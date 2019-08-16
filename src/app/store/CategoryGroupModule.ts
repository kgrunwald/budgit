import { Module, VuexModule, Action, Mutation, getModule } from 'vuex-module-decorators';
import { values, omit, remove } from 'lodash';
import store from './index';
import CategoryGroup from '@/models/CategoryGroup';
import Parse from '@/models/Parse';
import Subscriber from './Subscriber';
import Category from '@/models/Category';

interface CategoryGroupsById {
    [key: string]: CategoryGroup;
}

const AVAILABLE_CASH_GROUP = 'Available Cash';

@Module({ name: 'categoryGroup', store, namespaced: true, dynamic: true })
class CategoryGroupModule extends VuexModule {
    public groupsById: CategoryGroupsById = {};

    @Action({ rawError: true })
    public async loadCategoryGroups() {
        // @ts-ignore
        const query = new Parse.Query(CategoryGroup).notEqualTo('name', AVAILABLE_CASH_GROUP).include('categories');
        const sub = new Subscriber(query, this);
        await sub.subscribe();

        const groups = await query.find();
        groups.forEach((group: CategoryGroup) => {
            this.add(group);
        });

        this.loadAvailableGroup();
    }

    @Action({ rawError: true })
    public async loadAvailableGroup() {
        const availQuery = new Parse.Query(CategoryGroup).equalTo('name', AVAILABLE_CASH_GROUP);
        let availableGroup = await availQuery.first();
        if (!availableGroup) {
            availableGroup = new CategoryGroup();
            availableGroup.name = AVAILABLE_CASH_GROUP;
            await availableGroup.commit();

            const availableCashCategory = new Category();
            availableCashCategory.group = availableGroup;
            availableCashCategory.name = AVAILABLE_CASH_GROUP;
            await availableCashCategory.commit();
        }

        this.setAvailableGroup(availableGroup);
    }

    @Mutation
    public setAvailableGroup(group: CategoryGroup) {
        this.groupsById = {
            ...this.groupsById,
            CASH: group,
        };
    }

    get availableGroup(): CategoryGroup {
        return this.groupsById.CASH;
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

    get groups(): CategoryGroup[] {
        const groups = values(this.groupsById);
        return [
            ...remove(groups, {name: 'Credit Cards'}),
            ...groups,
        ];
    }

    @Action({ commit: 'add' })
    public async update(group: CategoryGroup) {
        await group.commit();
        return group;
    }
}

export default getModule(CategoryGroupModule);
