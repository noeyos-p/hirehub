import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
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

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

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

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            setIsAuthenticated(false);
            setUser(null);
            return;
        }

        // ✅ 중복 호출 방지 (Provider 내부에서는 크게 의미 없지만 유지)
        if (isChecking) return;
        setIsChecking(true);

        try {
            const response = await fetchMe();
            setUser(response.data);
            setIsAuthenticated(true);
            console.log('✅ [AuthProvider] 인증 확인 완료:', response.data);
        } catch (error: any) {
            console.error('❌ [AuthProvider] 인증 확인 실패:', error);
            const status = error?.response?.status;

            // 403만 진짜 인증실패로 취급 (401은 fallback 후 판단하므로 여기선 거의 안 옴)
            // 502 등 서버 에러 시에는 로그아웃 처리하지 않음 (기존 토큰 유지)
            if (status === 403) {
                localStorage.removeItem('token');
                setIsAuthenticated(false);
                setUser(null);
            }
        } finally {
            setLoading(false);
            setIsChecking(false);
        }
    }, [isChecking]);

    // ✅ 초기 로딩 시 한 번만 실행
    useEffect(() => {
        checkAuth();
    }, []);

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

    // ✅ 사용자 정보 새로고침
    const refreshUser = useCallback(async () => {
        try {
            const response = await fetchMe();
            setUser(response.data);
            console.log('🔄 [AuthProvider] 사용자 정보 갱신 완료:', response.data);
        } catch (error) {
            console.error('❌ [AuthProvider] 사용자 정보 갱신 실패:', error);
        }
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated,
            login,
            logout,
            checkAuth,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
