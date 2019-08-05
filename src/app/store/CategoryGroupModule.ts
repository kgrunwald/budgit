import { Module, VuexModule, Action, Mutation, getModule } from 'vuex-module-decorators';
import { values, omit } from 'lodash';
import Store from './index';
import CategoryGroup from '@/models/CategoryGroup';
import Parse from '@/models/Parse';
import Subscriber from './Subscriber';

interface CategoryGroupsById {
    [key: string]: CategoryGroup;
}

@Module({
    dynamic: true,
    store: Store,
    name: 'CategoryGroups',
    namespaced: true,
})
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
