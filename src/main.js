import Vue from "vue";
import App from "./App.vue";
import router from "./router/index";

// 블랙 대시보드 플러그인 로드 (사이드바, 알림 등을 주입함)
import BlackDashboard from "./plugins/blackDashboard";

Vue.use(BlackDashboard);

new Vue({
  router,
  render: h => h(App)
}).$mount("#app");