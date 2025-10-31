import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';

const SignInfo: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const isNewUser = searchParams.get('isNewUser');

    if (token) {
      console.log('🔄 OAuth 콜백 - 토큰 받음:', token.substring(0, 20) + '...');
      localStorage.setItem('token', token);
      console.log('✅ 토큰 저장 완료');

      if (isNewUser === 'false') {
        console.log('👤 기존 사용자 → 메인페이지 이동');
        navigate('/');
      }
    }

    console.log('🏁 SignInfo 컴포넌트 마운트됨');
  }, [searchParams, navigate]);

  const [formData, setFormData] = useState({
    displayName: '',
    nickname: '',
    phone: '',
    dob: '',
    gender: '',
    education: '',
    careerLevel: '',
    position: '',
    address: '',
    location: ''
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      console.log('🚀 온보딩 요청 시작', formData);

      const response = await api.post('/api/onboarding/save', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('✅ 온보딩 성공:', response.data);
      alert('정보가 성공적으로 저장되었습니다!');
      navigate('/'); // 🎯 메인으로 이동

    } catch (err: any) {
      console.error('❌ 온보딩 실패:', err);

      if (err.response) {
        const status = err.response.status;
        const backendMessage = err.response.data?.message;

        if (status === 400) {
          setError(backendMessage || '입력하신 정보에 문제가 있습니다.');
        } else if (status === 401) {
          setError('로그인이 만료되었습니다. 다시 로그인해주세요.');
          localStorage.removeItem('token');
          navigate('/login');
        } else if (status === 500) {
          setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(backendMessage || '정보 저장에 실패했습니다.');
        }
      } else if (err.request) {
        setError('서버와 연결할 수 없습니다. 네트워크를 확인해주세요.');
      } else {
        setError('요청 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormComplete = Object.values(formData).every(value => value.trim() !== '');

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">HIREHUB</h1>
      <hr className="max-w-md w-full border-t-2 border-gray-300 mb-6" />
      <h2 className="text-xl mb-6 font-bold">정보를 입력해주세요</h2>

      {/* 에러 메시지 */}
      {error && (
        <div className="w-full max-w-md mb-4 px-4 py-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault(); // 🔒 엔터로 제출 방지
        }}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
      >
        {/* 이름 */}
        <div className="mb-4">
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
            이름
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 p-2 w-full border rounded-md"
            placeholder="이름을 입력하세요"
          />
        </div>

        {/* 닉네임 */}
        <div className="mb-4">
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
            닉네임
          </label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 p-2 w-full border rounded-md"
            placeholder="닉네임을 입력하세요"
          />
        </div>

        {/* 전화번호 */}
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            전화번호
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 p-2 w-full border rounded-md"
            placeholder="010-1234-5678"
          />
        </div>

        {/* 생년월일 */}
        <div className="mb-4">
          <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
            생년월일
          </label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 p-2 w-full border rounded-md"
          />
        </div>

        {/* 성별 */}
        <div className="mb-4">
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
            성별
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 p-2 w-full border rounded-md"
          >
            <option value="">선택하세요</option>
            <option value="MALE">남성</option>
            <option value="FEMALE">여성</option>
            <option value="UNKNOWN">선택 안 함</option>
          </select>
        </div>

        {/* 주소 */}
        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            주소
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 p-2 w-full border rounded-md"
            placeholder="주소를 입력하세요"
          />
        </div>

        {/* 선호 지역 */}
        <div className="mb-4">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            선호 지역
          </label>
          <select
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 p-2 w-full border rounded-md"
          >
            <option value="">선택하세요</option>
            {seoulDistricts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* 직무 */}
        <div className="mb-4">
          <label htmlFor="position" className="block text-sm font-medium text-gray-700">
            직무
          </label>
          <select
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 p-2 w-full border rounded-md"
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
        <div className="mb-4">
          <label htmlFor="careerLevel" className="block text-sm font-medium text-gray-700">
            경력
          </label>
          <select
            id="careerLevel"
            name="careerLevel"
            value={formData.careerLevel}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 p-2 w-full border rounded-md"
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
        <div className="mb-4">
          <label htmlFor="education" className="block text-sm font-medium text-gray-700">
            학력
          </label>
          <select
            id="education"
            name="education"
            value={formData.education}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 p-2 w-full border rounded-md"
          >
            <option value="">선택하세요</option>
            <option value="고졸">고졸</option>
            <option value="초대졸">초대졸</option>
            <option value="대졸">대졸</option>
            <option value="석사">석사</option>
            <option value="박사">박사</option>
          </select>
        </div>

        {/* 완료 버튼 */}
        <button
          type="submit"
          disabled={!isFormComplete || isLoading}
          className="w-full bg-gray-300 text-black p-2 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '저장 중...' : '완료'}
        </button>
      </form>
    </div>
  );
};

export default SignInfo;
