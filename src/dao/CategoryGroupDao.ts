import Dao, { Subscriber } from './Dao';
import CategoryGroup from '../models/CategoryGroup';

class CategoryGroupDao extends Dao<CategoryGroup> {
    constructor() {
        super(CategoryGroup);
    }

    public byName(name: string): Promise<CategoryGroup | undefined> {
        return this.first('name', name);
    }
}

export default CategoryGroupDao;
