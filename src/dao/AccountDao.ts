import Dao from './Dao';
import Account from '../models/Account';
import Item from '../models/Item';

class AccountDao extends Dao {
  protected clazz = Account;

  constructor(useMasterKey?: boolean, sessionToken?: string) {
    super({ useMasterKey, sessionToken });
  }

  public byAccountId(accountId: string): Promise<Account | undefined> {
    return this.first('accountId', accountId);
  }

  public byItem(item: Item): Promise<Account[]> {
    return this.find('item', item);
  }

  public all(): Promise<Account[]> {
    return super.all();
  }

  public getOrCreate(accountId: string): Promise<Account> {
    return super.getOrCreate('accountId', accountId);
  }
}

export default AccountDao;
