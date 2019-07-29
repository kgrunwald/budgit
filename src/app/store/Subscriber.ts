import Parse from 'parse';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import AccountModule from './AccountModule';
import TransactionModule from './TransactionModule';

class AccountSubsciption {
    public async subscribe() {
        // Subscribe to account updates
        // @ts-ignore
        const accountQuery = new Parse.Query(Account);
        const accountSubscription = await accountQuery.subscribe();

        accountSubscription.on('create', (acct: Account) => {
            AccountModule.addAccount(acct);
        });

        accountSubscription.on('delete', (acct: Account) => {
            AccountModule.removeAccount(acct);
        });

        // Subscribe to transaction updates
        // @ts-ignore
        const transactionQuery = new Parse.Query(Transaction);
        const transactionSubscription = await transactionQuery.subscribe();

        transactionSubscription.on('create', (trans: Transaction) => {
            TransactionModule.addTransaction(trans);
        });

        transactionSubscription.on('delete', (trans: Transaction) => {
            TransactionModule.removeTransaction(trans);
        });
    }
}

export default AccountSubsciption;
