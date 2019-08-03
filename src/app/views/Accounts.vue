<template>
  <div>
    <div class="page-container">
      <div class="account-list-container">
        <AccountList :onAccountClick="handleAccountClick" :selectedAccountId="selectedAccountId"/>
      </div>
      <div class="content-container">
        <Account v-if="selectedAccountId" :account="selectedAccount"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import AccountModule from '@/app/store/AccountModule';
import Subscriber from '@/app/store/Subscriber';
import AccountList from './AccountList.vue';
import Account from './Account.vue';
import AccountModel from '@/models/Account';
import Transaction from '../../models/Transaction';
import TransactionModule from '../store/TransactionModule';

@Component({
  components: {
    AccountList,
    Account,
  },
})
export default class Accounts extends Vue {
  public async mounted() {
    AccountModule.loadAccounts();

    // @ts-ignore
    const acctSub = new Subscriber(AccountModel, AccountModule);
    await acctSub.subscribe();

    // @ts-ignore
    const txnSub = new Subscriber(Transaction, TransactionModule);
    await txnSub.subscribe();
  }

  public handleAccountClick(account: AccountModel) {
    AccountModule.selectAccount(account.accountId);
  }

  get selectedAccountId() {
    return AccountModule.selectedAccountId;
  }

  get selectedAccount() {
    return AccountModule.selectedAccount;
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  height: 100%;
}

.content-container {
  width: 100%;
}

.account-list-container {
  width: 15%;
  display: flex;
  border-right: solid black 1px;
}
</style>

