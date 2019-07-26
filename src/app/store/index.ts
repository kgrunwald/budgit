import Vue from 'vue';
import Vuex from 'vuex';
import actions from './actions';
import mutations from './mutations';
import { State } from './types';

Vue.use(Vuex);

export default new Vuex.Store({
  state: new State(),
  mutations,
  actions,
});
