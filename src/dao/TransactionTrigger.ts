import { setDate, addMonths } from 'date-fns';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import CategoryDao from './CategoryDao';
import Account from '../models/Account';
import User from '../models/User';
import { db } from './Firebase';
import { classToObject } from '@/models/Metadata';
import UserStore from '@/app/store/UserStore';

export default class TransactionTrigger {
    private categoryDao: CategoryDao;

    constructor(private user: User) {
        this.categoryDao = new CategoryDao(user);
    }

    public async trigger(
        txn: Transaction,
        acct: Account,
        oldCategory?: Category,
        newCategory?: Category
    ): Promise<Transaction> {
        const oldId = oldCategory && oldCategory.id;
        const newId = newCategory && newCategory.id;
        if (oldId !== newId) {
            await this.runTrigger(txn, acct, oldCategory, newCategory);
        }

        return txn;
    }

    public async runTrigger(
        txn: Transaction,
        acct: Account,
        oldCategory?: Category,
        newCategory?: Category
    ): Promise<void> {
        return db().runTransaction(async dbTxn => {
            // Save the Transaction to the DB
            const txnCollection = db().collection(
                `Users/${this.user.id}/Transactions`
            );

            if (!txn.id) {
                txn.id = this.newId();
            }

            const txnDoc = txnCollection.doc(txn.id);
            dbTxn.set(txnDoc, classToObject(txn));

            if (oldCategory) {
                await this.setCategoryActivity(
                    dbTxn,
                    txn,
                    acct,
                    oldCategory,
                    -1
                );
            }

            if (newCategory) {
                await this.setCategoryActivity(
                    dbTxn,
                    txn,
                    acct,
                    newCategory,
                    1
                );
            }
        });
    }

    private async setCategoryActivity(
        dbTxn: firebase.firestore.Transaction,
        txn: Transaction,
        acct: Account,
        ctg: Category,
        multiplier: number
    ): Promise<void> {
        if (ctg.isPayment && acct && acct.type !== 'credit') {
            return;
        }

        const month = setDate(txn.date, 1);

        const ctgCollection = db().collection(
            `Users/${this.user.id}/Categories`
        );

        // Increment the Category with the Transaction amount
        const activity = ctg.getActivity(month);
        ctg.setActivity(month, activity + multiplier * txn.amount);
        const ctgRef = ctgCollection.doc(ctg.id);
        dbTxn.set(ctgRef, classToObject(ctg));

        if (acct && acct.type === 'credit') {
            const paymentCtg = await this.categoryDao.byPaymentAccountId(
                txn.accountId
            );
            if (!paymentCtg) {
                console.error(
                    '[TRIGGER] Could not find payment category for credit account',
                    txn.accountId
                );
                return;
            }

            const creditActivity = paymentCtg.getActivity(month);
            paymentCtg.setActivity(
                month,
                creditActivity - multiplier * txn.amount
            );
            const paymentRef = ctgCollection.doc(paymentCtg.id);
            console.log(
                '[TRIGGER] Setting payment activity: ',
                paymentCtg.id,
                paymentCtg.getActivity(month)
            );
            dbTxn.set(paymentRef, classToObject(paymentCtg));
        } else {
            console.log('No account, or not a credit account', acct);
        }
    }

    private newId(): string {
        // Alphanumeric characters
        const chars =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let autoId = '';
        for (let i = 0; i < 20; i++) {
            autoId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return autoId;
    }
}
