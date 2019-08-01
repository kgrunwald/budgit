import Vue from 'vue';
import Parse from 'parse';
import Router, { NavigationGuard, Route } from 'vue-router';
import Accounts from './views/Accounts.vue';
import Login from './views/Login.vue';

Vue.use(Router);

const loginGuard: NavigationGuard<Vue> = (to: Route, from: Route, next) => {
  const user = Parse.User.current();
  if (user && user.authenticated()) {
    console.log('Authenticated');
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
      redirect: '/accounts' },
    {
      path: '/accounts',
      name: 'accounts',
      beforeEnter: loginGuard,
      component: Accounts,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
