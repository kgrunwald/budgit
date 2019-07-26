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
            {{ account.name }}
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import AccountModule from '@/app/store/AccountModule';
import Account from '@/models/Account';
import NewAccount from './NewAccount.vue';

@Component({
    components: {
        NewAccount,
    },
})
export default class AcountList extends Vue {
    public selectedId: string = '';

    public get accounts(): Account[] {
        return AccountModule.accounts;
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


