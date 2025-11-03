// src/api/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://byeongarigaebaldan.store",
  withCredentials: false,
});
//최종//

// ✅ 새로고침 시에도 기본 헤더에 토큰 반영
const bootToken = localStorage.getItem('token');
if (bootToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${bootToken}`;
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 요청에 토큰 추가됨:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ 토큰이 없습니다!');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
