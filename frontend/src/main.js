import Vue from 'vue'
import App from './App.vue'
import VueCodeMirror from 'vue-codemirror'
import router from './router'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import VueMoment from 'vue-moment'
import moment from 'moment'
import VuePaginate from 'vuejs-paginate'
import DatePicker from 'vue2-datepicker';
import 'vue2-datepicker/index.css';
import 'vue2-datepicker/locale/pt';

DatePicker.methods.displayPopup = function () {
  this.position = {
    left: 0,
    right: '100%'
  }
}

Vue.config.productionTip = false
library.add(fas)
library.add(fab)
moment.locale('pt');
Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.component('paginate', VuePaginate)
Vue.component('datepicker', DatePicker)
Vue.use(VueCodeMirror)
Vue.use(VueMoment, { moment });
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
