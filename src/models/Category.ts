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

    set group(group: CategoryGroup) {
        this.set('group', group);
    }

    get group(): CategoryGroup {
        return this.get('group');
    }
}

Parse.Object.registerSubclass('Category', Category);
export default Category;
