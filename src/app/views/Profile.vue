<template>
  <div>
    <div class="profile-container">
      <b-card class="profile-header-card">
        <h3 class="profile-title">Profile</h3>
      </b-card>
      <b-card class="profile-details-card">
        <div class="details-container">
        </div>
      </b-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Profile extends Vue {
}
</script>

<style lang="scss" scoped>

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

    .profile-title {

    }
  }

  .profile-details-card {
    flex: 1 1 auto;
    display: flex;
  }

}

</style>

