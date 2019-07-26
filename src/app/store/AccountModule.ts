import { Module, VuexModule, Mutation, MutationAction, getModule } from 'vuex-module-decorators';
import Parse from 'parse';
import Account from '@/models/Account';
import Store from './index';


@Module({
    dynamic: true,
    store: Store,
    name: 'Accounts',
    namespaced: true,
})
class AccountModule extends VuexModule {
    public accounts: Account[] = [];
    public accountsById: Map<string, Account> = new Map<string, Account>();

    @MutationAction
    public async loadAccounts() {
        // @ts-ignore
        const query = new Parse.Query(Account);
        const accounts = await query.find();
        return { accounts };
    }

    @Mutation
    public addAccounts(accounts: Account[]) {
        this.accounts = [
            ...this.accounts,
            ...accounts,
        ];
    }

    @Mutation
    public removeAccount(account: Account) {
        this.accounts = this.accounts.reduce((acctList: Account[], acct: Account) => {
            if (acct.accountId !== account.accountId) {
                acctList.push(acct);
            }

            return acctList;
        }, []);
    }
}

export default getModule(AccountModule);
