import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api, { setAuthToken } from '../../api/api';
import { useAuth } from '../../hooks/useAuth';

const Signup: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const oauthEmail = queryParams.get('email') || '';
  const isOAuthSignup = queryParams.get('oauth') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+82');
  const [code, setCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [emailCheckMessage, setEmailCheckMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [allAgree, setAllAgree] = useState(false);
  const [agreements, setAgreements] = useState({
    age14: false,
    terms: false,
    privacy: false,
    marketing: false,
    marketingEmail: false,
    marketingPush: false,
    marketingSMS: false,
    jobInfo: false,
    jobInfoEmail: false,
    jobInfoPush: false,
    jobInfoSMS: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // OAuth 로그인 시 이메일 자동 입력
  useEffect(() => {
    if (isOAuthSignup && oauthEmail) {
      setEmail(oauthEmail);
      setIsEmailChecked(true); // OAuth 이메일은 중복 확인 불필요
      setEmailCheckMessage('소셜 로그인 이메일이 자동으로 입력되었습니다.');
      console.log('🔐 OAuth 이메일 자동 입력:', oauthEmail);
    }
  }, [isOAuthSignup, oauthEmail]);

  // 이메일 중복 확인
  const handleCheckEmail = async () => {
    if (!email) {
      setEmailError("이메일을 입력해주세요.");
      return;
    }
    try {
      await api.get(`/api/auth/check-email?email=${email}`);
      setIsEmailChecked(true);
      setEmailCheckMessage("기입이 가능한 이메일입니다.");
      setEmailError('');
    } catch (e: any) {
      setIsEmailChecked(false);
      setEmailCheckMessage("");
      setEmailError("이미 사용 중인 이메일입니다.");
    }
  };

  // 닉네임 중복 확인
  const handleCheckNickname = async () => {
    if (!nickname) {
      setNicknameError("닉네임을 입력해주세요.");
      return;
    }
    try {
      await api.get(`/api/auth/check-nickname?nickname=${nickname}`);
      setIsNicknameChecked(true);
      setNicknameCheckMessage("사용 가능한 닉네임입니다.");
      setNicknameError('');
    } catch (e: any) {
      setIsNicknameChecked(false);
      setNicknameCheckMessage("");
      setNicknameError("이미 사용 중인 닉네임입니다.");
    }
  };

  // 전체 동의 핸들러
  const handleAllAgree = (checked: boolean) => {
    setAllAgree(checked);
    setAgreements({
      age14: checked,
      terms: checked,
      privacy: checked,
      marketing: checked,
      marketingEmail: checked,
      marketingPush: checked,
      marketingSMS: checked,
      jobInfo: checked,
      jobInfoEmail: checked,
      jobInfoPush: checked,
      jobInfoSMS: checked,
    });
  };

  // 개별 약관 동의 핸들러
  const handleAgreementChange = (key: string, checked: boolean) => {
    const newAgreements = { ...agreements, [key]: checked };
    setAgreements(newAgreements);

    // 모든 항목이 체크되었는지 확인
    const allChecked = Object.values(newAgreements).every(v => v === true);
    setAllAgree(allChecked);
  };

  // 인증번호 전송
  const handleSendCode = async () => {
    if (!phone) {
      setError("전화번호를 입력해주세요.");
      return;
    }
    try {
      const fullPhone = countryCode + phone;
      await api.post("/api/sms/send", { phone: fullPhone });
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
      const fullPhone = countryCode + phone;
      await api.post("/api/sms/verify", { phone: fullPhone, code });
      setIsVerified(true);
      setError('');
    } catch (e) {
      console.error(e);
      setError("인증번호가 틀렸습니다.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');

    // 이메일 중복 확인 검증 (OAuth 사용자는 제외)
    if (!isOAuthSignup && !isEmailChecked) {
      setError('이메일 중복 확인이 필요합니다.');
      return;
    }

    // 비밀번호 검증 (OAuth 사용자는 제외)
    if (!isOAuthSignup) {
      if (!password) {
        setPasswordError('비밀번호를 입력해주세요.');
        return;
      }

      if (password !== passwordConfirm) {
        setPasswordError('비밀번호가 일치하지 않습니다.');
        return;
      }
    }

    // 닉네임 중복 확인 검증
    if (!isNicknameChecked) {
      setError('닉네임 중복 확인이 필요합니다.');
      return;
    }

    // 전화번호 인증 확인
    if (!isVerified) {
      setError("휴대폰 인증이 필요합니다.");
      return;
    }

    // 필수 약관 동의 확인
    if (!agreements.age14 || !agreements.terms || !agreements.privacy) {
      setError("필수 약관에 동의해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // 🔥 OAuth 사용자는 프로필 업데이트 API 호출
      if (isOAuthSignup) {
        const response = await api.put('/api/mypage/me', {
          name,
          nickname,
          phone: countryCode + phone
        });

        console.log('📦 OAuth 프로필 업데이트 응답:', response.data);
        console.log('📝 온보딩 페이지로 이동');
        navigate('/signInfo');

      } else {
        // 일반 회원가입
        const response = await api.post('/api/auth/signup', {
          email,
          password,
          name,
          nickname,
          phone: countryCode + phone
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
      }

    } catch (err: any) {
      console.error('❌ 회원가입 에러:', err.response?.data);
      const errorMessage = err.response?.data?.message || '회원가입에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-background-light dark:bg-background-dark font-display text-text-primary dark:text-white p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-sm mx-auto">
        {/* 뒤로가기 */}
        <Link to="/login" className="text-xs sm:text-sm text-[#006AFF] mb-3 md:mb-4 hover:underline inline-block">
          ← 돌아가기
        </Link>

        <h1 className="text-text-primary dark:text-white text-2xl font-bold text-center mb-6">회원가입</h1>

        {error && (
          <div className="w-full px-4 py-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="w-full space-y-4">
          {/* 이메일 */}
          <div className="flex flex-col space-y-2">
            <label className="text-text-primary dark:text-white text-sm font-medium">이메일</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEmailChecked(false);
                  setEmailCheckMessage('');
                  setEmailError('');
                }}
                placeholder="이메일을 입력하세요"
                className="form-input w-full rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 pr-24 text-base transition-all"
                required
                disabled={isLoading || isOAuthSignup}
              />
              {!isOAuthSignup && (
                <button
                  type="button"
                  onClick={handleCheckEmail}
                  disabled={isLoading || !email}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium ${
                    email ? 'text-[#006AFF] cursor-pointer' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  중복 확인
                </button>
              )}
            </div>
            {emailCheckMessage && (
              <p className="text-green-600 dark:text-green-400 text-xs ml-2">{emailCheckMessage}</p>
            )}
            {emailError && (
              <p className="text-red-600 dark:text-red-400 text-xs ml-2">{emailError}</p>
            )}
          </div>

          {/* 이름 */}
          <div className="flex flex-col space-y-2">
            <label className="text-text-primary dark:text-white text-sm font-medium">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="form-input rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
              required
              disabled={isLoading}
            />
          </div>

          {/* 닉네임 */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-text-primary dark:text-white text-sm font-medium">닉네임</label>
              <span className="text-gray-500 dark:text-gray-400 text-xs">*실시간 채팅시 사용되는 닉네임입니다.</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setIsNicknameChecked(false);
                  setNicknameCheckMessage('');
                  setNicknameError('');
                }}
                placeholder="닉네임을 입력하세요"
                className="form-input w-full rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 pr-24 text-base transition-all"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleCheckNickname}
                disabled={isLoading || !nickname}
                className={`absolute right-3 top-1/2 -translate-y-1/2 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium ${
                  nickname ? 'text-[#006AFF] cursor-pointer' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                중복 확인
              </button>
            </div>
            {nicknameCheckMessage && (
              <p className="text-green-600 dark:text-green-400 text-xs ml-2">{nicknameCheckMessage}</p>
            )}
            {nicknameError && (
              <p className="text-red-600 dark:text-red-400 text-xs ml-2">{nicknameError}</p>
            )}
          </div>

          {/* 휴대폰 번호 */}
          <div className="flex flex-col space-y-2">
            <label className="text-text-primary dark:text-white text-sm font-medium">휴대폰 번호</label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="rounded-lg border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark text-[#0d141b] dark:text-white focus:border-[#006AFF] focus:outline-none h-14 pl-3 pr-8 transition-all appearance-none bg-no-repeat bg-[length:12px] bg-[right_0.75rem_center]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`
              }}
              disabled={isLoading}
            >
              <option value="+82">South Korea +82</option>
              <option value="+1">USA +1</option>
              <option value="+86">China +86</option>
            </select>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(예시) 01013245768"
                className="form-input w-full rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 pr-32 text-base transition-all"
                required
                disabled={isLoading}
              />
              {!isVerified && (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isLoading || !phone}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium ${
                    phone ? 'text-[#006AFF] cursor-pointer' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  인증번호 받기
                </button>
              )}
            </div>
            {/* 인증번호 입력 */}
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="인증번호를 입력해주세요."
                className="form-input w-full rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 pr-24 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isCodeSent || isVerified || isLoading}
              />
              {!isVerified ? (
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={!isCodeSent || isLoading || !code}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium ${
                    isCodeSent && code ? 'text-[#006AFF] cursor-pointer' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  인증하기
                </button>
              ) : (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-green-600 dark:text-green-400">
                  인증이 완료되었습니다
                </span>
              )}
            </div>
          </div>

          {/* 비밀번호 (OAuth 사용자는 숨김) */}
          {!isOAuthSignup && (
          <div className="flex flex-col space-y-2">
            <label className="text-text-primary dark:text-white text-sm font-medium">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="비밀번호를 입력하세요"
                className="form-input w-full rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 pr-12 text-base transition-all"
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
            {/* 비밀번호 확인 */}
            <div className="relative">
              <input
                type={showPasswordConfirm ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="form-input w-full rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 pr-12 text-base transition-all"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPasswordConfirm ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
            {passwordConfirm && password !== passwordConfirm && (
              <p className="text-red-600 dark:text-red-400 text-xs ml-2">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>
          )}

          {/* 약관 동의 */}
          <div className="flex flex-col space-y-3 pt-4">
            {/* 전체 동의 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allAgree"
                checked={allAgree}
                onChange={(e) => handleAllAgree(e.target.checked)}
                className="w-4 h-4 text-[#006AFF] bg-background-light dark:bg-background-dark border-gray-300 dark:border-gray-600 rounded focus:ring-[#006AFF]"
              />
              <label htmlFor="allAgree" className="ml-2 text-sm font-medium text-text-primary dark:text-white">
                전체 동의
              </label>
            </div>

            {/* 필수 약관들 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="age14"
                checked={agreements.age14}
                onChange={(e) => handleAgreementChange('age14', e.target.checked)}
                className="w-4 h-4 text-[#006AFF] bg-background-light dark:bg-background-dark border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="age14" className="ml-2 text-sm text-text-secondary dark:text-gray-400">
                [필수] 만 14세 이상입니다.
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreements.terms}
                  onChange={(e) => handleAgreementChange('terms', e.target.checked)}
                  className="w-4 h-4 text-[#006AFF] bg-background-light dark:bg-background-dark border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-text-secondary dark:text-gray-400">
                  [필수] Hirehub 이용약관 동의
                </label>
              </div>
              <button type="button" className="text-gray-400">›</button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={agreements.privacy}
                  onChange={(e) => handleAgreementChange('privacy', e.target.checked)}
                  className="w-4 h-4 text-[#006AFF] bg-background-light dark:bg-background-dark border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="privacy" className="ml-2 text-sm text-text-secondary dark:text-gray-400">
                  [필수] Hirehub 개인정보 수집 및 이용 동의
                </label>
              </div>
              <button type="button" className="text-gray-400">›</button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={agreements.marketing}
                  onChange={(e) => handleAgreementChange('marketing', e.target.checked)}
                  className="w-4 h-4 text-[#006AFF] bg-background-light dark:bg-background-dark border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="marketing" className="ml-2 text-sm text-text-secondary dark:text-gray-400">
                  [선택] 마케팅 목적의 개인정보 수집 및 이용 동의
                </label>
              </div>
              <button type="button" className="text-gray-400">›</button>
            </div>
          </div>

          {/* 가입하기 버튼 */}
          <div className="flex pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#006AFF] text-white rounded-lg h-14 font-medium hover:bg-[#0056CC] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '가입 중...' : '가입하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;