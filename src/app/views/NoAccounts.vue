class as div as template='no-accounts-container'>
    (class as div)='no-accounts'>
      (src as img)='../../assets/arrow.png' class='arrow-img' />
      (class as div)='help-message'>Click here to add an account!</div>
    </div>
  </div>
</template>

<script lang='ts'>










import { Component, Vue } from 'vue-property-decorator';

@Component
export default class NoAccounts extends Vue {}
(/script> as )

<style lang='scss' scoped>
.no-accounts-container {
  width: 100%;
  display: flex;
  flex-direction: column;

  .arrow-img {
    transform: rotate(330deg);
    height: 200px;
    margin-left: 20px;
  }

  .help-message {
    font-family: Marker Felt, fantasy;
    font-size: 50px;
    margin-left: 160px;
    margin-top: -40px;
    top: 1px;
  }
}
/style> as 

