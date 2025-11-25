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


  useEffect(() => {
    console.log("🧩 Header 렌더링됨, 현재 user:", user);
    if (user) console.log("🧩 user 내부 구조:", JSON.stringify(user, null, 2));
  }, [user]);

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
    window.dispatchEvent(new Event('userLogout'));
    logout();
    setShowDropdown(false);
    navigate('/login');
  };

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
      <div className="w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px] flex items-center justify-between py-3">
        <div className="flex items-center space-x-4 sm:space-x-6 md:space-x-8 lg:space-x-10 min-w-0">
          {/* 로고 */}
          <Link to="/" className="flex-shrink-0">
            <img
              src="/HIREHUB_LOGO.PNG"
              alt="HireHub Logo"
              className="w-[90px] sm:w-[100px] md:w-[110px] lg:w-[117px] h-auto object-contain"
            />
          </Link>

          {/* 네비게이션 메뉴 */}
          <nav className="hidden sm:flex space-x-3 md:space-x-4 lg:space-x-6 xl:space-x-8 text-gray-800 font-medium">
            <Link
              to="/jobPostings"
              className="inline-block whitespace-nowrap font-bord text-xs sm:text-sm md:text-[15px] lg:text-[16px] text-black hover:text-[#006AFF] transition"
            >
              채용정보
            </Link>

            <Link to="/board"
              className="inline-block whitespace-nowrap font-bord text-xs sm:text-sm md:text-[15px] lg:text-[16px] text-black hover:text-[#006AFF] transition">
              자유게시판
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 lg:space-x-4 xl:space-x-6 min-w-0">
          {/* 검색창 */}
          <div className="relative hidden sm:block min-w-0">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="어떤 공고를 찾으세요?"
              className="w-[120px] sm:w-[140px] md:w-[200px] lg:w-[280px] xl:w-[400px] h-[36px] md:h-[38px] lg:h-[41px] border border-gray-400 rounded-[10px] px-2 sm:px-3 md:px-4 py-1.5 pr-8 text-xs md:text-sm focus:outline-none focus:border-[#006AFF] transition-all"
            />
            <button onClick={handleSearch}>
              <MagnifyingGlassIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500 absolute right-2 md:right-3 top-2 md:top-2.5 cursor-pointer hover:text-blue-500 transition" />
            </button>
          </div>

          {/* 로그인/프로필 영역 */}
          <div className="flex items-center flex-shrink-0">
            {loading ? (
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-1 md:space-x-2 hover:bg-gray-50 rounded-lg px-2 md:px-3 py-1.5 md:py-2 transition"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <UserCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <span className="hidden sm:inline-block font-medium text-sm md:text-[15px] lg:text-[16px] text-black hover:text-[#006AFF] transition truncate max-w-[80px] md:max-w-[120px]">
                    {user.nickname || user.name || user.email.split('@')[0]}
                  </span>
                  <ChevronDownIcon className="hidden sm:block w-3 h-3 md:w-4 md:h-4 text-gray-500 flex-shrink-0" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-b-lg shadow-lg border border-gray-200 py-2 z-50 translate-y-[4px]">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-[16px] text-black translate-y-[-4px]">
                        {user.nickname || user.name}
                      </p>
                      <p className="font-normal text-[14px] text-gray-500">
                        {user.email}
                      </p>
                    </div>

                    {/* ✅ 관리자와 일반 사용자 구분 */}
                    {user?.email === "admin@admin" ? (
                      <Link
                        to="/admin"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2 font-normal text-[14px] text-black hover:text-[#006AFF] transition translate-y-[5px]"
                      >
                        관리자 페이지
                      </Link>
                    ) : (
                      <Link
                        to="/myPage/MyInfo"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2 font-normal text-[14px] text-black hover:text-[#006AFF] transition translate-y-[5px]"
                      >
                        마이페이지
                      </Link>
                    )}

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
              <div className="flex items-center space-x-1.5 md:space-x-2 text-sm text-gray-700">
                <Link to="/login" className="font-light text-sm md:text-[15px] lg:text-[16px] text-black hover:text-[#006AFF] transition whitespace-nowrap">
                  로그인
                </Link>
                <span className="text-gray-300 mb-[3px]">|</span>
                <Link to="/signup" className="font-light text-sm md:text-[15px] lg:text-[16px] text-black hover:text-[#006AFF] transition whitespace-nowrap">
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
