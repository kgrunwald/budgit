import { Dao, DaoBase } from './Dao';
import Category from '../models/Category';
import User from '../models/User';
import FirebaseDao from './Firebase';

export default class CategoryDao extends DaoBase<Category> {
    constructor(user: User, dao?: Dao<Category>) {
        if (!dao) {
            dao = new FirebaseDao<Category>(Category);
        }

        super(dao, 'Category');
        dao.setCollectionName(`Users/${user.id}/Categories`);
    }

    public byPaymentAccountId(
        accountId: string
    ): Promise<Category | undefined> {
        return this.dao.first('paymentAccountId', accountId);
    }

    public byName(name: string): Promise<Category | undefined> {
        return this.dao.first('name', name);
    }
}
