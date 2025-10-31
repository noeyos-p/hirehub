// src/api/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  withCredentials: false,
});

// 요청 인터셉터: 모든 요청에 자동으로 토큰 추가
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
  (error) => {
    return Promise.reject(error);
  }
);


export default api;