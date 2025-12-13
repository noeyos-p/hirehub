import React, { useState } from "react";
import { useNavigate, useParams, Routes, Route } from "react-router-dom";
import { Bars3Icon, XMarkIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import MyInfo from "./myPageComponents/MyInfo";
import FavoriteNotices from "./myPageComponents/FavoriteNotices";
import AppliedNotices from "./myPageComponents/AppliedNotices";
import Resume from "./myPageComponents/Resume";
import ResumeDetail from "./myPageComponents/ResumeDetail";
import MyPosts from "./myPageComponents/MyPosts";
import FavoriteCompanies from "./myPageComponents/FavoriteCompanies";
import SchedulePage from "./myPageComponents/SchedulePage";
import EditMyPost from "./myPageComponents/EditMyPost";
import { myPageApi } from "../api/myPageApi";
import MyPageTokenPayment from "./myPageComponents/MyPageTokenPayment";
import MyPagePaymentHistory from "./myPageComponents/MyPagePaymentHistory";

const tabs = [
  { key: "MyInfo", label: "내 정보", component: <MyInfo /> },
  { key: "Resume", label: "이력서 관리", component: <Resume /> },
  { key: "FavoriteNotices", label: "관심 공고", component: <FavoriteNotices /> },
  { key: "FavoriteCompanies", label: "관심 회사", component: <FavoriteCompanies /> },
  { key: "AppliedNotices", label: "지원 내역", component: <AppliedNotices /> },
  { key: "MyPosts", label: "작성한 게시물", component: <MyPosts /> },
  { key: "SchedulePage", label: "공고 일정", component: <SchedulePage /> },
{ key: "MyPageTokenPayment", label: "토큰 결제", component: <MyPageTokenPayment /> },
{ key: "MyPagePaymentHistory", label: "결제 내역", component: <MyPagePaymentHistory /> },

];

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab = tab || "MyInfo";
  const activeComponent = tabs.find((t) => t.key === activeTab)?.component || <MyInfo />;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleWithdraw = async () => {
    if (!window.confirm("정말 탈퇴하시겠습니까? 모든 데이터가 완전히 삭제됩니다.")) return;
    try {
      await myPageApi.withdraw();
      alert("회원 탈퇴가 완료되었습니다.");
      localStorage.clear();
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-0 md:px-8 lg:px-12 xl:px-[55px]">
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 md:bg-white shadow-none md:shadow-sm rounded-none md:rounded-lg">

        {/* 모바일 플로팅 메뉴 (우측 하단 고정) */}
        <div className="md:hidden fixed bottom-20 right-6 z-50 flex flex-col items-end">
          {/* 메뉴 리스트 (위로 펼쳐짐) */}
          <div
            className={`transition-all duration-300 origin-bottom-right ${isMobileMenuOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4 pointer-events-none"
              } absolute bottom-20 right-0 bg-gray-100 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden min-w-[200px]`}
          >
            <div className="py-2 flex flex-col">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    navigate(`/myPage/${t.key}`);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left px-5 py-3 text-sm font-medium transition-colors hover:bg-gray-200 ${activeTab === t.key
                    ? "text-[#006AFF] bg-blue-50"
                    : "text-gray-700"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 플로팅 버튼 */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-blue-200 text-gray-700 p-4 rounded-full shadow-lg hover:bg-blue-300 transition-transform active:scale-95 flex items-center justify-center border border-gray-200"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Squares2X2Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* 좌측 탭 - 태블릿부터 표시 */}
        <aside className="hidden md:block w-[200px] xl:w-[250px] border-r border-gray-200 pt-6 xl:pt-[44px] pb-6 xl:pb-[44px] pl-6 xl:pl-[44px] bg-white flex-shrink-0 flex flex-col">
          <ul className="space-y-4 xl:space-y-6">
            {tabs.map((t) => (
              <li
                key={t.key}
                onClick={() => navigate(`/myPage/${t.key}`)}
                className={`text-sm xl:text-[16px] cursor-pointer mb-4 xl:mb-[32px] hover:text-[#006AFF] transition
    ${activeTab === t.key ? "font-semibold text-black" : "text-gray-500"}
  `}
              >
                {t.label}
              </li>

            ))}
          </ul>
        </aside>

        {/* 본문 */}
        <main className="flex-1 bg-gray-50 p-4 sm:p-5 md:p-6 flex flex-col">
          <div className="flex-1">
            <Routes>
              {/* ✅ 인덱스 라우트로 현재 탭 본문 렌더 */}
              <Route index element={activeComponent} />
              {/* 이력서 상세 */}
              <Route path="ResumeDetail" element={<ResumeDetail />} />
              {/* ✅ 마이페이지 내부 게시글 수정 라우트 */}
              <Route path="edit/:id" element={<EditMyPost />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyPage;