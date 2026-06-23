<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-logo">
        <div class="logo-icon">🏗️</div>
        <h1 class="company-name">레미콘</h1>
        <p class="company-sub">업무 관리 시스템</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field-group">
          <label class="field-label">아이디</label>
          <input
            v-model="loginId"
            type="text"
            class="field-input"
            placeholder="아이디를 입력하세요"
            autocomplete="username"
            :disabled="loading"
          />
        </div>

        <div class="field-group">
          <label class="field-label">비밀번호</label>
          <input
            v-model="password"
            type="password"
            class="field-input"
            placeholder="비밀번호를 입력하세요"
            autocomplete="current-password"
            :disabled="loading"
          />
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="spinner-sm"></span>
          <span v-else>로그인</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import api from '@/api/axios'
import { auth } from '@/auth'

export default {
  name: 'LoginPage',
  data() {
    return {
      loginId:  '',
      password: '',
      errorMsg: '',
      loading:  false,
    }
  },
  methods: {
    async handleLogin() {
      this.errorMsg = ''
      if (!this.loginId.trim())  { this.errorMsg = '아이디를 입력해주세요'; return }
      if (!this.password.trim()) { this.errorMsg = '비밀번호를 입력해주세요'; return }

      this.loading = true
      try {
        const res = await api.post('/auth/login', {
          username: this.loginId.trim(),
          password: this.password,
        })

        const { token, companyCode, companyName, username } = res
        if (!token) throw new Error('토큰이 없습니다')

        auth.setAuth(token, { companyCode, companyName, username })
        this.$router.replace(this.$route.query.redirect || '/dashboard')
      } catch (e) {
        const status = e.response?.status
        if (status === 401 || status === 403) {
          this.errorMsg = '아이디 또는 비밀번호가 올바르지 않습니다'
        } else {
          this.errorMsg = e.response?.data?.message || '로그인 중 오류가 발생했습니다'
        }
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-card {
  background: rgba(255,255,255,.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,.4);
}

.login-logo {
  text-align: center;
  margin-bottom: 2rem;
}
.logo-icon    { font-size: 3rem; margin-bottom: .5rem; }
.company-name { font-size: 1.6rem; font-weight: 700; color: #fff; margin: 0 0 .25rem; }
.company-sub  { font-size: .9rem; color: rgba(255,255,255,.5); margin: 0; }

.login-form   { display: flex; flex-direction: column; gap: 1.25rem; }

.field-group  { display: flex; flex-direction: column; gap: .4rem; }
.field-label  { font-size: .8rem; font-weight: 600; color: rgba(255,255,255,.6); letter-spacing: .05em; }

.field-input {
  padding: .75rem 1rem;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.15);
  border-radius: .75rem;
  color: #fff;
  font-size: .95rem;
  transition: all .2s;
  outline: none;
}
.field-input::placeholder { color: rgba(255,255,255,.3); }
.field-input:focus {
  border-color: #f59e0b;
  background: rgba(255,255,255,.12);
  box-shadow: 0 0 0 3px rgba(245,158,11,.15);
}
.field-input:disabled { opacity: .5; cursor: not-allowed; }

.error-msg {
  background: rgba(239,68,68,.15);
  border: 1px solid rgba(239,68,68,.3);
  border-radius: .5rem;
  padding: .6rem .9rem;
  font-size: .85rem;
  color: #fca5a5;
  text-align: center;
}

.login-btn {
  margin-top: .25rem;
  padding: .85rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  border-radius: .75rem;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all .2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
}
.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245,158,11,.4);
}
.login-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }

.spinner-sm {
  width: 20px; height: 20px;
  border: 3px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
