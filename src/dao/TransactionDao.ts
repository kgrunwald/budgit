import { subDays, setHours, setMinutes } from 'date-fns';
import { Dao, DaoBase, Subscriber } from './Dao';
import Account from '../models/Account';
import User from '../models/User';
import Transaction from '../models/Transaction';
import FirebaseDao from './Firebase';

class TransactionDao extends DaoBase<Transaction> {
    private _dao: Dao<Transaction>;
    constructor(user: User, dao?: Dao<Transaction>) {
        if (!dao) {
            dao = new FirebaseDao<Transaction>(Transaction);
        }

        super(dao, 'Transaction');
        dao.setCollectionName(`Users/${user.id}/Transactions`);
        this._dao = dao;
    }

    public subscribe(s: Subscriber<Transaction>): void {
        const dao = this._dao as FirebaseDao<Transaction>;
        var start = subDays(new Date(), 30);
        start = setHours(start, 0);
        start = setMinutes(start, 0);
        const q = dao.buildQuery([
            {
                key: 'date',
                operator: '>=' as const,
                value: start
            }
        ]);
        dao.subscribeQuery(s, q);
    }

    public byAccountId(accountId: string): Promise<Transaction[]> {
        console.log('Loading transactions by account id', accountId);
        return this.dao.find('accountIs', accountId);
    }

    public async byTransactionId(txnId: string): Promise<Transaction> {
        console.log('Loading transactions by txn id', txnId);
        const txn = await this.dao.first('transactionId', txnId);
        if (!txn) {
            throw new Error('Could not find txn by id: ' + txnId);
        }
        return txn;
    }

    public async recentByAccount(account: Account): Promise<Transaction[]> {
        var start = subDays(new Date(), 30);
        start = setHours(start, 0);
        start = setMinutes(start, 0);
        return this.dao.query(
            [
                {
                    key: 'accountId',
                    operator: '==' as const,
                    value: account.id
                },
                {
                    key: 'date',
                    operator: '>=' as const,
                    value: start
                }
            ],
            { field: 'date', order: 'desc' }
        );
    }

    public async dateRangeByCategoryId(
        categoryId: string,
        begin: Date,
        end: Date
    ): Promise<Transaction[]> {
        console.log(
            'Loading transactions by date range, category id',
            begin,
            end
        );
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
        console.log('Loading transactions by date range', begin, end);
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
