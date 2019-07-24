/* tslint:disable */
if (typeof window !== 'undefined') {
    var Parse = require('parse');
} else {
    var Parse = require('parse/node');
}
/* tslint:enable */

class Item extends Parse.Object {
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
