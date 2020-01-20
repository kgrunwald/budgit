import * as functions from 'firebase-functions';
import { setDate, addMonths } from 'date-fns';

import Transaction from '../../src/models/Transaction';
import { objectToClass } from '../../src/models/Metadata';
import Category from '../../src/models/Category';
import CategoryDao from '../../src/dao/CategoryDao';
import AccountDao from '../../src/dao/AccountDao';
import UserDao from '../../src/dao/UserDao';
import Account from '../../src/models/Account';
import TransactionDao from '../../src/dao/TransactionDao';
import AdminDao from './adminDao';
import User from '../../src/models/User';

export const transactionTrigger = async (
    change: functions.Change<functions.firestore.DocumentSnapshot>,
    context: functions.EventContext
) => {
    const userId = context.params.userId;
    if (!userId) {
        console.error('Could not find user from context', context.params);
        return;
    }

    const origData = change.before.data();
    const newData = change.after.data();
    if (!origData || !newData) {
        console.log('No data change', origData, newData);
        return;
    }

    const orig = objectToClass(Transaction, origData);
    const update = objectToClass(Transaction, newData);

    const userDao = new UserDao(new AdminDao<User>(User));
    const user = await userDao.byId(userId);
    if (!user) {
        console.error('Could not find user by userId:', userId);
        return;
    }

    const origCatId = orig.categoryId;
    const updateCatId = update.categoryId;

    if (origCatId === updateCatId) {
        console.log('No category change, skipping afterSave hook');
        return;
    }

    if (origCatId) {
        console.log('Calculating activity for OLD transaction');
        await setCategoryActivity(orig, user);
    } else {
        console.log('No previous category');
    }

    if (updateCatId) {
        console.log('Calculating activity for NEW transaction');
        await setCategoryActivity(update, user);
    }
};

const setCategoryActivity = async (txn: Transaction, user: User) => {
    const categoryDao = new CategoryDao(user, new AdminDao<Category>(Category));
    const ctg = await categoryDao.byId(<string>txn.categoryId);

    if (!ctg) {
        console.log('[CLOUD] No category found for transaction');
        return;
    }

    const accountDao = new AccountDao(user, new AdminDao<Account>(Account));
    const acct = await accountDao.byId(txn.accountId);
    if (ctg.isPayment) {
        console.log(
            `Transaction ${txn.transactionId} is marked as a payment. Looking up corresponding account.`
        );
        if (acct && acct.type !== 'credit') {
            console.log(
                `[CLOUD] Account ${acct.accountId} associated with transaction ${txn.transactionId} is not a credit account, skipping`
            );
            return;
        }
    }

    const begin = setDate(txn.date, 1);
    const end = addMonths(begin, 1);

    console.log(
        `[CLOUD] Loading transactions between: ${Category.getKey(
            begin
        )} and ${Category.getKey(end)} for ${ctg.name}`
    );

    const txnDao = new TransactionDao(
        user,
        new AdminDao<Transaction>(Transaction)
    );
    const txns = await txnDao.dateRangeByCategoryId(ctg.id, begin, end);
    const activity = txns.reduce(
        (val: number, t: Transaction) => val + t.amount,
        0
    );
    console.log(`[CLOUD] Total for ${txns.length} transactions: $${activity}`);
    console.log(`[CLOUD] Setting activity for key: ${Category.getKey(begin)}`);

    ctg.setActivity(begin, activity);
    await categoryDao.commit(ctg);

    if (acct && acct.type === 'credit') {
        await setCreditActivity(txn, acct, user);
    }
};

const setCreditActivity = async (
    txn: Transaction,
    acct: Account,
    user: User
) => {
    const begin = setDate(txn.date, 1);
    const end = addMonths(begin, 1);

    const categoryDao = new CategoryDao(user, new AdminDao<Category>(Category));
    const paymentCtg = await categoryDao.byPaymentAccountId(acct.id);
    if (paymentCtg) {
        const txnDao = new TransactionDao(
            user,
            new AdminDao<Transaction>(Transaction)
        );
        const txns = await txnDao.dateRangeByAccountId(acct.id, begin, end);

        const activity = txns.reduce(
            (val: number, t: Transaction) => val - t.amount,
            0
        );

        paymentCtg.setActivity(begin, activity);
        console.log(
            '[CLOUD] Setting payment activity for credit category: ' +
                paymentCtg.id +
                ' ' +
                activity
        );
        await categoryDao.commit(paymentCtg);
    } else {
        console.error(
            '[CLOUD] No payment category found for account ' + acct.accountId
        );
    }
};
