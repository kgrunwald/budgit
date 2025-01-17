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
        <slot name="action" v-bind:onClick="() => triggerPlaidLink(props.onClick)" />
      </template>
    </plaid-link>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import PlaidLink from './PlaidLink.vue';
import AccountModule from '../store/AccountModule';

@Component({
  components: { PlaidLink },
  props: {
    accountId: String,
    itemId: String,
    forceImport: Boolean,
    icon: String,
  },
})
export default class AccountAction extends Vue {
  public PLAID_PUBLIC_KEY = process.env.VUE_APP_PLAID_PUBLIC_KEY;
  public PLAID_ENVIRONMENT = process.env.VUE_APP_PLAID_ENV;
  public PLAID_WEBHOOK_URL = process.env.VUE_APP_PLAID_WEBHOOK_URL;
  private token: string = '';

  public async triggerPlaidLink(triggerFunc: (token: string) => void) {
    if (this.$props.accountId || this.$props.itemId) {
      const resp = await fetch('/api/refreshToken', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: this.$props.accountId,
          itemId: this.$props.itemId,
        }),
      });
      const data = await resp.json();
      this.token = data.publicToken;
    }
    triggerFunc(this.token);
  }

  public async onSuccess(token: string, metadata: { accounts: any }) {
    if (this.token && !this.$props.forceImport) {
      await AccountModule.updateAccount(this.$props.accountId);
    } else {
      const resp = await fetch('/api/getAccessToken', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token: token,
          accounts: metadata.accounts,
        }),
      });
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