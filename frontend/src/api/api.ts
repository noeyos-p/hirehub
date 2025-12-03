// src/api/api.ts
import axios from "axios";

// HTTPS 환경에서는 localhost를 사용할 수 없으므로 자동으로 현재 origin 사용
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // 환경 변수가 설정되어 있으면 사용
  if (envUrl) {
    return envUrl.endsWith("/") ? envUrl : envUrl + "/";
  }

  // HTTPS 페이지에서는 현재 origin 사용 (localhost 사용 불가)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return window.location.origin;
  }

   // 🔥 슬래시 반드시 포함
  return "http://localhost:8080/";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ 토큰을 localStorage에 저장하고 axios 헤더에도 즉시 반영하는 헬퍼 함수
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
       console.log('🔑 토큰 저장 및 헤더 설정 완료:', token.length > 20 ? token.substring(0, 20) + '...' : token);
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    console.log('🔓 토큰 제거 완료');
  }
};

// ✅ 초기 로드 시 localStorage의 토큰을 axios 헤더에 반영
const bootToken = localStorage.getItem('token');
if (bootToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${bootToken}`;
  console.log('🔄 초기 토큰 로드 완료');
}

// Request 인터셉터
api.interceptors.request.use(
  (config) => {
    // 회원가입 및 문자 인증 요청은 토큰 검사하지 않음
    if (
      config.url?.includes('/api/auth/signup') ||
      config.url?.includes('/api/sms/send') ||
      config.url?.includes('/api/sms/verify')
    ) {
      return config;
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ 토큰이 없습니다!');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - 토큰이 유효하지 않거나 만료됨');
      setAuthToken(null); // 헬퍼 함수 사용
    }
    return Promise.reject(error);
  }
);

export default api;