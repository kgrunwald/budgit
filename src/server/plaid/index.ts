import plaid, { InstitutionWithInstitutionData } from 'plaid';
import Parse from 'parse/node';
import { Router, Request, Response } from 'express';
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

const DATE_FORMAT = 'YYYY-MM-DD';

const plaidRouter = Router();

plaidRouter.post('/get_access_token', async (req: Request, res: Response) => {
    try {
        const user = await new Parse.Query(Parse.User).first({ sessionToken: req.signedCookies.token });
        if (!user) {
            res.status(404).json({message: 'user not found'});
            return
        }

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

plaidRouter.post('/refresh_public_token', async (req: Request, res: Response) => {
    try {
        const user = await new Parse.Query(Parse.User).first({ sessionToken: req.signedCookies.token });
        if (!user) {
            res.status(404).json({message: 'user not found'});
            return
        }

        logger.info('Got updated token from: ' + user.getUsername());
        
        // @ts-ignore
        const accts = await new Parse.Query(Account).equalTo("_User", user).find();
        logger.info(`Loaded ${accts.length} accounts for user: ${user.getUsername()}`);

        accts.forEach((acct: Account) => {
            getTransactions(user, acct);
        });
       
        res.json({'error': false});
    } catch (err) {
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

                const model = new Account();
                model.accountId = account.account_id;
                model.item = item
                model.availableBalance = account.balances.available || 0;
                model.currentBalance = account.balances.current || 0;
                model.name = account.name || '<no name>';
                model.subType = account.subtype || '';
                model.type = account.type || '';
                model.color = institution.primary_color
                model.logo = institution.logo
                
                model.setACL(new Parse.ACL(user));
                await model.commit(user);
                await getTransactions(user, model);
            }
        })
    } catch (err) {
        if (err.error_code === 'ITEM_LOGIN_REQUIRED') {
            logger.info(`Login required for item: ${item.itemId}`);
            await createRefreshToken(user, item);
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
    } catch(err) {
        logger.error("Error loading transactions", err.message)
        throw err;
    }
}

async function createRefreshToken(user: Parse.User, item: Item) {
    try {
        logger.info(`Creating new public token for item ${item.itemId}`)
        const resp = await client.createPublicToken(item.accessToken)
        
        // @ts-ignore
        const accts = await new Parse.Query(Account).equalTo("item", item).find({ useMasterKey: true });
        logger.info("Got accounts", accts);
        accts.forEach(async (acct: Account) => {
            logger.info(`Setting refresh token for account: ${acct.accountId}`);
            acct.refreshToken = resp.public_token;
            await acct.save(null, { useMasterKey: true });
        });
    } catch (err) {
        logger.error("Error creating public token: ", err);
    }
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
