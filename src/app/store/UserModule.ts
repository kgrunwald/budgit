import {
    Module,
    VuexModule,
    Action,
    Mutation,
    getModule
} from 'vuex-module-decorators';
import store from './index';
import User from '@/models/User';
import UserDao from '@/dao/UserDao';
import UserStore from './UserStore';

const dao = new UserDao();

@Module({ name: 'user', store, namespaced: true, dynamic: true })
class UserModule extends VuexModule {
    public user: User = UserStore.loadUser();

    @Action({ rawError: true })
    public loadUser() {
        dao.subscribe(this);
        this.add(this.user);
    }

    @Mutation
    public add(user: User) {
        this.user = user;
    }

    @Mutation
    public remove(user: User) {
        this.user = new User();
    }

    @Action({ commit: 'add' })
    public async update(user: User): Promise<User> {
        return await dao.commit(user);
    }

    @Action
    public async create(user: User) {
        return this.update(user);
    }
}

export default getModule(UserModule);
