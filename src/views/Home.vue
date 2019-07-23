<template>
  <div class="home">
    <div>{{ count }}</div>
    <button @click="handleClick">Increment</button>
    <input v-model="countInput">
    <button @click="setCount(countInput)">Reset</button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({})
export default class Home extends Vue {
  public count: number = 0;
  public countInput: string = '';

  public handleClick() {
    this.getData();
    this.count++;
  }

  public setCount(newCount: string) {
    this.count = parseInt(newCount, 10);
  }

  private async getData() {
    const res = await fetch('/api/test');
    const body = await res.json();
    this.count = body.result;
  }
}
</script>
