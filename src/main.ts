import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlusCircle, faUser, faLock, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import './app/styles/custom.scss';

import App from './app/App.vue';
import router from './app/router';
import store from './app/store';
import Parse from 'parse';

Parse.initialize(process.env.VUE_APP_PARSE_APP_ID || '');
Parse.serverURL = `${process.env.VUE_APP_BASE_URL}/parse`;
Parse.liveQueryServerURL = `ws://localhost:3000/parse`;

library.add(faPlusCircle, faUser, faLock, faExclamationCircle);

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

Vue.component('font-awesome-icon', FontAwesomeIcon);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
