import * as firebase from '@firebase/testing';
import { initializeFirestore, db } from '../../src/dao/Firebase';
import TransactionTrigger from '../../src/dao/TransactionTrigger';
import UserDao from '../../src/dao/UserDao';
import AccountDao from '../../src/dao/AccountDao';
import User from '../../src/models/User';
import Transaction from '../../src/models/Transaction';
import Account from '../../src/models/Account';
import Category from '../../src/models/Category';
import CategoryDao from '../../src/dao/CategoryDao';

describe('Trigger', () => {
    const userDao = new UserDao();
    let user: User;
    let accountDao: AccountDao;
    let categoryDao: CategoryDao;

    beforeAll(async () => {
        const app = firebase.initializeTestApp({
            projectId: 'my-test-project',
            auth: { uid: 'alice', email: 'alice@example.com' }
        });
        initializeFirestore(app);

        user = new User();
        user.email = 'alice@example.com';
        user.id = 'alice';
        await userDao.commit(user);
        user = await userDao.byId('alice');

        accountDao = new AccountDao(user);
        categoryDao = new CategoryDao(user);
    });

    it('Saves New Transaction', async () => {
        const t = new TransactionTrigger(user);

        const acct = await newAccount();
        const txn = newTransaction(acct);

        const res = await db().runTransaction(dbTxn =>
            t.runTrigger(dbTxn, txn, acct)
        );
        expect(res.id).toBeDefined();
        expect(res.id.length).toBe(20);
    });

    it('Sets category id on new category', async () => {
        const t = new TransactionTrigger(user);
        const acct = await newAccount();
        const txn = newTransaction(acct);
        const ctg = await newCategory();
        expect(ctg.id).toBeDefined();

        const res = await db().runTransaction(dbTxn =>
            t.runTrigger(dbTxn, txn, acct, undefined, ctg)
        );
        expect(res.categoryId).toEqual(ctg.id);
        expect(txn.categoryId).toEqual(ctg.id);
    });

    it('Sets activity on old category', async () => {
        const t = new TransactionTrigger(user);
        const acct = await newAccount();
        const txn = newTransaction(acct);
        const ctg = await newCategory();
        await db().runTransaction(dbTxn => t.runTrigger(dbTxn, txn, acct, ctg));

        expect(ctg.getActivity(new Date())).toEqual(-1 * txn.amount);
    });

    it('Sets activity on new category', async () => {
        const t = new TransactionTrigger(user);
        const acct = await newAccount();
        const txn = newTransaction(acct);
        const ctg = await newCategory();
        await db().runTransaction(dbTxn =>
            t.runTrigger(dbTxn, txn, acct, undefined, ctg)
        );

        expect(ctg.getActivity(new Date())).toEqual(txn.amount);
    });

    it('Does not set activity on cash account for payments', async () => {
        const t = new TransactionTrigger(user);
        const acct = await newAccount();
        const txn = newTransaction(acct);
        const ctg = await newCategory();
        ctg.paymentAccountId = acct.id;

        await db().runTransaction(dbTxn =>
            t.runTrigger(dbTxn, txn, acct, undefined, ctg)
        );
        expect(ctg.getActivity(new Date())).toEqual(0);
    });

    it('Sets activity on payment account for linked credit accounts', async () => {
        const t = new TransactionTrigger(user);
        const creditAcct = await newAccount();
        creditAcct.type = 'credit';
        await accountDao.commit(creditAcct);

        const txn = newTransaction(creditAcct);
        const ctg = await newCategory();
        let paymentCtg = await newCategory();
        paymentCtg.paymentAccountId = creditAcct.id;
        await categoryDao.commit(paymentCtg);

        await db().runTransaction(dbTxn =>
            t.runTrigger(dbTxn, txn, creditAcct, undefined, ctg)
        );
        paymentCtg = await categoryDao.byId(paymentCtg.id);
        expect(paymentCtg.getActivity(new Date())).toEqual(-1 * txn.amount);
    });

    async function newAccount(save: boolean = true): Promise<Account> {
        let acct = new Account();
        acct.accountId = 'testAccountId';
        if (save) {
            acct = await accountDao.commit(acct);
        }
        return acct;
    }

    function newTransaction(acct: Account): Transaction {
        const txn = new Transaction();
        txn.accountId = acct.id;
        txn.acknowledged = false;
        txn.amount = 123.44;
        txn.date = new Date();
        return txn;
    }

    async function newCategory(save: boolean = true): Promise<Category> {
        let category = new Category();
        category.name = 'test:' + Math.random();
        if (save) {
            category = await categoryDao.commit(category);
        }
        return category;
    }
});
