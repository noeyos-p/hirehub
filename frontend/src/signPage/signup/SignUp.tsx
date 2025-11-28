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

  // =========================
  // 🔥 인증번호 전송
  // =========================
  const handleSendCode = async () => {
    if (!phone) {
      setError("전화번호를 입력해주세요.");
      return;
    }
    try {
      await api.post("/api/sms/send", { phone });
      setIsCodeSent(true);
      alert("인증번호가 전송되었습니다.");
    } catch (e) {
      console.error(e);
      alert("인증번호 전송에 실패했습니다.");
    }
  };

  // =========================
  // 🔥 인증번호 확인
  // =========================
  const handleVerifyCode = async () => {
    try {
      await api.post("/api/sms/verify", { phone, code });
      setIsVerified(true);
      alert("전화번호 인증 성공!");
    } catch (e) {
      console.error(e);
      alert("인증번호가 틀렸습니다.");
    }
  };

  // =========================
  // 🔥 회원가입
  // =========================
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!isVerified) {
      setError("휴대폰 인증이 필요합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/signup', {
        email,
        password,
        phone   // 🔥 추가됨
      });

      console.log('📦 회원가입 응답:', response.data);

      const { accessToken } = response.data || {};

      if (accessToken) {
        setAuthToken(accessToken);
        await login(accessToken);
      }

      navigate('/signInfo');

    } catch (err: any) {
      console.error('❌ 회원가입 에러:', err.response?.data);
      const errorMessage = err.response?.data?.message || '회원가입에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 로그인
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
        
        <h1 className="text-2xl font-bold">회원가입</h1>

        {error && (
          <div className="w-full px-4 py-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="w-full space-y-4">

          {/* 이메일 */}
          <div>
            <label>
              <p className="pb-2">이메일</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input w-full h-14 px-4"
                required
              />
            </label>
          </div>

          {/* 전화번호 */}
          <div>
            <label>
              <p className="pb-2">휴대폰 번호</p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="form-input w-full h-14 px-4"
                  required
                />
                {!isVerified && (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="px-4 bg-blue-500 text-white rounded-lg"
                  >
                    인증요청
                  </button>
                )}
              </div>
            </label>
          </div>

          {/* 인증번호 입력 */}
          {isCodeSent && !isVerified && (
            <div>
              <label>
                <p className="pb-2">인증번호</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="form-input w-full h-14 px-4"
                  />

                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    className="px-4 bg-green-600 text-white rounded-lg"
                  >
                    확인
                  </button>
                </div>
              </label>
            </div>
          )}

          {isVerified && (
            <p className="text-green-600 font-medium text-sm">전화번호 인증 완료 ✔</p>
          )}

          {/* 비밀번호 */}
          <div>
            <label>
              <p className="pb-2">비밀번호</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input w-full h-14 px-4"
                required
              />
            </label>
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label>
              <p className="pb-2">비밀번호 확인</p>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="form-input w-full h-14 px-4"
                required
              />
            </label>
          </div>

          {/* 회원가입 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary text-white w-full h-14 rounded-lg"
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </button>

          {/* 소셜 로그인 */}
          <div className="flex items-center justify-center mt-6">
            <hr className="flex-grow border-gray-300" />
            <span className="px-4 text-gray-500">또는</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full h-14 flex items-center justify-center border rounded-lg my-2"
          >
            <img src="/google_logo_icon_169090.png" className="w-7 h-7 mr-3" />
            Google
          </button>

          <button
            type="button"
            onClick={handleKakaoSignup}
            className="w-full h-14 flex items-center justify-center rounded-lg bg-yellow-300 my-2"
          >
            <img src="/kakao_logo.png" className="w-7 h-7 mr-3" />
            Kakao
          </button>

          <button
            type="button"
            onClick={handleNaverSignup}
            className="w-full h-14 flex items-center justify-center rounded-lg bg-green-500 text-white my-2"
          >
            <img src="/naver_logo.png" className="w-7 h-7 mr-3" />
            Naver
          </button>

          <div className="text-center mt-4">
            <p className="text-sm">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
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
