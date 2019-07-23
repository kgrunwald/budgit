import Parse from 'parse';

class Item extends Parse.Object {
    constructor() {
        super('Item');
    }

    get name(): string {
        return this.get('name');
    }

    set name(name: string) {
        this.set('name', name);
    }

    get created(): string {
        return this.createdAt.toISOString();
    }

    get updated(): string {
        return this.updatedAt.toISOString();
    }
}

Parse.Object.registerSubclass('Item', Item);
export default Item;
