import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, UserCircleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // ✅ 채팅방 자동 퇴장을 위한 이벤트 발생
    window.dispatchEvent(new Event('userLogout'));

    // 기존 로그아웃 로직
    logout();
    setShowDropdown(false);
    navigate('/login');
  };

  // 검색 처리
  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      alert('검색어를 입력해주세요.');
      return;
    }
    navigate(`/jobPostings?search=${encodeURIComponent(searchKeyword)}`, { replace: true });
    setSearchKeyword('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 flex justify-center">
      <div className="w-[1440px] px-[55px] flex items-center justify-between py-3 px-4">
        <div className="flex items-center space-x-10">
          {/* 로고 */}
          <Link to="/">
          <img
            src="/HIREHUB_LOGO.PNG"
            alt="HireHub Logo"
            className="w-[117px] h-[33px] object-contain"
          />
          </Link>



          {/* 네비게이션 메뉴 */}
          <nav className="hidden md:flex space-x-8 text-gray-800 font-medium text-sm">
            <Link
              to="/jobPostings"
              className="inline-block font-bord text-[16px] text-black hover:text-[#006AFF] transition"
            >
              채용정보
            </Link>

            <Link to="/board"
              className="inline-block mr-[405px] font-bord text-[16px] text-black hover:text-[#006AFF] transition">자유게시판</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          {/* 검색창 */}
          <div className="relative">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="어떤 공고를 찾으세요?"
              className="w-[400px] h-[41px] border border-gray-400 rounded-[10px] px-4 py-1.5 pr-9 text-sm focus:outline-none focus:border-[#006AFF]"
            />
            <button onClick={handleSearch}>
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 absolute right-3 top-2.5 cursor-pointer hover:text-blue-500 transition translate-y-[3px]" />
            </button>
          </div>

          {/* 로그인/프로필 영역 */}
          <div className="flex items-center">
            {loading ? (
              // 로딩 중
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : isAuthenticated && user ? (
              // 로그인된 상태
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition"
                >
                  {/* 프로필 이미지 */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
                    <UserCircleIcon className="w-6 h-6 text-white" />
                  </div>

                  {/* 닉네임 */}
                  <span className="font-medium text-[16px] text-black hover:text-[#006AFF] transition">
                    {user.nickname || user.name || user.email.split('@')[0]}
                  </span>

                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </button>

                {/* 드롭다운 메뉴 */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-b-lg shadow-lg border border-gray-200 py-2 z-50 translate-y-[4px]">
                    {/* 사용자 정보 */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-[16px] text-black translate-y-[-4px]">
                        {user.nickname || user.name}
                      </p>
                      <p className="font-normal text-[14px] text-gray-500">
                        {user.email}
                      </p>
                    </div>

                    {/* 메뉴 아이템 */}
                    {/* <Link
                      to="/myPage/MyInfo"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      내 정보
                    </Link>
                    <Link
                      to="/myPage/Resume"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      이력서 관리
                    </Link>
                    <Link
                      to="/myPage/AppliedNotices"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      지원 현황
                    </Link>

                    {user.role === 'ROLE_ADMIN' && (
                      <>
                        <hr className="my-2 border-gray-100" />
                        <Link
                          to="/admin"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition"
                        >
                          관리자 페이지
                        </Link>
                      </>
                    )} */}
                    <Link
                      to="/myPage/MyInfo"
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 font-normal text-[14px] text-black hover:text-[#006AFF] transition translate-y-[5px]"
                    >
                      마이페이지
                    </Link>

                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="block px-4 py-2 font-normal text-[14px] text-sm text-red-600 hover:text-red transition cursor-pointer"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // 로그인 안된 상태
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <Link to="/login" className="font-light text-[16px] text-black hover:text-[#006AFF] transition">
                  로그인
                </Link>
                <span className="text-gray-300 mb-[3px]">|</span>
                <Link to="/signup" className="font-light text-[16px] text-black hover:text-[#006AFF] transition">
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
