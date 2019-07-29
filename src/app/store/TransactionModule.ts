import { Module, VuexModule, Mutation, Action, getModule } from 'vuex-module-decorators';
import { omit, pickBy, values } from 'lodash';
import Parse from 'parse';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import Store from './index';

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
        // query.equalTo('account', account);
        const txns = await query.find();
        txns.forEach((txn: Transaction) => {
            this.addTransaction(txn);
        });
    }

    @Mutation
    public addTransaction(txn: Transaction) {
        this.txnsByid = {
            ...this.txnsByid,
            [txn.transactionId]: txn,
        };
    }

    @Mutation
    public removeTransaction(txn: Transaction) {
        this.txnsByid = omit(this.txnsByid, txn.transactionId);
    }

    get byAccountId() {
        return (acctId: string): Transaction[] => {
            const matches = pickBy(this.txnsByid, (key: string) => {
                const txn = this.txnsByid[key] as Transaction;
                return txn.account.accountId === acctId;
            });

            // @ts-ignore
            return values(matches);
        };
    }
}

export default getModule(TransactionModule);
