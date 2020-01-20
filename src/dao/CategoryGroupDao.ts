import { Dao, DaoBase } from './Dao';
import CategoryGroup from '../models/CategoryGroup';
import User from '../models/User';
import FirebaseDao from './Firebase';

class CategoryGroupDao extends DaoBase<CategoryGroup> {
    constructor(user: User, dao?: Dao<CategoryGroup>) {
        if (!dao) {
            dao = new FirebaseDao<CategoryGroup>(CategoryGroup);
        }

        super(dao, 'CategoryGroup');
        dao.setCollectionName(`Users/${user.id}/CategoryGroups`);
    }

    public byName(name: string): Promise<CategoryGroup | undefined> {
        return this.dao.first('name', name);
    }
}

export default CategoryGroupDao;
