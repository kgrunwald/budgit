<template>
    <div class="plaid-link-wrapper">
        <slot name="button" v-bind:onClick="handleOnClick">
            <button class="plaid-link-button" @click="handleOnClick">
                <slot />
            </button>
        </slot>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  props: {
        plaidUrl: {
            type: String,
            default: 'https://cdn.plaid.com/link/v2/stable/link-initialize.js',
        },
        env: {
            type: String,
            default: 'sandbox',
        },
        institution: String,
        selectAccount: Boolean,
        product: {
            type: [String, Array],
            default: () => ['transactions'],
        },
        language: String,
        countryCodes: Array,
        isWebView: Boolean,
        clientName: String,
        publicKey: String,
        webhook: String,
        onLoad: Function,
        onSuccess: Function,
        onExit: Function,
        onEvent: Function,
    },
})
export default class PlaidLink extends Vue {
    public onScriptError(error: object) {
        console.error('There was an issue loading the link-initialize.js script: ', error);
    }

    public handleOnClick(token: string) {
        const institution = this.$props.institution || null;
        (window as any).linkHandler = (window as any).Plaid.create({
            token,
            clientName: this.$props.clientName,
            env: this.$props.env,
            key: this.$props.publicKey,
            onExit: this.$props.onExit,
            onEvent: this.$props.onEvent,
            onSuccess: this.$props.onSuccess,
            product: this.$props.product,
            selectAccount: this.$props.selectAccount,
            webhook: this.$props.webhook,
        });

        (window as any).linkHandler.open(institution);
    }
    public loadScript(src: string) {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src="' + src + '"]')) {
                resolve();
                return;
            }

            const el = document.createElement('script');

            el.type = 'text/javascript';
            el.async = true;
            el.src = src;

            el.addEventListener('load', resolve);
            el.addEventListener('error', reject);
            el.addEventListener('abort', reject);

            document.head.appendChild(el);
        });
    }
    protected created() {
        this.loadScript(this.$props.plaidUrl)
            .catch(this.onScriptError);
    }
    protected beforeDestroy() {
        if ((window as any).linkHandler) {
            (window as any).linkHandler.exit();
        }
    }
}
</script>