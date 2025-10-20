import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

// 탭 이름과 URL 매핑
const menuItems = [
  { name: "공고 관리", path: "job-management" },
  { name: "유저 관리", path: "user-management" },
  { name: "기업 관리", path: "company-management" },
  { name: "광고 관리", path: "ads-management" },
  { name: "게시판 관리", path: "board-management" },
  { name: "로그아웃", path: "logout" },
];

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // URL 기반으로 activeTab 결정
  const pathParts = location.pathname.split("/");
  const activeTabObj = menuItems.find(item => item.path === pathParts[2]) || menuItems[0];

  return (
    <div className="flex">
      {/* 좌측 사이드바 */}
      <aside className="w-48 bg-white border-r border-gray-200 flex flex-col">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              if (item.path === "logout") {
                console.log("로그아웃");
                // 로그아웃 처리 후 원하는 페이지 이동
                navigate("/login");
              } else {
                navigate(`/admin/${item.path}`);
              }
            }}
            className={`text-left px-4 py-3 text-sm ${
              activeTabObj.path === item.path
                ? "font-semibold text-gray-900 bg-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {item.name}
          </button>
        ))}
      </aside>

      {/* 중앙 콘텐츠 영역 */}
      <main className="flex-1 p-8 ">
        {/* 상단 타이틀 + 신규 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">{activeTabObj.name}</h2>
          {activeTabObj.path !== "logout" && (
            <button className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-200">
              신규
            </button>
          )}
        </div>

        {/* 2열 그리드 테이블 */}
        <div className="bg-gray-100 shadow-sm rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(16)].map((_, index) => (
              <div
                key={index}
                className="flex justify-between items-center border bg-white rounded-md px-4 py-3 hover:bg-gray-50 transition"
              >
                <div className="text-sm text-gray-700">항목 {index + 1}</div>
                <div className="flex space-x-3">
                  <PencilIcon className="w-5 h-5 text-gray-400 hover:text-gray-700 cursor-pointer" />
                  <TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500 cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 검색창 */}
        <div className="flex justify-end mt-6">
          <div className="flex items-center border border-gray-300 rounded-full px-3 py-1 w-64">
            <input
              type="text"
              placeholder="검색"
              className="flex-1 text-sm outline-none"
            />
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
