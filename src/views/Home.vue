<template>
  <div class="home">
    <input v-model="itemInput">
    <button @click="newItem(itemInput)">Create</button>
    <ul>
      <li v-for="item in items" :key="item.id">{{ item.get("name") }}</li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Parse from 'parse';

Parse.initialize('jk-budgit');
Parse.serverURL = '/parse';
Parse.liveQueryServerURL = 'ws://localhost:3000/parse';

@Component({})
export default class Home extends Vue {
  public itemInput: string = '';
  public items: Parse.Object[] = [];

  public async newItem(itemName: string) {
    const Item = Parse.Object.extend('Item');
    const item = new Item();

    item.set('name', itemName);
    item.set('createdAt', new Date());

    try {
      const newItem = await item.save();
    } catch (e) {
      alert(e.message);
    }
  }

  public async mounted() {
    const query = new Parse.Query('Item');

    this.items = await query.find();

    const subscription = await query.subscribe();
    subscription.on('create', (object) => {
      this.items.push(object);
    });
  }
}
</script>
