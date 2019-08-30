import Dao from './Dao';
import Account from '../models/Account';
import Transaction from '../models/Transaction';

class TransactionDao extends Dao {
  protected clazz = Transaction;

  constructor(useMasterKey?: boolean, sessionToken?: string) {
    super({ useMasterKey, sessionToken });
  }

  public byAccount(account: Account): Promise<Transaction[]> {
    return this.first('account', account);
  }

  public byTransactionId(txnId: string): Promise<Transaction | undefined> {
    return this.first('transactionId', txnId);
  }

  public getOrCreate(txnId: string): Promise<Transaction> {
    return super.getOrCreate('transactionId', txnId);
  }
}

export default TransactionDao;
