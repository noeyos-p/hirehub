import axios from "axios";

const api = axios.create({
  // ✅ 수정: baseURL 마지막 / 제거하여 슬래시 중복 방지
  baseURL: import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || "https://byeongarigaebaldan.store",
  withCredentials: true,
});

// ✅ 부팅 시 토큰 복원
const bootToken = localStorage.getItem("token");
if (bootToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${bootToken}`;
  console.log("🔑 부팅 시 토큰 로드 완료:", bootToken.substring(0, 15) + "...");
}

// ✅ 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 요청에 토큰 추가됨:", token.substring(0, 20) + "...");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ 응답 인터셉터
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.error("❌ 401 Unauthorized - 토큰이 유효하지 않거나 만료됨");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("email");
      localStorage.removeItem("userId");
    }
    return Promise.reject(err);
  }
);

export default api;
