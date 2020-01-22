<template>
    <section>
        <plaid-link
            :env="PLAID_ENVIRONMENT"
            :publicKey="PLAID_PUBLIC_KEY"
            :webhook="PLAID_WEBHOOK_URL"
            clientName="Budgit"
            product="transactions"
            v-bind="{ onSuccess, onExit, onEvent }"
        >
            <template slot="button" slot-scope="props">
                <slot
                    name="action"
                    v-bind:onClick="() => triggerPlaidLink(props.onClick)"
                />
            </template>
        </plaid-link>
    </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import PlaidLink from './PlaidLink.vue';
import AccountModule from '../store/AccountModule';
import UserStore from '../store/UserStore';
import { refreshToken, getAccessToken } from '../api';

@Component({
    components: { PlaidLink },
    props: {
        accountId: String,
        itemId: String,
        forceImport: Boolean,
        icon: String
    }
})
export default class AccountAction extends Vue {
    public PLAID_PUBLIC_KEY = process.env.VUE_APP_PLAID_PUBLIC_KEY;
    public PLAID_ENVIRONMENT = process.env.VUE_APP_PLAID_ENV;
    public PLAID_WEBHOOK_URL = process.env.VUE_APP_PLAID_WEBHOOK_URL;
    public API_BASE = process.env.VUE_APP_API_BASE_URL;
    private token: string = '';

    public async triggerPlaidLink(triggerFunc: (token: string) => void) {
        if (this.$props.accountId || this.$props.itemId) {
            const res = await refreshToken(this.$props.itemId);
            this.token = res.data.publicToken;
        }
        triggerFunc(this.token);
    }

    public async onSuccess(token: string, metadata: { accounts: any }) {
        if (this.token && !this.$props.forceImport) {
            await AccountModule.updateAccount(this.$props.itemId);
        } else {
            await getAccessToken(token);
        }
    }

    public async onExit(error: string, meta: object) {
        // handle onExit
    }

    public async onEvent(event: string, meta: object) {
        // handle onEvent
    }
}
</script>

<style lang="scss" scoped>
.icon {
    padding: 0 10px 0 10px;
}
</style>
