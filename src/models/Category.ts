import Parse from './Parse';
import PrivateModel from './PrivateModel';
import CategoryGroup from './CategoryGroup';

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
}

Parse.Object.registerSubclass('Category', Category);
export default Category;
