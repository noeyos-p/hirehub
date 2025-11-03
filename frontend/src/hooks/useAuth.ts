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

  useEffect(() => {
    checkAuth();
  }, []);

  // 내 정보 조회: /api/auth/me 사용 금지!
  // 우선 /api/mypage/me 시도, 없으면 /api/users/me 폴백
  const fetchMe = async () => {
    try {
      return await api.get('/api/mypage/me');
    } catch (e1: any) {
      // 404면 다른 경로로 폴백
      const status = e1?.response?.status;
      if (status === 404) {
        return await api.get('/api/users/me');
      }
      throw e1; // 401/403/500 등은 상위에서 처리
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

    try {
      const response = await fetchMe();
      setUser(response.data);
      setIsAuthenticated(true);
      console.log('✅ 인증 확인 완료:', response.data);
    } catch (error: any) {
      const status = error?.response?.status;
      console.error('❌ 인증 확인 실패:', error);

      // 401/403에서만 토큰 제거 (권한/만료)
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      } else {
        // 5xx 등의 서버 에러는 토큰 유지 (일시 장애일 수 있음)
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ login은 토큰 저장 후 checkAuth 호출
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
    checkAuth
  };
};
