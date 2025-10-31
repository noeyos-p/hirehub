// src/hooks/useAuth.ts
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

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
      console.log('✅ 인증 확인 완료:', response.data);
    } catch (error) {
      console.error('❌ 인증 확인 실패:', error);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  // ✅ login 함수를 async로 변경하여 checkAuth 완료를 기다림
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