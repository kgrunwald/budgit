import * as plaid from 'plaid';
import * as functions from 'firebase-functions';
import { PubSub } from '@google-cloud/pubsub';
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
import { CallableContext } from 'firebase-functions/lib/providers/https';

const CLIENT_ID = functions.config().plaid.client_id;
const PLAID_SECRET = functions.config().plaid.secret;
const PUBLIC_KEY = functions.config().plaid.public_key;
const PLAID_ENV = functions.config().plaid.env;
const WEBHOOK_URL = 'https://us-central1-jk-budgit.cloudfunctions.net/webhook';

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

let readItemDao: ItemDao;
let userDao: UserDao;

const projectId = functions.config().pubsub.project_id;
const topic = functions.config().pubsub.topic;
const pubsub = new PubSub({ projectId });

export const webhook = async (
    req: functions.https.Request,
    res: functions.Response
) => {
    const messageId = await pubsub.topic(topic).publishJSON(req.body);
    console.log(`Message ${messageId} published.`);
    res.json({ status: 'ok' });
};

export const webhookHandler = async (msg: functions.pubsub.Message) => {
    const body = msg.json;
    const type = body.webhook_type;
    if (type === 'TRANSACTIONS') {
        await handleTransactionWebhook(body as TransactionWebhook);
    } else if (type === 'ITEM') {
        await handleItemWebhook(body as ItemWebhook);
    } else {
        console.error('Got unknown webhook type', body);
    }
};

function error(message: string, e?: Error): functions.https.HttpsError {
    return new functions.https.HttpsError('internal', message, e);
}

function denied(message: string, e?: Error): functions.https.HttpsError {
    return new functions.https.HttpsError('permission-denied', message, e);
}

function authError(message: string, e?: Error): functions.https.HttpsError {
    return new functions.https.HttpsError('unauthenticated', message, e);
}

async function initFirebase() {
    const admin = await import('firebase-admin');
    admin.initializeApp();

    readItemDao = new ItemDao(new AdminDao<Item>(Item));
    userDao = new UserDao(new AdminDao<User>(User));
}

export const getAccessToken = async (data: any, context: CallableContext) => {
    try {
        if (!context.auth?.uid) {
            throw authError('Not authenticated');
        }

        await initFirebase();

        const user = await userDao.byId(context.auth?.uid);
        const tokenResponse = await client.exchangePublicToken(
            data.publicToken
        );

        const item = await savePlaidItem(tokenResponse, user);
        await getAccounts(user, item);

        return { error: false };
    } catch (err) {
        console.error('Error saving item or accounts', err);
        throw error('Error saving item or accounts', err);
    }
};

export const refreshToken = async (data: any, context: CallableContext) => {
    try {
        await initFirebase();

        const { itemId } = data;
        const item = await readItemDao.byItemId(itemId);
        if (item.userId !== context.auth?.uid) {
            throw denied('Item does not match user id');
        }

        const response = await client.createPublicToken(item.accessToken);
        return { publicToken: response.public_token };
    } catch (err) {
        console.error('Error exchanging public token.', err);
        throw error('Error exchanging public token.');
    }
};

export const updateAccounts = async (data: any, context: CallableContext) => {
    try {
        await initFirebase();

        const { itemId } = data;
        const item = await readItemDao.byId(itemId);
        if (item.userId !== context.auth?.uid) {
            throw denied('Item user id does not match auth');
        }

        await refreshAccounts(item);
        return { error: false };
    } catch (err) {
        console.error('Error updating accounts.', err);
        throw error('Error updating accounts', err);
    }
};

const refreshAccounts = async (itemOrId: string | Item): Promise<void> => {
    let item: Item;
    if (typeof itemOrId === 'string') {
        item = await readItemDao.byId(itemOrId);
    } else {
        item = itemOrId;
    }

    const user = await userDao.byId(item.userId);

    const acctDao = new AccountDao(user, new AdminDao<Account>(Account));
    const accts = await acctDao.byItemId(item.id);
    const account_ids = accts.map(acct => acct.accountId);

    await Promise.all([
        loadPlaidTransactionsByAccount(item, user, account_ids),
        loadPlaidAccountDetails(item, user, account_ids),
        checkItemWebhook(item)
    ]);
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

export const removeAccount = async (data: any, context: CallableContext) => {
    try {
        const uid = context.auth?.uid;
        if (!uid) {
            throw authError('Not authenticated');
        }

        await initFirebase();

        const user = await userDao.byId(uid);
        const { accountId } = data;
        const acctDao = new AccountDao(user, new AdminDao<Account>(Account));
        const acct = await acctDao.byAccountId(accountId);
        const item = await readItemDao.byId(acct.itemId);

        console.log(`Removing transactions for account: ${acct.accountId}.`);

        const txnDao = new TransactionDao(
            user,
            new AdminDao<Transaction>(Transaction)
        );
        const txns = await txnDao.byAccountId(acct.id);
        await Promise.all(txns.map(t => txnDao.delete(t)));

        const ctgDao = new CategoryDao(user, new AdminDao<Category>(Category));
        const category = await ctgDao.byPaymentAccountId(acct.id);
        if (category) {
            await ctgDao.delete(category);
        }
        await acctDao.delete(acct);

        const accts = await acctDao.byItemId(item.id);
        if (accts.length === 0) {
            console.log(`Removing item: ${item.itemId}.`);
            await Promise.all([
                client.removeItem(item.accessToken),
                readItemDao.delete(item)
            ]);
        }

        return { error: false };
    } catch (err) {
        console.error('Error deleting account.', err);
        throw error('Error deleting account', err);
    }
};

async function getAccounts(user: User, item: Item): Promise<void> {
    try {
        const validTypes = ['depository', 'credit'];
        const response = await client.getAccounts(item.accessToken);
        for (const account of response.accounts) {
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
        }
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
    if (
        payload.webhook_code === 'HISTORICAL_UPDATE' ||
        payload.webhook_code === 'INITIAL_UPDATE'
    ) {
        console.log('Skipping historical/initial update');
    } else if (payload.webhook_code === 'DEFAULT_UPDATE') {
        console.log(`${payload.webhook_code} for item ${payload.item_id}`);
        await refreshAccounts(payload.item_id);
    } else if (payload.webhook_code === 'TRANSACTIONS_REMOVED') {
        console.log('Removing transactions');
        const item = await readItemDao.byItemId(payload.item_id);
        const user = await userDao.byId(item.userId);
        const transactionDao = new TransactionDao(
            user,
            new AdminDao<Transaction>(Transaction)
        );
        for (const txnId of payload.removed_transactions) {
            const txn = await transactionDao.byTransactionId(txnId);
            console.log(`Deleting transaction: ${txn.transactionId}`);
            await transactionDao.delete(txn);
        }
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
    user: User
): Promise<Item> {
    console.log('Saving Plaid Item', { token, userId: user.id });
    const itemDao = new ItemDao(new AdminDao<Item>(Item));
    const item = await itemDao.getOrCreate(token.item_id);
    item.accessToken = token.access_token;
    item.itemId = token.item_id;
    item.userId = user.id;

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
