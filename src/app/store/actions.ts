import { ActionContext } from 'vuex';
import Parse from 'parse';
import { State, RootState } from './types';
import Account from '@/models/Account';

export default {
    async loadAccounts(context: ActionContext<State, RootState>) {
        const query = new Parse.Query('Account');
        const accounts = await query.find() as unknown as Account[];
        context.commit('addAccounts', accounts);
    },
};
