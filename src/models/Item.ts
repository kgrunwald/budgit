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

    get user(): Parse.User {
        return this.get('user');
    }

    set user(user: Parse.User) {
        this.set('user', user);
    }
}

Parse.Object.registerSubclass('Item', Item);
export default Item;
