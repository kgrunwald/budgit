import plaid, { InstitutionWithInstitutionData, PlaidEnvironments } from 'plaid';
import Parse from 'parse/node';
import { Router, Request, Response, NextFunction } from 'express';
import logger from '../logger';
import Item from '../../models/Item';
import Account from '../../models/Account';
import Transaction from '../../models/Transaction';
import { subDays, format} from 'date-fns';
import PlaidCategoryMapping from '../../models/PlaidCategoryMapping';

const CLIENT_ID = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET = process.env.PLAID_SECRET || '';
const PUBLIC_KEY = process.env.PLAID_PUBLIC_KEY || '';

const SUDO = { useMasterKey: true };

const client = new plaid.Client(
    CLIENT_ID,
    PLAID_SECRET,
    PUBLIC_KEY,    
    plaid.environments.sandbox,
    {version: '2019-05-29'},
);

declare global {
    namespace Express {
        interface Request {
            user: Parse.User
        }
    }
}

interface Webhook {
    webhook_type: string;
    webhook_code: string;
    item_id: string;
}

interface TransactionWebhook extends Webhook {
    new_transactions: number;
    removed_transactions: string[];
}

interface ItemWebhook extends Webhook  {
    error: plaid.PlaidError;
}

const DATE_FORMAT = 'YYYY-MM-DD';

const plaidRouter = Router();

plaidRouter.post('/webhook', async (req: Request, res: Response) => {
    const type = req.body.webhook_type;
    if (type === 'TRANSACTIONS') {
        await handleTransactionWebhook(req.body as TransactionWebhook);
        res.json({ status: 'ok' });
    } else if (type === 'ITEM') {
        await handleItemWebhook(req.body as ItemWebhook);
        res.json({ status: 'ok' });
    } else {
        logger.error('Got unknown webhook type', req.body);
        res.json({ status: 'ok' });
    }
});

plaidRouter.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const user = await Parse.User.logIn(username, password);
        logger.info("User", user);
        res.cookie('token', user.getSessionToken(), {
            maxAge: 60 * 60 * 1000,
            signed: true,
            httpOnly: true
        });
        res.json(user);
    } catch (err) {
        if (err.message === 'Invalid username/password.') {
            res.status(401).json({ error: err.message });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

plaidRouter.use(async (req: Request, res: Response, next: NextFunction) => {
    const user = await new Parse.Query(Parse.User).first({ sessionToken: req.signedCookies.token });
    if (!user) {
        res.status(401).json({message: 'user not found'});
        return
    };

    req.user = user;
    next();
});

plaidRouter.post('/getAccessToken', async (req: Request, res: Response) => {
    try {
        const { user } = req;
        logger.info('Got request for access token from: ' + user.getUsername());
        const tokenResponse = await client.exchangePublicToken(req.body.public_token);
        
        const item = await savePlaidItem(tokenResponse, user);
        await getAccounts(user, item);

        res.json({'error': false});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

plaidRouter.post('/refreshToken', async (req: Request, res: Response) => {
    try {
        const { user } = req;
        logger.info('Got refreshToken request from: ' + user.getUsername());
        
        const { accountId } = req.body;
        // @ts-ignore
        const acct: Account = await new Parse.Query(Account).include('item').equalTo('accountId', accountId).first(SUDO);
        logger.info(`Loaded account: ${acct.accountId}. Refreshing token for item: ${acct.item.itemId}`);

        const response = await client.createPublicToken(acct.item.accessToken);
        logger.info("Got new public token for account.", response);
        res.json({ publicToken: response.public_token });
    } catch (err) {
        logger.error("Error exchanging public token.", err);
        res.status(500).json({ error: err.message });
    }
});

plaidRouter.post('/updateAccounts', async (req: Request, res: Response) => {
    try {
        const { user = new Parse.User() } = req;
        logger.info('Got updateAccounts request from: ' + user.getUsername());
        
        const { accountId } = req.body;
        // @ts-ignore
        const acct: Account = await new Parse.Query(Account).include('item').equalTo('accountId', accountId).first(SUDO);
        logger.info(`Loaded account: ${acct.accountId}. Refreshing all transactions for item: ${acct.item.itemId}`);

        const item = acct.item;

        // @ts-ignore
        const accts: Account[] = await new Parse.Query(Account).includeAll().equalTo('item', item).find({ useMasterKey: true });
        logger.info(`Loaded all accounts for item ${item.itemId}`);
        accts.forEach(async (acct) => {
            logger.info(`Loading transactions for account: ${acct.accountId}`);
            await getTransactions(user, acct);
        });

        res.json({ error: false });
    } catch (err) {
        logger.error("Error updating accounts.", err);
        res.status(500).json({ error: err.message });
    }
});

async function getAccounts(user: Parse.User, item: Item): Promise<void> {
    try {
        logger.info("Getting accounts for user " + user.getUsername());
        const validTypes = ['depository', 'credit'];

        const response = await client.getAccounts(item.accessToken);
        
        response.accounts.forEach(async (account) => {
            if (validTypes.includes(account.type || '')) {
                logger.info("Saving account", account);
                await savePlaidAccount(account, response.item.institution_id, item, user);
            }
        })
    } catch (err) {
        if (err.error_code === 'ITEM_LOGIN_REQUIRED') {
            logger.error(`Login required for item: ${item.itemId}`);
            await markItemTokenExpired(item);
        } else {
            logger.error('Error updating accounts:', err);
        }
    }
}

async function getTransactions(user: Parse.User, account: Account): Promise<void> {
    try {
        logger.info("Getting transactions for user: " + user.getUsername() + " and account: " + account.accountId);

        const endDate = format(Date(), DATE_FORMAT);
        const startDate = format(subDays(endDate, 30), DATE_FORMAT);
        logger.info(`Loading transactions from ${startDate} to ${endDate}`);
        const response = await client.getTransactions(account.item.accessToken, startDate, endDate, {
            account_ids: [account.accountId]
        });

        response.transactions.forEach(async (transaction) => {
            logger.info(`Processing transaction ${transaction.transaction_id}`);
            await savePlaidTransaction(transaction, account, user);
        });

        account.expired = false;
        await account.save(null, SUDO);
    } catch(err) {
        logger.error("Error loading transactions", err.message)
        throw err;
    }
}

async function markItemTokenExpired(item: Item): Promise<void> {
    logger.info(`Marking all accounts for item ${item.itemId} as expired`);
    // @ts-ignore
    const accts: Account[] = await new Parse.Query(Account).equalTo('item', item).find(SUDO);
    accts.forEach(async (acct) => {
        logger.info(`Marking account ${acct.accountId} expired.`)
        acct.expired = true;
        await acct.save(null, SUDO);
    });
}

async function handleTransactionWebhook(payload: TransactionWebhook): Promise<void> {
    logger.info('Processing transaction webhook', payload);
    if (payload.webhook_code === 'HISTORICAL_UPDATE') {
        logger.info('Skipping historical update');
    } else if (payload.webhook_code === 'INITIAL_UPDATE' || payload.webhook_code === 'DEFAULT_UPDATE') {
        logger.info(`Loading transactions: ${payload.webhook_code} for item ${payload.item_id}`);
        // @ts-ignore
        const item: Item = await new Parse.Query(Item).includeAll().equalTo('itemId', payload.item_id).first(SUDO);

        const endDate = format(Date(), DATE_FORMAT);
        const startDate = format(subDays(endDate, 30), DATE_FORMAT);
        const txnsResp = await client.getTransactions(item.accessToken, startDate, endDate, { count: payload.new_transactions });
        txnsResp.transactions.forEach(async (plaidTxn) => {
            logger.info(`Processing transaction ${plaidTxn.transaction_id}`);

            // @ts-ignore
            const acct: Account = await new Parse.Query(Account).equalTo('accountId', plaidTxn.account_id).first(SUDO);
            await savePlaidTransaction(plaidTxn, acct, item.user);
        })
    } else if (payload.webhook_code === 'TRANSACTIONS_REMOVED') {
        logger.info('Removing transactions');
        payload.removed_transactions.forEach(async (txnId) => {
            // @ts-ignore
            const txn: Transaction = await new Parse.Query(Transaction).equalTo('transactionId', txnId).first(SUDO);
            logger.info(`Destroying transaction: ${txn.transactionId}`);
            await txn.destroy(SUDO);
        });
    }
}

async function handleItemWebhook(payload: ItemWebhook) {
    if (payload.webhook_code === 'ERROR' && payload.error.error_code === 'ITEM_LOGIN_REQUIRED') {
        logger.info(`Login required for ${payload.item_id}`);
        const item = await get(Item, 'itemId', payload.item_id);
        await markItemTokenExpired(item as Item);
    }
}

async function savePlaidItem(token: plaid.TokenResponse, user: Parse.User): Promise<Item> {
    const item = await getOrCreate(Item, 'itemId', token.item_id);
    item.accessToken = token.access_token;
    item.itemId = token.item_id;
    item.user = user;

    const acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    item.setACL(acl);
    
    await item.save();
    return item;
}

async function savePlaidTransaction(plaidTxn: plaid.Transaction, account: Account, user: Parse.User): Promise<Transaction> {
    const txn = await getOrCreate(Transaction, 'transactionId', plaidTxn.transaction_id);
    txn.transactionId = plaidTxn.transaction_id;
    txn.merchant = plaidTxn.name || '';
    txn.date = plaidTxn.date;
    txn.amount = plaidTxn.amount || 0;
    if (plaidTxn.category_id) {
        const categoryMap = await get(PlaidCategoryMapping, 'plaidCategoryId', plaidTxn.category_id);
        if (categoryMap) {
            txn.category = categoryMap.category;
        }
    }
    txn.account = account;
    
    txn.setACL(new Parse.ACL(user));
    await txn.save(null, SUDO);
    return txn;
}

async function savePlaidAccount(account: plaid.Account, institutionId: string, item: Item, user: Parse.User): Promise<Account> {
    const getAccount = getOrCreate(Account, 'accountId', account.account_id);
    const getInstitution = client.getInstitutionById<InstitutionWithInstitutionData>(institutionId, {include_optional_metadata: true});
    
    const [acct, { institution }] = await Promise.all([getAccount, getInstitution]);
    acct.accountId = account.account_id;
    acct.item = item
    acct.availableBalance = account.balances.available || 0;
    acct.currentBalance = account.balances.current || 0;
    acct.name = account.name || '<no name>';
    acct.subType = account.subtype || '';
    acct.type = account.type || '';
    acct.color = institution.primary_color
    acct.logo = institution.logo
    acct.expired = false;

    acct.setACL(new Parse.ACL(user));
    await acct.save(null, SUDO);
    return acct;
}

interface Queryable<T> {
    new (...args: any[]): T;
}

async function getOrCreate<T>(classType: Queryable<T>, idField: string, id: string): Promise<T> {
    let inst: T | null = null;
    try {
        inst = await new Parse.Query(classType.name).includeAll().equalTo(idField, id).first(SUDO) as any as T;
    } catch (e) {
        logger.info(`Class ${classType.name} did not exist. Creating new instance`);
    }

    if (!inst) {
        inst = new classType();
    }
    
    return inst;
}

async function get<T>(classType: Queryable<T>, idField: string, id: string): Promise<T | null> {
    let inst: T | null = null;
    try {
        inst = await new Parse.Query(classType.name).includeAll().equalTo(idField, id).first(SUDO) as any as T;
    } catch (e) {
        logger.info(`Class ${classType.name} did not exist. Skipping due to get().`);
    }

    return inst;
}

export default plaidRouter;
