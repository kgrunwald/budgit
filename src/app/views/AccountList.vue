<template>
    <div class="account-list">
        <div class="title">
            <span>Accounts</span>
            <div class="new-account-container">
                <AccountAction icon="plus-circle" />
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
            {{ account.name }}
            <div class="account-status" >
                <AccountAction icon="sync" :token="account.refreshToken" v-if="account.refreshToken" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import AccountModule from '@/app/store/AccountModule';
import Account from '@/models/Account';
import AccountAction from './AccountAction.vue';

@Component({
    components: {
        AccountAction,
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
        padding: 10px 0 10px 10px;
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
        justify-content: space-between;
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
            min-width: 11px;
            display: flex;
            align-items: center;
        }
    }
}
</style>


