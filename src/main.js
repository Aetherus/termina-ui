import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';
import {Socket} from 'phoenix'

Vue.config.productionTip = false

const socket =  new Socket(process.env.VUE_APP_WS_URL)

socket.connect()

Vue.prototype.$socket = socket;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
