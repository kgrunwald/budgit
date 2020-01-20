import * as plaid from 'plaid';
import * as functions from 'firebase-functions';
import * as cors from 'cors';
import Item from '../../src/models/Item';
import Account from '../../src/models/Account';
import Transaction from '../../src/models/Transaction';
import { subDays, addDays, format, isBefore } from 'date-fns';
import User from '../../src/models/User';
import Category from '../../src/models/Category';
import CategoryGroup from '../../src/models/CategoryGroup';
import AccountDao from '../../src/dao/AccountDao';
import ItemDao from './itemDao';
import TransactionDao from '../../src/dao/TransactionDao';
import CategoryDao from '../../src/dao/CategoryDao';
import CategoryGroupDao from '../../src/dao/CategoryGroupDao';
import AdminDao from './adminDao';
import UserDao from '../../src/dao/UserDao';

const CLIENT_ID = functions.config().plaid.client_id;
const PLAID_SECRET = functions.config().plaid.secret;
const PUBLIC_KEY = functions.config().plaid.public_key;
const PLAID_ENV = functions.config().plaid.env;
const WEBHOOK_URL = 'https://us-central1-jk-budgit.cloudfunctions.net/webhook';

const allowCORS = cors({ origin: 'https://jk-budgit.firebaseapp.com' });

const client = new plaid.Client(
    CLIENT_ID,
    PLAID_SECRET,
    PUBLIC_KEY,
    PLAID_ENV,
    { version: '2019-05-29' }
);

interface Webhook {
    webhook_type: string;
    webhook_code: string;
    item_id: string;
}

interface TransactionWebhook extends Webhook {
    new_transactions: number;
    removed_transactions: string[];
}

interface ItemWebhook extends Webhook {
    error: plaid.PlaidError;
}

const DATE_FORMAT = 'yyyy-MM-dd';

const readItemDao = new ItemDao(new AdminDao<Item>(Item));
const userDao = new UserDao(new AdminDao<User>(User));

export const webhook = async (
    req: functions.https.Request,
    res: functions.Response
) => {
    const type = req.body.webhook_type;
    if (type === 'TRANSACTIONS') {
        await handleTransactionWebhook(req.body as TransactionWebhook);
        res.json({ status: 'ok' });
    } else if (type === 'ITEM') {
        await handleItemWebhook(req.body as ItemWebhook);
        res.json({ status: 'ok' });
    } else {
        console.error('Got unknown webhook type', req.body);
        res.json({ status: 'ok' });
    }
};

export const getAccessToken = async (
    req: functions.https.Request,
    res: functions.Response
) => {
    return allowCORS(req, res, async () => {
        try {
            const user = await userDao.byId(req.body.userId);
            const tokenResponse = await client.exchangePublicToken(
                req.body.public_token
            );
            console.info('Exchanged public token');

            const item = await savePlaidItem(tokenResponse, req, user);
            await getAccounts(req, item);

            res.json({ error: false });
        } catch (err) {
            console.error('Error saving item or accounts', err);
            res.status(500).json({ error: err.message });
        }
    });
};

export const refreshToken = async (
    req: functions.https.Request,
    res: functions.Response
) => {
    return allowCORS(req, res, async () => {
        try {
            const { itemId } = req.body;
            const item = await readItemDao.byItemId(itemId);
            const response = await client.createPublicToken(item.accessToken);
            console.log('Got new public token for account/item.', response);
            res.json({ publicToken: response.public_token });
        } catch (err) {
            console.error('Error exchanging public token.', err);
            res.status(500).json({ error: err.message });
        }
    });
};

export const updateAccounts = async (
    req: functions.https.Request,
    res: functions.Response
) => {
    return allowCORS(req, res, async () => {
        try {
            const { itemId } = req.body;
            const item = await readItemDao.byId(itemId);
            const user = await userDao.byId(item.userId);
            await refreshAccount(user, item);

            res.json({ error: false });
        } catch (err) {
            console.error('Error updating accounts.', err);
            res.status(500).json({ error: err.message });
        }
    });
};

const refreshAccount = async (user: User, item: Item) => {
    const acctDao = new AccountDao(user, new AdminDao<Account>(Account));
    const accts = await acctDao.byItemId(item.id);
    const account_ids = accts.map(acct => acct.accountId);

    await loadPlaidTransactionsByAccount(item, user, account_ids);
    await loadPlaidAccountDetails(item, user, account_ids);
    await checkItemWebhook(item);
};

const checkItemWebhook = async (item: Item) => {
    const res = await client.getItem(item.accessToken);
    if (res.item.webhook !== WEBHOOK_URL) {
        await client.updateItemWebhook(item.accessToken, WEBHOOK_URL);
    }
};

const loadPlaidAccountDetails = async (
    item: Item,
    user: User,
    account_ids: string[]
) => {
    const plaidRes = await client.getBalance(item.accessToken, { account_ids });
    for (const plaidAccount of plaidRes.accounts) {
        try {
            await savePlaidAccount(plaidAccount, user);
        } catch (e) {
            console.error('Error saving account details:', e);
        }
    }
};

const loadPlaidTransactionsByAccount = async (
    item: Item,
    user: User,
    account_ids: string[],
    offset: number = 0
) => {
    const thirtyDays = subDays(new Date(), 30);

    const startDate = isBefore(item.createdDate, thirtyDays)
        ? thirtyDays
        : item.createdDate;
    const start = format(startDate, DATE_FORMAT);
    const end = format(addDays(new Date(), 1), DATE_FORMAT);
    const plaidRes = await client.getTransactions(
        item.accessToken,
        start,
        end,
        {
            count: 500,
            offset,
            account_ids
        }
    );

    for (const txn of plaidRes.transactions) {
        try {
            await savePlaidTransaction(txn, user);
        } catch (e) {
            console.log('Error when saving txn:', e);
        }
    }

    if (plaidRes.total_transactions > 0) {
        await loadPlaidTransactionsByAccount(
            item,
            user,
            account_ids,
            offset + plaidRes.total_transactions
        );
    }
};

export const removeAccount = async (
    req: functions.https.Request,
    res: functions.Response
) => {
    try {
        const { accountId } = req.body;
        const readAccountDao = new AccountDao(
            new User(),
            new AdminDao<Account>(Account)
        );
        const acct = await readAccountDao.byAccountId(accountId);

        console.log(
            `Loaded account: ${acct.accountId}. Account item: ${acct.itemId}`
        );

        const item = await readItemDao.byId(acct.itemId);

        console.log(`Removing transactions for account: ${acct.accountId}.`);

        const readTxnDao = new TransactionDao(
            new User(),
            new AdminDao<Transaction>(Transaction)
        );
        const txns = await readTxnDao.byAccountId(acct.id);
        txns.forEach(async txn => {
            await readTxnDao.delete(txn);
        });

        const readCtgDao = new CategoryDao(
            new User(),
            new AdminDao<Category>(Category)
        );
        const category = await readCtgDao.byPaymentAccountId(acct.id);
        if (category) {
            await readCtgDao.delete(category);
        }
        await readAccountDao.delete(acct);

        const accts = await readAccountDao.byItemId(item.id);

        if (accts.length === 0) {
            console.log(`Removing item: ${item.itemId}.`);
            await client.removeItem(item.accessToken);
            await readItemDao.delete(item);
        }

        res.json({ error: false });
    } catch (err) {
        console.error('Error destroying account.', err);
        res.status(500).json({ error: err.message });
    }
};

async function getAccounts(
    req: functions.https.Request,
    item: Item
): Promise<void> {
    const user = await userDao.byId(item.userId);
    try {
        const validTypes = ['depository', 'credit'];

        const response = await client.getAccounts(item.accessToken);

        response.accounts.forEach(async account => {
            if (validTypes.includes(account.type || '')) {
                console.log('Saving account', account);
                const newAcct = await savePlaidAccountAndInstitution(
                    account,
                    response.item.institution_id,
                    item
                );

                if (account.type !== 'credit') {
                    await createInitialTransaction(user, newAcct, account);
                } else {
                    await createCreditCardCategory(user, newAcct);
                }
            }
        });
    } catch (err) {
        if (err.error_code === 'ITEM_LOGIN_REQUIRED') {
            console.error(`Login required for item: ${item.itemId}`);
            await markItemTokenExpired(user, item);
        } else {
            console.error('Error updating accounts:', err);
        }
    }
}

async function createInitialTransaction(
    user: User,
    newAcct: Account,
    account: plaid.Account
) {
    console.log('Creating transaction for initial balance');
    const initialTxn = new Transaction();
    initialTxn.accountId = newAcct.id;
    initialTxn.acknowledged = false;
    initialTxn.amount =
        account.balances.available || account.balances.current || 0;
    initialTxn.currency = account.balances.iso_currency_code || 'USD';
    initialTxn.date = new Date();
    initialTxn.merchant = `${newAcct.name} Initial Balance`;
    initialTxn.transactionId = newAcct.accountId;

    const categoryDao = new CategoryDao(user, new AdminDao<Category>(Category));
    const category = await categoryDao.byName('Available Cash');
    if (!category) {
        console.error('Cant load the available cash category');
        throw new Error('Failed to load available cash category');
    }

    console.log('Loaded cash category', { category });
    initialTxn.categoryId = category.id;

    const transactionDao = new TransactionDao(
        user,
        new AdminDao<Transaction>(Transaction)
    );
    await transactionDao.commit(initialTxn);
}

async function createCreditCardCategory(user: User, newAcct: Account) {
    const categoryGroupDao = new CategoryGroupDao(
        user,
        new AdminDao<CategoryGroup>(CategoryGroup)
    );
    let group = await categoryGroupDao.byName('Credit Cards');
    if (!group) {
        group = new CategoryGroup();
        group.name = 'Credit Cards';
        await categoryGroupDao.commit(group);
    }

    const category = new Category();
    category.name = `Payment: ${newAcct.name}`;
    category.groupId = group.id;
    category.paymentAccountId = newAcct.id;

    const categoryDao = new CategoryDao(user, new AdminDao<Category>(Category));
    await categoryDao.commit(category);
}

async function markItemTokenExpired(user: User, item: Item): Promise<void> {
    console.log(`Marking all accounts for item ${item.itemId} as expired`);
    const accountDao = new AccountDao(user, new AdminDao<Account>(Account));
    const accts = await accountDao.byItemId(item.id);
    accts.forEach(async acct => {
        console.log(`Marking account ${acct.accountId} expired.`);
        acct.expired = true;
        await accountDao.commit(acct);
    });
}

async function handleTransactionWebhook(
    payload: TransactionWebhook
): Promise<void> {
    console.log('Processing transaction webhook', payload);
    const item = await readItemDao.byItemId(payload.item_id);
    const user = await userDao.byId(item.userId);

    if (
        payload.webhook_code === 'HISTORICAL_UPDATE' ||
        payload.webhook_code === 'INITIAL_UPDATE'
    ) {
        console.log('Skipping historical/initial update');
    } else if (payload.webhook_code === 'DEFAULT_UPDATE') {
        console.log(
            `Loading transactions: ${payload.webhook_code} for item ${payload.item_id}`
        );
        const accountDao = new AccountDao(user, new AdminDao<Account>(Account));
        const accts = await accountDao.byItemId(item.id);
        for (const acct of accts) {
            await refreshAccount(acct, item);
        }
    } else if (payload.webhook_code === 'TRANSACTIONS_REMOVED') {
        console.log('Removing transactions');
        const transactionDao = new TransactionDao(
            user,
            new AdminDao<Transaction>(Transaction)
        );
        payload.removed_transactions.forEach(async txnId => {
            const txn = await transactionDao.byTransactionId(txnId);
            console.log(`Deleting transaction: ${txn.transactionId}`);
            await transactionDao.delete(txn);
        });
    }
}

async function handleItemWebhook(payload: ItemWebhook) {
    if (
        payload.webhook_code === 'ERROR' &&
        payload.error.error_code === 'ITEM_LOGIN_REQUIRED'
    ) {
        console.log(`Login required for ${payload.item_id}`);
        const item = await readItemDao.byItemId(payload.item_id);
        const user = await userDao.byId(item.userId);
        await markItemTokenExpired(user, item);
    }
}

async function savePlaidItem(
    token: plaid.TokenResponse,
    req: functions.https.Request,
    user: User
): Promise<Item> {
    console.log('Saving Plaid Item', { token, userId: req.body.userId });
    const itemDao = new ItemDao(new AdminDao<Item>(Item));
    const item = await itemDao.getOrCreate(token.item_id);
    item.accessToken = token.access_token;
    item.itemId = token.item_id;
    item.userId = req.body.userId;

    return await itemDao.commit(item);
}

async function savePlaidTransaction(
    plaidTxn: plaid.Transaction,
    user: User
): Promise<void> {
    if (plaidTxn.pending) {
        console.log(
            `Transaction ${plaidTxn.transaction_id} is pending, skipping.`
        );
        return;
    }

    const transactionDao = new TransactionDao(
        user,
        new AdminDao<Transaction>(Transaction)
    );
    const accountDao = new AccountDao(user, new AdminDao<Account>(Account));
    const txn = await transactionDao.getOrCreate(plaidTxn.transaction_id);
    const account = await accountDao.byAccountId(plaidTxn.account_id);

    txn.transactionId = plaidTxn.transaction_id;
    txn.merchant = plaidTxn.name || '';
    txn.date = new Date(plaidTxn.date);
    txn.amount = (plaidTxn.amount || 0) * -1;

    if (plaidTxn.category_id) {
        // TODO: PlaidCategoryMapping
    }
    txn.accountId = account.id;
    await transactionDao.commit(txn);
}

async function savePlaidAccount(account: plaid.Account, user: User) {
    const accountDao = new AccountDao(user, new AdminDao<Account>(Account));
    const acct = await accountDao.byAccountId(account.account_id);
    const creditMultiplier = account.type === 'credit' ? -1 : 1;
    acct.accountId = account.account_id;
    acct.availableBalance =
        creditMultiplier * (account.balances.available || 0);
    acct.currentBalance =
        creditMultiplier *
        (account.balances.current || account.balances.available || 0);
    acct.name = acct.name || account.name || '<no name>';
    acct.subType = account.subtype || '';
    acct.type = account.type || '';
    acct.expired = false;

    return await accountDao.commit(acct);
}

async function savePlaidAccountAndInstitution(
    account: plaid.Account,
    institutionId: string,
    item: Item
): Promise<Account> {
    const user = await userDao.byId(item.userId);
    const accountDao = new AccountDao(user, new AdminDao<Account>(Account));
    const getAccount = await accountDao.getOrCreate(account.account_id);
    const getInstitution = client.getInstitutionById<
        plaid.InstitutionWithInstitutionData
    >(institutionId, { include_optional_metadata: true });

    const [acct, { institution }] = await Promise.all([
        getAccount,
        getInstitution
    ]);
    acct.color = institution.primary_color;
    acct.logo = institution.logo;

    return savePlaidAccount(account, user);
}
