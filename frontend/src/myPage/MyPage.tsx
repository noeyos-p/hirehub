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
import EditMyPost from "./myPageComponents/EditMyPost"; // ✅ 추가

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

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px]">
      <div className="flex min-h-screen bg-white shadow-sm rounded-lg">

        {/* 좌측 탭 */}
        <aside className="hidden lg:block w-[200px] xl:w-[250px] border-r border-gray-200 pt-6 md:pt-8 xl:pt-[44px] pb-6 md:pb-8 xl:pb-[44px] pl-6 md:pl-8 xl:pl-[44px] bg-white">
          <ul className="space-y-4 md:space-y-5 xl:space-y-6">
            {tabs.map((t) => (
              <li
                key={t.key}
                onClick={() => navigate(`/myPage/${t.key}`)}
                className={`text-sm md:text-[15px] xl:text-[16px] cursor-pointer mb-4 md:mb-6 xl:mb-[32px] hover:text-[#006AFF] transition
    ${activeTab === t.key ? "font-semibold text-black" : "text-gray-500"}
  `}
              >
                {t.label}
              </li>

            ))}
          </ul>
        </aside>

        {/* 본문 */}
        <main className="flex-1 bg-gray-50 p-4 sm:p-5 md:p-6">
          <Routes>
            {/* ✅ 인덱스 라우트로 현재 탭 본문 렌더 */}
            <Route index element={activeComponent} />
            {/* 이력서 상세 */}
            <Route path="ResumeDetail" element={<ResumeDetail />} />
            {/* ✅ 마이페이지 내부 게시글 수정 라우트 */}
            <Route path="edit/:id" element={<EditMyPost />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default MyPage;