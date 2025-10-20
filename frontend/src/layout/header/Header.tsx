import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-10">
          {/* 로고 */}
          <Link to="/">
          <img src="/HIREHUB_LOGO.PNG" alt="HireHub Logo" className="h-10"/>
          </Link>

          {/* 네비게이션 메뉴 */}
          <nav className="hidden md:flex space-x-8 text-gray-800 font-medium text-sm">
            <Link to="/jobs">채용정보</Link>
            <Link to="/board">자유게시판</Link>
            <Link to="/myPage">마이페이지</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          {/* 검색창 */}
          <div className="relative">
            <input
              type="text"
              className="border border-gray-300 rounded-full px-4 py-1.5 pr-9 text-sm focus:outline-none focus:border-blue-500 w-64"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 absolute right-3 top-2.5" />
          </div>

          {/* 로그인 / 회원가입 */}
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <Link to="/login" className="hover:text-blue-500">
              로그인
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/signup" className="hover:text-blue-500">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
