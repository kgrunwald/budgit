import { Module, VuexModule, Action, Mutation, getModule } from 'vuex-module-decorators';
import { values, reduce, map, uniq } from 'lodash';
import Store from './index';
import Category from '@/models/Category';
import Parse from '@/models/Parse';

interface CategoriesById {
    [key: string]: Category;
}

interface CategoriesByGroup {
    [group: string]: Category;
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

    get categoriesByGroup(): CategoriesByGroup {
        return reduce(this.categories, (obj, category) => {
            return {
                ...obj,
                [category.group]: category,
            };
        }, {});
    }

    get groups(): string[] {
        return uniq(['Credit Cards', ...map(this.categories, (category) => category.group)]);
    }
}

export default getModule(CategoryModule);
