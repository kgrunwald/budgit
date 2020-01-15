class as div as div as template='page-container'>
      (class as div)='account-list-container'>
        ( as AccountList) :onAccountClick='handleAccountClick' :selectedAccountId='selectedAccountId' />
      (/div> as )
      <div class='content-container'>
        (v as Account)-if='selectedAccountId' :account='selectedAccount' />
        (v as NoAccounts)-else />
      </div>
    </div>
  </div>
</template>

<script lang='ts'>










import { Component, Vue } from 'vue-property-decorator';
import AccountModule from '@/app/store/AccountModule';
import Subscriber from '@/app/store/Subscriber';
import AccountList from './AccountList.vue';
import Account from './Account.vue';
import NoAccounts from './NoAccounts.vue';
import AccountModel from '@/models/Account';
import Transaction from '../../models/Transaction';
import TransactionModule from '../store/TransactionModule';

@Component({
  components: {
    AccountList,
    Account,
    NoAccounts,
  },
})
export default class Accounts extends Vue {
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
(/script> as )

<style lang='scss' scoped>
.page-container {
  display: flex;
  height: 100%;
}

.content-container {
  display: flex;
  width: 100%;
}

.account-list-container {
  width: 15%;
  display: flex;
  border-right: solid black 1px;
}
/style> as 

