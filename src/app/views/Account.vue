<template>
    <div class="account-container">
        <b-card title="Alliant Checking" sub-title="Checking" />
        <b-card header="Transactions">
            <b-table striped hover small :items="transactions" :fields="fields" />
        </b-card>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Transaction from '@/models/Transaction';

@Component({})
export default class Account extends Vue {
    public transactions: Transaction[] = [];

    public fields = ['date', 'merchant', 'category', 'memo', 'amount'];

    public mounted() {
        for (let i = 0; i < 10; i++) {
            const t = new Transaction();
            t.merchant = 'Merchant ' + i;
            t.date = '2019/07/25';
            t.amount = `$${i + 1}.00`;
            t.memo = 'Memo ' + i;

            this.transactions.push(t);
        }
    }
}
</script>

<style lang="scss" scoped>
.account-container {
    width: 100%;
    height: 100%;
    padding: 10px;
    background-color: #fafafa;
}

.card:first-child {
    margin-bottom: 5px;
}
</style>

