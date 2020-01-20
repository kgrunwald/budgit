import {
    Module,
    VuexModule,
    Mutation,
    Action,
    getModule
} from 'vuex-module-decorators';
import store from './index';
import { remove, sortBy, reverse } from 'lodash';
import Account from '@/models/Account';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import TransactionDao from '@/dao/TransactionDao';
import CategoryModule from './CategoryModule';
import UserStore from './UserStore';

interface TxnMap {
    [k: string]: Transaction;
}

interface AcctTxnMap {
    [k: string]: Transaction[];
}

const dao = new TransactionDao(UserStore.loadUser());

@Module({ name: 'transaction', store, namespaced: true, dynamic: true })
class TransactionModule extends VuexModule {
    public txnsByAcct: AcctTxnMap = {};

    @Action
    public async load() {
        dao.subscribe(this);
    }

    @Action
    public async loadTransactions(account: Account) {
        const txns = await dao.recentByAccount(account);
        txns.forEach((txn: Transaction) => {
            this.add(txn);
        });
    }

    @Mutation
    public add(txn: Transaction) {
        const acctId = txn.accountId;
        let txns = this.txnsByAcct[acctId] || [];
        remove(txns, existing => existing.id === txn.id);
        txns.push(txn);

        this.txnsByAcct = {
            ...this.txnsByAcct,
            [acctId]: [...reverse(sortBy(txns, ['date', 'id']))]
        };
    }

    @Mutation
    public remove(txn: Transaction) {
        const acctId = txn.accountId;
        const txns = this.txnsByAcct[acctId];
        this.txnsByAcct = {
            ...this.txnsByAcct,
            [acctId]: [...remove(txns, existing => existing.id !== txn.id)]
        };
    }

    get byAccountId() {
        return (acctId: string): Transaction[] => this.txnsByAcct[acctId];
    }

    @Action({ commit: 'add' })
    public async update(txn: Transaction): Promise<Transaction> {
        return await dao.commit(txn);
    }

    @Action
    public delete(txn: Transaction): Promise<void> {
        return dao.delete(txn);
    }
}

export default getModule(TransactionModule);
