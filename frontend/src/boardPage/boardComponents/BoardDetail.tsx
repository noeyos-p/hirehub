import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { boardApi, commentApi } from '../../api/boardApi';
import type { BoardListResponse, CommentResponse } from '../../types/interface';
import { useAuth } from '../../hooks/useAuth';
import CommentSection from './CommentSection';
import PopularPosts from './PopularPosts';
import { EyeIcon, ArrowLeftIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";

const BoardDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [board, setBoard] = useState<BoardListResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ 드롭다운 메뉴 state
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchBoardDetail(Number(id));
      fetchComments(Number(id));
    }
  }, [id]);

  // ✅ 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBoardDetail = async (boardId: number) => {
    try {
      setLoading(true);
      const data = await boardApi.getBoardById(boardId);
      setBoard(data);
    } catch (err) {
      console.error('게시글 조회 실패:', err);
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (boardId: number) => {
    try {
      const data = await commentApi.getCommentsByBoardId(boardId);
      setComments(data);
    } catch (err: any) {
      console.error('댓글 조회 실패:', err);

      if (err.response?.status === 401 || err.response?.status === 404) {
        setComments([]);
        console.log('인증 필요 또는 댓글 없음 - 빈 목록 표시');
      } else {
        alert('댓글을 불러오는데 실패했습니다.');
      }
    }
  };

  const handleCommentSubmit = async (content: string) => {
    if (!id) return;

    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      throw new Error('Not authenticated');
    }

    await commentApi.createComment({
      content,
      boardId: Number(id)
    });

    await fetchComments(Number(id));
  };

  const handleReplySubmit = async (parentCommentId: number, content: string) => {
    if (!id) return;

    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      throw new Error('Not authenticated');
    }

    await commentApi.createComment({
      content,
      boardId: Number(id),
      parentCommentId
    });

    await fetchComments(Number(id));
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      throw new Error('Cancelled');
    }

    await commentApi.deleteComment(commentId);
    if (id) {
      await fetchComments(Number(id));
    }
  };

  const handleCommentEdit = async (commentId: number, content: string) => {
    await commentApi.updateComment(commentId, content);
    if (id) {
      await fetchComments(Number(id));
    }
  };

  // ✅ 게시글 수정 핸들러
  const handleBoardEdit = () => {
    setShowDropdown(false);
    navigate(`/board/edit/${id}`);
  };

  // ✅ 게시글 삭제 핸들러
  const handleBoardDelete = async () => {
    setShowDropdown(false);

    if (!window.confirm('게시글을 삭제하시겠습니까?')) return;

    try {
      await boardApi.deleteBoard(Number(id));
      alert('게시글이 삭제되었습니다.');
      navigate('/board');
    } catch (err) {
      console.error('게시글 삭제 실패:', err);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';

    const isUTC = dateString.endsWith('Z');
    const date = new Date(isUTC ? dateString : `${dateString}Z`);

    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}.${month}.${day}. ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </section>
    );
  }

  if (error || !board) {
    return (
      <section className="mb-8">
        <button
          onClick={() => navigate('/board/user-posts')}
          className="flex items-center text-gray-500 text-sm mb-6 hover:text-gray-700"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          목록으로
        </button>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">{error || '게시글을 찾을 수 없습니다.'}</div>
        </div>
      </section>
    );
  }

  const isOwner = user?.id === board.usersId;
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const canManageBoard = isAuthenticated && (isOwner || isAdmin);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px]">
      <div className="flex flex-col lg:flex-row gap-8 py-6 sm:py-8">
        {/* Main Content */}
        <section className="flex-1 min-w-0">
          <button
            onClick={() => navigate('/board/user-posts')}
            className="flex items-center text-gray-500 text-sm mb-6 hover:text-gray-700 transition"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            목록으로
          </button>

          {/* ✅ 제목과 드롭다운 메뉴 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{board.title}</h2>

            {canManageBoard && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-2 cursor-pointer transition -mr-2"
                >
                  <EllipsisHorizontalIcon className="w-5 h-5 text-gray-600" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={handleBoardEdit}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleBoardDelete}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start text-sm text-gray-500 mb-6">
            <div className="w-10 h-10 rounded-full mr-3 overflow-hidden flex items-center justify-center bg-gray-300">
              {board.usersProfileImage ? (
                <img
                  src={board.usersProfileImage}
                  alt={`${board.nickname || board.usersName}'s profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-medium">
                  {(board.nickname || board.usersName || '익명').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-gray-800">
                {board.nickname || board.usersName || '익명'}
              </p>
              <p>{formatDateTime(board.createAt)}</p>
            </div>

            <div className="flex items-center ml-auto space-x-3 text-gray-400 mt-5">
              <div className="flex items-center space-x-1">
                <EyeIcon className="w-4 h-4" />
                <span>{board.views || 0}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-b border-gray-200 py-6 text-gray-800 leading-relaxed whitespace-pre-line">
            {board.content}
          </div>

          <CommentSection
            comments={comments}
            isAuthenticated={isAuthenticated}
            currentUserId={user?.id}
            currentUserRole={user?.role}
            onCommentSubmit={handleCommentSubmit}
            onReplySubmit={handleReplySubmit}
            onCommentDelete={handleCommentDelete}
            onCommentEdit={handleCommentEdit}
          />
        </section>

        {/* Sidebar - Popular Posts */}
        <aside className="hidden lg:block w-full lg:w-80 xl:w-96 flex-shrink-0">
          <div className="sticky top-20">
            <PopularPosts />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BoardDetail;