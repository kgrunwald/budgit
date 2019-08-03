import Parse from './Parse';
import Category from './Category';
import PrivateModel from './PrivateModel';

class PlaidCategoryMapping extends PrivateModel {
    constructor() {
        super('PlaidCategoryMapping');
    }

    get plaidCategoryId(): string {
        return this.get('plaidCategoryId');
    }

    set plaidCategoryId(plaidCategoryId: string) {
        this.set('plaidCategoryId', plaidCategoryId);
    }

    get category(): Category {
        return this.get('category');
    }

    set category(category: Category) {
        this.set('category', category);
    }
}

Parse.Object.registerSubclass('PlaidCategoryMapping', PlaidCategoryMapping);
export default PlaidCategoryMapping;
