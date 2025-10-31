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

const menuItems = [
  { name: "공고 관리", path: "job-management" },
  { name: "유저 관리", path: "user-management" },
  { name: "기업 관리", path: "company-management" },
  { name: "광고 관리", path: "ads-management" },
  { name: "댓글 관리", path: "comment-management" },
  { name: "리뷰 관리", path: "review-management" },
  { name: "게시판 관리", path: "board-management" },
  { name: "이력서 관리", path: "resume-management" },
  { name: "실시간 상담", path: "live-support" }, // ✅ 추가
  { name: "로그아웃", path: "logout" },
];

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab = tab || "job-management";

  return (
    <div className="flex min-h-screen">
      {/* 좌측 사이드바 */}
      <aside className="w-48 bg-white border-r border-gray-200 flex flex-col">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              if (item.path === "logout") {
                console.log("로그아웃");
                navigate("/login");
              } else {
                navigate(`/admin/${item.path}`);
              }
            }}
            className={`text-left px-4 py-3 text-sm ${
              activeTab === item.path
                ? "font-semibold text-gray-900 bg-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {item.name}
          </button>
        ))}
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 bg-gray-50">
        {activeTab === "job-management" && <JobManagement />}
        {activeTab === "user-management" && <UserManagement />}
        {activeTab === "company-management" && <CompanyManagement />}
        {activeTab === "ads-management" && <AdsManagement />}
        {activeTab === "comment-management" && <CommentManagement />}
        {activeTab === "review-management" && <ReviewManagement />}
        {activeTab === "board-management" && <BoardManagement />}
        {activeTab === "resume-management" && <ResumeManagement />}
        {activeTab === "live-support" && <LiveSupport />}{/* ✅ 추가 */}
      </main>
    </div>
  );
};

export default AdminLayout;
