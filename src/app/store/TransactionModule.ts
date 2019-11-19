import {
  Module,
  VuexModule,
  Mutation,
  Action,
  getModule,
  MutationAction,
} from 'vuex-module-decorators';
import store from './index';
import { omit, pickBy, remove, sortBy, reverse } from 'lodash';
import Parse from 'parse';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import Subscriber from './Subscriber';

interface TxnMap {
  [k: string]: Transaction;
}

interface AcctTxnMap {
  [k: string]: Transaction[];
}

@Module({ name: 'transaction', store, namespaced: true, dynamic: true })
class TransactionModule extends VuexModule {
  public txnsByAcct: AcctTxnMap = {};

  @Action
  public async load() {
    // @ts-ignore
    const query = new Parse.Query(Transaction).limit(100).includeAll();
    const txnSub = new Subscriber(query, this);
    await txnSub.subscribe();
  }

  @Action
  public async loadTransactions(account: Account) {
    // @ts-ignore
    const query = new Parse.Query(Transaction);
    query.equalTo('account', account);
    query.include('category');
    query.descending('date');
    query.limit(30);

    const txns = await query.find();
    txns.forEach((txn: Transaction) => {
      this.add(txn);
    });
  }

  @Mutation
  public add(txn: Transaction) {
    const acctId = txn.account.accountId;
    let txns = this.txnsByAcct[acctId] || [];
    txns = remove(txns, existing => existing.id !== txn.id);
    txns.push(txn);

    this.txnsByAcct = {
      ...this.txnsByAcct,
      [acctId]: [...reverse(sortBy(txns, ['date', 'id']))],
    };
  }

  @Mutation
  public remove(txn: Transaction) {
    const acctId = txn.account.accountId;
    const txns = this.txnsByAcct[acctId];
    this.txnsByAcct = {
      ...this.txnsByAcct,
      [acctId]: [...remove(txns, existing => existing.id !== txn.id)],
    };
  }

  get byAccountId() {
    return (acctId: string): Transaction[] => this.txnsByAcct[acctId];
  }

  @Action({ commit: 'add' })
  public async update(txn: Transaction) {
    await txn.commit();
    return txn;
  }
}

export default getModule(TransactionModule);
