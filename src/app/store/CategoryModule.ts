import { Module, VuexModule, Action, Mutation, getModule } from 'vuex-module-decorators';
import { values, omit, filter } from 'lodash';
import Store from './index';
import Category from '@/models/Category';
import CategoryGroup from '@/models/CategoryGroup';
import Parse from '@/models/Parse';
import Subscriber from './Subscriber';

interface CategoriesById {
    [id: string]: Category;
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
        const sub = new Subscriber(query, this);
        await sub.subscribe();

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

    @Mutation
    public remove(category: Category) {
        this.categoriesById = omit(this.categoriesById, category.id);
    }

    get categories(): Category[] {
        return values(this.categoriesById);
    }

    get categoriesByGroup() {
        return (group: CategoryGroup): Category[] => {
            return filter(this.categories, (category) => category.group.id === group.id);
        };
    }

    @Action({ commit: 'add' })
    public async update(category: Category) {
        await category.save();
        return category;
    }
}

export default getModule(CategoryModule);
