import { Module, VuexModule, Action, Mutation, getModule } from 'vuex-module-decorators';
import { values } from 'lodash';
import Store from './index';
import Category from '@/models/Category';

interface CategoriesById {
    [key: string]: Category;
}

@Module({
    dynamic: true,
    store: Store,
    name: 'Categories',
    namespaced: true,
})
class CategoryModule extends VuexModule {
    public categoriesById: CategoriesById = {};

    @Action({ rawError: true })
    public async loadCategories() {
        // @ts-ignore
        const query = new Parse.Query(Category);
        const categories = await query.find();
        categories.forEach((category: Category) => {
            this.add(category);
        });
    }

    @Mutation
    public add(category: Category) {
        this.categoriesById = {
            ...this.categoriesById,
            [category.id]: category,
        };
    }

    get categories(): Category[] {
        return values(this.categoriesById);
    }
}

export default getModule(CategoryModule);
