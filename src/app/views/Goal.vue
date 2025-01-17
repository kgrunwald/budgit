<template>
  <div>
    <h4>Goals</h4>
    <div class="sub-header">{{category.name}}</div>
    <div class="actions">
      <b-button v-if="hasGoal" @click="budgetGoal">Budget {{ formattedGoal }}</b-button>
      <b-button v-if="hasGoal" v-b-modal.create-modal variant="outline-info">Edit goal</b-button>
      <b-button v-if="!hasGoal" v-b-modal.create-modal>Create Goal</b-button>
      <b-modal id="create-modal" title="Create Goal" @ok="createGoal">
        Enter the monthly funding goal.
        <b-form-input
          autofocus
          v-model="goalAmount"
          placeholder="Enter goal amount"
          type="number"
          @keydown.native.enter="createGoal() && $bvModal.hide('create-modal')"
        />
      </b-modal>
    </div>
    <div class="summary">
      <span
        v-if="hasGoal"
      >The current funding goal for this category is {{ formattedGoal }} per month.</span>
      <span v-else>Click above to create a monthly funding goal for this category.</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Category from '@/models/Category';
import CategoryModule from '../store/CategoryModule';
import { moneyAsFloat } from '../../models/Money';

@Component({
  props: {
    categoryId: String,
    month: Date,
  },
})
export default class Goal extends Vue {
  public goalAmount: string = '';

  get category(): Category {
    return CategoryModule.byId(this.$props.categoryId);
  }

  get goal(): number {
    return this.category.goal;
  }

  get hasGoal(): boolean {
    return this.category.hasGoal;
  }

  get formattedGoal(): string {
    return this.category.formattedGoal;
  }

  public async budgetGoal() {
    this.category.setBudget(this.$props.month, this.category.goal);
    await this.category.commit();
  }

  public async createGoal(evt: Event) {
    try {
      this.category.goal = moneyAsFloat(this.goalAmount);
      await this.category.commit();
    } catch (e) {
      evt.preventDefault();
    }
  }
}
</script>

<style lang="scss">
.actions {
  button {
    width: 100%;
    margin-bottom: 4px;
  }
}

.sub-header {
  font-size: 14px;
  font-weight: 300;
  padding-bottom: 15px;
}

.summary {
  font-size: 14px;
  font-weight: 300;
  text-align: center;
}
</style>