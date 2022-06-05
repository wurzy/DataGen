import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { Toast } from 'buefy'
import VueProgress from 'vue-progress-path'
import 'vue-progress-path/dist/vue-progress-path.css'

Vue.use(Toast)
Vue.use(VueProgress)
Vue.config.productionTip = false

new Vue({
  router,
  vuetify,
  render: h => h(App)
}).$mount('#app')
