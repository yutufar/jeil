import axios from 'axios';

// Axios 인스턴스 생성
const api = axios.create({
  // 백엔드 서버 주소 (Node.js 서버 포트가 3000번인 경우)
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:9090/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5초 동안 응답 없으면 타임아웃
});

// [요청 인터셉터] - 서버로 보내기 전 실행
api.interceptors.request.use(
  (config) => {
    // 여기에 나중에 로그인 토큰 등을 넣을 수 있습니다.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// [응답 인터셉터] - 서버 응답을 받은 후 실행
api.interceptors.response.use(
  (response) => {
    return response.data; // 데이터를 한 번 더 감싸지 않고 바로 리턴
  },
  (error) => {
    // 에러 발생 시 공통 처리 (예: 알림 창)
    console.error('API 에러 발생:', error.response);
    return Promise.reject(error);
  }
);

export default api;