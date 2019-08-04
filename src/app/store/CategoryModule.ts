import { Module, VuexModule, Action, Mutation, getModule } from 'vuex-module-decorators';
import { values, omit, map, flatten, reject, isUndefined } from 'lodash';
import Store from './index';
import Category from '@/models/Category';
import CategoryGroup from '@/models/CategoryGroup';
import Parse from '@/models/Parse';
import Subscriber from './Subscriber';

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
        const sub = new Subscriber(query, this);
        await sub.subscribe();

        const groups = await query.find();
        groups.forEach((group: CategoryGroup) => {
            this.add(group);
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
    public remove(group: CategoryGroup) {
        return omit(this.groupsById, group.id);
    }

    get categories(): Category[] {
        return reject(flatten(map(this.groupsById, (group) => group.categories)), isUndefined);
    }

    get groups(): CategoryGroup[] {
        return values(this.groupsById);
    }
}

export default getModule(CategoryModule);
