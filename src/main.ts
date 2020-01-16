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
    faTrashAlt,
    faMinus,
    faPlus,
    faChevronCircleUp,
    faChevronCircleDown
} from '@fortawesome/free-solid-svg-icons';
import {
    FontAwesomeIcon,
    FontAwesomeLayers
} from '@fortawesome/vue-fontawesome';
import './app/styles/custom.scss';

import firebase from 'firebase/app';
import 'firebase/firestore';
import { initializeFirestore } from '@/dao/Firebase';

const app = firebase.initializeApp({
    apiKey: 'AIzaSyDsRwythALU0vhd8J6u96gjH-18agODJgs',
    authDomain: 'jk-budgit.firebaseapp.com',
    databaseURL: 'https://jk-budgit.firebaseio.com',
    projectId: 'jk-budgit',
    appId: 'budgit-web'
});

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
initializeFirestore(app);

import App from '@/app/App.vue';
import router from '@/app/router';
import store from '@/app/store';

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
    faTrashAlt,
    faMinus,
    faPlus,
    faChevronCircleUp,
    faChevronCircleDown
);

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.component('font-awesome-layers', FontAwesomeLayers);

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app');
