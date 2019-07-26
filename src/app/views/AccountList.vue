<template>
    <div class="account-list">
        <div class="title">
            <h3>Accounts</h3>
            <NewAccount />
        </div>
        <div 
            class="account-item" 
            :style="accountItemStyle(account.color)"
            :class="{ selected: selectedId === account.accountId }"
            v-for="account in accounts" 
            :key="account.accountId"
            @click="accountClicked(account)"
        >
            <div class="bank-icon">
                <b-img :src="account.logo" fluid alt="Responsive image"></b-img>
            </div>
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

    public accountItemStyle(color: string) {
        return {
            '--account-item-color': color,
        };
    }

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

.bank-icon {
    width: 30px;
    height: 30px;
    padding-right: 8px;
}

.account-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 4px 8px;
    cursor: pointer;
    position: relative;

    &:before{
        display: block;
        content: "";
        position: absolute;
        z-index: -1;
        background: var(--account-item-color);;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.5;
    }

    &:hover:before {
        opacity: 1;
    }

    &.selected:before {
        opacity: 1;
    }
}

.title {
    padding-left: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
}
</style>


