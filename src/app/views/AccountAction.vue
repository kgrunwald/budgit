<template>
    <section>
        <plaid-link
            :env="PLAID_ENVIRONMENT"
            :publicKey="PLAID_PUBLIC_KEY"
            clientName="Budgit"
            product="transactions"
            :token="token"
            v-bind="{ onSuccess, onExit, onEvent }">
            <template slot="button" slot-scope="props">
              <div class="icon">
                <font-awesome-icon :icon="icon" @click="props.onClick" />
              </div>
            </template>
        </plaid-link>
    </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import PlaidLink from './PlaidLink.vue';

@Component({
  components: { PlaidLink },
  props: {
    token: String,
    icon: String,
  },
})
export default class AccountAction extends Vue {
    public PLAID_PUBLIC_KEY = process.env.VUE_APP_PLAID_PUBLIC_KEY;
    public PLAID_ENVIRONMENT = process.env.VUE_APP_PLAID_ENV;

    public async onSuccess(token: string) {
      if (this.$props.token) {
        const resp = await fetch('/refresh_public_token', {
          method: 'post',
          headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({public_token: token}),
        });
      } else {
        const resp = await fetch('/get_access_token', {
          method: 'post',
          headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({public_token: token}),
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