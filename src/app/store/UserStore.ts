import User from '@/models/User';
import { classToObject, objectToClass } from '@/models/Metadata';

export default class UserStore {
    private static user?: User;

    public static storeUser(user: User) {
        UserStore.user = user;
        const str = JSON.stringify(classToObject(user));
        window.localStorage.setItem('user', str);
    }

    public static loadUser(): User {
        if (UserStore.user) {
            return UserStore.user;
        }

        const userStr = window.localStorage.getItem('user');
        if (userStr) {
            const user = objectToClass(User, JSON.parse(userStr));
            UserStore.user = user;
            return user;
        }
        // throw new Error('No current user found');
        return new User();
    }
}
