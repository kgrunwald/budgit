<template>
  <div>
    <div class="budget-container">
      <b-card>
        <div class="budget-header">
          <div class="budget-info">
            <div class="budget-title">
              <span>Budget</span>
            </div>
            <div class="summary">
              <div class="balance">
                <div :class="1000 > 0 ? 'positive' : 'negative'">1000</div>
                <span class="info">Current Balance</span>
              </div>
              <div class="separator" />
              <div class="actions">
                <b-button pill variant="outline-primary" class="action">
                  <font-awesome-icon icon="cloud-download-alt" />Import
                </b-button>
              </div>
            </div>
          </div>
        </div>
      </b-card>
      <b-card v-for="(group, i) in groups" :key="group" body-class="budget-card">
        <b-table
          striped 
          hover 
          small 
          caption-top
          :fields="fields"
        >
          <template slot="table-caption">
            <div class="budget-group-header">
              <div>
                {{ group }}
              </div>
              <b-button 
                pill 
                variant="outline-primary" 
                class="action"
                v-b-modal="'add-category-' + i"
              >
                Add Category
              </b-button>
              <b-modal :id="`add-category-${i}`" title="Add Category" @ok="createCategory(group)">
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
        </b-table>
      </b-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import CategoryModule from '../store/CategoryModule';
import Category from '../../models/Category';
import Parse from '../../models/Parse';

@Component
export default class Budget extends Vue {
  public newCategory: string = '';
  public fields = ['Category', 'Budget', 'Activity', 'Balance'];

  public async mounted() {
    CategoryModule.loadCategories();

    // @ts-ignore
    const categorySub = new Subscriber(Category, CategoryModule);
    await categorySub.subscribe();
  }

  get categories() {
    return CategoryModule.categoriesByGroup;
  }

  get groups() {
    return CategoryModule.groups;
  }

  public async createCategory(group: string) {
    console.log('create', group);
    const category = new Category();
    category.name = this.newCategory;
    category.group = group;
    await category.commit(Parse.User.current());
    this.newCategory = '';
  }

}
</script>

<style lang="scss" scoped >
@import '@/app/styles/custom.scss';

.budget-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #fafafa;
  overflow-y: scroll;

  .budget-header {
    display: flex;
    width: 100%;
    flex-direction: row;
    align-items: center;

    .budget-info {
      width: 100%;
      display: flex;
      justify-content: space-between;

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
      margin-bottom: 5px;

      .card-body {
          padding: 0.75rem;
      }
  }

  .separator {
      border-right: 1px solid #ddd;
      margin: 0 16px;
  }
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

.budget-card {
  padding: 0 10px !important;

  .budget-group-header {
    display: flex;
    justify-content: space-between
  }
}
</style>



