// src/pages/auth/Login.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../hooks/useAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // [NAVER ADD START] ✅ 네이버 로그인 - 백엔드 OAuth 엔드포인트로 리다이렉트
  const handleNaverLogin = () => {
    window.location.href = '/api/auth/naver';
  };
  // [NAVER ADD END]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });

      console.log('📦 로그인 응답:', response.data);

      const { accessToken, role, email: userEmail, id: userId } = response.data;

      if (accessToken) {
        // 토큰, role, 이메일 저장
        localStorage.setItem('token', accessToken);
        localStorage.setItem('role', role || '');
        localStorage.setItem('email', userEmail || '');
        localStorage.setItem('userId', userId?.toString() || '');

        // [CHANGED] useAuth.login은 string(토큰) 기대 → 토큰만 전달
        login(accessToken); // ✅ 타입에러 해결

        // 관리자/사용자 라우팅
        if (role === 'ADMIN') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      }
    } catch (err: any) {
      console.error('❌ 로그인 에러:', err.response?.data);
      const errorMessage = err.response?.data?.message || '로그인에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleKakaoLogin = () => {
    window.location.href = '/api/auth/kakao';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="px-8 py-10">
          <h2 className="text-3xl font-bold text-center text-text-primary dark:text-white">로그인</h2>
          <p className="text-center mt-2 text-text-secondary dark:text-gray-300">
            이메일/비밀번호로 로그인, 또는 소셜 로그인을 이용하세요.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            {/* 이메일 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary dark:text-gray-200">이메일</label>
              <input
                type="email"
                className="w-full h-12 px-4 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-text-primary dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary dark:text-gray-200">비밀번호</label>
              <input
                type="password"
                className="w-full h-12 px-4 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-text-primary dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* 기본 로그인 버튼 */}
            <div className="flex px-0 py-3 w-full">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center h-12 bg-primary text-white rounded-full text-lg shadow-md hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="truncate">{isLoading ? '로그인 중...' : '로그인'}</span>
              </button>
            </div>

            <div className="flex items-center px-4 py-6">
              <hr className="flex-grow border-t border-gray-300 dark:border-gray-600" />
              <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">또는</span>
              <hr className="flex-grow border-t border-gray-300 dark:border-gray-600" />
            </div>

            {/* ✅ 구글 로그인 버튼 */}
            <div className="flex px-0 py-3 w-full">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex w-full items-center justify-center h-12 bg-white border border-gray-300 rounded-full text-lg shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img alt="Google logo" className="w-7 h-7 mr-3" src="/google_logo_icon_169090.png" />
                <span>Google</span>
              </button>
            </div>

            {/* ✅ 카카오 로그인 버튼 */}
            <div className="flex px-0 py-3 w-full">
              <button
                type="button"
                onClick={handleKakaoLogin}
                disabled={isLoading}
                className="flex w/full items-center justify-center h-12 bg-yellow-400 text-gray-900 rounded-full text-lg shadow-md hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img alt="Kakao logo" className="w-7 h-7 mr-3" src="/kakao_logo.png" />
                <span>Kakao</span>
              </button>
            </div>

            {/* ✅ 네이버 로그인 버튼 */}
            <div className="flex px-0 py-3 w-full">
              <button
                type="button"
                onClick={handleNaverLogin}
                disabled={isLoading}
                className="flex w-full items-center justify-center h-12 bg-emerald-500 text-white rounded-full text-lg shadow-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img alt="Naver logo" className="w-7 h-7 mr-3" src="/naver_logo.png" />
                <span>Naver</span>
              </button>
            </div>

            <div className="text-center">
              <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal">
                계정이 없으신가요?{' '}
                <Link to="/signup" className="font-medium text-primary hover:underline text-blue-600">
                  회원가입
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
