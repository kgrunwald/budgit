<template>
  <div>
    <div class="profile-container">
      <b-card class="profile-header-card">
        <h3 class="profile-title">Profile</h3>
      </b-card>
      <b-card class="profile-details-card">
        <div class="details-container">
          <div class="update-profile-details">
            <div class="first-name attr-container">
              <div class="attr-title">First Name:</div>
              <b-form-input
                class="attr-input"
                autofocus
                v-if="edits.firstName"
                v-model="user.firstName"
                @blur="updateUser('firstName', user)"
                @keydown.enter.native="updateUser('firstName', user)"
              />
              <div 
                v-else
                v-html="user.firstName || '<i>None</i>'"
                :class="{'attr-label': true, 'none': !user.firstName}"
                @click="editProfileAttr('firstName')"
              />              
            </div>
            <div class="last-name attr-container">
              <div class="attr-title">Last Name:</div>
              <b-form-input
                class="attr-input"
                autofocus
                v-if="edits.lastName"
                v-model="user.lastName"
                @blur="updateUser('lastName', user)"
                @keydown.enter.native="updateUser('lastName', user)"
              />
              <div
                v-else
                v-html="user.lastName || '<i>None</i>'"
                :class="{'attr-label': true, 'none': !user.lastName}"
                @click="editProfileAttr('lastName')"
              /> 
            </div>
            <div class="email attr-container">
              <div class="attr-title">Email:</div>
              <b-form-input
                class="attr-input"
                autofocus
                v-if="edits.email"
                v-model="user.email"
                @blur="updateUser('email', user)"
                @keydown.enter.native="updateUser('email', user)"
              />
              <div
                v-else
                v-html="user.email || '<i>None</i>'"
                :class="{'attr-label': true, 'none': !user.email}"
                @click="editProfileAttr('email')"
              /> 
            </div>
            <div class="username attr-container">
              <div class="attr-title">Username:</div>
              <b-form-input
                class="attr-input"
                autofocus
                v-if="edits.username"
                v-model="user.username"
                @blur="updateUser('username', user)"
                @keydown.enter.native="updateUser('username', user)"
              />
              <div
                v-else
                v-html="user.username || '<i>None</i>'"
                :class="{'attr-label': true, 'none': !user.username}"
                @click="editProfileAttr('username')"
              /> 
            </div>
          </div>
        </div>
      </b-card>
      <b-card v-if="user.username === 'kgrunwald@gmail.com'">
        <div class="admin-card">
          <b-form-input
            v-model="itemToken"
            @keydown.enter="updateItemAccess"
          />
          <AccountAction 
            forceImport
            :itemId="itemToken"
          >
            <template slot="action" slot-scope="props">
              <b-button @click="props.onClick" >Force Import Item</b-button>
            </template>
          </AccountAction>
        </div>
      </b-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Parse from 'parse';
import User from '@/models/User';
import UserModule from '@/app/store/UserModule';
import AccountAction from './AccountAction.vue';

interface Edits {
  [name: string]: boolean;
}

@Component({
  components: {
        AccountAction,
    },
})
export default class Profile extends Vue {
  public edits: Edits = {};
  public itemToken: string = '';

  get user() {
    return UserModule.user;
  }

  public editProfileAttr(attr: string) {
    this.edits = {...this.edits, [attr]: true};
  }

  public uneditProfileAttr(attr: string) {
    this.edits = {...this.edits, [attr]: false};
  }

  public async updateUser(attr: string, user: User) {
    await UserModule.update(user);
    this.uneditProfileAttr(attr);
  }
}
</script>

<style lang="scss" scoped>
@import '@/app/styles/custom.scss';

.profile-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 5px;

  .card {
    margin: 5px;
  }

  .profile-header-card {
    flex: 0 1 auto;
    display: flex;

  }

  .profile-details-card {
    flex: 1 1 auto;
    display: flex;

    .attr-container {
      height: 40px;
      display: flex;
      align-items: center;
      white-space: nowrap;

      .attr-title {
        width: 100px;
      }

      .attr-label {
        margin-left: 7px;
        cursor: pointer;
      }
    }
  }

  .none {
    color: lighten(black, 50%);
  }
}

.admin-card {
  display: flex;

  input {
    width: auto;
    margin-right: 10px;
  }
}

</style>

