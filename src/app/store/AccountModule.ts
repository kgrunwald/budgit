import { Module, VuexModule, Mutation, Action, getModule, MutationAction } from 'vuex-module-decorators';
import { omit, values } from 'lodash';
import Parse from 'parse';
import Account from '@/models/Account';
import Store from './index';
import TransactionModule from './TransactionModule';
import { runInThisContext } from 'vm';

interface AccountsById {
    [key: string]: Account;
}

@Module({
    dynamic: true,
    store: Store,
    name: 'Accounts',
    namespaced: true,
})
class AccountModule extends VuexModule {
    public accountsById: AccountsById = {};
    public selectedAccountId: string = '';

    @MutationAction
    public async selectAccount(selectedAccountId: string) {
        return { selectedAccountId };
    }

    @Action
    public async loadAccounts() {
        // @ts-ignore
        const query = new Parse.Query(Account);
        const accounts = await query.find();
        accounts.forEach((account: Account) => {
            this.add(account);
            TransactionModule.loadTransactions(account);
        });
        if (!this.selectedAccount) {
            this.selectAccount(accounts[0].accountId);
        }
    }

    @Mutation
    public add(account: Account) {
        this.accountsById = {
            ...this.accountsById,
            [account.accountId]: account,
        };
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
}

export default getModule(AccountModule);
