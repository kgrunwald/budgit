<template>
  <div>
    <b-form>
      <b-form-group id="input-group-first-name" label="First Name:" label-for="input-first-name">
        <b-form-input
          id="input-first-name"
          v-model="user.firstName"
          required
          placeholder="Enter first name"
        ></b-form-input>
      </b-form-group>
      <b-form-group id="input-group-last-name" label="Last Name:" label-for="input-last-name">
        <b-form-input
          id="input-last-name"
          v-model="user.lastName"
          required
          placeholder="Enter last name"
        ></b-form-input>
      </b-form-group>
      <b-form-group id="input-group-email" label="Email address:" label-for="input-email">
        <b-form-input
          id="input-email"
          v-model="user.email"
          type="email"
          required
          placeholder="Enter email"
        ></b-form-input>
      </b-form-group>
      <b-form-group id="input-group-password" label="Password:" label-for="input-password">
        <b-form-input
          id="input-password"
          v-model="user.password"
          type="password"
          required
          placeholder="Enter password"
        ></b-form-input>
      </b-form-group>
    </b-form>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import User from '@/models/User';
import UserModule from '../store/UserModule';

@Component
export default class AddUser extends Vue {
  private user: { [key: string]: any } = {};

  public async saveUser() {
    const user = new User({});
    user.email = this.user.email;
    user.username = this.user.email;
    user.firstName = this.user.firstName;
    user.lastName = this.user.lastName;
    user.password = this.user.password;
    await UserModule.create(user);
    this.user = {};
  }
}
</script>

<style lang="scss">
</style>