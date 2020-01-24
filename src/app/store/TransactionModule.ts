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
import Transaction from '@/models/Transaction';
import TransactionDao from '@/dao/TransactionDao';
import TransactionTrigger from '@/dao/TransactionTrigger';
import UserStore from './UserStore';
import CategoryModule from './CategoryModule';
import AccountModule from './AccountModule';

interface AcctTxnMap {
    [k: string]: Transaction[];
}

interface CurrentTxnCategoryMap {
    [k: string]: string | undefined;
}

const user = UserStore.loadUser();
const dao = new TransactionDao(user);
const trigger = new TransactionTrigger(user);

@Module({ name: 'transaction', store, namespaced: true, dynamic: true })
class TransactionModule extends VuexModule {
    public txnsByAcct: AcctTxnMap = {};
    public txnCategories: CurrentTxnCategoryMap = {};

    @Action
    public async load() {
        dao.subscribe(this);
    }

    @Action
    public async loadTransactions(account: Account) {
        const txns = await dao.recentByAccount(account);
        for (const txn of txns) {
            this.add(txn);
        }
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

        this.txnCategories = {
            ...this.txnCategories,
            [txn.id]: txn.categoryId
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
        const oldCatId = this.txnCategories[txn.id] || '';
        const oldCtg = CategoryModule.byId(oldCatId);
        const newCtg = CategoryModule.byId(txn.categoryId || '');
        const acct = AccountModule.accountsById[txn.accountId];
        return await trigger.trigger(txn, acct, oldCtg, newCtg);
    }

    @Action
    public async delete(txn: Transaction): Promise<void> {
        const oldCatId = this.txnCategories[txn.id] || '';
        const oldCtg = CategoryModule.byId(oldCatId);
        const acct = AccountModule.accountsById[txn.accountId];
        await trigger.trigger(txn, acct, oldCtg, undefined);
        return dao.delete(txn);
    }
}

export default getModule(TransactionModule);
