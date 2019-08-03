import Parse from './Parse';
import PrivateModel from './PrivateModel';
import Category from './Category';

class CategoryGroup extends PrivateModel {
    constructor() {
        super('CategoryGroup');
    }

    get name(): string {
        return this.get('name');
    }

    set name(name: string) {
        this.set('name', name);
    }
}

Parse.Object.registerSubclass('CategoryGroup', CategoryGroup);
export default CategoryGroup;
