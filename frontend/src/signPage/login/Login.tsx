import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { setAuthToken } from '../../api/api'; // ✅ setAuthToken import

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        // ✅ 헬퍼 함수로 토큰 저장 및 헤더 설정
        setAuthToken(accessToken);
        
        // role, email, userId 저장
        localStorage.setItem('role', role || 'USER');
        localStorage.setItem('email', userEmail || email);
        localStorage.setItem('userId', String(userId));
        
        console.log('🔐 로그인 성공');
        console.log('- 토큰:', accessToken.substring(0, 20) + '...');
        console.log('- Role:', role);
        console.log('- Email:', userEmail || email);

        // 로그인 후 페이지 새로고침으로 이동
        if (role === 'ADMIN') {
          console.log('✅ 관리자 - Admin 페이지로 이동');
          window.location.href = '/admin';
        } else {
          console.log('✅ 일반 사용자 - 메인 페이지로 이동');
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

  return (
    <div className="min-h-[80vh] bg-background-light dark:bg-background-dark font-display text-text-primary dark:text-white p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-sm mx-auto">
        {/* 뒤로가기 */}
        <Link to="/auth" className="text-xs sm:text-sm text-[#006AFF] mb-3 md:mb-4 hover:underline inline-block">
          ← 돌아가기
        </Link>

        <h1 className="text-text-primary dark:text-white text-2xl font-bold text-center mb-6">로그인</h1>

        {error && (
          <div className="w-full px-4 py-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="flex flex-col">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-text-primary dark:text-white text-base font-medium leading-normal pb-2">이메일</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력해주세요."
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d141b] dark:text-white focus:outline-none focus:ring-0 border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] h-14 placeholder:text-[#4c739a] dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal transition-all"
                required
                disabled={isLoading}
              />
            </label>
          </div>
          <div className="flex flex-col">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-text-primary dark:text-white text-base font-medium leading-normal pb-2">비밀번호</p>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력해주세요."
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d141b] dark:text-white focus:outline-none focus:ring-0 border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] h-14 placeholder:text-[#4c739a] dark:placeholder:text-gray-500 p-[15px] pr-12 text-base font-normal leading-normal transition-all"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </label>
          </div>
          <div className="flex px-0 py-3 w-full">
            <button
              type="submit"
              disabled={isLoading}
              className="flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-5 flex-1 bg-[#006AFF] text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#0056CC] focus:outline-none focus:ring-4 focus:ring-[#006AFF]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate">{isLoading ? '로그인 중...' : '로그인'}</span>
            </button>
          </div>

          {/* 또는 구분선 */}
          <div className="flex items-center px-4 py-6">
            <hr className="flex-grow border-t border-gray-300 dark:border-gray-600" />
            <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">또는</span>
            <hr className="flex-grow border-t border-gray-300 dark:border-gray-600" />
          </div>

          <div className="flex px-0 py-0 w-full">
            <Link
              to="/signup"
              className="flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-5 flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-[#006AFF] text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-[#006AFF]/30"
            >
              <span className="truncate">회원가입</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;