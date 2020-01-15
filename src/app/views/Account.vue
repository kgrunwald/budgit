class as div as template='account-container'>
    (-card as b)>
      (class as div)='account-header'>
        (class as div)='account-icon'>
          (-img as b) class='bank-icon' :src='account.logo'>(/b-img> as )
        </div>
        <div class='account-info'>
          (class as div)='account-title'>
            (-form as b)-input
              class='account-title-input'
              autofocus
              v-if='accountNameEdit' {
              v-model
}='account.name'
              @blur='setAccountName(account, account.name)'
              @keydown.enter.native='setAccountName(account, account.name)'
            />
            (class as div)='title' v-else @click='editAccountName()'>{{ account.name }}(/div> as )
            <span class='info'>{{ account.subType }}(/span> as )
          </div>
          <div class='summary'>
            (class as div)='balance'>
              (class as div)='title'
                :class='account.currentBalance > 0 ? \'positive\' : \'negative\''
              >{{ currentBalance }}(/div> as )
              <span class='info'>Current Balance</span>
            </div>
            <div class='separator' />
            (class as div)='actions'>
              (-button as b) pill variant='outline-danger' class='action' @click='removeAccount()'>
                (-awesome as font)-icon icon='trash-alt' />
                (class as div)='action-title'>Remove</div>
              </b-button>
              <b-button
                pill
                variant='outline-secondary'
                class='action'
                :disabled='account.expired'
                @click='AccountModule.updateAccount(account.accountId)'
              >
                (-awesome as font)-icon icon='cloud-download-alt' />
                (class as div)='action-title'>Import</div>
              </b-button>
              <AccountAction :accountId='account.accountId' v-if='account.expired'>
                (slot as template) {='action' } slot-scope='props'>
                  (-- as !) <font-awesome-icon icon='sync' @click='props.onClick' /> -->
                  (-button as b) pill class='action' variant='outline-danger' @click='props.onClick'>
                    (-awesome as font)-icon icon='exclamation-triangle' />
                    (class as div)='action-title'>Refresh</div>
                  </b-button>
                </template>
              </AccountAction>
            </div>
          </div>
        </div>
      </div>
    </b-card>
    <div class='trans-actions'>
      (-button as b) pill variant='outline-success' class='action' v-b-modal.add-trans>
        (-awesome as font)-icon icon='plus-circle' />Add Transaction
      </b-button>
      <b-button
        v-if='transactionsSelected' {
        pill
}
        variant='outline-danger'
        class='action'
        @click='removeTransactions'
      >
        (-awesome as font)-icon icon='trash-alt' />Remove Transactions
      </b-button>
      <b-modal
        id='add-trans'
        title='Add Transaction'
        ok-title='Save'
        @ok='addTransaction'
        header-bg-variant='primary'
        header-text-variant='light'
      >
        ( as div) @keydown.enter='addTransaction() && $bvModal.hide(\'add-trans\')'>
          (-form as b)>
            (-form as b)-group id='input-group-date'>
              (-form as b)-checkbox
                class='deposit-switch'
                size='lg'
                v-model='newTransactionDeposit'
                switch
              >
                (class as div)='deposit-switch-label'
                >{{ newTransactionDeposit ? 'Deposit' : 'Expense' }}(/div> as )
              </b-form-checkbox>
            </b-form-group>
            <b-form-group
              id='input-group-date'
              label='Date of Transaction: '
              label-for='input-date'
            >
              (-form as b)-input
                autofocus
                id='input-date' {
                v-model
}='newTransaction.date'
                type='date'
                required
                placeholder='Enter Date'
              />
            (/b-form-group> as )
            <b-form-group id='input-group-merchant' label='Merchant:' label-for='input-merchant'>
              (-form as b)-input
                id='input-merchant'
                v-model {='newTransaction.merchant' }
                required
                placeholder='Enter Merchant'
              />
            (/b-form-group> as )
            <b-form-group id='input-group-category' label='Category:' label-for='input-category'>
              ({ :onChange='(category) => setNewTransactionCategory(category)' />
            (/b-form-group> as )
            <b-form-group
} as CategoryDropdown) id='input-group-amount' label='Amount:' label-for='input-amount'>
              (-input as b)-group>
                (-input as b)-group-prepend is-text>
                  (-awesome as font)-icon
                    v- {if='newTransactionDeposit' {
                    :class
}
}='{positive: newTransactionDeposit, negative: !newTransactionDeposit, \'sign-icon\': true}'
                    icon='plus'
                  />
                  (-awesome as font)-icon
                    v-else
                    :class='{positive: newTransactionDeposit, negative: !newTransactionDeposit, \'sign-icon\': true}'
                    icon='minus'
                  />
                (/b-input-group-prepend> as )
                <div
                  :class='{positive: newTransactionDeposit, negative: !newTransactionDeposit, \'new-trans-amount-sign\': true}'
                >$</div>
                <b-form-input
                  :class='{positive: newTransactionDeposit, negative: !newTransactionDeposit, \'new-trans-amount\': true}'
                  id='input-amount'
                  v-model='newTransaction.amount'
                  number
                  type='number'
                  required
                >(/b-form-input> as )
              </b-input-group>
            </b-form-group>
          </b-form>
        </div>
      </b-modal>
    </div>
    <b-card no-body class='account-table-container'>
      (-table as b)
        striped
        hover
        small
        tbody-tr-class='account-row-class'
        v-model='sortedTransactions'
        :items='transactions'
        :fields='fields'
        :sort-by.sync='sortBy'
        :sort-desc.sync='sortDesc'
      >
        (slot as col)='table-colgroup' width='3%' />
        (slot as col)='table-colgroup' width='3%' />
        (slot as col)='table-colgroup' width='10%' />
        (slot as col)='table-colgroup' width='40%' />
        (slot as col)='table-colgroup' width='40%' />
        (slot as col)='table-colgroup' width='10%' />
        (slot as template)='HEAD_selected'>
          (-form as b)-checkbox
            :checked='selectAll'
            :indeterminate='selectAllIndeterminate'
            @change='changeSelectAll'
          >(/b-form-checkbox> as )
        </template>
        <template slot='selected' slot-scope='data'>
          ( as div)
            @click.shift.prevent.stop='transactionSelected(data.item.id, $event)'
            @mousedown.prevent
          >
            (-form as b)-checkbox
              :checked='selected[data.item.id]'
              @change='transactionSelected(data.item.id, undefined, $event)'
            >(/b-form-checkbox> as )
          </div>
        </template>
        <template slot='acknowledged' slot-scope='data'>
          (-awesome as font)-icon
            class='ack-icon'
            icon='search-dollar'
            v-if='!data.item.acknowledged' {
            @click
}='acknowledge(data.item)'
          />
          (v as div)-else />
        </template>
        <template slot='formattedDate' slot-scope='data'>
          (class as div)='formatted-date'>{{ data.item.formattedDate }}(/div> as )
        </template>
        <template slot='merchant' slot-scope='data'>
          (class as div)='view-category'
            @click='editMerchant(data.item.id)'
            v-if='transactionMerchantEdit !== data.item.id'
          >
            (v as span)-html {='data.item.merchant || \'<i>None</i>\''>(/span> as )
          </div>
          <div
} v-if='transactionMerchantEdit === data.item.id'>
            (-form as b)-input {
              class
}='merchant-input'
              autofocus
              v-model='data.item.merchant'
              @blur='setMerchant(data.item, data.item.merchant)'
              @keydown.enter.native='setMerchant(data.item, data.item.merchant)'
            />
          (/div> as )
        </template>
        <template slot='categoryName' slot-scope='data'>
          (class as div)='view-category'
            @click='editCategory(data.item.id)'
            v-if='transactionCategoryEdit !== data.item.id'
          >
            (v as span)-html {='data.item.categoryName || \'<i>None</i>\''>(/span> as )
          </div>
          <div
} v-show='transactionCategoryEdit === data.item.id'>
            (-dropdown as b)
              :ref='\'dd-\' + data.item.id'
              class='category-dropdown'
              :text='data.item.categoryName'
              split
              split-variant='outline-primary'
              variant='primary'
              @hide='uneditCategory(data.item.id)'
              @shown='focusCategorySearch(data.item.id)'
            >
              (-dropdown as b)-form>
                (-form as b)-input :ref='\'input-\' + data.item.id' v-model='filter' />
              (/b-dropdown-form> as )
              <div class='category-dropdown-container'>
                (-dropdown as b)-item
                  v-for='category in categories' {
                  :key='category.id'
}
                  @click='setCategory(data.item, category)'
                  @blur='uneditCategory(data.item.id)'
                >{{ category.name}}(/b-dropdown-item> as )
              </div>
            </b-dropdown>
          </div>
        </template>
        <template slot='formattedAmount' slot-scope='data'>
          ( as div) :class='data.item.amount > 0 ? \'\' : \'negative\''>{{ data.item.formattedAmount }}(/div> as )
        </template>
      </b-table>
    </b-card>
  </div>
</template>

<script lang='ts'>










import { Component, Vue, Watch } from 'vue-property-decorator';
import {
  filter,
  map,
  find,
  pickBy,
  keys,
  reduce,
  includes,
  findIndex,
  each,
} from 'lodash';
import uuid from 'uuid/v4';
import { format } from 'date-fns';
import { BFormInput, BDropdown } from 'bootstrap-vue';
import CategoryModule from '@/app/store/CategoryModule';
import TransactionModule from '@/app/store/TransactionModule';
import Transaction from '@/models/Transaction';
import AccountModel from '@/models/Account';
import AccountAction from './AccountAction.vue';
import Category from '../../models/Category';
import AccountModule from '../store/AccountModule';
import CategoryDropdown from './CategoryDropdown.vue';

@Component({
  components: {
    AccountAction,
    CategoryDropdown,
  },
  props: {
    account: AccountModel,
  },
})
export default class Account extends Vue {
  public fields = [
    { key: 'selected', label: '' },
    { key: 'acknowledged', label: '' },
    { key: 'formattedDate', label: 'Date', sortable: true },
    { key: 'merchant', label: 'Merchant', sortable: true },
    { key: 'categoryName', label: 'Category' },
    { key: 'formattedAmount', label: 'Amount' },
  ];
  public selected: { [key: string]: boolean } = {};
  public sortedTransactions: Transaction[] = [];
  public lastSelectedIndex = -1;
  public selectAll = false;
  public selectAllIndeterminate = false;
  public sortBy = 'date';
  public sortDesc = true;
  public accountNameEdit: boolean = false;
  public transactionCategoryEdit: string = '';
  public transactionMerchantEdit: string = '';
  public filter: string = '';
  public AccountModule = AccountModule;
  public newTransaction: { [key: string]: any } = {};
  public newTransactionCategoryName: string = 'Select Category';
  public newTransactionDeposit: boolean = false;

  @Watch('selected', { deep: true })
  public async onSelectedChanged(val: object) {
    const checked = keys(pickBy(val, value => value === true));
    const unchecked = keys(pickBy(val, value => value === false));
    if (checked.length === this.transactions.length) {
      this.selectAllIndeterminate = false;
      this.selectAll = true;
    } else if (unchecked.length === this.transactions.length) {
      this.selectAllIndeterminate = false;
      this.selectAll = false;
    } else if (checked.length) {
      this.selectAllIndeterminate = true;
    } else {
      this.selectAllIndeterminate = false;
      this.selectAll = false;
    }
  }

  public changeSelectAll(checked: boolean) {
    const selected = reduce(
      this.transactions,
      (result: { [key: string]: any }, trans: Transaction) => {
        result[trans.id] = checked;
        return result;
      },
      {}
    );
    this.selected = selected;
  }

  public async transactionSelected(id: string, shift: Event, checked: boolean) {
    const transIndex = this.getTransactionIndex(id);
    const lastSelectedTransaction: Transaction = this.sortedTransactions[
      this.lastSelectedIndex
    ];
    const newSelected = { ...this.selected };

    if (!shift) {
      this.selected = { ...this.selected, [id]: checked };
    } else {
      if (this.lastSelectedIndex !== -1) {
        const lastSelectedState = this.selected[lastSelectedTransaction.id];
        const indexes = [this.lastSelectedIndex, transIndex].sort();
        const changeTransactionStates = this.sortedTransactions.slice(
          indexes[0],
          indexes[1] + 1
        );
        each(changeTransactionStates, transaction => {
          newSelected[transaction.id] = lastSelectedState;
        });
        this.selected = newSelected;
      }
    }
    this.lastSelectedIndex = transIndex;
  }

  public editAccountName() {
    this.accountNameEdit = true;
  }

  public uneditAccountName() {
    this.accountNameEdit = false;
  }

  public editCategory(transactionId: string) {
    this.transactionCategoryEdit = transactionId;
    (this.$refs['dd-' + transactionId] as BDropdown).show();
  }

  public focusCategorySearch(transactionId: string) {
    (this.$refs['input-' + transactionId] as BFormInput).focus();
  }

  public editMerchant(transactionId: string) {
    this.transactionMerchantEdit = transactionId;
  }

  public uneditCategory(transactionId: string) {
    // @ts-ignore
    this.filter = '';
    if (this.transactionCategoryEdit === transactionId) {
      this.transactionCategoryEdit = '';
    }
  }

  public uneditMerchant() {
    this.transactionMerchantEdit = '';
  }

  public getTransactionIndex(id: string) {
    return findIndex(this.transactions, { id });
  }

  get transactionsSelected(): boolean {
    return !!this.selectedTransactions.length;
  }

  get selectedTransactions(): Transaction[] {
    const transIds: string[] = keys(
      pickBy(this.selected, value => value === true)
    );
    return filter(this.transactions, v => includes(transIds, v.id));
  }

  get currentBalance(): string {
    return this.$props.account.formattedCurrentBalance;
  }

  get transactions(): Transaction[] {
    return TransactionModule.byAccountId(this.$props.account.accountId);
  }

  public async acknowledge(txn: Transaction) {
    txn.acknowledged = true;
    await TransactionModule.update(txn);
  }

  get categories(): Category[] {
    return filter(CategoryModule.categories, ctg =>
      ctg.name.toUpperCase().includes(this.filter.toUpperCase())
    );
  }

  public async setCategory(txn: Transaction, category: Category) {
    txn.category = category;
    await TransactionModule.update(txn);
    this.uneditCategory(txn.transactionId);
    this.acknowledge(txn);
  }

  public async setAccountName(acct: AccountModel, name: string) {
    acct.name = name;
    await AccountModule.update(acct);
    this.uneditAccountName();
  }

  public async setMerchant(txn: Transaction, merchant: string) {
    txn.merchant = merchant;
    await TransactionModule.update(txn);
    this.uneditMerchant();
  }

  public async removeAccount() {
    const res = await this.$bvModal.msgBoxConfirm(
      'Are you sure you want to delete this account?',
      {
        title: 'Delete Account',
        size: 'md',
        okVariant: 'danger',
        okTitle: 'Delete',
        cancelVariant: 'light',
        centered: true,
        headerBgVariant: 'primary',
        headerTextVariant: 'light',
      }
    );
    if (res) {
      await AccountModule.removeAccount(this.$props.account.accountId);
    }
  }

  public setNewTransactionCategory(cat: Category) {
    this.newTransactionCategoryName = cat.name;
    this.newTransaction.category = cat;
  }

  public async addTransaction() {
    if (this.newTransaction.amount && this.newTransaction.date) {
      const tran = new Transaction();
      const amount = this.newTransaction.amount;
      tran.amount = this.newTransactionDeposit ? amount : amount * -1;
      tran.date = new Date(this.newTransaction.date);
      tran.transactionId = uuid();
      tran.account = this.$props.account;
      tran.category = this.newTransaction.category;
      tran.merchant = this.newTransaction.merchant;
      tran.acknowledged = true;
      tran.currency = 'USD';
      await tran.commit();
    }
    this.newTransaction = {};
  }

  public async removeTransactions() {
    const trans = this.selectedTransactions;
    const res = await this.$bvModal.msgBoxConfirm(
      `Are you sure you want to remove ${trans.length} transaction${
        trans.length > 1 ? 's' : ''
      }?`,
      {
        title: `Delete Transaction${trans.length > 1 ? 's' : ''}`,
        size: 'md',
        okVariant: 'danger',
        okTitle: 'Delete',
        cancelVariant: 'light',
        centered: true,
        headerBgVariant: 'primary',
        headerTextVariant: 'light',
      }
    );
    if (res) {
      trans.forEach(tran => {
        tran.destroy();
      });
      this.selected = {};
    }
  }
}
(/script> as )

<style lang='scss'>
@import '@/app/styles/custom.scss';

.account-container {
  width: 100%;
  height: 100%;
  padding: 5px;
  background-color: #fafafa;
  overflow-x: scroll;
  display: flex;
  flex-direction: column;

  .account-header {
    overflow-x: scroll;
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 80px;

    .account-icon {
      display: flex;
      justify-content: center;
      flex-direction: column;
      padding-right: 20px;

      .bank-icon {
        width: 50px;
        height: 50px;
      }
    }

    .account-info {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: stretch;

      .account-title {
        display: flex;
        flex-direction: column;
        font-size: 18px;
        font-weight: 500;

        .account-title-input {
          padding-left: 4px;
          margin-left: -5px;
          width: 400px;
          font-size: 18px;
          font-weight: 500;
        }

        .title {
          padding: 7px 0 7px 0;
        }
      }

      .info {
        display: flex;
        flex-direction: column;
        text-transform: capitalize;
        font-size: 14px;
        font-weight: 300;
        white-space: nowrap;
        margin-bottom: 5px;
      }

      .balance {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;
      }

      .summary {
        display: flex;

        .actions {
          margin-bottom: 5px;
          display: flex;
          flex-direction: column;
          font-size: 12px;
          justify-content: space-evenly;
        }

        .separator {
          border-right: 1px solid #ddd;
          margin: 0 16px;
        }
      }
    }
  }
  .trans-actions {
    display: flex;
    margin: 5px;
  }
  .account-table-container {
    .ack-icon {
      margin: 0 0 0 4px;
      cursor: pointer;
      color: $secondary;
    }

    .view-category {
      display: flex;
      align-items: center;
    }

    .formatted-date {
      padding-right: 10px;
    }

    .merchant-input {
      margin-left: -5px;
      padding: 4px;
      height: 30px;
    }

    .category-dropdown {
      margin-left: -6px;
      padding: 0px;
      height: 30px;

      button {
        padding: 0 5px;
      }

      .dropdown-menu {
        display: flex;
        flex-direction: column;
        max-height: 190px;

        .category-dropdown-container {
          overflow: scroll;
        }
      }
    }

    tr {
      height: 40px;

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
  }

  .card {
    margin: 5px;

    .card-body {
      padding: 0.75rem;
    }
  }
  .action {
    padding: 0 8px 0 8px;
    display: flex;
    height: 20px;
    align-items: center;
    margin-right: 5px;
    font-size: 12px;

    .action-title {
      flex: 1 0 auto;
      display: flex;
      justify-content: flex-start;
    }

    svg {
      width: 15px;
      margin-right: 5px;
    }
  }
}

.deposit-switch {
  .custom-control-label::before {
    background-color: $red;
    border: $red;
  }

  .custom-control-label::after {
    background-color: $white !important;
  }

  .custom-control-input:checked ~ .custom-control-label::before {
    background-color: $green;
    border: $green;
  }

  .deposit-switch-label {
    font-size: 20px;
  }
}

.new-trans-amount {
  padding-left: 14px !important;
  margin-left: -14px;
  border-left: 0 !important;
  color: red;
}

.new-trans-amount-sign {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-left: 5px;
  z-index: 5;
}

.positive {
  color: $green !important;
}

.negative {
  color: $red !important;
}

.sign-icon {
  color: $secondary;
}
/style> as 

