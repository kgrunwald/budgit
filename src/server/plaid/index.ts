import plaid, { InstitutionWithInstitutionData } from 'plaid';
import Parse, { User } from 'parse/node';
import { Router, Request, Response, NextFunction } from 'express';
import logger from '../logger';
import Item from '../../models/Item';
import Account from '../../models/Account';
import Transaction from '../../models/Transaction';
import { subDays, format} from 'date-fns';

const CLIENT_ID = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET = process.env.PLAID_SECRET || '';
const PUBLIC_KEY = process.env.PLAID_PUBLIC_KEY || '';

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

const DATE_FORMAT = 'YYYY-MM-DD';

const plaidRouter = Router();

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
        
        const item = new Item();
        item.accessToken = tokenResponse.access_token;
        item.itemId = tokenResponse.item_id;
        const acl = new Parse.ACL();
        acl.setPublicReadAccess(false);
        acl.setPublicWriteAccess(false);
        item.setACL(acl);
        await item.save();

        getAccounts(user, item)
            .then(async () => {
                await client.resetLogin(item.accessToken);
                await getAccounts(user, item);
            })
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
        const acct: Account = await new Parse.Query(Account).include('item').first({ accountId }, { useMasterKey: true });
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
        const acct: Account = await new Parse.Query(Account).include('item').first({ accountId });
        logger.info(`Loaded account: ${acct.accountId}. Refreshing all transactions for item: ${acct.item.itemId}`);

        const item = acct.item;

        // @ts-ignore
        const accts: Account[] = await new Parse.Query(Account).equalTo('item', item).find({ useMasterKey: true });
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

                const {institution} = await client.getInstitutionById<InstitutionWithInstitutionData>(response.item.institution_id, {include_optional_metadata: true})

                const acct = new Account();
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
                await acct.commit(user);
                await getTransactions(user, acct);
            }
        })
    } catch (err) {
        if (err.error_code === 'ITEM_LOGIN_REQUIRED') {
            logger.info(`Login required for item: ${item.itemId}`);
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
            logger.info("Transaction", transaction);

            const txn = new Transaction();
            txn.transactionId = transaction.transaction_id;
            txn.merchant = transaction.name || '';
            txn.date = transaction.date;
            txn.amount = transaction.amount || 0;
            txn.category = (transaction.category && transaction.category[0] || '');
            txn.account = account;
            
            await txn.commit(user);
        });

        account.expired = false;
        await account.save(null, { useMasterKey: true });
    } catch(err) {
        logger.error("Error loading transactions", err.message)
        throw err;
    }
}

async function markItemTokenExpired(item: Item): Promise<void> {
    logger.info(`Marking all accounts for item ${item.itemId} as expired`);
    // @ts-ignore
    const accts: Account[] = await new Parse.Query(Account).equalTo('item', item).find({ useMasterKey: true });
    accts.forEach(async (acct) => {
        logger.info(`Marking account ${acct.accountId} expired.`)
        acct.expired = true;
        await acct.save(null, { useMasterKey: true });
    });
}

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

export default plaidRouter;
