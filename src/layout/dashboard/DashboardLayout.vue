<template>
  <div class="wrapper">
    <side-bar :title="sidebarTitle">
      <template slot="links">
        <sidebar-link to="/dashboard"          name="대시보드"              icon="tim-icons icon-chart-pie-36"/>
        <sidebar-link to="/setting/users"      name="직원 관리"             icon="tim-icons icon-single-02"/>
        <sidebar-link to="/setting/vehicles"   name="차량 관리"             icon="tim-icons icon-bus-front-12"/>
        <sidebar-link to="/setting/ratio"      name="비율 설정"             icon="tim-icons icon-settings-gear-63"/>
        <sidebar-link to="/log/aggregate"      name="레미콘 자재 현황 관리" icon="tim-icons icon-coins"/>
        <sidebar-link to="/material/stock"     name="원자재 재고 관리"      icon="tim-icons icon-bank"/>
        <sidebar-link to="/vacation"           name="휴가 관리"             icon="tim-icons icon-calendar-60"/>
        <sidebar-link to="/log/remicon"        name="레미콘 운반비"         icon="tim-icons icon-delivery-fast"/>
        <sidebar-link to="/remicon/external"   name="외부 지원 운행"        icon="tim-icons icon-bus-front-12"/>
        <sidebar-link to="/log/goljae"         name="골재 운반비"           icon="tim-icons icon-cart"/>
        <sidebar-link to="/fuel-usage"         name="유류비 관리"           icon="tim-icons icon-coins"/>
        <sidebar-link to="/setting/accounts"   name="계좌번호 관리"         icon="tim-icons icon-bank"/>
        <sidebar-link to="/expense/report"     name="지출결의서"            icon="tim-icons icon-notes"/>
      </template>
    </side-bar>

    <div class="main-panel">
      <!-- 상단 헤더 -->
      <div class="top-header">
        <div class="user-info">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-detail">
            <span class="user-name">{{ userName }}</span>
            <span class="user-dept">{{ companyName }}</span>
          </div>
        </div>
        <button @click="handleLogout" class="logout-btn">
          <span class="logout-icon">⏻</span>
          <span>로그아웃</span>
        </button>
      </div>

      <div class="content">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import api  from '@/api/axios'
import { auth } from '@/auth'

export default {
  name: 'DashboardLayout',
  computed: {
    companyName()   { return auth.user?.companyName || '관리' },
    userName()      { return auth.user?.username    || '사용자' },
    userInitial()   { return (auth.user?.username   || '?').charAt(0) },
    sidebarTitle()  { return this.companyName + ' 관리' },
  },
  watch: {
    companyName: {
      immediate: true,
      handler(name) {
        document.title = name ? name + ' 업무관리' : '업무관리시스템'
      },
    },
  },
  methods: {
    async handleLogout() {
      if (!confirm('로그아웃 하시겠습니까?')) return
      try { await api.post('/auth/logout') } catch { /* ignore */ }
      auth.clear()
      this.$router.push('/login')
    },
  },
}
</script>

<style scoped>
/* ─── 상단 헤더 ─── */
.top-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 1.5rem;
  height: 56px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  gap: 1rem;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: .6rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  font-size: .85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-detail {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.user-name { font-size: .88rem; font-weight: 600; color: #e2e8f0; }
.user-dept { font-size: .72rem; color: #94a3b8; }

.logout-btn {
  display: flex;
  align-items: center;
  gap: .35rem;
  padding: .38rem .85rem;
  background: rgba(239, 68, 68, .12);
  border: 1px solid rgba(239, 68, 68, .28);
  border-radius: .5rem;
  color: #fca5a5;
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .18s;
  white-space: nowrap;
}
.logout-btn:hover {
  background: rgba(239, 68, 68, .22);
  border-color: rgba(239, 68, 68, .45);
  color: #fff;
}
.logout-icon { font-size: .95rem; }
</style>
