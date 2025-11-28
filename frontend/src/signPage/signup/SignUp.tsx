import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { setAuthToken } from '../../api/api';
import { useAuth } from '../../hooks/useAuth';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // 인증번호 전송
  const handleSendCode = async () => {
    if (!phone) {
      setError("전화번호를 입력해주세요.");
      return;
    }
    try {
      await api.post("/api/sms/send", { phone });
      setIsCodeSent(true);
      setError('');
      alert("인증번호가 전송되었습니다.");
    } catch (e) {
      console.error(e);
      setError("인증번호 전송에 실패했습니다.");
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    try {
      await api.post("/api/sms/verify", { phone, code });
      setIsVerified(true);
      setError('');
      alert("전화번호 인증 성공!");
    } catch (e) {
      console.error(e);
      setError("인증번호가 틀렸습니다.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 비밀번호 확인 검증
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 전화번호 인증 확인
    if (!isVerified) {
      setError("휴대폰 인증이 필요합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/signup', {
        email,
        password,
        phone
      });

      console.log('📦 회원가입 응답:', response.data);

      const { accessToken } = response.data || {};

      if (accessToken) {
        setAuthToken(accessToken);
        await login(accessToken);
        console.log('🔐 회원가입 성공, 토큰 저장 및 인증 상태 업데이트 완료');
      }

      console.log('📝 온보딩 페이지로 이동');
      navigate('/signInfo');

    } catch (err: any) {
      console.error('❌ 회원가입 에러:', err.response?.data);
      const errorMessage = err.response?.data?.message || '회원가입에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${api.defaults.baseURL}/api/auth/google`;
  };

  const handleKakaoSignup = () => {
    window.location.href = `${api.defaults.baseURL}/api/auth/kakao`;
  };

  const handleNaverSignup = () => {
    window.location.href = `${api.defaults.baseURL}/api/auth/naver`;
  };

  return (
    <div className="flex min-h-[80vh] bg-background-light dark:bg-background-dark font-display text-text-primary dark:text-white items-center justify-center p-12">
      <div className="flex flex-col items-center w-full max-w-sm space-y-6">
        <h1 className="text-text-primary dark:text-white text-2xl font-bold leading-tight text-center px-4 pb-6">회원가입</h1>

        {error && (
          <div className="w-full px-4 py-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="w-full space-y-4">
          {/* 이메일 */}
          <div className="flex flex-col">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-text-primary dark:text-white text-base font-medium leading-normal pb-2">이메일</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d141b] dark:text-white focus:outline-0 focus:ring-0 border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-primary h-14 placeholder:text-[#4c739a] dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal"
                required
                disabled={isLoading}
              />
            </label>
          </div>

          {/* 전화번호 */}
          <div className="flex flex-col">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-text-primary dark:text-white text-base font-medium leading-normal pb-2">휴대폰 번호</p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d141b] dark:text-white focus:outline-0 focus:ring-0 border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-primary h-14 placeholder:text-[#4c739a] dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal"
                  required
                  disabled={isLoading}
                />
                {!isVerified && (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isLoading}
                    className="px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    인증요청
                  </button>
                )}
              </div>
            </label>
          </div>

          {/* 인증번호 입력 */}
          {isCodeSent && !isVerified && (
            <div className="flex flex-col">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-text-primary dark:text-white text-base font-medium leading-normal pb-2">인증번호</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="인증번호 6자리"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d141b] dark:text-white focus:outline-0 focus:ring-0 border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-primary h-14 placeholder:text-[#4c739a] dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isLoading}
                    className="px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    확인
                  </button>
                </div>
              </label>
            </div>
          )}

          {/* 인증 완료 메시지 */}
          {isVerified && (
            <div className="w-full px-4 py-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded-lg text-sm">
              ✓ 전화번호 인증 완료
            </div>
          )}

          {/* 비밀번호 */}
          <div className="flex flex-col">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-text-primary dark:text-white text-base font-medium leading-normal pb-2">비밀번호</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d141b] dark:text-white focus:outline-0 focus:ring-0 border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-primary h-14 placeholder:text-[#4c739a] dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal"
                required
                disabled={isLoading}
              />
            </label>
          </div>

          {/* 비밀번호 확인 */}
          <div className="flex flex-col">
            <label className="flex flex-col min-w-40 flex-1">
              <p className="text-text-primary dark:text-white text-base font-medium leading-normal pb-2">비밀번호 확인</p>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d141b] dark:text-white focus:outline-0 focus:ring-0 border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-primary h-14 placeholder:text-[#4c739a] dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal"
                required
                disabled={isLoading}
              />
            </label>
          </div>

          {/* 회원가입 버튼 */}
          <div className="flex px-0 py-3 w-full">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-5 flex-1 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate">{isLoading ? '가입 중...' : '회원가입'}</span>
            </button>
          </div>

          <div className="flex items-center px-4 py-6">
            <hr className="flex-grow border-t border-gray-300 dark:border-gray-600" />
            <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">또는</span>
            <hr className="flex-grow border-t border-gray-300 dark:border-gray-600" />
          </div>

          {/* Google 회원가입 */}
          <div className="flex px-0 py-3 w-full">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-background-light dark:bg-background-dark h-14 px-5 text-gray-800 dark:text-white font-medium text-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                alt="Google logo"
                className="w-7 h-7 mr-3"
                src='/google_logo_icon_169090.png'
              />
              <span>Google</span>
            </button>
          </div>

          {/* Kakao 회원가입 */}
          <div className="flex px-0 py-3 w-full">
            <button
              type="button"
              onClick={handleKakaoSignup}
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-yellow-300 h-14 px-5 text-gray-800 font-medium text-lg shadow-md hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                alt="Kakao logo"
                className="w-7 h-7 mr-3"
                src='/kakao_logo.png'
              />
              <span>Kakao</span>
            </button>
          </div>

          {/* Naver 회원가입 */}
          <div className="flex px-0 py-3 w-full">
            <button
              type="button"
              onClick={handleNaverSignup}
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-green-500 h-14 px-5 text-white font-medium text-lg shadow-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                alt="Naver logo"
                className="w-7 h-7 mr-3"
                src='/naver_logo.png'
              />
              <span>Naver</span>
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
  );
};

export default Signup;