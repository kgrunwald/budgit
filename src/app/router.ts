import Vue from 'vue';
import Parse from 'parse';
import Router, { NavigationGuard, Route } from 'vue-router';
import Accounts from './views/Accounts.vue';
import Login from './views/Login.vue';

Vue.use(Router);

const loginGuard: NavigationGuard<Vue> = (to: Route, from: Route, next) => {
  if (Parse.User.current()) {
    next();
  } else {
    next('/login');
  }
};

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'accounts',
      beforeEnter: loginGuard,
      component: Accounts,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
  ],
});
