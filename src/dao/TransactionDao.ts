import Dao from './Dao';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import { objectsToClassArray } from '@/models/Metadata';

class TransactionDao extends Dao<Transaction> {
    constructor() {
        super(Transaction);
    }

    public byAccount(account: Account): Promise<Transaction[]> {
        return this.find('account', account);
    }

    public byTransactionId(txnId: string): Promise<Transaction | undefined> {
        return this.first('transactionId', txnId);
    }

    public async recentByAccount(account: Account): Promise<Transaction[]> {
        const res = await this.collection()
            .where('accountId', '==', account.id)
            .orderBy('date', 'desc')
            .limit(30)
            .get();

        return objectsToClassArray(this.clazz, res);
    }

    public getOrCreate(txnId: string): Promise<Transaction> {
        return super.getOrCreate('transactionId', txnId);
    }
}

export default TransactionDao;
