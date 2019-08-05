import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faPlusCircle,
  faUser,
  faLock,
  faExclamationCircle,
  faSync,
  faExclamationTriangle,
  faCloudDownloadAlt,
  faSearchDollar,
  faDollarSign,
  faArrowCircleRight,
  faArrowCircleLeft,
  faFunnelDollar,
  faFileInvoiceDollar,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome';
import './app/styles/custom.scss';

import App from './app/App.vue';
import router from './app/router';
import store from './app/store';
import Parse from 'parse';

Parse.initialize(process.env.VUE_APP_PARSE_APP_ID || '');
Parse.serverURL = `${process.env.VUE_APP_BASE_URL}/parse`;
Parse.liveQueryServerURL = `ws://localhost:3000/parse`;

library.add(
  faPlusCircle,
  faUser,
  faLock,
  faExclamationCircle,
  faSync,
  faExclamationTriangle,
  faCloudDownloadAlt,
  faSearchDollar,
  faDollarSign,
  faArrowCircleRight,
  faArrowCircleLeft,
  faFunnelDollar,
  faFileInvoiceDollar,
);

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.component('font-awesome-layers', FontAwesomeLayers);

Vue.config.errorHandler = (err, vm, info) => {
  // @ts-ignore
  if (err.code === Parse.Error.INVALID_SESSION_TOKEN) {
    Parse.User.logOut();
    router.push('/login');
  }
};

window.addEventListener('unhandledrejection', (err) => {
  // @ts-ignore
  if (err.reason.code === Parse.Error.INVALID_SESSION_TOKEN) {
      Parse.User.logOut();
      router.push('/login');
  }
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
