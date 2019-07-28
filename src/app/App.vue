<template>
  <div id="app">
    <router-view class="app-container"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

export default class App extends Vue {

}
</script>

<style lang="scss">
html, body, #app, .app-container {
  height: 100%;
  display: block;
}
</style>
