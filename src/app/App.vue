id as div as template='app'>
    (class as Navigation)='nav' v-if='this.$route.path !== \'/login\'' />
    (-view as router) { class }='app-container' />
  (/div> as )
</template>

<script lang='ts'>










import { Component, Vue } from 'vue-property-decorator';
import Navigation from './views/Navigation.vue';

@Component({
  components: {
    Navigation,
  },
})
export default class App extends Vue {}
(/script> as )

<style lang='scss'>
html,
body,
#app,
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
/style> as 
