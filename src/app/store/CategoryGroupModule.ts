import { Module, VuexModule, Action, Mutation, getModule } from 'vuex-module-decorators';
import { values, omit, remove, find } from 'lodash';
import store from './index';
import CategoryGroup from '@/models/CategoryGroup';
import Parse from '@/models/Parse';
import Subscriber from './Subscriber';
import Category from '@/models/Category';

interface CategoryGroupsById {
    [key: string]: CategoryGroup;
}

const AVAILABLE_CASH_GROUP = 'Available Cash';
const CREDIT_CARD_GROUP = 'Credit Cards';
const HIDDEN_GROUP = 'Hidden';

@Module({ name: 'categoryGroup', store, namespaced: true, dynamic: true })
class CategoryGroupModule extends VuexModule {
    public groupsById: CategoryGroupsById = {};

    @Action({ rawError: true })
    public async loadCategoryGroups() {
        // @ts-ignore
        const query = new Parse.Query(CategoryGroup).include('categories');
        const sub = new Subscriber(query, this);
        await sub.subscribe();

        const groups = await query.find();
        groups.forEach((group: CategoryGroup) => {
            this.add(group);
        });

        this.loadSpecialGroups();
    }

    @Action({ rawError: true })
    public async loadSpecialGroups() {
        [AVAILABLE_CASH_GROUP, HIDDEN_GROUP, CREDIT_CARD_GROUP].forEach(async (groupName) => {
            const query = new Parse.Query(CategoryGroup).equalTo('name', groupName);
            let group = await query.first();
            if (!group) {
                group = new CategoryGroup();
                group.name = groupName;
                await group.commit();

                switch (groupName) {
                    case AVAILABLE_CASH_GROUP:
                        const availableCashCategory = new Category();
                        availableCashCategory.group = group;
                        availableCashCategory.name = AVAILABLE_CASH_GROUP;
                        await availableCashCategory.commit();
                        break;
                }
                this.add(group);
            }
        });
    }

    get availableGroup(): CategoryGroup {
        return find(this.groupsById, {
            name: AVAILABLE_CASH_GROUP}) as CategoryGroup || new CategoryGroup();
    }

    get creditCardGroup(): CategoryGroup {
        return find(this.groupsById, {
            name: CREDIT_CARD_GROUP}) as CategoryGroup || new CategoryGroup();
    }

    get hiddenGroup(): CategoryGroup {
        return find(this.groupsById, {
            name: HIDDEN_GROUP}) as CategoryGroup || new CategoryGroup();
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
        const ccGroup = remove(groups, {name: CREDIT_CARD_GROUP});
        const hiddenGroup = remove(groups, {name: HIDDEN_GROUP});
        return [
            ...ccGroup,
            ...groups,
            ...hiddenGroup,
        ];
    }

    get specialGroups() {
        return [
            this.availableGroup,
            this.creditCardGroup,
            this.hiddenGroup,
        ];
    }

    @Action({ commit: 'add' })
    public async update(group: CategoryGroup) {
        await group.commit();
        return group;
    }
}

export default getModule(CategoryGroupModule);
