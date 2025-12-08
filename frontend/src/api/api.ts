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
      console.error('❌ 401 Unauthorized - 토큰이 유효하지 않거나 만료됨', {
        url: error.config?.url,
        hasToken: !!localStorage.getItem('token')
      });

      // 로그인/회원가입 API는 401이 정상이므로 토큰을 삭제하지 않음
      const isAuthEndpoint = error.config?.url?.includes('/api/auth/');

      // 공개 API는 401이 와도 토큰을 삭제하지 않음 (인증 불필요)
      const isPublicEndpoint =
        error.config?.url?.includes('/api/jobposts') ||
        error.config?.url?.includes('/api/companies') ||
        error.config?.url?.includes('/api/boards') ||
        error.config?.url?.includes('/api/reviews');

      // ⚠️ 실제 인증 실패 시에만 토큰 삭제
      // 단, 너무 공격적으로 토큰을 삭제하지 않도록 조건 추가
      if (!isAuthEndpoint && !isPublicEndpoint) {
        const token = localStorage.getItem('token');

        // 토큰이 있는데 401이 발생한 경우에만 로그
        if (token) {
          console.warn('⚠️ 토큰이 있지만 401 발생 - 에러를 컴포넌트로 전달');
          // 토큰을 즉시 삭제하지 않고, 에러를 컴포넌트로 전달하여 처리하도록 함
          // 컴포넌트에서 재시도하거나 사용자에게 재로그인을 요청할 수 있음
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;