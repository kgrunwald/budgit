import Dao from './Dao';
import Account from '../models/Account';
import Category from '../models/Category';

class CategoryDao extends Dao<Category> {
    constructor() {
        super(Category);
    }

    public byPaymentAccount(account: Account): Promise<Category | undefined> {
        return this.first('paymentAccount', account);
    }

    public byName(name: string): Promise<Category | undefined> {
        return this.first('name', name);
    }
}

export default CategoryDao;
