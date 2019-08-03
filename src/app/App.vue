<template>
  <div id="app">
    <Navigation class="nav" v-if="this.$route.path !== '/login'" />
    <router-view class="app-container" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Navigation from './views/Navigation.vue';

@Component({
  components: {
    Navigation,
  },
})
export default class App extends Vue {}
</script>

<style lang="scss" scoped>
.nav {
  position: absolute;
  height: 56px;
  width: 100%;
}

.app-container {
  padding-top: 56px;
}

html, body, #app, .app-container {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}
</style>
