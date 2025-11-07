import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EyeIcon, ArrowLeftIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { boardApi, commentApi, type BoardListResponse, type CommentResponse } from '../../api/boardApi';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';
import CommentSection from './CommentSection';

const BoardDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [board, setBoard] = useState<BoardListResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);  // ← 여기
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchBoardDetail(Number(id));
      fetchComments(Number(id));
    }
  }, [id]);

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
    
    // 401/404 에러는 조용히 처리 (빈 댓글 목록 유지)
    if (err.response?.status === 401 || err.response?.status === 404) {
      setComments([]); // 빈 배열로 설정
      console.log('인증 필요 또는 댓글 없음 - 빈 목록 표시');
    } else {
      // 다른 에러는 사용자에게 알림
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

  const handleBoardDelete = async () => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/api/board/${id}`);
      alert('게시글이 삭제되었습니다.');
      navigate('/board');
    } catch (err) {
      console.error('게시글 삭제 실패:', err);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\. /g, '.');
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
          onClick={() => navigate('/board')}
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
  const canDeleteBoard = isAuthenticated && (isOwner || isAdmin);

  return (
    <section className="mb-8">
      <button
        onClick={() => navigate('/board')}
        className="flex items-center text-gray-500 text-sm mb-6 hover:text-gray-700"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        목록으로
      </button>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{board.title}</h2>
        {canDeleteBoard && (
          <button
            onClick={handleBoardDelete}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            게시글 삭제
          </button>
        )}
      </div>

      <div className="flex items-center text-sm text-gray-500 mb-6">
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
          <p className="font-medium text-gray-800">
            {board.nickname || board.usersName || '익명'}
          </p>
          <p>{formatDateTime(board.createAt)}</p>
        </div>
        <div className="flex items-center ml-4 space-x-3 text-gray-400">
          <div className="flex items-center space-x-1">
            <EyeIcon className="w-4 h-4" />
            <span>{board.views || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ChatBubbleLeftIcon className="w-4 h-4" />
            <span>{comments.length}</span>
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
      />
    </section>
  );
};

export default BoardDetail;