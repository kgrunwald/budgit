<template>
    <div class="account-container">
        <b-card>
            <div class="account-header">
                <div class="account-icon">
                    <b-img class="icon" :src="account.logo"></b-img>
                </div>
                <div class="account-info">
                    <div class="account-title">
                        <span>{{ account.name }}</span>
                        <span :class="account.currentBalance > 0 ? 'positive' : 'negative'">{{ currentBalance }}</span>
                    </div>
                    <div class="type">
                        <span>{{ account.subType }}</span>
                        <span>Current Balance</span>
                    </div>
                </div>
            </div>
        </b-card>
        <b-card no-body="">
            <b-table striped hover small :items="transactions" :fields="fields">
                    <col slot="table-colgroup" width="10%" />
                    <col slot="table-colgroup" width="40%" />
                    <col slot="table-colgroup" width="40%" />
                    <col slot="table-colgroup" width="10%">
            </b-table>
        </b-card>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import formatter from 'currency-formatter';
import { format } from 'date-fns';
import TransactionModule from '@/app/store/TransactionModule';
import Transaction from '@/models/Transaction';
import AccountModel from '@/models/Account';

@Component({
    props: {
        account: AccountModel,
    },
})
export default class Account extends Vue {
    public fields = ['date', 'merchant', 'category', { key: 'formattedAmount', label: 'Amount'}];

    get currentBalance(): string {
        return formatter.format(this.$props.account.currentBalance, { code: 'USD' });
    }

    get transactions(): Transaction[] {
        return TransactionModule.byAccountId(this.$props.account.accountId);
    }
}
</script>

<style lang="scss" scoped>
@import '@/app/styles/custom.scss';

.account-container {
    width: 100%;
    height: 100%;
    padding: 10px;
    background-color: #fafafa;

    .account-header {
        display: flex;
        width: 100%;
        flex-direction: row;
        align-items: center;

        .account-icon {
            display: flex;
            justify-content: center;
            flex-direction: column;
            padding-right: 20px;

            .icon {
                width: 40px;
                height: 40px;
            }
        }

        .account-info {
            width: 100%;

            .account-title {
                display: flex;
                font-size: 18px;
                font-weight: 500;
                justify-content: space-between;
                width: 100%;

                .positive {
                    color: $green;
                }

                .negative {
                    color: $red;
                }
            }

            .type {
                display: flex;
                justify-content: space-between;
                text-transform: capitalize;
                font-size: 14px;
                font-weight: 300;
            }
        }
    }
}

.card:first-child {
    margin-bottom: 5px;
}
</style>

