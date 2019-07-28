<template>
    <div class="account-list">
        <div class="title">
            <span>Accounts</span>
            <div class="new-account-container">
                <NewAccount />
            </div>
        </div>
        <div 
            class="account-item" 
            :style="accountItemStyle(account.color)"
            :class="{ selected: selectedId === account.accountId }"
            v-for="account in accounts" 
            :key="account.accountId"
            @click="accountClicked(account)"
        >
<<<<<<< HEAD
            <div class="account-status" >
                <font-awesome-icon v-if="account.name === 'Plaid CD'" icon="exclamation-circle"/>
=======
            <div class="bank-icon">
                <b-img :src="account.logo" fluid alt="Responsive image"></b-img>
>>>>>>> 6c8537f3e3178de2e1c03dc8327a3785e5b5c74f
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
@import "@/app/styles/custom.scss";

.account-list {
    width: 100%;
    background-color: lighten($primary, 10%);
    color: $white;
    border: none;
    height: 100%;
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
    font-weight: 300;
    cursor: pointer;
    display: flex;

    &:hover {
        background-color: lighten($primary, 5%);
    }

    &.selected {
        background-color: darken($primary, 10%);
    }

    .account-status {
        font-size: 11px;
        margin: 2px 8px 0 0;
        min-width: 11px;
    }
}

.title {
    padding-left: 8px;
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    align-items: center;

    span {
        font-weight: 200;
        font-size: 12px;
        text-transform: uppercase;
    }

    .new-account-container {
        float: right;
        font-size: 12px;
        margin-right: 8px;
        cursor: pointer;
    }
}
</style>


