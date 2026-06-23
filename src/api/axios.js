import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:9090/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jeil_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // 회사(사업장) 구분을 헤더에 명시적으로 포함 — 백엔드가 토큰 외에도 참조 가능
  try {
    const user = JSON.parse(localStorage.getItem('jeil_user'))
    if (user?.locationId != null) {
      config.headers['X-Location-Id'] = user.locationId
    }
  } catch { /* ignore */ }

  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 토큰이 있는 상태에서 401 → 세션 만료, 로그인 페이지로 이동
    // 토큰이 없는 상태에서 401 → 로그인 시도 중 인증 실패, 그냥 reject
    if (error.response?.status === 401 && localStorage.getItem('jeil_token')) {
      localStorage.removeItem('jeil_token')
      localStorage.removeItem('jeil_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
