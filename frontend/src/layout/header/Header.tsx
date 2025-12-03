import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, UserCircleIcon, ChevronDownIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);


  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("🧩 Header 렌더링됨, 현재 user:", user);
    if (user) console.log("🧩 user 내부 구조:", JSON.stringify(user, null, 2));
  }, [user]);

  // 드롭다운 및 모바일 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    window.dispatchEvent(new Event('userLogout'));
    logout();
    setShowDropdown(false);
    setShowMobileMenu(false);
    navigate('/login');
  };

  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      alert('검색어를 입력해주세요.');
      return;
    }
    navigate(`/jobPostings?search=${encodeURIComponent(searchKeyword)}`, { replace: true });
    setSearchKeyword('');
    setShowMobileMenu(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showMobileSearch && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [showMobileSearch]);

  const handleMobileSearch = () => {
    if (!searchKeyword.trim()) {
      alert('검색어를 입력해주세요.');
      return;
    }
    navigate(`/jobPostings?search=${encodeURIComponent(searchKeyword)}`, { replace: true });
    setSearchKeyword('');
    setShowMobileSearch(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 flex justify-center">
      <div className="w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px] flex items-center justify-between py-3 relative">

        {/* 모바일/태블릿 검색바 (펼쳐지는 애니메이션) */}
        <div
          className={`lg:hidden absolute top-0 right-12 md:right-0 h-full bg-white flex items-center transition-all duration-300 ease-in-out z-50 ${showMobileSearch ? 'w-[calc(100%-150px)] md:w-[calc(100%-110px)] px-4 border-b border-gray-200' : 'w-0 px-0 overflow-hidden'
            }`}
        >
          <div className="flex-1 relative">
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleMobileSearch()}
              placeholder="공고 검색..."
              className="w-full h-[38px] bg-gray-50 border border-gray-300 rounded-lg px-4 py-1.5 pr-10 text-sm focus:outline-none focus:border-[#006AFF] transition-all"
            />
            <button
              onClick={handleMobileSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            >
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <button
            onClick={() => setShowMobileSearch(false)}
            className="ml-3 p-1 text-gray-500 hover:text-gray-800 whitespace-nowrap text-sm font-medium"
          >
            취소
          </button>
        </div>

        <div className="flex items-center space-x-4 sm:space-x-6 md:space-x-8 lg:space-x-10 min-w-0">
          {/* 로고 */}
          <Link to="/" className="flex-shrink-0">
            <img
              src="/HIREHUB_LOGO.PNG"
              alt="HireHub Logo"
              className="w-[90px] sm:w-[100px] md:w-[110px] lg:w-[117px] h-auto object-contain"
            />
          </Link>

          {/* 네비게이션 메뉴 (데스크톱) */}
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

            <Link to="/cover-letter"
              className="inline-block whitespace-nowrap font-bord text-xs sm:text-sm md:text-[15px] lg:text-[16px] text-black hover:text-[#006AFF] transition">
              자소서 수정
            </Link>

            <Link to="/job-matching"
              className="inline-block whitespace-nowrap font-bord text-xs sm:text-sm md:text-[15px] lg:text-[16px] text-black hover:text-[#006AFF] transition">
              공고매칭
            </Link>

            <Link to="/interview-coaching"
              className="inline-block whitespace-nowrap font-bord text-xs sm:text-sm md:text-[15px] lg:text-[16px] text-black hover:text-[#006AFF] transition">
              면접코칭
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4 xl:space-x-6 min-w-0">
          {/* 데스크톱 검색창 (lg 이상에서만 표시) */}
          <div className="relative hidden lg:block min-w-0">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="어떤 공고를 찾으세요?"
              className="w-[200px] lg:w-[280px] xl:w-[400px] h-[38px] lg:h-[41px] border border-gray-400 rounded-[10px] px-4 py-1.5 pr-10 text-sm focus:outline-none focus:border-[#006AFF] transition-all"
            />
            <button onClick={handleSearch}>
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 absolute right-3 top-2.5 cursor-pointer hover:text-blue-500 transition" />
            </button>
          </div>

          {/* 태블릿용 검색 아이콘 (md ~ lg 사이) */}
          <button
            className="hidden md:block lg:hidden p-1"
            onClick={() => setShowMobileSearch(true)}
          >
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 hover:text-[#006AFF] transition" />
          </button>

          {/* 모바일 로그인/메뉴 버튼 */}
          <div className="md:hidden flex items-center space-x-3" ref={mobileMenuRef}>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="text-sm font-medium text-gray-700 hover:text-[#006AFF] transition whitespace-nowrap px-4 py-1.5 border border-gray-300 rounded-md"
              >
                로그인
              </Link>
            )}
            {/* 검색 아이콘 (클릭 시 검색바 펼침) */}
            <button className="p-1" onClick={() => setShowMobileSearch(true)}>
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-700" />
            </button>
            <button className="p-1" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <Bars3Icon className="w-6 h-6 text-gray-700" />
            </button>

            {/* 모바일 햄버거 메뉴 드롭다운 */}
            {showMobileMenu && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 overflow-hidden">
                {/* 사용자 정보 영역 */}
                {isAuthenticated && user && (
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <UserCircleIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">
                          {user.nickname || user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {user.email === "admin@admin" ? (
                        <Link
                          to="/admin"
                          onClick={() => setShowMobileMenu(false)}
                          className="flex-1 text-center py-1.5 text-xs font-medium bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-700"
                        >
                          관리자
                        </Link>
                      ) : (
                        <Link
                          to="/myPage/MyInfo"
                          onClick={() => setShowMobileMenu(false)}
                          className="flex-1 text-center py-1.5 text-xs font-medium bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-700"
                        >
                          마이페이지
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex-1 text-center py-1.5 text-xs font-medium bg-white border border-gray-200 rounded hover:bg-red-50 text-red-600"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}

                {/* 비로그인 시 로그인/회원가입 버튼 */}
                {!isAuthenticated && (
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex gap-2">
                      <Link
                        to="/login"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex-1 text-center py-2 text-sm font-medium bg-[#006AFF] text-white rounded hover:bg-blue-600"
                      >
                        로그인
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex-1 text-center py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                      >
                        회원가입
                      </Link>
                    </div>
                  </div>
                )}

                {/* 네비게이션 링크 */}
                <div className="py-2">
                  <Link
                    to="/jobPostings"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#006AFF]"
                  >
                    채용정보
                  </Link>
                  <Link
                    to="/board"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#006AFF]"
                  >
                    자유게시판
                  </Link>
                  <Link
                    to="/cover-letter"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#006AFF]"
                  >
                    자소서 수정
                  </Link>
                  <Link
                    to="/job-matching"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#006AFF]"
                  >
                    공고매칭
                  </Link>
                  <Link
                    to="/interview-coaching"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#006AFF]"
                  >
                    면접코칭
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 데스크톱 로그인/프로필 영역 */}
          <div className="hidden md:flex items-center flex-shrink-0">
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
