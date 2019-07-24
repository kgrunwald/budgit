import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue';
import './app/styles/custom.scss';

import App from './app/App.vue';
import router from './app/router';
import store from './app/store';

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
