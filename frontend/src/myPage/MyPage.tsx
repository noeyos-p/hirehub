import React from "react";
import { useNavigate, useParams, Routes, Route } from "react-router-dom";
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

const tabs = [
  { key: "MyInfo", label: "내 정보", component: <MyInfo /> },
  { key: "Resume", label: "이력서 관리", component: <Resume /> },
  { key: "FavoriteNotices", label: "관심 공고", component: <FavoriteNotices /> },
  { key: "FavoriteCompanies", label: "관심 회사", component: <FavoriteCompanies /> },
  { key: "AppliedNotices", label: "지원 내역", component: <AppliedNotices /> },
  { key: "MyPosts", label: "작성한 게시물", component: <MyPosts /> },
  { key: "SchedulePage", label: "공고 일정", component: <SchedulePage /> },
];

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab = tab || "MyInfo";
  const activeComponent = tabs.find((t) => t.key === activeTab)?.component || <MyInfo />;

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

        {/* 모바일 상단 탭 (가로 스크롤) */}
        <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex px-4 py-3 space-x-4">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => navigate(`/myPage/${t.key}`)}
                className={`text-sm font-medium transition-colors pb-1 border-b-2 ${activeTab === t.key
                  ? "text-[#006AFF] border-[#006AFF]"
                  : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
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

          {/* 탈퇴하기 버튼 - 하단에 여백을 두고 위치 (내 정보 탭에서만 표시) */}
          {activeTab === "MyInfo" && (
            <button
              onClick={handleWithdraw}
              className="text-red-500 text-sm xl:text-[16px] hover:text-red-600 transition text-left mt-112"
            >
              탈퇴하기
            </button>
          )}
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

          {/* 모바일 탈퇴하기 버튼 (최하단 배치, 내 정보 탭에서만 표시) */}
          {activeTab === "MyInfo" && (
            <div className="md:hidden mt-8 mb-4 flex justify-center">
              <button
                onClick={handleWithdraw}
                className="text-sm font-medium text-red-500 underline decoration-red-500/30 underline-offset-4"
              >
                회원 탈퇴하기
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyPage;