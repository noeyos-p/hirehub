import React, { useState, useEffect } from "react";
import { PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import api from "../../api/api";

interface User {
  id: number;
  name: string;
  nickname: string;
  email: string;
  role: string;
  createdAt: string;
}

interface PageInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 신규 등록 모달
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    nickname: "",
    role: "USER"
  });

  // 수정 모달
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const pageSize = 10;

  // ✅ 유저 목록 불러오기
  const fetchUsers = async (page: number = 0) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/admin/user-management", {
        params: {
          page,
          size: pageSize,
          sortBy: "id",
          direction: "DESC"
        }
      });

      if (response.data.success) {
        setUsers(response.data.data);
        setPageInfo({
          totalElements: response.data.totalElements,
          totalPages: response.data.totalPages,
          currentPage: response.data.currentPage,
        });
        setCurrentPage(page);
      }
    } catch (err: any) {
      console.error("❌ 유저 목록 조회 실패:", err);
      setError(err.response?.data?.message || "유저 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(0);
  }, []);

  // ✅ 검색 필터
  const filteredUsers = users.filter(
    (user) =>
      user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ 신규 등록
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post("/api/admin/user-management", newUser);

      if (response.data.success) {
        alert("유저 등록 완료!");
        setIsCreateModalOpen(false);
        setNewUser({
          email: "",
          password: "",
          name: "",
          nickname: "",
          role: "USER"
        });
        fetchUsers(0);
      }
    } catch (err: any) {
      console.error("❌ 유저 등록 실패:", err);
      alert(err.response?.data?.message || "유저 등록에 실패했습니다.");
    }
  };

  // ✅ 수정 모달 열기
  const handleEditClick = (user: User) => {
    setEditUser({ ...user });
    setIsEditModalOpen(true);
  };

  // ✅ 수정 제출
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      const response = await api.put(`/api/admin/user-management/${editUser.id}`, {
        name: editUser.name,
        nickname: editUser.nickname,
        email: editUser.email,
        role: editUser.role
      });

      if (response.data.success) {
        alert("수정 완료!");
        setIsEditModalOpen(false);
        fetchUsers(currentPage);
      }
    } catch (err: any) {
      console.error("❌ 수정 실패:", err);
      alert(err.response?.data?.message || "수정에 실패했습니다.");
    }
  };

  // ✅ 유저 삭제
  const handleDelete = async (id: number) => {
    if (!window.confirm("정말 이 유저를 삭제하시겠습니까?")) return;

    try {
      const response = await api.delete(`/api/admin/user-management/${id}`);

      if (response.data.success) {
        alert("삭제되었습니다.");

        // 현재 페이지에 데이터가 1개만 남았고, 첫 페이지가 아니면 이전 페이지로
        if (users.length === 1 && currentPage > 0) {
          fetchUsers(currentPage - 1);
        } else {
          fetchUsers(currentPage);
        }
      }
    } catch (err: any) {
      console.error("❌ 삭제 실패:", err);
      alert(err.response?.data?.message || "유저 삭제 중 오류가 발생했습니다.");
    }
  };

  // ✅ 페이지 변경
  const handlePageChange = (page: number) => {
    fetchUsers(page);
  };

  // ✅ 페이지네이션 렌더링
  const renderPagination = () => {
    const { totalPages } = pageInfo;
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>

        {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-4 py-2 rounded-lg border transition-colors ${currentPage === page
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
          >
            {page + 1}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
    );
  };

  return (
    <div className="p-8">
      {/* 상단 타이틀 + 검색 + 신규 버튼 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">유저 관리</h2>

        <div className="flex items-center gap-4">
          {/* 검색창 */}
          <div className="flex items-center border border-gray-300 rounded-full px-3 py-1 w-64">
            <input
              type="text"
              placeholder="이름 또는 이메일 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* 신규 버튼 */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-200"
          >
            신규
          </button>
        </div>
      </div>

      {/* 상태 표시 */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">로딩 중...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 유저 목록 */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex justify-between items-center border border-gray-100 bg-white rounded-md px-4 py-3 hover:bg-gray-50 transition"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-800">
                    {user.nickname}
                  </div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {user.role}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <PencilIcon
                    className="w-5 h-5 text-gray-400 hover:text-gray-700 cursor-pointer"
                    onClick={() => handleEditClick(user)}
                  />
                  <TrashIcon
                    className="w-5 h-5 text-gray-400 hover:text-red-500 cursor-pointer"
                    onClick={() => handleDelete(user.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {renderPagination()}
        </>
      )}

      {/* 신규 등록 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">신규 유저 등록</h3>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">이메일 *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">비밀번호 *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">이름 *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">닉네임 *</label>
                <input
                  type="text"
                  value={newUser.nickname}
                  onChange={(e) => setNewUser({ ...newUser, nickname: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">역할</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {isEditModalOpen && editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">유저 정보 수정</h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <input
                  type="email"
                  value={editUser.email}
                  readOnly  // ✅ 수정 불가
                  className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">이름</label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">닉네임</label>
                <input
                  type="text"
                  value={editUser.nickname}
                  onChange={(e) => setEditUser({ ...editUser, nickname: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">역할</label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;