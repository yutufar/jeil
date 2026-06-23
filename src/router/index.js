import Vue from "vue";
import VueRouter from "vue-router";
import routes from "./routes";

Vue.use(VueRouter);

const router = new VueRouter({
  mode: "history",
  routes,
  linkExactActiveClass: "active",
  scrollBehavior: (to) => {
    if (to.hash) return { selector: to.hash };
    return { x: 0, y: 0 };
  },
});

router.beforeEach((to, from, next) => {
  const isPublic    = to.matched.some(r => r.meta.public)
  const token       = localStorage.getItem('jeil_token')

  if (isPublic) {
    // 이미 로그인 상태에서 /login 접근 시 대시보드로
    if (token && to.path === '/login') return next('/dashboard')
    return next()
  }

  if (!token) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  next()
})

export default router;
