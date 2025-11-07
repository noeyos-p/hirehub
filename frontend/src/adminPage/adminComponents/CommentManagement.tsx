import React, { useState, useEffect } from "react";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import api from '../../api/api';

interface Comment {
  id: number;
  content: string;
  usersId: number | null;
  nickname: string | null;
  boardId: number | null;
  boardTitle?: string | null;
  parentCommentId: number | null;
  parentCommentContent?: string | null;
  createAt: string;
  updateAt: string | null;
}

const CommentManagement: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  // ✅ 선택 상태 추가
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allSelected = comments.length > 0 && selectedIds.length === comments.length;

  // ✅ 선택 토글 함수
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ✅ 전체 선택 / 해제
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(comments.map((c) => c.id));
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState("");

  // 댓글 목록 불러오기
  const fetchComments = async (page: number = 0) => {
    setIsLoading(true);
    setError("");

    try {
      // 인증 정보 확인
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');

      console.log('🔑 인증 정보 확인:');
      console.log('- Token:', token ? '있음' : '없음');
      console.log('- Role:', role);

      if (!token) {
        setError('로그인이 필요합니다.');
        return;
      }

      if (role !== 'ADMIN') {
        setError('관리자 권한이 필요합니다.');
        return;
      }

      const response = await api.get('/api/admin/comments', {
        params: {
          page: page,
          size: pageSize,
          sortBy: 'id',
          direction: 'DESC'
        }
      });

      console.log('📦 댓글 목록 응답:', response.data);

      if (response.data.success) {
        const commentsData = response.data.data || [];

        // 🔍 첫 번째 댓글 상세 로그
        if (commentsData.length > 0) {
          console.log("=== 첫 번째 댓글 상세 정보 ===");
          console.log("전체 객체:", commentsData[0]);
          console.log("ID:", commentsData[0].id);
          console.log("nickname:", commentsData[0].nickname);
          console.log("usersId:", commentsData[0].usersId);
          console.log("content:", commentsData[0].content);
          console.log("================================");
        }
        setComments(commentsData);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
        setCurrentPage(page);
        console.log(`✅ 총 ${response.data.totalElements}개의 댓글 중 ${response.data.data?.length}개 조회 완료`);
      } else {
        setError(response.data.message || '댓글 목록을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('❌ 댓글 목록 조회 에러:', err);
      console.error('❌ 에러 상세:', err.response?.data);
      console.error('❌ 에러 상태:', err.response?.status);

      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('인증이 필요하거나 권한이 없습니다. 다시 로그인해주세요.');
      } else if (err.response?.status === 500) {
        setError('서버 오류가 발생했습니다. 관리자에게 문의하세요.');
      } else {
        const errorMessage = err.response?.data?.message || '댓글 목록을 불러오는데 실패했습니다.';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 댓글 목록 불러오기
  useEffect(() => {
    fetchComments();
  }, []);

  // 댓글 삭제
  const handleDelete = async (commentId: number) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까? (답글도 함께 삭제됩니다)')) {
      return;
    }

    try {
      const response = await api.delete(`/api/admin/comments/${commentId}`);

      console.log('📦 댓글 삭제 응답:', response.data);

      if (response.data.success) {
        console.log(`✅ 댓글 삭제 성공 - ID: ${commentId}, 삭제된 대댓글: ${response.data.deletedRepliesCount}`);

        // 현재 페이지 새로고침
        fetchComments(currentPage);

        // 성공 메시지
        const message = response.data.deletedRepliesCount > 0
          ? `댓글이 삭제되었습니다. (답글 ${response.data.deletedRepliesCount}개도 함께 삭제됨)`
          : '댓글이 삭제되었습니다.';
        alert(message);
      } else {
        alert(response.data.message || '댓글 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('❌ 댓글 삭제 에러:', err.response?.data);
      const errorMessage = err.response?.data?.message || '댓글 삭제에 실패했습니다.';
      alert(errorMessage);
    }
  };

  // 댓글 수정 모달 열기
  const handleEdit = (comment: Comment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
    setIsEditModalOpen(true);
  };

  // 댓글 수정 저장
  const handleSaveEdit = async () => {
    if (!editingComment) return;

    if (editContent.trim() === '') {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      const response = await api.put(`/api/admin/comments/${editingComment.id}`, {
        content: editContent,
        updateAt: new Date().toISOString()
      });

      console.log('📦 댓글 수정 응답:', response.data);

      if (response.data.success) {
        console.log(`✅ 댓글 수정 성공 - ID: ${editingComment.id}`);

        // 모달 닫기
        setIsEditModalOpen(false);
        setEditingComment(null);
        setEditContent('');

        // 현재 페이지 새로고침
        fetchComments(currentPage);

        alert('댓글이 수정되었습니다.');
      } else {
        alert(response.data.message || '댓글 수정에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('❌ 댓글 수정 에러:', err.response?.data);
      const errorMessage = err.response?.data?.message || '댓글 수정에 실패했습니다.';
      alert(errorMessage);
    }
  };

  // 수정 모달 닫기
  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingComment(null);
    setEditContent('');
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) {
      fetchComments(page);
    }
  };

  // 검색 필터링 (클라이언트 사이드)
  const filteredComments = comments.filter(comment =>
    comment.nickname?.includes(searchQuery) ||
    comment.content?.includes(searchQuery)
  );

  // 페이지네이션 버튼 생성
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    // startPage 조정
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    // 이전 버튼
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className={`px-3 py-1 rounded ${currentPage === 0
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
      >
        &lt;
      </button>
    );

    // 페이지 번호 버튼
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded ${i === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
        >
          {i + 1}
        </button>
      );
    }

    // 다음 버튼
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className={`px-3 py-1 rounded ${currentPage >= totalPages - 1
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
      >
        &gt;
      </button>
    );

    return pages;
  };

  return (
    <div className="p-8">
      {/* 상단 타이틀 + 새로고침 버튼 */}
      <div className="flex justify-between items-center mb-6">
        {/* ✅ 전체선택 + 선택삭제 영역 */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="w-4 h-4 accent-blue-600"
          />
          <span className="text-sm text-gray-700">전체 선택</span>

          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`${selectedIds.length}개의 댓글을 삭제하시겠습니까?`)) {
                  selectedIds.forEach(id => handleDelete(id));
                  setSelectedIds([]);
                }
              }}
              className="ml-3 bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-sm"
            >
              선택 삭제
            </button>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">댓글 관리</h2>
          <p className="text-sm text-gray-500 mt-1">
            총 {totalElements}개의 댓글
          </p>
        </div>
        <button
          onClick={() => fetchComments(currentPage)}
          className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-200 transition"
        >
          새로고침
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      )}

      {/* 2열 그리드 댓글 목록 */}
{!isLoading && (
  <div className="p-4">
    {filteredComments.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        {searchQuery ? "검색 결과가 없습니다." : "댓글이 없습니다."}
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-4">
        {filteredComments.map((comment) => (
          <div
            key={comment.id}
            className="flex items-center border border-gray-100 bg-white rounded-md px-4 py-3 hover:bg-gray-50 transition"
          >
            {/* ✅ 개별 선택 체크박스 */}
            <input
              type="checkbox"
              checked={selectedIds.includes(comment.id)}
              onChange={() => toggleSelect(comment.id)}
              className="w-4 h-4 mr-3 accent-blue-600"
            />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-semibold text-gray-800">
                        {comment.nickname || '알 수 없음'}
                      </div>
                      {comment.parentCommentId && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                          답글
                        </span>
                      )}
                    </div>

                    {/* 답글인 경우 부모 댓글 내용 표시 */}
                    {comment.parentCommentId && (
                      <div className="text-xs text-gray-500 mb-1 pl-2 border-l-2 border-blue-300 bg-blue-50 p-1.5 rounded">
                        <span className="font-medium">↳ </span>
                        {comment.parentCommentContent ? (
                          <span className="line-clamp-1">{comment.parentCommentContent}</span>
                        ) : (
                          <span className="italic">댓글 ID: {comment.parentCommentId}</span>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mb-1">
                      게시글: {comment.boardTitle ? comment.boardTitle : `ID: ${comment.boardId || 'N/A'}`}
                    </div>
                    <div className="text-sm text-gray-700 line-clamp-2 mb-1">{comment.content}</div>
                    <div className="text-xs text-gray-500">
                      작성: {new Date(comment.createAt).toLocaleString('ko-KR')}
                      {comment.updateAt && ` · 수정: ${new Date(comment.updateAt).toLocaleString('ko-KR')}`}
                    </div>
                  </div>
                  <div className="flex space-x-3 ml-3">
                    <PencilIcon
                      onClick={() => handleEdit(comment)}
                      className="w-5 h-5 text-gray-400 hover:text-gray-700 cursor-pointer transition"
                      title="수정"
                    />
                    <TrashIcon
                      onClick={() => handleDelete(comment.id)}
                      className="w-5 h-5 text-gray-400 hover:text-red-500 cursor-pointer transition"
                      title="삭제"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {!isLoading && !searchQuery && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {renderPagination()}
        </div>
      )}

      {/* 검색창 */}
      <div className="flex justify-end mt-6">
        <div className="flex items-center border border-gray-300 rounded-full px-3 py-1 w-64">
          <input
            type="text"
            placeholder="검색"
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
      </div>

      {/* 수정 모달 */}
      {isEditModalOpen && editingComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-4">댓글 수정</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작성자
              </label>
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {editingComment.nickname} (ID: {editingComment.usersId})
              </div>
            </div>

            {editingComment.parentCommentId && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  답글 대상
                </label>
                <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded border-l-2 border-blue-300">
                  {editingComment.parentCommentContent || `댓글 ID: ${editingComment.parentCommentId}`}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                댓글 내용
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="댓글 내용을 입력하세요"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentManagement;