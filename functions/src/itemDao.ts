import { Dao } from '../../src/dao/Dao';
import Item from '../../src/models/Item';

class ItemDao {
    constructor(private dao: Dao<Item>) {
        dao.setCollectionName(`Item`);
    }

    public getOrCreate(itemId: string): Promise<Item> {
        return this.dao.getOrCreate('itemId', itemId);
    }

    public async byId(id: string): Promise<Item> {
        const item = await this.dao.get(id);
        if (!item) {
            throw new Error('Could not get item by id: ' + id);
        }

        return item;
    }

    public async byItemId(itemId: string): Promise<Item> {
        const item = await this.dao.first('itemId', itemId);
        if (!item) {
            throw new Error('Could not find item by id: ' + itemId);
        }
        return item;
    }

    public commit(item: Item): Promise<Item> {
        return this.dao.commit(item);
    }

    public delete(item: Item) {
        return this.dao.delete(item);
    }
}

export default ItemDao;
