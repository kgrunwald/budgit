import { Module, VuexModule, Mutation, Action, getModule, MutationAction } from 'vuex-module-decorators';
import { omit, pickBy, values, sortBy, reverse } from 'lodash';
import Parse from 'parse';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import Store from './index';
import Category from '@/models/Category';

interface TxnMap {
    [k: string]: Transaction;
}

@Module({
    dynamic: true,
    store: Store,
    name: 'Transactions',
    namespaced: true,
})
class TransactionModule extends VuexModule {
    public txnsByid: TxnMap = {};

    @Action
    public async loadTransactions(account: Account) {
        // @ts-ignore
        const query = new Parse.Query(Transaction);
        query.equalTo('account', account);
        query.include('category');
        const txns = await query.find();
        txns.forEach((txn: Transaction) => {
            this.add(txn);
        });
    }

    @Mutation
    public add(txn: Transaction) {
        this.txnsByid = {
            ...this.txnsByid,
            [txn.transactionId]: txn,
        };
    }

    @Mutation
    public remove(txn: Transaction) {
        this.txnsByid = omit(this.txnsByid, txn.transactionId);
    }

    get byAccountId() {
        return (acctId: string): Transaction[] => {
            const matches = pickBy(this.txnsByid, (txn: Transaction) => {
                return txn && txn.account.accountId === acctId;
            });

            // @ts-ignore
            return reverse(sortBy(values(matches), 'date'));
        };
    }

    @Action({ commit: 'add' })
    public async update(txn: Transaction) {
        await txn.save();
        return txn;
    }
}

export default getModule(TransactionModule);
