import Dao from './Dao';
import CategoryGroup from '../models/CategoryGroup';

class CategoryGroupDao extends Dao {
  protected clazz = CategoryGroup;

  constructor(useMasterKey?: boolean, sessionToken?: string) {
    super({ useMasterKey, sessionToken });
  }

  public byName(name: string): Promise<CategoryGroup | undefined> {
    return this.first('name', name);
  }
}

export default CategoryGroupDao;
