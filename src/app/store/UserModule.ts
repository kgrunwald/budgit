import { Module, VuexModule, Action, Mutation, getModule } from 'vuex-module-decorators';
import store from './index';
import User from '@/models/User';
import Parse from '@/models/Parse';
import Subscriber from './Subscriber';

@Module({ name: 'user', store, namespaced: true, dynamic: true })
class UserModule extends VuexModule {
    public user: User = new User({});

    @Action({ rawError: true })
    public async loadUser() {
        // @ts-ignore
        const query = new Parse.Query(User);
        const sub = new Subscriber(query, this);
        await sub.subscribe();

        const user = await User.current();
        this.add(user);
    }

    @Mutation
    public add(user: User) {
        this.user = user;
    }

    @Mutation
    public remove(user: User) {
        this.user = new User({});
    }

    @Action({ commit: 'add' })
    public async update(user: User) {
        await user.save();
        return user;
    }

    @Action
    public async create(user: User) {
        await user.save();
        return user;
    }
}

export default getModule(UserModule);
