import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../api/api';

interface Post {
  id: number;
  title: string;
  content: string;
  usersId: number;
  nickname: string;
  authorEmail?: string;
  views: number;
  comments: number;
  createAt: string;
  updateAt?: string;
}

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedPost: Post) => void;
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
      const response = await api.put(`/api/admin/board-management/${post.id}`, {
        title: editedTitle,
        content: editedContent,
      });

      console.log('✅ 게시글 수정 성공:', response.data);

      if (response.data.success) {
        onUpdate(response.data.data);
        setIsEditing(false);
        onClose();
        alert('게시글이 수정되었습니다.');
      } else {
        throw new Error(response.data.message || '게시글 수정에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('❌ 게시글 수정 에러:', err.response?.data);
      alert(err.response?.data?.message || err.message || '게시글 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    setIsLoading(true);
    try {
      const response = await api.delete(`/api/admin/board-management/${post.id}`);

      console.log('✅ 게시글 삭제 성공:', response.data);

      if (response.data.success) {
        onDelete(post.id);
        onClose();
        alert('게시글이 삭제되었습니다.');
      } else {
        throw new Error(response.data.message || '게시글 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('❌ 게시글 삭제 에러:', err.response?.data);
      alert(err.response?.data?.message || err.message || '게시글 삭제에 실패했습니다.');
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
  const [posts, setPosts] = useState<Post[]>([]);
  // ✅ 선택 관련 상태
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allSelected = posts.length > 0 && selectedIds.length === posts.length;

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
        await api.delete(`/api/admin/board-management/${id}`);
      }
      alert("선택된 게시글이 삭제되었습니다.");
      setSelectedIds([]);
      fetchPosts(currentPage, searchQuery);
    } catch (err: any) {
      console.error("❌ 선택삭제 실패:", err.response?.data || err.message);
      alert("선택삭제 중 오류가 발생했습니다.");
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // 게시글 목록 불러오기
  useEffect(() => {
    fetchPosts(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  // const fetchPosts = async (page: number = 0, keyword: string = '') => {
  //   setIsLoading(true);
  //   try {
  //     const params = {
  //       page: page,
  //       size: pageSize,
  //       sortBy: 'createAt',
  //       direction: 'DESC'
  //     };

  //     let response;

  //     if (keyword.trim()) {
  //       // 검색이 있을 때
  //       response = await api.get('/api/admin/board-management/search', {
  //         params: { ...params, keyword: keyword }
  //       });
  //     } else {
  //       // 전체 목록 조회
  //       response = await api.get('/api/admin/board-management', { params });
  //     }

  //     console.log('📦 게시글 목록:', response.data);

  //     // 백엔드 응답 구조 처리
  //     if (response.data.success) {
  //       const postsData = response.data.data || [];
  //       const total = response.data.totalElements || 0;
  //       const pages = response.data.totalPages || 0;

  //       setPosts(postsData);
  //       setTotalElements(total);
  //       setTotalPages(pages);
  //       setCurrentPage(response.data.currentPage || page);
  //     } else {
  //       throw new Error(response.data.message || '게시글을 불러올 수 없습니다.');
  //     }

  //   } catch (err: any) {
  //     console.error('❌ 게시글 목록 조회 에러:', err.response?.data);
  //     console.error('❌ 에러 상세:', err);
  //     alert(err.response?.data?.message || err.message || '게시글 목록을 불러오는데 실패했습니다.');
  //     setPosts([]);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchPosts = async (page: number = 0, keyword: string = '') => {
    setIsLoading(true);
    try {
      const params = {
        page: page,
        size: pageSize,
        sortBy: 'createAt',
        direction: 'DESC'
      };

      let response;

      if (keyword.trim()) {
        // 검색이 있을 때
        response = await api.get('/api/admin/board-management/search', {
          params: { ...params, keyword: keyword }
        });
      } else {
        // 전체 목록 조회
        response = await api.get('/api/admin/board-management', { params });
      }

      console.log('📦 전체 응답 데이터:', response.data);
      console.log('📦 게시글 배열:', response.data.data);
      console.log('📦 첫 번째 게시글:', response.data.data?.[0]);
      console.log('📦 첫 번째 게시글의 모든 키:', response.data.data?.[0] ? Object.keys(response.data.data[0]) : '데이터 없음');

      // 백엔드 응답 구조 처리
      if (response.data.success) {
        const postsData = response.data.data || [];
        const total = response.data.totalElements || 0;
        const pages = response.data.totalPages || 0;

        setPosts(postsData);
        setTotalElements(total);
        setTotalPages(pages);
        setCurrentPage(response.data.currentPage || page);
      } else {
        throw new Error(response.data.message || '게시글을 불러올 수 없습니다.');
      }

    } catch (err: any) {
      console.error('❌ 게시글 목록 조회 에러:', err.response?.data);
      console.error('❌ 에러 상세:', err);
      alert(err.response?.data?.message || err.message || '게시글 목록을 불러오는데 실패했습니다.');
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
  const handleUpdatePost = (updatedPost: Post) => {
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
      const response = await api.post('/api/admin/board-management', { title, content });

      if (response.data.success) {
        alert('게시글이 등록되었습니다.');
        closeModal();
        fetchPosts(currentPage, searchQuery);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      console.error('❌ 게시글 등록 실패:', err);
      alert(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
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
    <div className="p-8">
      {/* 상단 타이틀 + 새로고침 버튼 */}
      <div className="flex justify-between items-center mb-6">
        {/* ✅ 전체선택 / 선택삭제 영역 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              전체 선택
            </span>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-sm"
            >
              선택삭제 ({selectedIds.length})
            </button>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            게시판 관리
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            전체 {totalElements}개
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-200"
        >
          신규
        </button>
      </div>

      {/* 검색창 */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1 w-64 bg-white dark:bg-gray-800">
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
                className="relative flex justify-between items-center border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
              >
                {/* ✅ 개별 선택 체크박스 */}
                <div
                  className="absolute top-2 left-2 bg-white bg-opacity-80 backdrop-blur-sm rounded shadow-sm p-0.5 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(post.id)}
                    onChange={() => toggleSelect(post.id)}
                    className="w-4 h-4 accent-blue-600"
                  />
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
                <div className="flex space-x-3 ml-4">
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
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i;
            } else if (currentPage < 3) {
              pageNum = i;
            } else if (currentPage > totalPages - 3) {
              pageNum = totalPages - 5 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 rounded-lg ${currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {pageNum + 1}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
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
    </div>
  );
};

export default BoardManagement;