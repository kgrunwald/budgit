<template>
    <section>
        <plaid-link
            :env="PLAID_ENVIRONMENT"
            :publicKey="PLAID_PUBLIC_KEY"
            clientName="Budgit"
            product="transactions"
            v-bind="{ onSuccess }">
            <template slot="button" slot-scope="props">
              <div class="icon">
                <font-awesome-icon icon="plus-circle" @click="props.onClick" />
              </div>
            </template>
        </plaid-link>
    </section>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator';
import PlaidLink from 'vue-plaid-link'

@Component({
  components: { PlaidLink },
})
export default class NewAccount extends Vue {
    PLAID_PUBLIC_KEY = process.env.VUE_APP_PLAID_PUBLIC_KEY;
    PLAID_ENVIRONMENT = process.env.VUE_APP_PLAID_ENV;
    async onSuccess(token) {
          const resp = await fetch('/get_access_token', {
              method: 'post', 
              headers: {'Content-Type': 'application/json'},
               body: JSON.stringify({public_token: token})
            })
    }
}
</script>

<style lang="scss" scoped>
.icon {
    padding: 10px 10px 10px 10px;
}
</style>