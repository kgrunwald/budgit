<template>
  <div v-if="ready">
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
                <div class="balance" :class="{ negative: getAvailableCash(currentMonth) < 0 }">
                  {{ formatCurrency(getAvailableCash(currentMonth)) }}
                </div>
                <div>{{ availableCashGroup.name }}</div>
              </div>
              <div class="separator" />
              <div class="available-summary">
                <div class="detail" >
                  <div>Rollover:</div>
                  <div>{{ formatCurrency(getRollover(currentMonth)) }}</div>
                </div>
                <div class="detail" >
                  <div>Income:</div>
                  <div>{{ formatCurrency(getIncome(currentMonth)) }}</div>
                </div>
                <div class="detail" >
                  <div>Budgeted:</div>
                  <div>{{ formatCurrency(getBudgeted(currentMonth)) }}</div>
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
          <b-card no-body="" v-for="group in groups" :key="group.id" body-class="budget-group-card-body">
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
                    :value="data.item.getBudget(currentMonth)"
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
                  <b-badge pill :variant="data.item.getBalance(currentMonth) != 0 ? data.item.getBalance(currentMonth) > 0 ? 'success' : 'danger' : 'dark'">
                    {{ formatCurrency(data.item.getBalance(currentMonth)) }}
                  </b-badge>
                </span>
              </template>
              <template slot="activity" slot-scope="data">
                {{ formatCurrency(data.item.getActivity(currentMonth)) }}
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
import { get, keys } from 'lodash';
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
  public ready: boolean = false;
  public availableCashGroup!: CategoryGroup;
  public fields = [
    'name',
    'budget',
    'activity',
    { key: 'balance', label: 'Balance', tdClass: 'balance-cell', thClass: 'balance-cell'}];

  public async mounted() {
    this.availableCashGroup = await CategoryGroupModule.loadAvailableGroup();
    this.ready = true;
  }

  get availableCategory() {
      return get(CategoryModule.categoriesByGroup(this.availableCashGroup), '[0]');
  }

  public formatCurrency(amount: number): string {
    return formatter.format(amount, { code: 'USD' });
  }

  public getAvailableCash(month: Date): number {
    return this.getRollover(month) + this.getIncome(month) - this.getBudgeted(month);
  }

  public getRollover(month: Date): number {
    const lastMonth = addMonths(month, -1);
    if (this.availableCategory.hasActivity(lastMonth)) {
      return this.getAvailableCash(lastMonth);
    }
    return 0;
  }

  public getIncome(month: Date) {
    return this.availableCategory.getActivity(month);
  }

  public getBudgeted(month: Date) {
    let budgeted = 0;
    CategoryModule.categories.forEach((category) => {
      // @ts-ignore
      budgeted = budgeted + parseFloat(category.getBudget(month));
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

  public previousMonth() {
    this.currentMonth = addMonths(this.currentMonth, -1);
  }

  public nextMonth() {
    this.currentMonth = addMonths(this.currentMonth, 1);
  }

  public async setBudget(category: Category, value: string) {
    category.setBudget(this.currentMonth, parseFloat(value));
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

  .available {
    display: flex;
    flex-direction: column;
  }

  .available-summary {
    width: 180px;
  }

  .detail {
    display: flex;
    justify-content: space-between;
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
          margin: 5px 20px 0 0;
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

      .balance-header {
        float: right;
      }

      .balance {
        font-size: 20px;
        float: right;
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

      tr {
        height: 40px;

        td, th {
          vertical-align: middle;

          &:first-child {
            padding-left: 10px;
          }

          &:last-child {
            padding-right: 10px;
          }
        }

        &:last-child {
          border-bottom: 1px solid #ddd;
        }
      }

      .budget-group-header {
          padding: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

      .budget-group-card-body {
        padding: 0 10px !important;
      }
    }
    .budget-actions-container {
      flex: 0 1 auto;
      width: 351px;
      display: flex;
      flex-direction: column;

      .budget-actions {
        flex: 1 1 auto;
      }
    }
  }
}

</style>



