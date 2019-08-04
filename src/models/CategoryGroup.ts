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

    get categories(): Category[] {
        return this.get('categories');
    }

    set categories(categories: Category[]) {
        this.set('categories', categories);
    }

    public addCategory(category: Category) {
        const categories = this.categories || [];
        categories.push(category);
        this.categories = categories;
    }
}

Parse.Object.registerSubclass('CategoryGroup', CategoryGroup);
export default CategoryGroup;
