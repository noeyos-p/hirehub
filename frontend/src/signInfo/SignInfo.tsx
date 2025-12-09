import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAuthToken } from '../api/api';
import { AxiosError } from 'axios';

const SignInfo: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: 이력서 자동기입정보
  const [step1Data, setStep1Data] = useState({
    dob: '',
    address: '',
    gender: ''
  });

  // Step 2: AI 추천공고정보
  const [step2Data, setStep2Data] = useState({
    location: '',
    position: '',
    careerLevel: '',
    education: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const seoulDistricts = [
    '강남구', '강동구', '강북구', '강서구', '관악구',
    '광진구', '구로구', '금천구', '노원구', '도봉구',
    '동대문구', '동작구', '마포구', '서대문구', '서초구',
    '성동구', '성북구', '송파구', '양천구', '영등포구',
    '용산구', '은평구', '종로구', '중구', '중랑구'
  ];

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStep1Data(prev => ({ ...prev, [name]: value }));
  };

  const handleStep2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStep2Data(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handlePreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      // Step 1에서는 회원가입 페이지로
      navigate('/signup');
    }
  };

  const handleSkipStep = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      // Step 2 건너뛰기 - 바로 완료
      await handleComplete(true);
    }
  };

  const handleComplete = async (isSkip = false) => {
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const dataToSend = {
        dob: step1Data.dob || undefined,
        address: step1Data.address || undefined,
        gender: step1Data.gender || undefined,
        location: step2Data.location || undefined,
        position: step2Data.position || undefined,
        careerLevel: step2Data.careerLevel || undefined,
        education: step2Data.education || undefined
      };

      // undefined 필드 제거
      const cleanData = Object.fromEntries(
        Object.entries(dataToSend).filter(([_, v]) => v !== undefined && v !== '')
      );

      const response = await api.post('/api/onboarding/save', cleanData);

      if (response.data?.accessToken) {
        setAuthToken(response.data.accessToken);
      }

      navigate('/');

    } catch (e) {
      const err = e as AxiosError<{ message?: string }>;
      setError(err.response?.data?.message || '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-background-light dark:bg-background-dark font-display text-text-primary dark:text-white p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-sm mx-auto">
        {/* 뒤로가기 */}
        <button
          onClick={handlePreviousStep}
          className="text-xs sm:text-sm text-[#006AFF] mb-3 md:mb-4 hover:underline inline-block"
        >
          ← 이전으로
        </button>

        <h1 className="text-text-primary dark:text-white text-2xl font-bold text-center mb-2">추가 정보 입력</h1>
        <p className="text-text-primary dark:text-white text-sm text-center mb-6">Step {currentStep}/2</p>

        {error && (
          <div className="w-full mb-4 px-4 py-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="w-full space-y-4">
          {currentStep === 1 && (
            <>
              <div className="mb-6">
                <h2 className="text-text-primary dark:text-white text-lg font-semibold mb-4">이력서 자동기입정보</h2>
                <p className="text-text-secondary dark:text-gray-400 text-sm mb-4">
                  이력서 작성 시 자동으로 채워지는 정보입니다.
                </p>
              </div>

              {/* 생년월일 */}
              <div className="flex flex-col space-y-2">
                <label className="text-text-primary dark:text-white text-sm font-medium">생년월일</label>
                <input
                  type="date"
                  name="dob"
                  value={step1Data.dob}
                  onChange={handleStep1Change}
                  disabled={isLoading}
                  className="form-input rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
                />
              </div>

              {/* 주소 */}
              <div className="flex flex-col space-y-2">
                <label className="text-text-primary dark:text-white text-sm font-medium">주소</label>
                <input
                  type="text"
                  name="address"
                  value={step1Data.address}
                  onChange={handleStep1Change}
                  disabled={isLoading}
                  placeholder="주소를 입력하세요"
                  className="form-input rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
                />
              </div>

              {/* 성별 */}
              <div className="flex flex-col space-y-2">
                <label className="text-text-primary dark:text-white text-sm font-medium">성별</label>
                <select
                  name="gender"
                  value={step1Data.gender}
                  onChange={handleStep1Change}
                  disabled={isLoading}
                  className="rounded-lg border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark text-[#0d141b] dark:text-white focus:border-[#006AFF] focus:outline-none h-14 pl-3 pr-8 transition-all appearance-none"
                >
                  <option value="">선택하세요</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                  <option value="UNKNOWN">선택 안 함</option>
                </select>
              </div>

              {/* 버튼 */}
              <div className="flex flex-col space-y-3 pt-4">
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isLoading}
                  className="w-full bg-[#006AFF] text-white rounded-lg h-14 font-medium hover:bg-[#0056CC] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
                <button
                  type="button"
                  onClick={handleSkipStep}
                  disabled={isLoading}
                  className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg h-14 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  건너뛰기
                </button>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="mb-6">
                <h2 className="text-text-primary dark:text-white text-lg font-semibold mb-4">AI 추천공고 기입정보</h2>
                <p className="text-text-secondary dark:text-gray-400 text-sm mb-4">
                  맞춤 공고 추천에 활용되는 정보입니다.
                </p>
              </div>

              {/* 선호 지역 */}
              <div className="flex flex-col space-y-2">
                <label className="text-text-primary dark:text-white text-sm font-medium">선호 지역</label>
                <select
                  name="location"
                  value={step2Data.location}
                  onChange={handleStep2Change}
                  disabled={isLoading}
                  className="rounded-lg border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark text-[#0d141b] dark:text-white focus:border-[#006AFF] focus:outline-none h-14 pl-3 pr-8 transition-all appearance-none"
                >
                  <option value="">선택하세요</option>
                  {seoulDistricts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* 직무 */}
              <div className="flex flex-col space-y-2">
                <label className="text-text-primary dark:text-white text-sm font-medium">직무</label>
                <select
                  name="position"
                  value={step2Data.position}
                  onChange={handleStep2Change}
                  disabled={isLoading}
                  className="rounded-lg border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark text-[#0d141b] dark:text-white focus:border-[#006AFF] focus:outline-none h-14 pl-3 pr-8 transition-all appearance-none"
                >
                  <option value="">선택하세요</option>
                  <option value="프론트엔드">프론트엔드</option>
                  <option value="백엔드">백엔드</option>
                  <option value="풀스택">풀스택</option>
                  <option value="DevOps">DevOps</option>
                  <option value="데이터 엔지니어">데이터 엔지니어</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              {/* 경력 */}
              <div className="flex flex-col space-y-2">
                <label className="text-text-primary dark:text-white text-sm font-medium">경력</label>
                <select
                  name="careerLevel"
                  value={step2Data.careerLevel}
                  onChange={handleStep2Change}
                  disabled={isLoading}
                  className="rounded-lg border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark text-[#0d141b] dark:text-white focus:border-[#006AFF] focus:outline-none h-14 pl-3 pr-8 transition-all appearance-none"
                >
                  <option value="">선택하세요</option>
                  <option value="신입">신입</option>
                  <option value="1년 미만">1년 미만</option>
                  <option value="1-3년">1-3년</option>
                  <option value="3-5년">3-5년</option>
                  <option value="5-10년">5-10년</option>
                  <option value="10년 이상">10년 이상</option>
                </select>
              </div>

              {/* 학력 */}
              <div className="flex flex-col space-y-2">
                <label className="text-text-primary dark:text-white text-sm font-medium">학력</label>
                <select
                  name="education"
                  value={step2Data.education}
                  onChange={handleStep2Change}
                  disabled={isLoading}
                  className="rounded-lg border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark text-[#0d141b] dark:text-white focus:border-[#006AFF] focus:outline-none h-14 pl-3 pr-8 transition-all appearance-none"
                >
                  <option value="">선택하세요</option>
                  <option value="고졸">고졸</option>
                  <option value="초대졸">초대졸</option>
                  <option value="대졸">대졸</option>
                  <option value="석사">석사</option>
                  <option value="박사">박사</option>
                </select>
              </div>

              {/* 버튼 */}
              <div className="flex flex-col space-y-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleComplete(false)}
                  disabled={isLoading}
                  className="w-full bg-[#006AFF] text-white rounded-lg h-14 font-medium hover:bg-[#0056CC] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '저장 중...' : '완료'}
                </button>
                <button
                  type="button"
                  onClick={handleSkipStep}
                  disabled={isLoading}
                  className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg h-14 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  건너뛰기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignInfo;
