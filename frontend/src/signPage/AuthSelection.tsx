import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const AuthSelection: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = `${api.defaults.baseURL}/api/auth/google`;
  };

  const handleKakaoLogin = () => {
    window.location.href = `${api.defaults.baseURL}/api/auth/kakao`;
  };

  const handleNaverLogin = () => {
    window.location.href = `${api.defaults.baseURL}/api/auth/naver`;
  };

  const handleEmailLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-[80vh] bg-background-light dark:bg-background-dark p-4 sm:p-8 md:p-12 pt-16 sm:pt-20 md:pt-24">
      <div className="flex flex-col items-center w-full max-w-sm mx-auto space-y-8 sm:space-y-12">
        {/* 로고 */}
        <div className="flex justify-center">
          <img
            src="/HIREHUB_LOGO.PNG"
            alt="HireHub Logo"
            className="w-[120px] sm:w-[150px] h-auto object-contain"
          />
        </div>

        {/* 버튼 섹션 */}
        <div className="w-full space-y-4 sm:space-y-5 flex flex-col items-center">
          {/* 카카오 로그인 */}
          <button
            onClick={handleKakaoLogin}
            className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 sm:gap-3 bg-[#FEE500] hover:bg-[#FDD835] rounded-lg transition-colors px-4"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C6.477 3 2 6.477 2 10.5C2 13.148 3.824 15.509 6.5 16.75L5.5 20.5L9.5 17.75C10.293 17.917 11.133 18 12 18C17.523 18 22 14.523 22 10.5C22 6.477 17.523 3 12 3Z" fill="#000000"/>
            </svg>
            <span className="font-semibold text-sm sm:text-base text-gray-900">카카오 계정으로 계속하기</span>
          </button>

          {/* 네이버 로그인 */}
          <button
            onClick={handleNaverLogin}
            className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 sm:gap-3 bg-white border-1 border-gray-200 hover:bg-gray-50 rounded-lg transition-colors px-4"
          >
            <img
              src="/naver_logo.png"
              alt="Naver"
              className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0"
            />
            <span className="font-semibold text-sm sm:text-base text-gray-900">네이버 계정으로 계속하기</span>
          </button>

          {/* 구글 로그인 */}
          <button
            onClick={handleGoogleLogin}
            className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 sm:gap-3 bg-white border-1 border-gray-200 hover:bg-gray-50 rounded-lg transition-colors px-4"
          >
            <img
              src="/google_logo_icon_169090.png"
              alt="Google"
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
            />
            <span className="font-semibold text-sm sm:text-base text-gray-900">구글 계정으로 계속하기</span>
          </button>

          {/* 이메일 로그인 */}
          <button
            onClick={handleEmailLogin}
            className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 sm:gap-3 bg-white border-1 border-gray-200 hover:bg-gray-50 rounded-lg transition-colors px-4"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span className="font-semibold text-sm sm:text-base text-gray-900">이메일로 계속하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthSelection;
