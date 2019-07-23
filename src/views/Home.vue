<template>
  <div class="home">
    <el-input v-model="itemInput"/>
    <el-button @click="newItem(itemInput)">Create</el-button>
    <el-table :data="items">
      <el-table-column prop="name" label="Name" />
      <el-table-column prop="created" label="Created" />
      <el-table-column prop="updated" label="Updated" />
    </el-table>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Parse from 'parse';

import Item from '@/models/Item';

Parse.initialize('jk-budgit');
Parse.serverURL = `${process.env.VUE_APP_BASE_URL}/parse`;

@Component({})
export default class Home extends Vue {
  public itemInput: string = '';
  public items: Item[] = [];

  public async newItem(itemName: string) {
    const item = new Item();
    item.name = itemName;

    try {
      const newItem = await item.save();
    } catch (e) {
      alert(e.message);
    }
  }

  public async mounted() {
    const query = new Parse.Query('Item');

    this.items = (await query.find()) as Item[];

    const subscription = await query.subscribe();
    subscription.on('create', (object) => {
      this.items.push(object);
    });
  }
}
</script>
