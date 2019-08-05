<template>
  <div>
    <div class="budget-container">
      <b-card>
        <div class="budget-header">
          <div class="budget-info">
            <div class="budget-title-group">
              <font-awesome-icon size="3x" class="budget-icon" icon="file-invoice-dollar"/>
              <div class="budget-title">
                <div class="month">
                  <font-awesome-icon class="date-arrow" icon="arrow-circle-left" @click="previousMonth" />
                  {{ currentMonthString }}
                  <font-awesome-icon class="date-arrow" icon="arrow-circle-right" @click="nextMonth" />
                </div>
                <div>Budget</div>
              </div>
            </div>
            <div class="summary">
              <div class="available">
                <div class="balance" :class="{ negative: availableCash < 0 }">
                  {{ formatCurrency(availableCash) }}
                </div>
                {{ availableCashGroup.name }}
              </div>
              <div class="separator" />
              <div class="available">
                <div class="detail" >
                  Rollover: {{ formatCurrency(rollover) }}
                </div>
                <div class="detail" >
                  Income: {{ formatCurrency(income) }}
                </div>
                <div class="detail" >
                  Budgeted: {{ formatCurrency(budgeted) }}
                </div>
              </div>
              <div class="separator" />
              <div class="actions">
                <b-button v-b-modal.add-group pill variant="outline-secondary" class="action">
                  <font-awesome-icon icon="cloud-download-alt" />Add Group
                  <b-modal :id="`add-group`" title="Add Group" @ok="createGroup">
                  <b-form-input 
                    v-model="newGroup" 
                    placeholder="Enter Group Name"
                  />
                </b-modal>
                </b-button>
              </div>
            </div>
          </div>
        </div>
      </b-card>
      <div class=budget-body-container>
        <div class="budget-groups">
          <b-card v-for="group in groups" :key="group.id" body-class="budget-group-card-body">
            <b-table
              striped 
              hover 
              small 
              caption-top
              tbody-tr-class="budget-row-class"
              :fields="fields"
              :items="categoriesForGroup(group)"
            >
              <template slot="table-caption">
                <div class="budget-group-header">
                  <div>
                    {{ group.name }}
                  </div>
                  <b-button 
                    pill 
                    variant="outline-secondary" 
                    class="action"
                    v-b-modal="'add-category-' + group.id"
                  >
                    Add Category
                  </b-button>
                  <b-modal :id="`add-category-${group.id}`" title="Add Category" @ok="createCategory(group)">
                    <b-form-input 
                      v-model="newCategory" 
                      placeholder="Enter category"
                    />
                  </b-modal>
                </div>
              </template>
              <col slot="table-colgroup" width="40%" />
              <col slot="table-colgroup" width="20%" />
              <col slot="table-colgroup" width="20%" />
              <col slot="table-colgroup" width="20%" />
              <template slot="budget" slot-scope="data">
                <b-input-group>
                  <b-input-group-prepend size="sm">
                    <div class="dollar-icon">
                        <font-awesome-icon icon="dollar-sign"/>
                    </div>
                  </b-input-group-prepend>
                  <b-form-input
                    placeholder="0.00"
                    size="sm"
                    type="number"
                    number
                    :value="data.item.getBudget(currentMonthKey)"
                    @change="setBudget(data.item, ...arguments)"
                  />
                </b-input-group>
              </template>
              <template slot="HEAD_balance">
                <span class="balance-header">
                  Balance
                </span>
              </template>
              <template slot="balance" slot-scope="data">
                <span class="balance">
                  <b-badge pill :variant="data.item.getBalance(currentMonthKey) != 0 ? data.item.getBalance(currentMonthKey) > 0 ? 'success' : 'danger' : 'dark'">
                    {{ formatCurrency(data.item.getBalance(currentMonthKey)) }}
                  </b-badge>
                </span>
              </template>
              <template slot="activity" slot-scope="data">
                {{ formatCurrency(data.item.getActivity(currentMonthKey)) }}
              </template>
            </b-table>
          </b-card>
        </div>
        <div class=budget-actions-container>
          <b-card class=budget-actions>
          </b-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { keys } from 'lodash';
import { format, addMonths } from 'date-fns';
import CategoryModule from '../store/CategoryModule';
import CategoryGroupModule from '../store/CategoryGroupModule';
import Category from '../../models/Category';
import Parse from '../../models/Parse';
import CategoryGroup from '../../models/CategoryGroup';
import Transaction from '../../models/Transaction';
import formatter from 'currency-formatter';


@Component
export default class Budget extends Vue {
  public currentMonth: Date = new Date();
  public newCategory: string = '';
  public newGroup: string = '';
  public fields = [
    'name',
    'budget',
    'activity',
    { key: 'balance', label: 'Balance', tdClass: 'balance-cell', thClass: 'balance-cell'}];

  get availableCashGroup() {
    return CategoryGroupModule.availableGroup;
  }

  get availableCategory() {
    return CategoryModule.categoriesByGroup(this.availableCashGroup)[0];
  }

  public formatCurrency(amount: number): string {
    return formatter.format(amount, { code: 'USD' });
  }

  get availableCash() {
    return this.rollover + this.income - this.budgeted;
  }

  get rollover() {
    const lastMonthKey = format(addMonths(this.currentMonth, -1), 'YYYYMM');
    return -1 * this.availableCategory.getBalance(lastMonthKey);
  }

  get income() {
    return this.availableCategory.getActivity(this.currentMonthKey);
  }

  get budgeted() {
    let budgeted = 0;
    CategoryModule.categories.forEach((category) => {
      // @ts-ignore
      budgeted = budgeted + parseFloat(category.getBudget(this.currentMonthKey));
    });

    return budgeted;
  }

  get groups() {
    return CategoryGroupModule.groups;
  }

  get categoriesForGroup() {
    return (group: CategoryGroup) => CategoryModule.categoriesByGroup(group);
  }

  get currentMonthString(): string {
    return format(this.currentMonth, 'MMM YYYY');
  }

  get currentMonthKey(): string {
    return format(this.currentMonth, 'YYYYMM');
  }

  public previousMonth() {
    this.currentMonth = addMonths(this.currentMonth, -1);
  }

  public nextMonth() {
    this.currentMonth = addMonths(this.currentMonth, 1);
  }

  public async setBudget(category: Category, value: string) {
    category.setBudget(this.currentMonthKey, parseFloat(value));
    await category.commit();
  }

  public async createGroup() {
    const group = new CategoryGroup();
    group.name = this.newGroup;
    await group.commit();
    this.newGroup = '';
  }

  public async createCategory(group: CategoryGroup) {
    const category = new Category();
    category.name = this.newCategory;
    category.group = group;
    await category.commit();
    this.newCategory = '';
  }

  public async submitNewCategory(group: CategoryGroup) {
    await this.createCategory(group);
    this.$bvModal.hide(`add-category-${group.id}`);
  }

}
</script>

<style lang="scss">
@import '@/app/styles/custom.scss';

.budget-container {
  width: 100%;
  height: 100%;
  padding: 5px;
  background-color: #fafafa;
  overflow-y: scroll;
  display: flex;
  flex-flow: column;

  .budget-header {
    font-size: 14px;
    font-weight: 300;
  }

  .month {
    font-size: 24px;
    font-weight: 600;
    color: $primary;

    .date-arrow {
      font-size: 16px;
      font-weight: 300;
      margin: 0 4px 4px 4px;
      color: black;
      cursor: pointer;

      &:first-child {
        margin-left: 0;
      }
    }
  }

  .available {
    text-align: center;
    border-radius: 4px;

    .balance {
      font-size: 24px;
      font-weight: 600;
      color: $success;

      &.negative {
        color: $danger;
      }
    }
  }

  .budget-header {
    display: flex;
    width: 100%;
    flex-direction: row;
    align-items: center;

    .budget-info {
      width: 100%;
      display: flex;
      justify-content: space-between;

      .budget-title-group {
        display: flex;
        align-items: center;

        .budget-icon {
          margin: 5px 20px 0 10px;
          color: $secondary;
        }
      }

      .title {
        display: flex;
        flex-direction: column;
        font-size: 18px;
        font-weight: 500;
        width: 100%;
      }

      .summary {
        display: flex;

        .balance > div {
          width: 100%;
          text-align: right;

          .positive {
            color: $green;
          }

          .negative {
            color: $red;
          }

          .info {
            display: flex;
            flex-direction: column;
            text-transform: capitalize;
            font-size: 14px;
            font-weight: 300;
          }
        }
      }
    }
  }
  .card {
      margin: 5px;

      .card-body {
          padding: 0.75rem;
      }
  }

  .separator {
      border-right: 1px solid #ddd;
      margin: 0 16px;
  }

  .actions {
    margin-bottom: 5px;
    display: flex;
    flex-direction: column;
    font-size: 12px;
  }

  .action {
    padding: 0 8px 0 8px;
    display: flex;
    height: 20px;
    align-items: center;
    margin-right: 5px;
    font-size: 12px;

    &:first-child {
      margin-bottom: 8px;
    }

    svg {
      margin-right: 5px;
    }
  }
  .budget-body-container {
    display: flex;
    flex: 1 1 auto;

    .budget-groups {
      flex: 1 1 auto;

      .budget-group-card-body {
        padding: 0 10px !important;

        .budget-group-header {
          display: flex;
          justify-content: space-between
        }
      }
    }
    .budget-actions-container {
        flex: 0 1 auto;
        width: 300px;
        display: flex;
        flex-direction: column;

        .budget-actions {
          flex: 1 1 auto;
        }
      }
  }

  .dollar-icon {
      width: 24px;
      height: 31px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e9ecef;
      border-radius: 5px 0 0 5px;
      text-align: center;
      color: $secondary;
      border: 1px solid #ced4da;
  }

  .balance {
    font-size: 20px;
    float: right;
  }

  .balance-header {
    float: right;
  }

  .budget-row-class {
      height: 40px;

      td {
          vertical-align: middle;
      }
  }
}



</style>



