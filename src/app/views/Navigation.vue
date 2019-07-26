<template>
    <div class="nav-container">
        <b-navbar toggleable="lg" type="dark" variant="primary">
            <b-navbar-brand href="#">Budgit</b-navbar-brand>

            <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

            <b-collapse id="nav-collapse" is-nav>
                <b-navbar-nav>
                    <b-nav-item active href="#">Accounts</b-nav-item>
                    <b-nav-item href="#">Budget</b-nav-item>
                </b-navbar-nav>

                <!-- Right aligned nav items -->
                <b-navbar-nav class="ml-auto">
                    <b-nav-item-dropdown right>
                        <template slot="button-content">Account</template>
                        <b-dropdown-item href="#">Profile</b-dropdown-item>
                        <b-dropdown-item @click="signOut">Sign Out</b-dropdown-item>
                    </b-nav-item-dropdown>
                </b-navbar-nav>
            </b-collapse>
        </b-navbar>
    </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Parse from 'parse';

@Component({})
export default class Navigation extends Vue {
    public async signOut() {
        await Parse.User.logOut();
        this.$router.push('/login');
    }
}
</script>

<style lang="scss" scoped>
.nav-container {
    display: block;
    height: auto;
}
</style>
