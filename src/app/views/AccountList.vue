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
            :class="{ selected: selectedAccountId === account.accountId }"
            v-for="account in accounts" 
            :key="account.accountId"
            @click="onAccountClick(account)"
        >
            <div class="account-status" >
                <font-awesome-icon v-if="account.name === 'Plaid CD'" icon="sync"/>
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
    props: {
        onAccountClick: Function,
        selectedAccountId: String,
    },
})
export default class AcountList extends Vue {
    public accountItemStyle(color: string) {
        return {
            '--account-item-color': color,
        };
    }

    public get accounts(): Account[] {
        return AccountModule.accounts;
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
            margin-right: 8px;
            min-width: 11px;
            display: flex;
            align-items: center;
        }
    }
}
</style>


