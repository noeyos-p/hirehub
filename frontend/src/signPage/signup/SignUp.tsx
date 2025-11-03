// src/pages/auth/Signup.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/api';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // [NAVER ADD START] ✅ 네이버 회원가입 - 백엔드 OAuth 엔드포인트로 리다이렉트
  const handleNaverSignup = () => {
    window.location.href = '/api/auth/naver';
  };
  // [NAVER ADD END]

 const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);
  try {
    const res = await api.post('/api/auth/signup', { email, password });
    const { accessToken } = res.data || {};
    if (accessToken) {
      localStorage.setItem('token', accessToken);
    }
    // ✅ 규칙: 회원가입 후에는 무조건 온보딩
    navigate('/signInfo');
  } catch (err: any) {
    const msg = err.response?.data?.message || '회원가입에 실패했습니다.';
    setError(msg);
  } finally {
    setIsLoading(false);
  }
};

  const handleGoogleSignup = () => {
    window.location.href = '/api/auth/google';
  };

  const handleKakaoSignup = () => {
    window.location.href = '/api/auth/kakao';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="px-8 py-10">
          <h2 className="text-3xl font-bold text-center text-text-primary dark:text-white">회원가입</h2>
          <p className="text-center mt-2 text-text-secondary dark:text-gray-300">
            이메일/비밀번호로 회원가입, 또는 소셜 계정을 이용하세요.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
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

            {/* 기본 회원가입 버튼 */}
            <div className="flex px-0 py-3 w-full">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center h-12 bg-primary text-white rounded-full text-lg shadow-md hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="truncate">{isLoading ? '가입 중...' : '회원가입'}</span>
              </button>
            </div>

            <div className="flex items-center px-4 py-6">
              <hr className="flex-grow border-t border-gray-300 dark:border-gray-600" />
              <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">또는</span>
              <hr className="flex-grow border-t border-gray-300 dark:border-gray-600" />
            </div>

            {/* ✅ 구글 회원가입 */}
            <div className="flex px-0 py-3 w-full">
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className="flex w-full items-center justify-center h-12 bg-white border border-gray-300 rounded-full text-lg shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img alt="Google logo" className="w-7 h-7 mr-3" src="/google_logo_icon_169090.png" />
                <span>Google로 회원가입</span>
              </button>
            </div>

            {/* ✅ 카카오 회원가입 */}
            <div className="flex px-0 py-3 w-full">
              <button
                type="button"
                onClick={handleKakaoSignup}
                disabled={isLoading}
                className="flex w-full items-center justify-center h-12 bg-yellow-400 text-gray-900 rounded-full text-lg shadow-md hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img alt="Kakao logo" className="w-7 h-7 mr-3" src="/kakao_logo.png" />
                <span>Kakao로 회원가입</span>
              </button>
            </div>

            {/* ✅ 네이버 회원가입 */}
            <div className="flex px-0 py-3 w-full">
              <button
                type="button"
                onClick={handleNaverSignup}
                disabled={isLoading}
                className="flex w-full items-center justify-center h-12 bg-emerald-500 text-white rounded-full text-lg shadow-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img alt="Naver logo" className="w-7 h-7 mr-3" src="/naver_logo.png" />
                <span>Naver로 회원가입</span>
              </button>
            </div>

            <div className="text-center">
              <p className="text-text-secondary dark:text-gray-400 text-sm font-normal leading-normal">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline text-blue-600">
                  로그인
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
