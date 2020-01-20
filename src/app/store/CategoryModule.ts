import {
    Module,
    VuexModule,
    Action,
    Mutation,
    getModule
} from 'vuex-module-decorators';
import { values, omit, filter } from 'lodash';
import store from './index';
import Category from '@/models/Category';
import User from '@/models/User';
import CategoryGroup from '@/models/CategoryGroup';
import CategoryDao from '@/dao/CategoryDao';
import UserStore from './UserStore';

interface CategoriesById {
    [id: string]: Category;
}

const dao = new CategoryDao(UserStore.loadUser());

@Module({ name: 'category', store, namespaced: true, dynamic: true })
class CategoryModule extends VuexModule {
    public categoriesById: CategoriesById = {};

    @Action({ rawError: true })
    public async loadCategories() {
        dao.subscribe(this);

        const categories = await dao.all();
        categories.forEach((category: Category) => {
            this.add(category);
        });
    }

    @Mutation
    public add(category: Category) {
        this.categoriesById = {
            ...this.categoriesById,
            [category.id]: category
        };
    }

    @Mutation
    public remove(category: Category) {
        this.categoriesById = omit(this.categoriesById, category.id);
    }

    get categories(): Category[] {
        return values(this.categoriesById);
    }

    get byId() {
        return (id: string): Category => {
            return this.categoriesById[id];
        };
    }

    get categoriesByGroup() {
        return (group: CategoryGroup): Category[] => {
            return filter(
                this.categories,
                category => category.groupId === group.id
            );
        };
    }

    @Action({ commit: 'add' })
    public async update(category: Category): Promise<Category> {
        return await dao.commit(category);
    }
}

export default getModule(CategoryModule);
