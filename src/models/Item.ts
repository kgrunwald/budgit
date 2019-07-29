import Parse from './Parse';
import PrivateModel from './PrivateModel';

class Item extends PrivateModel {
    constructor() {
        super('Item');
    }

    get accessToken(): string {
        return this.get('accessToken');
    }

    set accessToken(token: string) {
        this.set('accessToken', token);
    }

    get itemId(): string {
        return this.get('itemId');
    }

    set itemId(id: string) {
        this.set('itemId', id);
    }
}

Parse.Object.registerSubclass('Item', Item);
export default Item;
