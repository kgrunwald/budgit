<template>
    <div class="outer">
        <h1>Budgit</h1>
        <div class="login-container">
            <span class="login-text" >Login to your account</span>
            <b-input-group>
                <b-input-group-prepend>
                    <div class="icon">
                        <font-awesome-icon icon="user"/>
                    </div>
                </b-input-group-prepend>
                <b-form-input autofocus v-model="username" placeholder="username" :disabled="disabled" @keyup.enter="onSubmit"/>
            </b-input-group>
            <b-input-group>
                <b-input-group-prepend>
                    <div class="icon">
                        <font-awesome-icon icon="lock"/>
                    </div>
                </b-input-group-prepend>
                <b-form-input 
                    v-model="password" 
                    placeholder="password" 
                    type="password" 
                    :disabled="disabled"
                    @keyup.enter="onSubmit"
                />
            </b-input-group>
            <b-button variant="primary" @click="onSubmit"> Log In </b-button>
            <div class="error-container">
                <span class="error" v-if="error">Invalid username or password.</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Parse from 'parse';

@Component({})
export default class Login extends Vue {
    public username: string = '';
    public password: string = '';
    public error: boolean = false;
    public disabled: boolean = false;

    public mounted() {
        if (Parse.User.current()) {
            Parse.User.logOut();
        }
    }

    public async onSubmit() {
        try {
            this.disabled = true;
            const response = await fetch('/api/login', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: this.username, password: this.password }),
            });
            const body = await response.json();
            await Parse.User.become(body.sessionToken);
            this.error = false;
            this.$router.push('/');
        } catch (e) {
            this.disabled = false;
            this.error = true;
        }
    }
}
</script>

<style lang="scss" scoped>
@import "@/app/styles/custom.scss";

.outer {
    width: 100%;
    height: 100%;
    background-color: $purple;
    display: flex;
    flex-direction: column;
    align-items: center;
}

h1 {
    color: $white;
    margin: 90px 0 50px;
    font-weight: 300;
}

// .form-control:focus {
//     border-color: $purple;
//     box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.075) inset, 0px 1px 8px rgba(211, 100, 255, 0.5);
// }


.login-container {
    height: 400px;
    width: 350px;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    padding: 40px;
    background-color: white;
    border-radius: 10px;
}

.login-text {
    color: $purple;
    width: 100%;
    font-size: 24px;
    font-weight: 200;
    text-align: center;
}

.icon {
    width: 36px;
    background: #e9ecef;
    border-radius: 5px 0 0 5px;
    text-align: center;
    padding: 4px;
    color: $purple;
    border: 1px solid #ced4da;
}

.error-container {
    height: 14px;
    width: 100%;
    text-align: center; 
}

.error {
    color: $danger;
    font-size: 14px;
    font-weight: 200;
}
</style>


