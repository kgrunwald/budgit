import Parse from './Parse';
import PrivateModel from './PrivateModel';

class Category extends PrivateModel {
    constructor() {
        super('Category');
    }

    get name(): string {
        return this.get('name');
    }

    set name(name: string) {
        this.set('name', name);
    }

    get group(): string {
        return this.get('group');
    }

    set group(group: string) {
        this.set('group', group);
    }
}

Parse.Object.registerSubclass('Category', Category);
export default Category;
