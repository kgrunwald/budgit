<template>
    <section>
        <plaid-link
            env="sandbox"
            publicKey="793eb3e2dca7c9ffb3fea089e86f85"
            clientName="Test App"
            product="transactions"
            v-bind="{ onSuccess }">
            <template slot="button" slot-scope="props">
                <a @click="props.onClick">Custom Open Element</a>
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
    async onSuccess(token) {
          const resp = await fetch('/get_access_token', {method: 'post', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({public_token: token})})
          console.log(resp);
    }
}
</script>