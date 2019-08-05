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

<style lang="scss">
html, body, #app, .app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
