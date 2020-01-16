import Vue from 'vue';
import firebase from 'firebase/app';
import Router, { NavigationGuard, Route } from 'vue-router';
import Accounts from './views/Accounts.vue';
import Budget from './views/Budget.vue';
import Profile from './views/Profile.vue';
import Login from './views/Login.vue';
import UserDao from '@/dao/UserDao';

Vue.use(Router);

var dao = new UserDao();

const loginGuard: NavigationGuard<Vue> = async (
    to: Route,
    from: Route,
    next
) => {
    const user = firebase.auth().currentUser;
    if (user) {
        try {
            var accountUser = await dao.byUsername(user.email || '');
            if (accountUser) {
                next();
                return;
            } else {
                await firebase.auth().signOut();
            }
        } catch (e) {
            console.log('Error checking auth status', e);
        }
    }

    next('/login');
};

export default new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            redirect: '/accounts'
        },
        {
            path: '/budget',
            name: 'budget',
            beforeEnter: loginGuard,
            component: Budget
        },
        {
            path: '/accounts',
            name: 'accounts',
            beforeEnter: loginGuard,
            component: Accounts
        },
        {
            path: '/profile',
            name: 'profile',
            beforeEnter: loginGuard,
            component: Profile
        },
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '*',
            redirect: '/'
        }
    ]
});
