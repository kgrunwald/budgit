import Dao from './Dao';
import Account from '../models/Account';
import Category from '../models/Category';

class CategoryDao extends Dao {
  protected clazz = Category;

  constructor(useMasterKey?: boolean, sessionToken?: string) {
    super({ useMasterKey, sessionToken });
  }

  public byPaymentAccount(account: Account): Promise<Category[]> {
    return this.first('paymentAccount', account);
  }

  public byName(name: string): Promise<Category | undefined> {
    return this.first('name', name);
  }
}

export default CategoryDao;
