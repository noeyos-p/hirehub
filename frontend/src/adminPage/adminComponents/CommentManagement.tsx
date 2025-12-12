import React, { useState, useEffect } from "react";
import { TrashIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { adminApi } from '../../api/adminApi';
import type { AdminComment } from '../../types/interface';

const CommentManagement: React.FC = () => {
  const [comments, setComments] = useState<AdminComment[]>([]);
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
  const [editingComment, setEditingComment] = useState<AdminComment | null>(null);
  const [editContent, setEditContent] = useState("");

  // 댓글 목록 불러오기
  const fetchComments = async (page: number = 0) => {
    setIsLoading(true);
    setError("");

    try {
      // 인증 정보 확인
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');

      if (!token) {
        setError('로그인이 필요합니다.');
        return;
      }

      if (role !== 'ADMIN') {
        setError('관리자 권한이 필요합니다.');
        return;
      }

      const res = await adminApi.getComments({
        page: page,
        size: pageSize,
        sortBy: 'id',
        direction: 'DESC'
      });

      console.log('📦 댓글 목록 응답:', res);

      if (res.success) {
        const commentsData = res.data || [];
        setComments(commentsData);
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.totalElements || 0);
        setCurrentPage(page);
      } else {
        setError(res.message || '댓글 목록을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('❌ 댓글 목록 조회 에러:', err);
      setError(err.message || '댓글 목록을 불러오는데 실패했습니다.');
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
      const res = await adminApi.deleteComment(commentId);

      console.log('📦 댓글 삭제 응답:', res);

      if (res.success) {
        // 현재 페이지 새로고침
        fetchComments(currentPage);

        // 성공 메시지
        const message = res.deletedRepliesCount > 0
          ? `댓글이 삭제되었습니다. (답글 ${res.deletedRepliesCount}개도 함께 삭제됨)`
          : '댓글이 삭제되었습니다.';
        alert(message);
      } else {
        alert(res.message || '댓글 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('❌ 댓글 삭제 에러:', err.message);
      alert(err.message || '댓글 삭제에 실패했습니다.');
    }
  };

  // 댓글 수정 모달 열기
  const handleEdit = (comment: AdminComment) => {
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
      const res = await adminApi.updateComment(editingComment.id, {
        content: editContent,
        updateAt: new Date().toISOString()
      });

      console.log('📦 댓글 수정 응답:', res);

      if (res.success) {
        // 모달 닫기
        setIsEditModalOpen(false);
        setEditingComment(null);
        setEditContent('');

        // 현재 페이지 새로고침
        fetchComments(currentPage);

        alert('댓글이 수정되었습니다.');
      } else {
        alert(res.message || '댓글 수정에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('❌ 댓글 수정 에러:', err.message);
      alert(err.message || '댓글 수정에 실패했습니다.');
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
    (comment.nickname || '').includes(searchQuery) ||
    (comment.content || '').includes(searchQuery)
  );

  // 페이지네이션 버튼 생성
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="mt-8 flex items-center justify-center gap-2 mb-[12px]">
        <button
          onClick={() => handlePageChange(0)}
          disabled={currentPage === 0}
          className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronDoubleLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        {(() => {
          const pages = [];
          const maxVisible = 5;
          let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
          let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
          if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(0, endPage - maxVisible + 1);
          }
          for (let i = startPage; i <= endPage; i++) {
            pages.push(
              <button
                key={i}
                onClick={() => handlePageChange(i)}
                className={`w-10 h-10 flex items-center justify-center rounded-md text-base transition border font-medium ${currentPage === i
                  ? 'bg-white text-[#006AFF] border-[#006AFF]'
                  : 'bg-white text-gray-700 border-gray-300 hover:text-[#006AFF]'
                  }`}
              >
                {i + 1}
              </button>
            );
          }
          return pages;
        })()}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => handlePageChange(totalPages - 1)}
          disabled={currentPage === totalPages - 1}
          className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronDoubleRightIcon className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8">
      {/* 상단 타이틀 + 새로고침 버튼 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">댓글 관리</h2>
        <button
          onClick={() => fetchComments(currentPage)}
          className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-200 transition"
        >
          새로고침
        </button>
      </div>

      {/* ✅ 전체선택 + 선택삭제 영역 */}
      <div className="flex items-center gap-3 mb-4 min-h-[36px]">
        <label className="relative flex items-center gap-2 cursor-pointer group flex-shrink-0">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="sr-only peer"
          />
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${allSelected
              ? 'bg-blue-600 border-blue-600'
              : 'bg-white border-gray-300 group-hover:border-blue-400'
            }`}>
            {allSelected && (
              <svg className="w-3.5 h-3.5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 flex-shrink-0">전체 선택</span>
        </label>

        {selectedIds.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm(`${selectedIds.length}개의 댓글을 삭제하시겠습니까?`)) {
                selectedIds.forEach(id => handleDelete(id));
                setSelectedIds([]);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex-shrink-0"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            선택삭제 ({selectedIds.length})
          </button>
        )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`relative flex items-center border border-gray-100 bg-white rounded-md px-4 py-3 hover:bg-gray-50 transition ${selectedIds.includes(comment.id) ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    }`}
                >
                  {/* ✅ 개별 선택 체크박스 */}
                  <div
                    className="absolute top-3 right-3 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label className="relative flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(comment.id)}
                        onChange={() => toggleSelect(comment.id)}
                        className="sr-only peer"
                      />
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.includes(comment.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300 hover:border-blue-400'
                        }`}>
                        {selectedIds.includes(comment.id) && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </label>
                  </div>
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
                  <div className="flex space-x-3 ml-3 mr-8">
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
      {!isLoading && !searchQuery && totalPages > 1 && renderPagination()}

      {/* 검색창 */}
      <div className="flex justify-end mt-6">
        <div className="flex items-center border border-gray-300 rounded-full px-3 py-1 w-full md:w-64">
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