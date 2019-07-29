import Parse from 'parse';
import Account from '@/models/Account';
import AccountModule from './AccountModule';

class AccountSubsciption {
    public async subscribe() {
        // @ts-ignore
        const query = new Parse.Query(Account);
        const subscription = await query.subscribe();

        subscription.on('create', (acct: Account) => {
            AccountModule.addAccount(acct);
        });

        subscription.on('delete', (acct: Account) => {
            AccountModule.removeAccount(acct);
        });
    }
}

export default AccountSubsciption;
