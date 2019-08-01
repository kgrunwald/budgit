import Vue from 'vue';
import Parse from 'parse';
import Router, { NavigationGuard, Route } from 'vue-router';
import Home from './views/Home.vue';
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
      name: 'home',
      beforeEnter: loginGuard,
      component: Home,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
  ],
});
