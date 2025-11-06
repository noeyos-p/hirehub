import { useState, useEffect, useRef } from "react";
import api from "../api/api";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  nickname?: string;
  phone?: string;
  role?: string;
  requiresOnboarding?: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isCheckingRef = useRef(false); // 중복 실행 방지

  useEffect(() => {
    checkAuth();
  }, []);

  // 단계적 사용자 정보 조회
  const fetchMe = async () => {
    try {
      return await api.get("/api/mypage/me");
    } catch (e1: any) {
      const status = e1?.response?.status;
      if (status === 404 || status === 401) {
        return await api.get("/api/auth/me");
      }
      throw e1;
    }
  };

  // 인증 검증
  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setLoading(true);

    try {
      const res = await fetchMe();
      setUser(res.data);
      setIsAuthenticated(true);
      console.log("✅ 인증 확인 완료:", res.data);
    } catch (err: any) {
      const status = err?.response?.status;
      console.error("❌ 인증 확인 실패:", status, err);
      // 403만 진짜 인증 실패로 간주
      if (status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        localStorage.removeItem("userId");
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
      isCheckingRef.current = false;
    }
  };

  // 로그인 후 강제 재검증
  const login = async (token: string) => {
    localStorage.setItem("token", token);
    await checkAuth();
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    setUser(null);
    setIsAuthenticated(false);
  };

  return { user, loading, isAuthenticated, login, logout, checkAuth };
};
