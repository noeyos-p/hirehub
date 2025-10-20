import React from 'react';

const SignInfo: React.FC = () => {
  // 나이 옵션 (19~65세) 동적 생성
  const ageOptions = Array.from({ length: 65 - 19 + 1 }, (_, i) => 19 + i);

  // 서울특별시 자치구 목록
  const seoulDistricts = [
    '강남구', '강동구', '강북구', '강서구', '관악구',
    '광진구', '구로구', '금천구', '노원구', '도봉구',
    '동대문구', '동작구', '마포구', '서대문구', '서초구',
    '성동구', '성북구', '송파구', '양천구', '영등포구',
    '용산구', '은평구', '종로구', '중구', '중랑구'
  ];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // 폼 제출 로직 (예: API 호출) 추가 가능
    console.log('폼 제출');
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">HIREHUB</h1>
      <hr className="max-w-md w-full border-t-2 border-gray-300 mb-6" />
      <h2 className="text-xl mb-6 font-bold">정보를 입력해주세요</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            이름
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 p-2 w-full border rounded-md"
            placeholder="이름을 입력하세요"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
            닉네임
          </label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            required
            className="mt-1 p-2 w-full border rounded-md"
            placeholder="닉네임을 입력하세요"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            전화번호
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            className="mt-1 p-2 w-full border rounded-md"
            placeholder="010-1234-5678"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
            생년월일
          </label>
          <input
            type="date"
            id="birthdate"
            name="birthdate"
            required
            className="mt-1 p-2 w-full border rounded-md"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="age" className="block text-sm font-medium text-gray-700">
            나이
          </label>
          <select id="age" name="age" required className="mt-1 p-2 w-full border rounded-md">
            <option value="">선택하세요</option>
            {ageOptions.map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="region" className="block text-sm font-medium text-gray-700">
            지역
          </label>
          <select id="region" name="region" required className="mt-1 p-2 w-full border rounded-md">
            <option value="">선택하세요</option>
            {seoulDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="job" className="block text-sm font-medium text-gray-700">
            직무
          </label>
          <select id="job" name="job" required className="mt-1 p-2 w-full border rounded-md">
            <option value="">선택하세요</option>
            <option value="frontend">프론트앤드</option>
            <option value="backend">백앤드</option>
            <option value="fullstack">풀스택</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="career" className="block text-sm font-medium text-gray-700">
            경력
          </label>
          <select id="career" name="career" required className="mt-1 p-2 w-full border rounded-md">
            <option value="">선택하세요</option>
            <option value="newbie">신입</option>
            <option value="under3">경력(3년 이하)</option>
            <option value="over3">경력(3년 이상)</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="education" className="block text-sm font-medium text-gray-700">
            학력
          </label>
          <select id="education" name="education" required className="mt-1 p-2 w-full border rounded-md">
            <option value="">선택하세요</option>
            <option value="high">고졸</option>
            <option value="college">대졸</option>
            <option value="junior">초대졸</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="school" className="block text-sm font-medium text-gray-700">
            학교명
          </label>
          <input
            type="text"
            id="school"
            name="school"
            required
            className="mt-1 p-2 w-full border rounded-md"
            placeholder="학교명을 입력하세요"
          />
        </div>
        <button type="submit" className="w-full bg-gray-300 text-black p-2 rounded-md hover:bg-gray-400">
          완료
        </button>
      </form>
    </div>
  );
};

export default SignInfo;