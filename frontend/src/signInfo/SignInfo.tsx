import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAuthToken } from '../api/api';
import { AxiosError } from 'axios';
import type { UsersRequest } from "../types/interface";

/* === Daum 주소검색용 타입 선언 === */
declare global { interface Window { daum: any } }

/* 주소검색 함수 */
const openPostcode = (cb: (addr: string) => void) => {
  new window.daum.Postcode({
    oncomplete: (data: any) => cb(data.address)
  }).open();
};

const SignInfo: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<UsersRequest>({
    name: '',
    nickname: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    location: '',
    position: '',
    careerLevel: '',
    education: ''
  });

  /* 상세주소 (프론트 전용) */
  const [addressDetail, setAddressDetail] = useState("");

  /* 상세주소 자동 포커스 */
  const detailRef = useRef<HTMLInputElement | null>(null);

  const seoulDistricts = [
    '강남구', '강동구', '강북구', '강서구', '관악구',
    '광진구', '구로구', '금천구', '노원구', '도봉구',
    '동대문구', '동작구', '마포구', '서대문구', '서초구',
    '성동구', '성북구', '송파구', '양천구', '영등포구',
    '용산구', '은평구', '종로구', '중구', '중랑구'
  ];

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /* 저장 */
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

      const finalAddress = `${formData.address} ${addressDetail}`.trim();

      const response = await api.post('/api/onboarding/save', {
        ...formData,
        address: finalAddress
      });

      if (response.data?.accessToken) {
        setAuthToken(response.data.accessToken);
      }

      alert('정보가 성공적으로 저장되었습니다!');
      window.location.href = '/';

    } catch (e) {
      const err = e as AxiosError<{ message?: string }>;
      setError(err.response?.data?.message || '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormComplete = Object.values(formData).every(v => v.trim() !== "");

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">HIREHUB</h1>
      <hr className="max-w-md w-full border-t-2 border-gray-300 mb-6" />
      <h2 className="text-xl mb-6 font-bold">정보를 입력해주세요</h2>

      {error && (
        <div className="w-full max-w-md mb-4 px-4 py-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
      >

        {/* 이름 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">이름 *</label>
          <input
            type="text"
            name="name"
            required
            disabled={isLoading}
            value={formData.name}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 닉네임 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">닉네임 *</label>
          <input
            type="text"
            name="nickname"
            required
            disabled={isLoading}
            value={formData.nickname}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 전화번호 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">전화번호 *</label>
          <input
            type="tel"
            name="phone"
            required
            disabled={isLoading}
            value={formData.phone}
            onChange={handleChange}
            placeholder="010-1234-5678"
            className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 생년월일 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">생년월일 *</label>
          <input
            type="date"
            name="dob"
            required
            disabled={isLoading}
            value={formData.dob}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 성별 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">성별 *</label>
          <select
            name="gender"
            required
            disabled={isLoading}
            value={formData.gender}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택하세요</option>
            <option value="MALE">남성</option>
            <option value="FEMALE">여성</option>
            <option value="UNKNOWN">선택 안 함</option>
          </select>
        </div>

        {/* ===================== */}
        {/*   주소 + 상세주소     */}
        {/* ===================== */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">주소 *</label>

          {/* 주소 input */}
          <input
            type="text"
            name="address"
            disabled={isLoading}
            value={formData.address}
            onChange={handleChange}
            placeholder="주소를 입력하세요"
            className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
          />

          {/* 주소 찾기 */}
          <button
            type="button"
            onClick={() =>
              openPostcode(addr => {
                setFormData(prev => ({ ...prev, address: addr }));
                setTimeout(() => detailRef.current?.focus(), 100);
              })
            }
            className="mt-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
          >
            주소 찾기
          </button>

          {/* 상세주소 */}
          <input
            ref={detailRef}
            value={addressDetail}
            disabled={isLoading}
            onChange={e => setAddressDetail(e.target.value)}
            placeholder="상세 주소를 입력하세요 (예: 101동 1203호)"
            className="mt-2 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 선호 지역 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">선호 지역 *</label>
          <select
            name="location"
            required
            disabled={isLoading}
            value={formData.location}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택하세요</option>
            {seoulDistricts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* 직무 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">직무 *</label>
          <select
            name="position"
            required
            disabled={isLoading}
            value={formData.position}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700">경력 *</label>
          <select
            name="careerLevel"
            required
            disabled={isLoading}
            value={formData.careerLevel}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
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
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">학력 *</label>
          <select
            name="education"
            required
            disabled={isLoading}
            value={formData.education}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택하세요</option>
            <option value="고졸">고졸</option>
            <option value="초대졸">초대졸</option>
            <option value="대졸">대졸</option>
            <option value="석사">석사</option>
            <option value="박사">박사</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!isFormComplete || isLoading}
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:opacity-50 font-medium"
        >
          {isLoading ? '저장 중...' : '완료'}
        </button>
      </form>
    </div>
  );
};

export default SignInfo;
