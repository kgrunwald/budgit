import {
    Module,
    VuexModule,
    Mutation,
    Action,
    getModule,
    MutationAction
} from 'vuex-module-decorators';
import { omit, values } from 'lodash';
import store from './index';
import Account from '@/models/Account';
import TransactionModule from './TransactionModule';
import AccountDao from '@/dao/AccountDao';

interface AccountsById {
    [key: string]: Account;
}

const dao: AccountDao = new AccountDao();

@Module({ name: 'account', store, namespaced: true, dynamic: true })
class AccountModule extends VuexModule {
    public accountsById: AccountsById = {};
    public selectedAccountId: string = '';

    @MutationAction
    public async selectAccount(selectedAccountId: string) {
        return { selectedAccountId };
    }

    @Action({ rawError: true })
    public async loadAccounts() {
        dao.subscribe(this);
        const accounts = await dao.all();

        if (!this.selectedAccount) {
            if (accounts.length > 0) {
                this.selectAccount(accounts[0].accountId);
            } else {
                this.selectAccount('');
            }
        }

        accounts.forEach((account: Account) => {
            this.add(account);
            TransactionModule.loadTransactions(account);
        });
    }

    @Mutation
    public add(account: Account) {
        this.accountsById = {
            ...this.accountsById,
            [account.accountId]: account
        };
        if (!this.selectedAccountId) {
            this.selectedAccountId = account.accountId;
        }
    }

    @Mutation
    public remove(account: Account) {
        this.accountsById = omit(this.accountsById, account.accountId);
    }

    get accounts(): Account[] {
        return values(this.accountsById);
    }

    get selectedAccount(): Account {
        return this.accountsById[this.selectedAccountId];
    }

    @Action({ commit: 'add' })
    public async update(acct: Account): Promise<Account> {
        return await dao.commit(acct);
    }

    @Action
    public async updateAccount(accountId: string) {
        const resp = await fetch('/api/updateAccounts', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId })
        });
    }

    @Action
    public async removeAccount(accountId: string) {
        const resp = await fetch('/api/removeAccount', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId })
        });
        if (this.accounts.length > 0) {
            this.selectAccount(this.accounts[0].accountId);
        } else {
            this.selectAccount('');
        }
    }
}

export default getModule(AccountModule);
