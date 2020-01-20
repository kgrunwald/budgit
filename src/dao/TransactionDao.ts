import { Dao, DaoBase } from './Dao';
import Account from '../models/Account';
import User from '../models/User';
import Transaction from '../models/Transaction';
import FirebaseDao from './Firebase';

class TransactionDao extends DaoBase<Transaction> {
    constructor(user: User, dao?: Dao<Transaction>) {
        if (!dao) {
            dao = new FirebaseDao<Transaction>(Transaction);
        }

        super(dao, 'Transaction');
        dao.setCollectionName(`Users/${user.id}/Transactions`);
    }

    public byAccountId(accountId: string): Promise<Transaction[]> {
        return this.dao.find('accountIs', accountId);
    }

    public async byTransactionId(txnId: string): Promise<Transaction> {
        const txn = await this.dao.first('transactionId', txnId);
        if (!txn) {
            throw new Error('Could not find txn by id: ' + txnId);
        }
        return txn;
    }

    public async recentByAccount(account: Account): Promise<Transaction[]> {
        return this.dao.query(
            [
                {
                    key: 'accountId',
                    operator: '==' as const,
                    value: account.id
                }
            ],
            { field: 'date', order: 'desc' },
            30
        );
    }

    public async dateRangeByCategoryId(
        categoryId: string,
        begin: Date,
        end: Date
    ): Promise<Transaction[]> {
        return this.dao.query(
            [
                {
                    key: 'categoryId',
                    operator: '==' as const,
                    value: categoryId
                },
                { key: 'date', operator: '>=' as const, value: begin },
                { key: 'date', operator: '<' as const, value: end }
            ],
            { field: 'date', order: 'desc' }
        );
    }

    public async dateRangeByAccountId(
        accountId: string,
        begin: Date,
        end: Date
    ): Promise<Transaction[]> {
        return this.dao.query(
            [
                {
                    key: 'accountId',
                    operator: '==' as const,
                    value: accountId
                },
                { key: 'date', operator: '>=' as const, value: begin },
                { key: 'date', operator: '<' as const, value: end }
            ],
            { field: 'date', order: 'desc' }
        );
    }

    public getOrCreate(txnId: string): Promise<Transaction> {
        return this.dao.getOrCreate('transactionId', txnId);
    }
}

export default TransactionDao;
