<template>
  <div class="budget-container">
    <b-card>
      <div class="budget-header">
        <div class="budget-info">
          <div class="budget-title-group">
            <font-awesome-icon size="3x" class="budget-icon" icon="file-invoice-dollar" />
            <div class="budget-title">
              <div class="month">
                <font-awesome-icon
                  class="date-arrow"
                  icon="arrow-circle-left"
                  @click="previousMonth"
                />
                {{ currentMonthString }}
                <font-awesome-icon class="date-arrow" icon="arrow-circle-right" @click="nextMonth" />
              </div>
              <div>Budget</div>
            </div>
          </div>
          <div class="summary">
            <div class="available">
              <div
                class="balance"
                :class="{ negative: getAvailableCash(currentMonth) < 0 }"
              >{{ formatCurrency(getAvailableCash(currentMonth)) }}</div>
              <div>{{ availableCashGroup.name }}</div>
            </div>
            <div class="separator" />
            <div class="available-summary">
              <div class="detail">
                <div>Rollover:</div>
                <div>{{ formatCurrency(getRollover(currentMonth)) }}</div>
              </div>
              <div class="detail">
                <div>Income:</div>
                <div>{{ formatCurrency(getIncome(currentMonth)) }}</div>
              </div>
              <div class="detail">
                <div>Budgeted:</div>
                <div>{{ formatCurrency(getBudgeted(currentMonth)) }}</div>
              </div>
            </div>
            <div class="separator" />
            <div class="actions">
              <b-button v-b-modal.add-group pill variant="outline-secondary" class="action">
                <font-awesome-icon icon="cloud-download-alt" />Add Group
                <b-modal id="add-group" title="Add Group" @ok="createGroup">
                  <b-form-input
                    v-model="newGroup"
                    placeholder="Enter Group Name"
                    autofocus
                    @keydown.native.enter="createGroup() && $bvModal.hide(`add-group`)"
                  />
                </b-modal>
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </b-card>
    <div class="budget-body-container">
      <div class="budget-groups">
        <b-card no-body v-for="group in groups" :key="group.id" body-class="budget-group-card-body">
          <draggable
            :list="[]"
            :group="{name: 'header-group', draggable: '.category-group-item', put: () => true, pull: false}"
            :disabled="creditCardGroup.id === group.id"
            class="headerzone"
            @change="(event) => onDragChange(group, event)"
          >
            <div :group="group.id" class="budget-group-header" slot="header">
              <div class="group-title-container">
                <font-awesome-icon
                  class="collapse-button"
                  :icon="group.hidden ? 'chevron-circle-down' : 'chevron-circle-up'"
                  @click="categoriesForGroup(group).length && setGroupHidden(group, !group.hidden)"
                />
                <b-form-input
                  class="group-title-input"
                  autofocus
                  v-if="groupNameEdit === group.id"
                  v-model="group.name"
                  @blur="setGroupName(group, group.name)"
                  @keydown.enter.native="setGroupName(group, group.name)"
                />
                <div class="group-title" v-else @click="editGroupName(group)">{{ group.name }}</div>
              </div>
              <div v-if="group.id !== creditCardGroup.id" class="group-actions">
                <b-button
                  pill
                  variant="outline-secondary"
                  class="action"
                  v-b-modal="'add-category-' + group.id"
                >Add Category</b-button>
              </div>
              <b-modal
                :id="`add-category-${group.id}`"
                title="Add Category"
                @ok="createCategory(group)"
              >
                <b-form-input
                  autofocus
                  v-model="newCategory"
                  placeholder="Enter category"
                  @keydown.native.enter="createCategory(group) && $bvModal.hide(`add-category-${group.id}`)"
                />
              </b-modal>
            </div>
            <b-collapse
              :id="`group-collapse-${group.id}`"
              :visible="(movingCategory ? !hiddenGroups.includes(group.id) : !group.hidden) && categoriesForGroup(group).length > 0"
            >
              <b-list-group class="category-group-container">
                <b-list-group-item class="category-group-item">
                  <div>Name</div>
                  <div>Budget</div>
                  <div>Activity</div>
                  <div>Balance</div>
                </b-list-group-item>
                <draggable
                  :list="categoriesForGroup(group)"
                  :group="'groups'"
                  :disabled="creditCardGroup.id === group.id"
                  draggable=".category-group-item"
                  @start="onDragStart"
                  @end="onDragEnd"
                  @change="(event) => onDragChange(group, event)"
                  :move="onDragMove"
                >
                  <b-list-group-item
                    button
                    v-for="(category, index) in categoriesForGroup(group)"
                    :key="category.id"
                    class="category-group-item"
                    :variant="!(index % 2) ? 'secondary' : ''"
                    @click="rowClicked(group, category, index)"
                    :active="selectedCategory.category.id == category.id"
                  >
                    <div>
                      <b-form-input
                        class="category-name-input"
                        autofocus
                        v-if="categoryNameEdit === category.id"
                        v-model="category.name"
                        @blur="setCategoryName(category, category.name)"
                        @keydown.enter.native="setCategoryName(category, category.name)"
                      />
                      <span v-else @click="editCategoryName(category)">{{ category.name }}</span>
                    </div>
                    <div>
                      <b-input-group>
                        <b-input-group-prepend size="sm" is-text>
                          <font-awesome-icon class="dollar-icon" icon="dollar-sign" />
                        </b-input-group-prepend>
                        <b-form-input
                          placeholder="0.00"
                          size="sm"
                          :value="category.getBudget(currentMonth)"
                          @change="setBudget(category, ...arguments)"
                        />
                      </b-input-group>
                    </div>
                    <div>{{ formatCurrency(category.getActivity(currentMonth)) }}</div>
                    <div>
                      <span class="balance">
                        <b-badge
                          pill
                          :id="`balance-${category.id}`"
                          :variant="category.getBalance(currentMonth) != 0 ? category.getBalance(currentMonth) > 0 ? 'success' : 'danger' : 'dark'"
                        >{{ formatCurrency(category.getBalance(currentMonth)) }}</b-badge>
                        <b-popover
                          v-if="category.getBalance(currentMonth) < 0"
                          :ref="`popover-${category.id}`"
                          :target="`balance-${category.id}`"
                          title="Cover Overspending"
                          placement="bottom"
                          triggers="click blur"
                          custom-class="cover-overspending-popover"
                          @shown="focusCategorySearch"
                        >
                          <CategorySearch
                            ref="category-search"
                            :onChange="(ctg) => handleOverspending(category, ctg)"
                          />
                        </b-popover>
                      </span>
                    </div>
                  </b-list-group-item>
                </draggable>
              </b-list-group>
            </b-collapse>
          </draggable>
        </b-card>
      </div>
      <div class="budget-actions-container">
        <b-card class="budget-actions">
          <Goal
            v-if="categorySelected"
            :categoryId="selectedCategory.category.id"
            :month="currentMonth"
          />
          <div class="no-goal-message" v-else>
            <h2>Select a Category</h2>
            <h2>to set a Goal</h2>
          </div>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { get, keys, reject, each, find, uniq, pullAll } from 'lodash';
import { format, addMonths } from 'date-fns';
import { evaluate } from 'mathjs';
import { BPopover, BTable } from 'bootstrap-vue';
import draggable from 'vuedraggable';
import CategorySearch from './CategorySearch.vue';
import Goal from './Goal.vue';
import CategoryModule from '../store/CategoryModule';
import CategoryGroupModule from '../store/CategoryGroupModule';
import Category from '../../models/Category';
import CategoryGroup from '../../models/CategoryGroup';
import Transaction from '../../models/Transaction';
import {
    formatMoney,
    addMoney,
    subMoney,
    isMoneyNegative,
    multiplyMoney,
    moneyAsFloat
} from '@/models/Money';

interface SelectedCategory {
    category: Category;
    index: number;
    group: CategoryGroup;
}

@Component({
    components: {
        CategorySearch,
        Goal,
        draggable
    }
})
export default class Budget extends Vue {
    public movingCategory: boolean = false;
    public hiddenGroups: string[] = [];
    public trashItems = [];
    public currentMonth: Date = new Date();
    public selectedCategory: SelectedCategory = {
        category: new Category(),
        index: -1,
        group: new CategoryGroup()
    };
    public selectedGroup: CategoryGroup = new CategoryGroup();
    public categoryClicked = false;
    public newCategory: string = '';
    public newGroup: string = '';
    public groupNameEdit: string = '';
    public categoryNameEdit: string = '';
    public fields = [
        'name',
        'budget',
        'activity',
        {
            key: 'balance',
            label: 'Balance',
            tdClass: 'balance-cell',
            thClass: 'balance-cell'
        }
    ];

    public mounted() {
        this.groupsChanged();
    }

    @Watch('groups', { deep: true })
    public groupsChanged() {
        if (!this.categorySelected && this.groups.length) {
            each(this.groups, group => {
                const cats = this.categoriesForGroup(group);
                if (
                    group.id !== CategoryGroupModule.creditCardGroup.id &&
                    cats.length
                ) {
                    this.rowClicked(group, cats[0], 0);
                    return false;
                }
            });
        }
    }

    public onDragEnd(args: any) {
        this.hideGroups(false, []);
        this.movingCategory = false;
    }

    public onDragStart(args: any) {
        this.hideGroups(true, []);
        this.movingCategory = true;
    }

    public onDragChange(group: any, event: any) {
        if (event.added) {
            this.setGroup(event.added.element, group);
        }
    }

    public onDragMove(evt: CustomEvent) {
        // @ts-ignore
        if (evt.to.className === 'headerzone') {
            // @ts-ignore
            let groupId;
            try {
                // @ts-ignore
                groupId = evt.to.firstChild.attributes.group.value;
            } catch {
                groupId = undefined;
            }
            if (groupId) {
                this.hideGroups(false, [groupId]);
            }
        }
    }

    public hideGroups(hide: boolean, groups: string[]) {
        if (hide) {
            if (groups.length === 0) {
                groups = this.groups.map(group => group.id) as string[];
            }
            this.hiddenGroups = uniq([
                ...this.hiddenGroups,
                ...groups
            ]) as string[];
        } else {
            if (groups.length === 0) {
                this.hiddenGroups = [];
            } else {
                const newGroups = this.groups.map(
                    group => group.id
                ) as string[];
                pullAll(newGroups, groups);
                this.hiddenGroups = newGroups;
            }
        }
    }

    get availableCashGroup(): CategoryGroup {
        return CategoryGroupModule.availableGroup;
    }

    get creditCardGroup(): CategoryGroup {
        return CategoryGroupModule.creditCardGroup;
    }

    public editGroupName(group: CategoryGroup) {
        if (!find(CategoryGroupModule.specialGroups, { id: group.id })) {
            this.groupNameEdit = group.id;
        }
    }

    public uneditGroupName() {
        this.groupNameEdit = '';
    }

    public editCategoryName(category: Category) {
        if (!category.isPayment) {
            this.categoryNameEdit = category.id;
        }
    }

    public uneditCategoryName() {
        this.categoryNameEdit = '';
    }

    get availableCategory() {
        if (this.availableCashGroup) {
            return get(
                CategoryModule.categoriesByGroup(this.availableCashGroup),
                '[0]'
            );
        }
    }

    public formatCurrency(amount: number): string {
        return formatMoney(amount);
    }

    public getAvailableCash(month: Date): number {
        return (
            this.getRollover(month) +
            this.getIncome(month) -
            this.getBudgeted(month)
        );
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
        CategoryModule.categories.forEach(category => {
            // @ts-ignore
            budgeted = budgeted + parseFloat(category.getBudget(month));
        });

        return budgeted;
    }

    get groups() {
        return reject(CategoryGroupModule.groups, {
            id: CategoryGroupModule.availableGroup.id
        });
    }

    get categoriesForGroup() {
        return (group: CategoryGroup) =>
            CategoryModule.categoriesByGroup(group);
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

    public async setGroupName(group: CategoryGroup, name: string) {
        group.name = name;
        await CategoryGroupModule.update(group);
        this.uneditGroupName();
    }

    public async setGroupHidden(group: CategoryGroup, hidden: boolean) {
        group.hidden = hidden;
        await CategoryGroupModule.update(group);
    }

    public async setCategoryName(category: Category, name: string) {
        category.name = name;
        await CategoryModule.update(category);
        this.uneditCategoryName();
    }

    public async setBudget(category: Category, value: string) {
        const result = evaluate(value || '0');
        category.setBudget(this.currentMonth, result);
        await CategoryModule.update(category);
    }

    public async setGroup(category: Category, group: CategoryGroup) {
        category.groupId = group.id;
        await CategoryModule.update(category);
    }

    public async createGroup() {
        if (this.newGroup) {
            const group = new CategoryGroup();
            group.name = this.newGroup;
            await CategoryGroupModule.update(group);
            this.newGroup = '';
        }
    }

    public async createCategory(group: CategoryGroup) {
        if (this.newCategory) {
            const category = new Category();
            category.name = this.newCategory;
            category.groupId = group.id;
            await CategoryModule.update(category);
            this.newCategory = '';
        }
    }

    public async handleOverspending(
        targetCategory: Category,
        sourceCategory: Category
    ) {
        if (sourceCategory) {
            const balance = Math.abs(
                targetCategory.getBalance(this.currentMonth)
            );
            let budget = targetCategory.getBudget(this.currentMonth);
            targetCategory.setBudget(this.currentMonth, budget + balance);

            budget = sourceCategory.getBudget(this.currentMonth);
            sourceCategory.setBudget(this.currentMonth, budget - balance);
            await Promise.all([
                CategoryModule.update(targetCategory),
                CategoryModule.update(sourceCategory)
            ]);
        }

        if (
            (this.$refs[`popover-${targetCategory.id}`] as Vue[][0]) as BPopover
        ) {
            ((this.$refs[
                `popover-${targetCategory.id}`
            ] as Vue[][0]) as BPopover).$emit('close');
        }
    }

    get categorySelected(): boolean {
        return !!this.selectedCategory.category.id;
    }

    public rowClicked(group: CategoryGroup, item: Category, index: number) {
        // if (this.selectedCategory.index !== -1) {
        //   ((this.$refs[
        //     `${this.selectedCategory.group.id}-table`
        //   ] as Vue[][0]) as BTable).unselectRow(this.selectedCategory.index);
        // }

        // this.$nextTick(() => {
        //   ((this.$refs[`${group.id}-table`] as Vue[][0]) as BTable).selectRow(
        //     index
        //   );
        // });

        this.selectedCategory = {
            category: item,
            index,
            group
        };
        this.categoryClicked = true;
    }

    public focusCategorySearch() {
        ((this.$refs[
            'category-search'
        ] as Vue[][0]) as CategorySearch).focusSearch();
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

    svg {
      margin-right: 5px;
    }
  }
  .budget-body-container {
    display: flex;
    flex: 1 1 auto;
    overflow-y: scroll;

    .budget-groups {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      overflow-y: scroll;

      .balance-header {
        float: right;
      }

      .balance {
        font-size: 20px;
        float: right;
      }

      .dollar-icon {
        color: $secondary;
      }

      .category-name-input {
        //margin-left: -5px;
        padding: 4px;
        height: 30px;
      }

      tr {
        height: 40px;
        outline: none;

        td,
        th {
          vertical-align: middle;
          white-space: nowrap;

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
        color: grey;
        height: 70px;
        padding: 0 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .group-title-container {
          display: flex;
          align-items: center;
          width: 200px;

          .collapse-button {
            font-size: 20px;
            margin-right: 5px;
          }

          .group-title {
            padding-left: 5px;
            font-size: 18px;
            font-weight: 500;
          }
          .group-title-input {
            padding-left: 4px;
            font-size: 18px;
            font-weight: 500;
          }
        }

        .group-actions {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      }

      .budget-group-card-body {
        padding: 0 10px !important;
      }
      .category-group-container {
        display: flex;

        & > :first-child {
          font-weight: 600;
        }
        .category-group-item {
          display: flex;
          align-items: center;
          padding: 5px;
          border: 0;

          &:first-child {
            border-top-left-radius: 0px;
            border-top-right-radius: 0px;
          }

          & > div {
            padding: 0 5px;
          }
          & > :nth-child(1) {
            width: 40%;
          }
          & > :nth-child(2) {
            width: 20%;
          }
          & > :nth-child(3) {
            width: 20%;
          }
          & > :nth-child(4) {
            width: 20%;
            text-align: right;
          }
        }
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
  .no-goal-message {
    padding: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

.cover-overspending-popover {
  .popover-body {
    padding: 0;
  }
}

.headerzone .category-group-item {
  display: none;
}
</style>



