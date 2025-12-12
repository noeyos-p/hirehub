import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { adminApi } from '../../api/adminApi';
import type { AdminPost, AiBoardControl } from '../../types/interface';

interface PostDetailModalProps {
  post: AdminPost | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedPost: AdminPost) => void;
  onDelete: (postId: number) => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (post) {
      setEditedTitle(post.title);
      setEditedContent(post.content);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.updatePost(post.id, {
        title: editedTitle,
        content: editedContent,
      });

      console.log('✅ 게시글 수정 성공:', res);

      if (res.success) {
        onUpdate(res.data);
        setIsEditing(false);
        onClose();
        alert('게시글이 수정되었습니다.');
      } else {
        throw new Error(res.message || '게시글 수정에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('❌ 게시글 수정 에러:', err.message);
      alert(err.message || '게시글 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    setIsLoading(true);
    try {
      const res = await adminApi.deletePost(post.id);

      console.log('✅ 게시글 삭제 성공:', res);

      if (res.success) {
        onDelete(post.id);
        onClose();
        alert('게시글이 삭제되었습니다.');
      } else {
        throw new Error(res.message || '게시글 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('❌ 게시글 삭제 에러:', err.message);
      alert(err.message || '게시글 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            게시글 상세
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="p-6 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              제목
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {post.title}
              </p>
            )}
          </div>

          {/* 작성자 정보 */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>작성자: {post.nickname}</span>
            <span>조회수: {post.views}</span>
            <span>댓글: {post.comments}</span>
          </div>

          {/* 날짜 정보 */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>작성일: {new Date(post.createAt).toLocaleString('ko-KR')}</p>
            {post.updateAt && (
              <p>수정일: {new Date(post.updateAt).toLocaleString('ko-KR')}</p>
            )}
          </div>

          {/* 구분선 */}
          <hr className="border-gray-200 dark:border-gray-700" />

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              내용
            </label>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              />
            ) : (
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {post.content}
              </div>
            )}
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 p-6">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleUpdate}
                disabled={isLoading}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '저장 중...' : '저장'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                삭제
              </button>
              <button
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                수정
              </button>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                닫기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const BoardManagement: React.FC = () => {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  // ✅ 선택 관련 상태
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allSelected = posts.length > 0 && selectedIds.length === posts.length;

  // 🔥 AI 정보글 생성 로딩 상태
  const [isGeneratingAiPost, setIsGeneratingAiPost] = useState(false);

  // ✅ 개별 선택 토글
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ✅ 전체 선택 / 해제
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(posts.map((p) => p.id));
  };

  // ✅ 선택 삭제
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length}개의 게시글을 삭제하시겠습니까?`)) return;

    try {
      for (const id of selectedIds) {
        await adminApi.deletePost(id);
      }
      alert("선택된 게시글이 삭제되었습니다.");
      setSelectedIds([]);
      fetchPosts(currentPage, searchQuery);
    } catch (err: any) {
      console.error("❌ 선택삭제 실패:", err.message);
      alert("선택삭제 중 오류가 발생했습니다.");
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // 게시글 목록 불러오기
  useEffect(() => {
    fetchPosts(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  const fetchPosts = async (page: number = 0, keyword: string = '') => {
    setIsLoading(true);
    try {
      const res = await adminApi.getPosts({
        page,
        size: pageSize,
        sortBy: 'createAt',
        direction: 'DESC',
        keyword
      });

      console.log('📦 전체 응답 데이터:', res);

      // 백엔드 응답 구조 처리
      if (res.success) {
        const postsData = res.data || [];
        const total = res.totalElements || 0;
        const pages = res.totalPages || 0;

        setPosts(postsData);
        setTotalElements(total);
        setTotalPages(pages);
        setCurrentPage(res.currentPage || page);
      } else {
        throw new Error(res.message || '게시글을 불러올 수 없습니다.');
      }

    } catch (err: any) {
      console.error('❌ 게시글 목록 조회 에러:', err.message);
      alert(err.message || '게시글 목록을 불러오는데 실패했습니다.');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 실행
  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(0);
  };

  // 검색어 입력 시 엔터키 처리
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 게시글 상세 조회 (컨트롤러에 상세 조회 API가 없으므로 목록에서 찾기)
  const handlePostClick = async (postId: number) => {
    try {
      // 이미 로드된 목록에서 찾기
      const post = posts.find(p => p.id === postId);
      if (post) {
        setSelectedPost(post);
        setIsModalOpen(true);
      } else {
        alert('게시글을 찾을 수 없습니다.');
      }
    } catch (err: any) {
      console.error('❌ 게시글 조회 에러:', err);
      alert('게시글을 불러오는데 실패했습니다.');
    }
  };

  // 게시글 수정 후 목록 업데이트
  const handleUpdatePost = (updatedPost: AdminPost) => {
    setPosts(posts.map(post => post.id === updatedPost.id ? updatedPost : post));
    // 최신 목록 다시 불러오기
    fetchPosts(currentPage, searchQuery);
  };

  // 게시글 삭제 후 목록 업데이트
  const handleDeletePost = (postId: number) => {
    setPosts(posts.filter(post => post.id !== postId));
    // 최신 목록 다시 불러오기
    fetchPosts(currentPage, searchQuery);
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // ✅ 게시글 생성 함수 (신규 모달용)
  const handleCreatePost = async (title: string, content: string, closeModal: () => void) => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await adminApi.createPost({ title, content });

      if (res.success) {
        alert('게시글이 등록되었습니다.');
        closeModal();
        fetchPosts(currentPage, searchQuery);
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      console.error('❌ 게시글 등록 실패:', err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 AI 정보글 자동 생성 함수
  const handleGenerateAiPost = async () => {
    if (!confirm('AI가 새로운 취업 정보글을 생성합니다. 계속하시겠습니까?')) {
      return;
    }

    setIsGeneratingAiPost(true);
    try {
      const body = {
        query: '채용 OR 공채 OR 채용공고',
        days: 3,
        limit: 20,
        style: 'bullet',
        botUserId: 102, // 🔥 BOT 계정 ID
      };

      const res = await fetch('/api/board/ai/news/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 409) {
        alert('이미 최신 뉴스가 등록되어 있습니다 ✅');
        return;
      }

      if (!res.ok) {
        throw new Error('AI 게시글 생성 실패');
      }

      const saved = await res.json();
      alert(`AI 정보글이 생성되었습니다! 게시글 ID: ${saved.id}`);

      // 목록 새로고침
      fetchPosts(currentPage, searchQuery);
    } catch (err: any) {
      console.error('❌ AI 정보글 생성 실패:', err);
      alert('AI 정보글 생성 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsGeneratingAiPost(false);
    }
  };

  // ✅ 신규 등록 모달 내부 컴포넌트
  const CreatePostModal = ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      await handleCreatePost(title, content, onClose);
      setIsSubmitting(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">새 게시글 등록</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* 내용 */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="게시글 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="게시글 내용을 입력하세요"
              />
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 p-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8">
      {/* 상단 타이틀 + 새로고침 버튼 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">게시판 관리</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleGenerateAiPost}
            disabled={isGeneratingAiPost}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
              isGeneratingAiPost
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
          >
            {isGeneratingAiPost ? '생성 중...' : '🤖 AI 정보글 생성'}
          </button>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="bg-purple-100 text-purple-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-200"
          >
            봇 상태 확인
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-200"
          >
            신규
          </button>
        </div>
      </div>

      {/* ✅ 전체선택 / 선택삭제 영역 */}
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
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">전체 선택</span>
        </label>

        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex-shrink-0"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            선택삭제 ({selectedIds.length})
          </button>
        )}
      </div>

      {/* 검색창 */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1 w-full md:w-64 bg-white dark:bg-gray-800">
          <input
            type="text"
            placeholder="제목 또는 작성자 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="flex-1 text-sm outline-none bg-transparent text-gray-800 dark:text-white"
          />
          <button onClick={handleSearch} className="ml-2">
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
          </button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && posts.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          게시글을 불러오는 중...
        </div>
      )}

      {/* 게시글이 없을 때 */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchQuery ? '검색 결과가 없습니다.' : '등록된 게시글이 없습니다.'}
        </div>
      )}

      {/* 2열 그리드 테이블 */}
      {posts.length > 0 && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className={`relative flex justify-between items-center border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${selectedIds.includes(post.id) ? 'ring-2 ring-blue-500 ring-offset-2' : ''
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
                      checked={selectedIds.includes(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="sr-only peer"
                    />
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.includes(post.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300 hover:border-blue-400'
                      }`}>
                      {selectedIds.includes(post.id) && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {post.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    작성자: {post.nickname}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    조회 {post.views} · 댓글 {post.comments} ·{' '}
                    {new Date(post.createAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <div className="flex space-x-3 ml-4 mr-8">
                  <PencilIcon className="w-5 h-5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" />
                  <TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
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
      )}

      {/* 게시글 상세 모달 */}
      <PostDetailModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPost(null);
        }}
        onUpdate={handleUpdatePost}
        onDelete={handleDeletePost}
      />
      {/* ✅ 신규 등록 모달 */}
      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      {/* ✅ AI 봇 차단 관리 모달 */}
      <AiControlModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </div>
  );
};



// ✅ AI 봇 차단 관리 모달
const AiControlModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [logs, setLogs] = useState<AiBoardControl[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAiBoardControls();
      if (res.success) {
        setLogs(res.data);
      } else {
        alert(res.message || "데이터를 불러오지 못했습니다.");
      }
    } catch (err: any) {
      console.error("❌ AI 로그 조회 실패:", err);
      alert("AI 로그를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm("정말로 이 게시글을 복구하시겠습니까?")) return;
    try {
      const res = await adminApi.restoreAiBoardControl(id);
      if (res.success) {
        alert("게시글이 복구되었습니다.");
        fetchLogs(); // 목록 갱신
      } else {
        alert(res.message || "복구에 실패했습니다.");
      }
    } catch (err: any) {
      console.error("❌ 복구 실패:", err);
      alert("복구 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!window.confirm("정말로 이 차단 내역을 삭제하시겠습니까?")) return;
    try {
      const res = await adminApi.deleteAiBoardControl(id);
      if (res.success) {
        alert("차단 내역이 삭제되었습니다.");
        fetchLogs(); // 목록 갱신
      } else {
        alert(res.message || "삭제에 실패했습니다.");
      }
    } catch (err: any) {
      console.error("❌ 삭제 실패:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            AI 봇 차단 관리
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              차단된 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">게시글 제목</th>
                    <th className="px-6 py-3">차단 사유</th>
                    <th className="px-6 py-3">상태</th>
                    <th className="px-6 py-3">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <td className="px-6 py-4">{log.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {log.board?.title || "삭제된 게시글"}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={log.reason}>
                        {log.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${log.role === "BOT"
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                            }`}
                        >
                          {log.role === "BOT" ? "차단됨" : "복구됨"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {/* 🔥 복구 버튼: role이 BOT이거나, ADMIN이지만 hidden이 true인 경우 활성화 */}
                        {(log.role === "BOT" || (log.role === "ADMIN" && log.board?.hidden)) && (
                          <button
                            onClick={() => handleRestore(log.id)}
                            className="font-medium text-blue-600 dark:text-blue-500 hover:underline mr-3"
                          >
                            복구
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="font-medium text-red-600 dark:text-red-500 hover:underline"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 p-6 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardManagement;