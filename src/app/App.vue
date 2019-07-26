<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

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
</style>
