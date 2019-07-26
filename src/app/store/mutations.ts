import { State } from './types';
import Account from '@/models/Account';

export default {
    addAccounts(state: State, accounts: Account[]) {
        state.accounts = [
            ...state.accounts,
            ...accounts,
        ];
    },
};
