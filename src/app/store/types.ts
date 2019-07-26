import Account from '@/models/Account';

export interface RootState {
    accounts: Account[];
}

export class State implements RootState {
    public accounts: Account[] = [];
}
