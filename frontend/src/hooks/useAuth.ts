import { useState, useEffect } from 'react';
import api from '../api/api';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  nickname: string;
  phone: string;
  role: string;
  requiresOnboarding: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // ✅ 유연한 사용자 정보 조회
  const fetchMe = async () => {
    try {
      // 1️⃣ 마이페이지 우선 시도
      return await api.get('/api/mypage/me');
    } catch (e1: any) {
      const status = e1?.response?.status;
      // 404나 401 둘 다 auth/me로 fallback
      if (status === 404 || status === 401) {
        return await api.get('/api/auth/me');
      }
      throw e1;
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    // ✅ 중복 호출 방지
    if (isChecking) return;
    setIsChecking(true);

    try {
      const response = await fetchMe();
      setUser(response.data);
      setIsAuthenticated(true);
      console.log('✅ 인증 확인 완료:', response.data);
    } catch (error: any) {
      console.error('❌ 인증 확인 실패:', error);
      const status = error?.response?.status;

      // 403만 진짜 인증실패로 취급 (401은 fallback 후 판단)
      if (status === 403) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } finally {
      setLoading(false);
      setIsChecking(false);
    }
  };

  // ✅ 로그인 후 강제 재검증
  const login = async (token: string) => {
    localStorage.setItem('token', token);
    await checkAuth();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };
};
