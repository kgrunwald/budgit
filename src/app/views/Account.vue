<template>
    <div class="account-container">
        <b-card>
            <div class="account-header">
                <div class="account-icon">
                    <b-img class="bank-icon" :src="account.logo"></b-img>
                </div>
                <div class="account-info">
                    <div class="account-title">
                        <span>{{ account.name }}</span>
                        <span class="info">{{ account.subType }}</span>
                    </div>
                    <div class="summary">
                        <div class="balance">
                            <div :class="account.currentBalance > 0 ? 'positive' : 'negative'">{{ currentBalance }}</div>
                            <span class="info">Current Balance</span>
                        </div>
                        <div class="separator" />
                        <div class="actions">
                            <b-button pill variant="outline-primary" class="action" :disabled="account.expired">
                                <font-awesome-icon icon="cloud-download-alt"/>
                                Import
                            </b-button>
                            <AccountAction :accountId="account.accountId" v-if="account.expired">
                                <template slot="action" slot-scope="props">
                                    <!-- <font-awesome-icon icon="sync" @click="props.onClick" /> -->
                                    <b-button pill class="action" variant="outline-danger" @click="props.onClick">
                                        <font-awesome-icon icon="exclamation-triangle"/>
                                        Refresh
                                    </b-button>
                                </template>
                            </AccountAction>
                        </div>
                    </div>
                </div>
            </div>
        </b-card>
        <b-card no-body="">
            <b-table
                striped 
                hover 
                small 
                :items="transactions" 
                :fields="fields" 
                :sort-by.sync="sortBy" 
                :sort-desc.sync="sortDesc"
            >
                    <col slot="table-colgroup" width="3%" />
                    <col slot="table-colgroup" width="10%" />
                    <col slot="table-colgroup" width="40%" />
                    <col slot="table-colgroup" width="40%" />
                    <col slot="table-colgroup" width="10%">
                    <template slot="acknowledged" slot-scope="data">
                        <font-awesome-icon 
                            class="ack-icon" 
                            icon="search-dollar"
                            v-if="!data.item.acknowledged" 
                            @click="acknowledge(data.item)"
                        />
                    </template>
                    <template slot="merchant" slot-scope="data">
                        <b-form-input
                            size="sm"
                            v-model="data.item.merchant"
                            @blur="update(data.item)"
                        />
                    </template>
                    <template slot="category" slot-scope="data">
                        <b-form-input
                            :id="`ctg-${data.item.id}`"
                            size="sm"
                            v-model="data.item.category.name"
                            @blur="update(data.item)"
                            @update="filterCategories"
                        />
                        <b-popover
                            :target="`ctg-${data.item.id}`"
                            :ref="`popover-${data.item.id}`"
                            placement="bottom"
                            custom-class="category-popover"
                        >
                            <template slot="title">
                                Categories
                            </template>
                            <div 
                                v-for="category in categories" 
                                :key="category" 
                                class="category"
                                @click="setCategory(data.item, category)"
                            >
                                {{ category }}
                            </div>
                        </b-popover>
                    </template>
            </b-table>
        </b-card>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { filter, startsWith, map, find } from 'lodash';
import formatter from 'currency-formatter';
import { format } from 'date-fns';
import CategoryModule from '@/app/store/CategoryModule';
import TransactionModule from '@/app/store/TransactionModule';
import Transaction from '@/models/Transaction';
import AccountModel from '@/models/Account';
import AccountAction from './AccountAction.vue';
import Category from '../../models/Category';

@Component({
    components: {
        AccountAction,
    },
    props: {
        account: AccountModel,
    },
})
export default class Account extends Vue {
    public fields = [
        { key: 'acknowledged', label: ''},
        { key: 'date', label: 'Date', sortable: true },
        'merchant',
        'category',
        { key: 'formattedAmount', label: 'Amount'},
    ];
    public sortBy = 'date';
    public sortDesc = true;
    private filter: string = '';

    get currentBalance(): string {
        return formatter.format(this.$props.account.currentBalance, { code: 'USD' });
    }

    get transactions(): Transaction[] {
        return TransactionModule.byAccountId(this.$props.account.accountId);
    }

    public async acknowledge(txn: Transaction) {
        txn.acknowledged = true;
        await txn.save();
    }

    get categories(): string[] {
        const categoryNames = map(CategoryModule.categories, 'name');
        return filter(categoryNames, (ctg) => startsWith(ctg, this.filter));
    }

    public filterCategories(prefix: string) {
        this.filter = prefix;
    }

    public async setCategory(txn: Transaction, categoryName: string) {
        const category = find(CategoryModule.categories, (ctg: Category) => ctg.name === categoryName) as Category;
        txn.category = category;

        const popover = this.$refs[`popover-${txn.id}`] as Vue;
        popover.$emit('close');
        await txn.save();
    }

    public async update(obj: Parse.Object) {
        await obj.save();
    }
}
</script>

<style lang="scss">
@import '@/app/styles/custom.scss';

.account-container {
    width: 100%;
    height: 100%;
    padding: 10px;
    background-color: #fafafa;
    overflow-y: scroll;

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

            .bank-icon {
                width: 40px;
                height: 40px;
            }
        }

        .account-info {
            width: 100%;
            display: flex;
            justify-content: space-between;

            .title {
                display: flex;
                flex-direction: column;
                font-size: 18px;
                font-weight: 500;
                width: 100%;
            }

            .info {
                display: flex;
                flex-direction: column;
                text-transform: capitalize;
                font-size: 14px;
                font-weight: 300;
            }

            .balance > div {
                width: 100%;
                text-align: right;
            }

            .positive {
                    color: $green;
            }

            .negative {
                color: $red;
            }

            .summary {
                display: flex;                
            }
        }
    }
}

.actions {
    margin-bottom: 5px;
    display: flex;
    flex-direction: column;
    font-size: 12px;

    .action {
        padding: 0 8px 0 8px;
        display: flex;
        height: 20px;
        align-items: center;
        margin-right: 5px;
        font-size: 12px;

        &:first-child {
            margin-bottom: 8px;
        }

        svg {
            margin-right: 5px;
        }
    }
}

.card {
    margin-bottom: 5px;

    .card-body {
        padding: 0.75rem;
    }
}

.separator {
    border-right: 1px solid #ddd;
    margin: 0 16px;
}

.category-popover {
    width: 400px;

    .category {
        width: 100%;
        cursor: pointer;

        &:hover {
            background-color: lighten($primary, 55%);
        }
    }
}

.ack-icon {
    margin: 0 0 0 4px;
    cursor: pointer;
    color: $primary;
}
</style>

