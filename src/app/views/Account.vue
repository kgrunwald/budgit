<template>
    <div class="account-container">
        <b-card>
            <div class="account-title">
                <span>{{ account.name }}</span>
                <span :class="account.currentBalance > 0 ? 'positive' : 'negative'">{{ currentBalance }}</span>
            </div>
            <div class="type">
                <span>{{ account.subType }}</span>
                <span>Current Balance</span>
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
import Transaction from '@/models/Transaction';
import AccountModel from '@/models/Account';

@Component({
    props: {
        account: AccountModel,
    },
})
export default class Account extends Vue {
    public transactions: Transaction[] = [];

    public fields = ['date', 'merchant', 'category', { key: 'formattedAmount', label: 'Amount'}];

    public mounted() {
        for (let i = 0; i < 10; i++) {
            const t = new Transaction();
            t.merchant = 'Merchant ' + i;
            t.date = format('2019-07-25', 'MM/DD/YYYY');
            t.amount = 100 + i;
            t.category = 'Coffee';

            this.transactions.push(t);
        }
    }

    get currentBalance(): string {
        return formatter.format(this.$props.account.currentBalance, { code: 'USD' });
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

    .account-title {
        display: flex;
        font-size: 18px;
        font-weight: 500;
        justify-content: space-between;

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

.card:first-child {
    margin-bottom: 5px;
}
</style>

