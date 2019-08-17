import Parse from './Parse';
import PrivateModel from './PrivateModel';

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

    get hidden(): boolean {
        return this.get('hidden');
    }

    set hidden(hidden: boolean) {
        this.set('hidden', hidden);
    }
}

Parse.Object.registerSubclass('CategoryGroup', CategoryGroup);
export default CategoryGroup;
