import { Module, VuexModule, MutationAction, getModule } from 'vuex-module-decorators';
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

    @MutationAction
    public async loadAccounts() {
        // @ts-ignore
        const query = new Parse.Query(Account);
        const accounts = await query.find();
        return { accounts };
    }
}

export default getModule(AccountModule);
