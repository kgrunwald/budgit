<template>
  <div id="app">
    <Navigation />
    <div class="page-container">
      <div class="account-list-container">
        <NewAccount />
        <AccountList />
      </div>
      <div class="content-container">
        <Account />
      </div>
    </div>
    <!-- <div id="nav">
      <router-link to="/">Home</router-link> |
    </div> -->
    <router-view/>
  </div>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator';
import Navigation from './views/Navigation';
import AccountList from './views/AccountList';
import Account from './views/Account';
import NewAccount from './views/NewAccount';

@Component({
  components: {
    Navigation,
    AccountList,
    Account,
    NewAccount
  }
})
export default class App extends Vue {

}
</script>

<style lang="scss">
html, body {
  height: 100%;
  display: block;
}

#app {
  height: 100%;
}

.page-container {
  display: flex;
  height: 100%;
}

.content-container {
  width: 100%;
}

.account-list-container {
  width: 15%;
  height: 100%;
  display: flex;
  border-right: solid black 1px;
}
</style>
