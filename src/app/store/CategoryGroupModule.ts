import { Module, VuexModule, Action, Mutation, getModule } from 'vuex-module-decorators';
import { values, omit } from 'lodash';
import Store from './index';
import CategoryGroup from '@/models/CategoryGroup';
import Parse from '@/models/Parse';
import Subscriber from './Subscriber';
import Category from '@/models/Category';

interface CategoryGroupsById {
    [key: string]: CategoryGroup;
}

const AVAILABLE_CASH_GROUP = 'Available Cash';

@Module({
    dynamic: true,
    store: Store,
    name: 'CategoryGroups',
    namespaced: true,
})
class CategoryGroupModule extends VuexModule {
    public groupsById: CategoryGroupsById = {};
    public availableGroup!: CategoryGroup;

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

        const availQuery = new Parse.Query(CategoryGroup).equalTo('name', AVAILABLE_CASH_GROUP);
        this.availableGroup = await availQuery.first();
        if (!this.availableGroup) {
            this.availableGroup = new CategoryGroup();
            this.availableGroup.name = AVAILABLE_CASH_GROUP;
            await this.availableGroup.commit();
            const availableCashCategory = new Category();
            availableCashCategory.group = this.availableGroup;
            availableCashCategory.name = AVAILABLE_CASH_GROUP;
            await availableCashCategory.commit();
        }
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
        return values(this.groupsById);
    }
}

export default getModule(CategoryGroupModule);
