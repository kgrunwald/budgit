import {
    Module,
    VuexModule,
    Action,
    Mutation,
    getModule
} from 'vuex-module-decorators';
import { values, omit, remove, find } from 'lodash';
import store from './index';
import CategoryGroup from '@/models/CategoryGroup';
import Category from '@/models/Category';
import CategoryDao from '@/dao/CategoryDao';
import CategoryGroupDao from '@/dao/CategoryGroupDao';

interface CategoryGroupsById {
    [key: string]: CategoryGroup;
}

const AVAILABLE_CASH_GROUP = 'Available Cash';
const CREDIT_CARD_GROUP = 'Credit Cards';
const HIDDEN_GROUP = 'Hidden';

const dao: CategoryGroupDao = new CategoryGroupDao();

@Module({ name: 'categoryGroup', store, namespaced: true, dynamic: true })
class CategoryGroupModule extends VuexModule {
    public groupsById: CategoryGroupsById = {};

    @Action({ rawError: true })
    public async loadCategoryGroups() {
        dao.subscribe(this);

        const groups = await dao.all();
        groups.forEach((group: CategoryGroup) => {
            this.add(group);
        });

        this.loadSpecialGroups();
    }

    @Action({ rawError: true })
    public async loadSpecialGroups() {
        [AVAILABLE_CASH_GROUP, HIDDEN_GROUP, CREDIT_CARD_GROUP].forEach(
            async groupName => {
                let group = await dao.byName(groupName);
                if (!group) {
                    group = new CategoryGroup();
                    group.name = groupName;
                    await dao.commit(group);

                    switch (groupName) {
                        case AVAILABLE_CASH_GROUP:
                            const categoryDao = new CategoryDao();
                            const availableCashCategory = new Category();
                            availableCashCategory.groupId = group.id;
                            availableCashCategory.name = AVAILABLE_CASH_GROUP;
                            await categoryDao.commit(availableCashCategory);
                            break;
                    }
                    this.add(group);
                }
            }
        );
    }

    get availableGroup(): CategoryGroup {
        return (
            (find(this.groupsById, {
                name: AVAILABLE_CASH_GROUP
            }) as CategoryGroup) || new CategoryGroup()
        );
    }

    get creditCardGroup(): CategoryGroup {
        return (
            (find(this.groupsById, {
                name: CREDIT_CARD_GROUP
            }) as CategoryGroup) || new CategoryGroup()
        );
    }

    get hiddenGroup(): CategoryGroup {
        return (
            (find(this.groupsById, {
                name: HIDDEN_GROUP
            }) as CategoryGroup) || new CategoryGroup()
        );
    }

    @Mutation
    public add(group: CategoryGroup) {
        this.groupsById = {
            ...this.groupsById,
            [group.id]: group
        };
    }

    @Mutation
    public remove(group: CategoryGroup) {
        return omit(this.groupsById, group.id);
    }

    get groups(): CategoryGroup[] {
        const groups = values(this.groupsById);
        const ccGroup = remove(groups, { name: CREDIT_CARD_GROUP });
        const hiddenGroup = remove(groups, { name: HIDDEN_GROUP });
        return [...ccGroup, ...groups, ...hiddenGroup];
    }

    get specialGroups() {
        return [this.availableGroup, this.creditCardGroup, this.hiddenGroup];
    }

    @Action({ commit: 'add' })
    public async update(group: CategoryGroup): Promise<CategoryGroup> {
        return await dao.commit(group);
    }
}

export default getModule(CategoryGroupModule);
