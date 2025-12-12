import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import JobManagement from "./adminComponents/JobManagement";
import UserManagement from "./adminComponents/UserManagement";
import CompanyManagement from "./adminComponents/CompanyManagement";
import AdsManagement from "./adminComponents/AdsManagement";
import BoardManagement from "./adminComponents/BoardManagement";
import CommentManagement from "./adminComponents/CommentManagement";
import ReviewManagement from "./adminComponents/ReviewManagement";
import ResumeManagement from "./adminComponents/ResumeManagement";
import LiveSupport from "./adminComponents/LiveSupport"; // ✅ 추가
// ⭐⭐⭐ 신규 결제 관리 컴포넌트 임포트
import AdminPaymentManagement from "./adminComponents/AdminPaymentManagement";
import AdminMobileBottomNav from "./adminComponents/AdminMobileBottomNav"; // ✅ 추가

const menuItems = [
  { name: "공고 관리", path: "job-management" },
  { name: "유저 관리", path: "user-management" },
  { name: "기업 관리", path: "company-management" },
  { name: "광고 관리", path: "ads-management" },
  { name: "댓글 관리", path: "comment-management" },
  { name: "리뷰 관리", path: "review-management" },
  { name: "게시판 관리", path: "board-management" },
  { name: "이력서 관리", path: "resume-management" },
  { name: "실시간 상담", path: "live-support" },
  { name: "결제 관리", path: "payment-management" }

];

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab = tab || "job-management";

  return (
    <div className="max-w-[1440px] mx-auto px-0 md:px-8 lg:px-12 xl:px-[55px]">
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 md:bg-white shadow-none md:shadow-sm rounded-none md:rounded-lg">

        {/* ✅ 모바일 하단 네비게이션 추가 */}
        <AdminMobileBottomNav />

        {/* 모바일 상단 탭 (가로 스크롤) - 유지하되 필요 시 삭제 가능 */}
        <div className="hidden md:hidden bg-white border-b border-gray-200 sticky top-0 z-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex px-4 py-3 space-x-4">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(`/admin/${item.path}`)}
                className={`text-sm font-medium transition-colors pb-1 border-b-2 ${activeTab === item.path
                    ? "text-[#006AFF] border-[#006AFF]"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* 좌측 탭 - 태블릿부터 표시 */}
        <aside className="hidden md:block w-[200px] xl:w-[250px] border-r border-gray-200 pt-6 xl:pt-[44px] pb-6 xl:pb-[44px] pl-6 xl:pl-[44px] bg-white flex-shrink-0 flex flex-col">
          <ul className="space-y-4 xl:space-y-6">
            {menuItems.map((item) => (
              <li
                key={item.path}
                onClick={() => navigate(`/admin/${item.path}`)}
                className={`text-sm xl:text-[16px] cursor-pointer mb-4 xl:mb-[32px] hover:text-[#006AFF] transition
    ${activeTab === item.path ? "font-semibold text-black" : "text-gray-500"}
  `}
              >
                {item.name}
              </li>
            ))}
          </ul>
        </aside>

        {/* 본문 */}
        <main className="flex-1 bg-gray-50 p-4 sm:p-5 md:p-6 flex flex-col">
          <div className="flex-1">
            {activeTab === "job-management" && <JobManagement />}
            {activeTab === "user-management" && <UserManagement />}
            {activeTab === "company-management" && <CompanyManagement />}
            {activeTab === "ads-management" && <AdsManagement />}
            {activeTab === "comment-management" && <CommentManagement />}
            {activeTab === "review-management" && <ReviewManagement />}
            {activeTab === "board-management" && <BoardManagement />}
            {activeTab === "resume-management" && <ResumeManagement />}
            {activeTab === "live-support" && <LiveSupport />}
            {activeTab === "payment-management" && <AdminPaymentManagement />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
