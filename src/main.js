import Vue from "vue";
import App from "./App.vue";
import router from "./router/index";

// 블랙 대시보드 플러그인 로드 (사이드바, 알림 등을 주입함)
import BlackDashboard from "./plugins/blackDashboard";

// 글로벌 디자인 시스템
import "@/assets/css/jeil-global.css";

Vue.use(BlackDashboard);

new Vue({
  router,
  render: h => h(App)
}).$mount("#app");