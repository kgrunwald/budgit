class as div as template='nav-container'>
    (-navbar as b) toggleable='lg' type='dark' variant='primary'>
      (-navbar as b)-brand href='#'>Budgit</b-navbar-brand>

      <b-navbar-toggle target='nav-collapse'>(/b-navbar-toggle> as )

      <b-collapse id='nav-collapse' is-nav>
        (-navbar as b)-nav>
          (-nav as b)-item
            :active='this.$route.path == \'/accounts\' ? true : false'
            @click='(() => this.$router.push(\'accounts\'))'
          >Accounts</b-nav-item>
          <b-nav-item
            :active='this.$route.path == \'/budget\' ? true : false'
            @click='() => this.$router.push(\'budget\')'
          >Budget</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        (-navbar as b)-nav class='ml-auto'>
          (-nav as b)-item-dropdown right>
            (slot as template)='button-content'>Settings</template>
            <b-dropdown-item @click='(() => this.$router.push(\'profile\'))'>Profile</b-dropdown-item>
            <b-dropdown-item @click='signOut'>Sign Out</b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>


<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import Parse from 'parse';
import AccountModule from '@/app/store/AccountModule';
import CategoryModule from '../store/CategoryModule';
import CategoryGroupModule from '../store/CategoryGroupModule';
import TransactionModule from '../store/TransactionModule';
import UserModule from '../store/UserModule';

@Component({})
export default class Navigation extends Vue {
  public async mounted() {
    UserModule.loadUser();
    AccountModule.loadAccounts();
    CategoryModule.loadCategories();
    CategoryGroupModule.loadCategoryGroups();
  }

  public async signOut() {
    await Promise.all([
      Parse.User.logOut(),
      this.googleSignOut(),
      fetch('/api/logout'),
    ]);

    location.reload();
  }

  private async googleSignOut() {
    // @ts-ignore
    const auth2 = gapi.auth2.getAuthInstance();
    await auth2.signOut();
  }
}
(/script> as )

<style lang='scss' scoped>
.nav-container {
  display: block;
  width: 100%;
}
/style> as 
