<template>
    <div class="nav-container">
        <b-navbar toggleable="lg" type="dark" variant="primary">
            <b-navbar-brand href="#">Budgit</b-navbar-brand>

            <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

            <b-collapse id="nav-collapse" is-nav>
                <b-navbar-nav>
                    <b-nav-item
                        :active="this.$route.path == '/accounts' ? true : false"
                        @click="() => this.$router.push('accounts')"
                        >Accounts</b-nav-item
                    >
                    <b-nav-item
                        :active="this.$route.path == '/budget' ? true : false"
                        @click="() => this.$router.push('budget')"
                        >Budget</b-nav-item
                    >
                </b-navbar-nav>

                <!-- Right aligned nav items -->
                <b-navbar-nav class="ml-auto">
                    <b-nav-item-dropdown right>
                        <template slot="button-content">Settings</template>
                        <b-dropdown-item
                            @click="() => this.$router.push('profile')"
                            >Profile</b-dropdown-item
                        >
                        <b-dropdown-item @click="signOut"
                            >Sign Out</b-dropdown-item
                        >
                    </b-nav-item-dropdown>
                </b-navbar-nav>
            </b-collapse>
        </b-navbar>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import AccountModule from '@/app/store/AccountModule';
import CategoryModule from '../store/CategoryModule';
import CategoryGroupModule from '../store/CategoryGroupModule';
import TransactionModule from '../store/TransactionModule';
import UserModule from '../store/UserModule';
import firebase from 'firebase';

@Component({})
export default class Navigation extends Vue {
    public async mounted() {
        UserModule.loadUser();
        AccountModule.loadAccounts();
        CategoryModule.loadCategories();
        CategoryGroupModule.loadCategoryGroups();
    }

    public async signOut() {
        await firebase.auth().signOut();
        location.reload();
    }
}
</script>

<style lang="scss" scoped>
.nav-container {
    display: block;
    width: 100%;
}
</style>
