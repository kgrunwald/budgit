import { Module, VuexModule, Action, Mutation, getModule } from 'vuex-module-decorators';
import { values } from 'lodash';
import Store from './index';
import Category from '@/models/Category';
import CategoryGroup from '@/models/CategoryGroup';
import Parse from '@/models/Parse';

interface CategoryGroupsById {
    [key: string]: CategoryGroup;
}

interface CategoriesById {
    [group: string]: Category;
}

@Module({
    dynamic: true,
    store: Store,
    name: 'Categories',
    namespaced: true,
})
class CategoryModule extends VuexModule {
    public groupsById: CategoryGroupsById = {};
    public categoriesById: CategoriesById = {};

    @Action({ rawError: true })
    public async loadCategories() {
        // @ts-ignore
        const query = new Parse.Query(CategoryGroup).include('categories');
        const groups = await query.find();
        groups.forEach((group: CategoryGroup) => {
            this.add(group);
        });

        const category = new Parse.Query(Category).includeAll();
        const categories = await category.find();
        categories.forEach((ctg: Category) => {
            this.addCategory(ctg);
        });
    }

    @Mutation
    public add(group: CategoryGroup) {
        this.groupsById = {
            ...this.groupsById,
            [group.id]: group,
        };
    }

    @Mutation
    public addCategory(ctg: Category) {
        this.categoriesById = {
            ...this.categoriesById,
            [ctg.id]: ctg,
        };
    }

    get categories(): Category[] {
        return values(this.categoriesById);
    }

    get groups(): CategoryGroup[] {
        return values(this.groupsById);
    }
}

export default getModule(CategoryModule);
