<template>
    <div class="account-list">
        <div class="title">
            <h3>Accounts</h3>
            <NewAccount />
        </div>
        <div 
            class="account-item" 
            :class="{ selected: selectedId === account.accountId }"
            v-for="account in accounts" 
            :key="account.accountId"
            @click="accountClicked(account)"
        >
            {{ account.accountName }}
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Account from '@/models/Account';
import NewAccount from './NewAccount';

@Component({
    components: {
        NewAccount,
    },
})
export default class AcountList extends Vue {
    public accounts: Account[] = [];
    public selectedId: string = '';

    public mounted() {
        const checking = new Account();
        checking.accountName = 'Alliant Checking';
        checking.accountId = 'asflakjfldkf';

        const savings = new Account();
        savings.accountName = 'Alliant Savings';
        savings.accountId = 'sfdfsdf';

        this.accounts = [
            checking,
            savings,
        ];
    }

    public accountClicked(account: Account) {
        this.selectedId = account.accountId;
    }
}
</script>

<style lang="scss" scoped>
.account-list {
    width: 100%;
}

.account-item {
    padding: 4px 8px;
    cursor: pointer;

    &:hover {
        background-color: #eee;
    }

    &.selected {
        background-color: #eee;
    }
}

.title {
    padding-left: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
}
</style>


