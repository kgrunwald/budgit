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
const MAX_TXN_COUNT = 500;

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

let itemDao: ItemDao;
let userDao: UserDao;
let app: any;

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

async function initFirebase() {
    if (!app) {
        const admin = await import('firebase-admin');
        app = admin.initializeApp();
    }

    itemDao = itemDao || new ItemDao(new AdminDao<Item>(Item));
    userDao = userDao || new UserDao(new AdminDao<User>(User));
}

export const webhookHandler = async (msg: functions.pubsub.Message) => {
    await initFirebase();
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
        const item = await itemDao.byId(itemId);
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
        const item = await itemDao.byId(itemId);
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

const refreshAccounts = async (
    item: Item,
    newTxnCount: number = MAX_TXN_COUNT
): Promise<void> => {
    const user = await userDao.byId(item.userId);

    const acctDao = new AccountDao(user, new AdminDao<Account>(Account));
    const accts = await acctDao.byItemId(item.id);
    const account_ids = accts.map(acct => acct.accountId);

    await Promise.all([
        loadPlaidTransactionsByItem(item, user, account_ids, newTxnCount),
        loadPlaidAccountDetails(item, user, account_ids)
    ]);
};

const loadPlaidAccountDetails = async (
    item: Item,
    user: User,
    account_ids: string[]
) => {
    const res = await client.getBalance(item.accessToken, { account_ids });
    await Promise.all(res.accounts.map(a => savePlaidAccount(a, user)));
};

const loadPlaidTransactionsByItem = async (
    item: Item,
    user: User,
    account_ids: string[],
    count: number = 500,
    offset: number = 0
) => {
    const thirtyDays = subDays(new Date(), 30);

    const startDate = isBefore(item.createdDate, thirtyDays)
        ? thirtyDays
        : item.createdDate;
    const start = format(startDate, DATE_FORMAT);
    const end = format(addDays(new Date(), 1), DATE_FORMAT);
    const res = await client.getTransactions(item.accessToken, start, end, {
        count,
        offset,
        account_ids
    });

    await Promise.all(res.transactions.map(t => savePlaidTransaction(t, user)));

    if (res.total_transactions === MAX_TXN_COUNT) {
        await loadPlaidTransactionsByItem(
            item,
            user,
            account_ids,
            count,
            offset + count
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
        const item = await itemDao.byId(acct.itemId);

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
                itemDao.delete(item)
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

        await client.updateItemWebhook(
            item.accessToken,
            'https://us-central1-jk-budgit.cloudfunctions.net/webhook'
        );
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
    await Promise.all(
        accts.map(acct => {
            console.log(`Marking account ${acct.accountId} expired.`);
            acct.expired = true;
            return accountDao.commit(acct);
        })
    );
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
        const item = await itemDao.byItemId(payload.item_id);
        await refreshAccounts(item);
    } else if (payload.webhook_code === 'TRANSACTIONS_REMOVED') {
        console.log('Removing transactions');
        const item = await itemDao.byItemId(payload.item_id);
        const user = await userDao.byId(item.userId);
        const transactionDao = new TransactionDao(
            user,
            new AdminDao<Transaction>(Transaction)
        );
        await Promise.all(
            payload.removed_transactions.map(async t => {
                try {
                    const txn = await transactionDao.byTransactionId(t);
                    console.log(`Deleting transaction: ${txn.transactionId}`);
                    await transactionDao.delete(txn);
                } catch (e) {
                    console.log('skipping remove txn...');
                }
            })
        );
    }
}

async function handleItemWebhook(payload: ItemWebhook) {
    if (
        payload.webhook_code === 'ERROR' &&
        payload.error.error_code === 'ITEM_LOGIN_REQUIRED'
    ) {
        console.log(`Login required for ${payload.item_id}`);
        const item = await itemDao.byItemId(payload.item_id);
        const user = await userDao.byId(item.userId);
        await markItemTokenExpired(user, item);
    }
}

async function savePlaidItem(
    token: plaid.TokenResponse,
    user: User
): Promise<Item> {
    console.log('Saving Plaid Item', { token, userId: user.id });
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
    const [txn, account] = await Promise.all([
        transactionDao.getOrCreate(plaidTxn.transaction_id),
        accountDao.byAccountId(plaidTxn.account_id)
    ]);

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
    const acct = await accountDao.getOrCreate(account.account_id);
    const creditMultiplier = account.type === 'credit' ? -1 : 1;
    acct.accountId = account.account_id;
    acct.availableBalance =
        creditMultiplier * (account.balances.available || 0);
    acct.currentBalance = creditMultiplier * (account.balances.current || 0);
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
