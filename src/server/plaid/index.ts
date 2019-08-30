import plaid, {
  InstitutionWithInstitutionData,
  PlaidEnvironments,
} from 'plaid';
import Parse from 'parse/node';
import { Router, Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import logger from '../logger';
import Item from '../../models/Item';
import Account from '../../models/Account';
import Transaction from '../../models/Transaction';
import { subDays, format, isBefore } from 'date-fns';
import PlaidCategoryMapping from '../../models/PlaidCategoryMapping';
import { set, get } from 'lodash';
import Category from '../../models/Category';
import CategoryGroup from '../../models/CategoryGroup';
import User from '../../models/User';
import UserDao from '../../dao/UserDao';
import AccountDao from '../../dao/AccountDao';
import ItemDao from '../../dao/ItemDao';
import TransactionDao from '../../dao/TransactionDao';
import CategoryDao from '../../dao/CategoryDao';
import CategoryGroupDao from '../../dao/CategoryGroupDao';
import { TokenPayload } from 'google-auth-library/build/src/auth/loginticket';

const CLIENT_ID = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET = process.env.PLAID_SECRET || '';
const PUBLIC_KEY = process.env.PLAID_PUBLIC_KEY || '';
const PLAID_ENV = process.env.PLAID_ENV || '';
const GOOGLE_CLIENT_ID = process.env.VUE_APP_GOOGLE_CLIENT_ID || '';

const SUDO = { useMasterKey: true };

const client = new plaid.Client(
  CLIENT_ID,
  PLAID_SECRET,
  PUBLIC_KEY,
  PLAID_ENV,
  { version: '2019-05-29' }
);

declare global {
  namespace Express {
    interface Request {
      user: User;
      userDao: UserDao;
      accountDao: AccountDao;
      itemDao: ItemDao;
      transactionDao: TransactionDao;
      categoryDao: CategoryDao;
      categoryGroupDao: CategoryGroupDao;
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

interface ItemWebhook extends Webhook {
  error: plaid.PlaidError;
}

const DATE_FORMAT = 'YYYY-MM-DD';

const oathClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const plaidRouter = Router();

plaidRouter.use((req: Request, res: Response, next: NextFunction) => {
  req.userDao = new UserDao(true);
  req.itemDao = new ItemDao(true);
  req.accountDao = new AccountDao(true);
  req.transactionDao = new TransactionDao(true);
  req.categoryDao = new CategoryDao(true);
  req.categoryGroupDao = new CategoryGroupDao(true);
  next();
});

plaidRouter.post('/webhook', async (req: Request, res: Response) => {
  const type = req.body.webhook_type;
  if (type === 'TRANSACTIONS') {
    await handleTransactionWebhook(req, req.body as TransactionWebhook);
    res.json({ status: 'ok' });
  } else if (type === 'ITEM') {
    await handleItemWebhook(req, req.body as ItemWebhook);
    res.json({ status: 'ok' });
  } else {
    logger.error('Got unknown webhook type', req.body);
    res.json({ status: 'ok' });
  }
});

plaidRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await User.logIn(username, password);
    req.user = user;
    logger.info('User', user);

    set(req, 'session.user', user);
    refreshAccounts(req);
    res.json(user);
  } catch (err) {
    if (err.message === 'Invalid username/password.') {
      res.status(401).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

plaidRouter.post('/googleauth', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    const ticket = await oathClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload() as TokenPayload;
    const user = await req.userDao.byUsername(payload.email || '');
    if (user) {
      await user._linkWith(
        'google',
        { authData: { id: payload['sub'], id_token: idToken } },
        { ...SUDO }
      );
      set(req, 'session.user', user);
      req.user = user;
      refreshAccounts(req);
      res.json(user);
    } else {
      throw 'Invalid username/password.';
    }
  } catch (err) {
    if (err.message === 'Invalid username/password.') {
      res.status(401).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

plaidRouter.get('/logout', (req, res) => {
  logger.info('Logout route', req.session);
  req.session &&
    req.session.destroy(() => {
      logger.info('Session destroyed');
      res.json({ message: 'ok' });
    });
});

plaidRouter.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('session', req.session);
    const user = await req.userDao.byId(get(req, 'session.user.objectId'));
    req.user = user;

    const token = user.getSessionToken();
    req.userDao.setSessionToken(token);
    req.itemDao = new ItemDao(true);
    req.accountDao = new AccountDao(true);
    req.transactionDao = new TransactionDao(true);
    req.categoryDao = new CategoryDao(true);
    req.categoryGroupDao = new CategoryGroupDao(true);
  } catch (err) {
    logger.warn('Could not find user, redirecting to login', { err });
    req.session && req.session.destroy(() => logger.info('Session destroyed'));
    res.redirect('/login');
    return;
  }
  next();
});

plaidRouter.post('/getAccessToken', async (req: Request, res: Response) => {
  try {
    const { user } = req;
    logger.info('Got request for access token from: ' + user.getUsername());
    const tokenResponse = await client.exchangePublicToken(
      req.body.public_token
    );
    logger.info('Exchanged public token');

    const item = await savePlaidItem(tokenResponse, req);
    await getAccounts(req, item);

    res.json({ error: false });
  } catch (err) {
    logger.error('Error saving item or accounts', err);
    res.status(500).json({ error: err.message });
  }
});

plaidRouter.post('/refreshToken', async (req: Request, res: Response) => {
  try {
    const { user } = req;
    logger.info('Got refreshToken request from: ' + user.getUsername());

    const { accountId, itemId } = req.body;
    let item;

    if (accountId) {
      const acct = await req.accountDao.byAccountId(accountId);
      if (!acct) {
        logger.error('Could not find account by account id', { accountId });
        throw new Error('Could not find account by accountId');
      }

      logger.info(
        `Loaded account: ${acct.accountId}. Refreshing token for item: ${acct.item.itemId}`
      );
      item = acct.item;
    } else if (itemId) {
      item = await req.itemDao.byItemId(itemId);
    }

    if (!item) {
      logger.error('Could not find item by item id', { itemId });
      throw new Error('Could not find item by item id');
    }

    const response = await client.createPublicToken(item.accessToken);
    logger.info('Got new public token for account/item.', response);
    res.json({ publicToken: response.public_token });
  } catch (err) {
    logger.error('Error exchanging public token.', err);
    res.status(500).json({ error: err.message });
  }
});

plaidRouter.post('/updateAccounts', async (req: Request, res: Response) => {
  try {
    const { user } = req;
    logger.info('Got updateAccounts request from: ' + user.getUsername());

    const { accountId } = req.body;
    const acct = await req.accountDao.byAccountId(accountId);
    if (!acct) {
      logger.error('Could not find account by account id', { accountId });
      throw new Error('Could not find account by account id');
    }

    logger.info(
      `Loaded account: ${acct.accountId}. Refreshing all transactions for item: ${acct.item.itemId}`
    );

    const item = acct.item;

    const accts = await req.accountDao.byItem(item);
    logger.info(`Loaded all accounts for item ${item.itemId}`);
    accts.forEach(async acct => {
      logger.info(`Loading transactions for account: ${acct.accountId}`);
      await getTransactions(req, acct);
    });

    res.json({ error: false });
  } catch (err) {
    logger.error('Error updating accounts.', err);
    res.status(500).json({ error: err.message });
  }
});

plaidRouter.post('/removeAccount', async (req: Request, res: Response) => {
  try {
    const { user } = req;
    logger.info('Got removeAccount request from: ' + user.getUsername());

    const { accountId } = req.body;
    const acct = await req.accountDao.byAccountId(accountId);
    if (!acct) {
      logger.error('Could not find account by account id', { accountId });
      throw new Error('Could not find account by account id');
    }

    logger.info(
      `Loaded account: ${acct.accountId}. Account item: ${acct.item.itemId}`
    );

    const item = acct.item;
    logger.info(`Removing transactions for account: ${acct.accountId}.`);

    const txns = await req.transactionDao.byAccount(acct);
    txns.forEach(async txn => {
      await txn.destroy(SUDO);
    });

    const categories = await req.categoryDao.byPaymentAccount(acct);
    categories.forEach(async category => {
      await category.destroy(SUDO);
    });
    await acct.destroy(SUDO);

    const accts = await req.accountDao.byItem(item);
    logger.info(
      `Length of all accounts for item ${item.itemId}: ${accts.length}`
    );

    if (accts.length === 0) {
      logger.info(`Removing item: ${item.itemId}.`);
      await client.removeItem(item.accessToken);
      await item.destroy(SUDO);
    }

    res.json({ error: false });
  } catch (err) {
    logger.error('Error destroying account.', err);
    res.status(500).json({ error: err.message });
  }
});

async function getAccounts(req: Request, item: Item): Promise<void> {
  try {
    logger.info('Getting accounts for user ' + req.user.getUsername());
    const validTypes = ['depository', 'credit'];

    const response = await client.getAccounts(item.accessToken);

    response.accounts.forEach(async account => {
      if (validTypes.includes(account.type || '')) {
        logger.info('Saving account', account);
        const newAcct = await savePlaidAccount(
          account,
          response.item.institution_id,
          item,
          req
        );

        if (account.type !== 'credit') {
          await createInitialTransaction(req, newAcct, account);
        } else {
          await createCreditCardCategory(req, newAcct);
        }
      }
    });
  } catch (err) {
    if (err.error_code === 'ITEM_LOGIN_REQUIRED') {
      logger.error(`Login required for item: ${item.itemId}`);
      await markItemTokenExpired(req, item);
    } else {
      logger.error('Error updating accounts:', err);
    }
  }
}

async function createInitialTransaction(
  req: Request,
  newAcct: Account,
  account: plaid.Account
) {
  logger.info('Creating transaction for initial balance');
  const initialTxn = new Transaction();
  initialTxn.account = newAcct;
  initialTxn.acknowledged = false;
  initialTxn.amount =
    account.balances.available || account.balances.current || 0;
  initialTxn.currency = account.balances.iso_currency_code || 'USD';
  initialTxn.date = new Date();
  initialTxn.merchant = `${newAcct.name} Initial Balance`;
  initialTxn.transactionId = newAcct.accountId;

  const category = await req.categoryDao.byName('Available Cash');
  if (!category) {
    logger.error('Cant load the available cash category', {
      user: req.user,
    });
    throw new Error('Failed to load available cash category');
  }

  logger.info('Loaded cash category', { category });
  initialTxn.category = category;

  await initialTxn.commit(req.user, SUDO);
}

async function createCreditCardCategory(req: Request, newAcct: Account) {
  let group = await req.categoryGroupDao.byName('Credit Cards');
  if (!group) {
    logger.info(
      'Creating credit card group for user ' + req.user.getUsername()
    );
    group = new CategoryGroup();
    group.name = 'Credit Cards';
    await group.commit(req.user, SUDO);
  }

  const category = new Category();
  category.name = `Payment: ${newAcct.name}`;
  category.group = group;
  category.paymentAccount = newAcct;
  await category.commit(req.user, SUDO);
}

async function refreshAccounts(req: Request) {
  logger.info(`Refreshing account for user ${req.user.getUsername()}`);
  if (!req.accountDao) {
    req.accountDao = new AccountDao(true);
  }
  const accts = await req.accountDao.all();
  accts.forEach(acct => getTransactions(req, acct));
}

async function getTransactions(req: Request, account: Account): Promise<void> {
  try {
    const { user } = req;
    logger.info(
      'Getting transactions for user: ' +
        user.getUsername() +
        ' and account: ' +
        account.accountId
    );

    const endDate = format(Date(), DATE_FORMAT);
    const thirtyDays = subDays(endDate, 30);
    const createdDate = account.get('createdAt');
    const startDate = format(
      isBefore(createdDate, thirtyDays) ? thirtyDays : createdDate,
      DATE_FORMAT
    );

    logger.info(`Loading transactions from ${startDate} to ${endDate}`);
    const response = await client.getTransactions(
      account.item.accessToken,
      startDate,
      endDate,
      {
        account_ids: [account.accountId],
      }
    );

    response.transactions.forEach(async plaidTxn => {
      logger.info(`Processing transaction ${plaidTxn.transaction_id}`);
      await savePlaidTransaction(plaidTxn, account, req);
    });

    account.expired = false;
    await account.commit(user, SUDO);
  } catch (err) {
    logger.error('Error loading transactions', err.message);
    throw err;
  }
}

async function markItemTokenExpired(req: Request, item: Item): Promise<void> {
  logger.info(`Marking all accounts for item ${item.itemId} as expired`);
  const accts = await req.accountDao.byItem(item);
  accts.forEach(async acct => {
    logger.info(`Marking account ${acct.accountId} expired.`);
    acct.expired = true;
    await acct.save(null, SUDO);
  });
}

async function handleTransactionWebhook(
  req: Request,
  payload: TransactionWebhook
): Promise<void> {
  logger.info('Processing transaction webhook', payload);
  if (
    payload.webhook_code === 'HISTORICAL_UPDATE' ||
    payload.webhook_code === 'INITIAL_UPDATE'
  ) {
    logger.info('Skipping historical/initial update');
  } else if (payload.webhook_code === 'DEFAULT_UPDATE') {
    logger.info(
      `Loading transactions: ${payload.webhook_code} for item ${payload.item_id}`
    );
    const item = await req.itemDao.byItemId(payload.item_id);
    if (!item) {
      logger.error('Failed to load item', { payload });
      throw new Error('Failed to load item');
    }

    const endDate = format(Date(), DATE_FORMAT);
    const startDate = format(subDays(endDate, 30), DATE_FORMAT);
    const txnsResp = await client.getTransactions(
      item.accessToken,
      startDate,
      endDate,
      { count: payload.new_transactions }
    );
    txnsResp.transactions.forEach(async plaidTxn => {
      logger.info(`Processing transaction ${plaidTxn.transaction_id}`);

      const acct = await req.accountDao.byAccountId(plaidTxn.account_id);
      if (acct) {
        logger.info(`Found matching account for transaction.`);
        logger.info(`Saving transaction to account ${acct.accountId}`);
        await savePlaidTransaction(plaidTxn, acct, req);
      }
    });
  } else if (payload.webhook_code === 'TRANSACTIONS_REMOVED') {
    logger.info('Removing transactions');
    payload.removed_transactions.forEach(async txnId => {
      const txn = await req.transactionDao.byTransactionId(txnId);
      if (txn) {
        logger.info(`Destroying transaction: ${txn.transactionId}`);
        await txn.destroy(SUDO);
      }
    });
  }
}

async function handleItemWebhook(req: Request, payload: ItemWebhook) {
  if (
    payload.webhook_code === 'ERROR' &&
    payload.error.error_code === 'ITEM_LOGIN_REQUIRED'
  ) {
    logger.info(`Login required for ${payload.item_id}`);
    const item = await req.itemDao.byItemId(payload.item_id);
    await markItemTokenExpired(req, item as Item);
  }
}

async function savePlaidItem(
  token: plaid.TokenResponse,
  req: Request
): Promise<Item> {
  logger.info('Saving Plaid Item', { token, user: req.user });
  const item = await req.itemDao.getOrCreate(token.item_id);
  item.accessToken = token.access_token;
  item.itemId = token.item_id;
  item.user = req.user;

  const acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);
  item.setACL(acl);

  await item.save(null, SUDO);
  logger.info('Plaid item saved');
  return item;
}

async function savePlaidTransaction(
  plaidTxn: plaid.Transaction,
  account: Account,
  req: Request
): Promise<void> {
  if (plaidTxn.pending) {
    logger.info(`Transaction ${plaidTxn.transaction_id} is pending, skipping.`);
    return;
  }

  const txn = await req.transactionDao.getOrCreate(plaidTxn.transaction_id);
  txn.transactionId = plaidTxn.transaction_id;
  txn.merchant = plaidTxn.name || '';
  txn.date = new Date(plaidTxn.date);
  txn.amount = (plaidTxn.amount || 0) * -1;

  if (plaidTxn.category_id) {
    // TODO: PlaidCategoryMapping
  }
  txn.account = account;
  await txn.commit(req.user, SUDO);
}

async function savePlaidAccount(
  account: plaid.Account,
  institutionId: string,
  item: Item,
  req: Request
): Promise<Account> {
  const getAccount = await req.accountDao.getOrCreate(account.account_id);
  const getInstitution = client.getInstitutionById<
    InstitutionWithInstitutionData
  >(institutionId, { include_optional_metadata: true });

  const creditMultiplier = account.type === 'credit' ? -1 : 1;

  const [acct, { institution }] = await Promise.all([
    getAccount,
    getInstitution,
  ]);
  acct.accountId = account.account_id;
  acct.item = item;
  acct.availableBalance = creditMultiplier * (account.balances.available || 0);
  acct.currentBalance = creditMultiplier * (account.balances.current || 0);
  acct.name = account.name || '<no name>';
  acct.subType = account.subtype || '';
  acct.type = account.type || '';
  acct.color = institution.primary_color;
  acct.logo = institution.logo;
  acct.expired = false;

  await acct.commit(req.user, SUDO);
  return acct;
}

export default plaidRouter;
