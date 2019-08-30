import Dao from './Dao';
import Item from '../models/Item';

class ItemDao extends Dao {
  protected clazz = Item;

  constructor(useMasterKey?: boolean, sessionToken?: string) {
    super({ useMasterKey, sessionToken });
  }

  public getOrCreate(itemId: string): Promise<Item> {
    return super.getOrCreate('itemId', itemId);
  }

  public byItemId(itemId: string): Promise<Item | undefined> {
    return this.first('itemId', itemId);
  }
}

export default ItemDao;
