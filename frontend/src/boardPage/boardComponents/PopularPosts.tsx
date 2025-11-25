import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardApi, commentApi } from '../../api/boardApi';
import type { BoardListResponse } from '../../types/interface';
import { EyeIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'; // ✅ 아이콘 import 추가

const PopularPosts: React.FC = () => {
  const navigate = useNavigate();
  const [popularBoards, setPopularBoards] = useState<BoardListResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ 각 게시글의 댓글 수를 저장하는 state 추가
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchPopularBoards();
  }, []);

  const fetchPopularBoards = async () => {
    try {
      setLoading(true);
      const data = await boardApi.getPopularBoards();
      const topBoards = data.slice(0, 6);
      setPopularBoards(topBoards);

      // ✅ 각 게시글의 댓글 수를 가져오기
      await fetchAllCommentCounts(topBoards);
    } catch (err) {
      console.error('인기 게시글 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 모든 게시글의 댓글 수를 가져오는 함수
  const fetchAllCommentCounts = async (boardList: BoardListResponse[]) => {
    const counts: Record<number, number> = {};

    await Promise.all(
      boardList.map(async (board) => {
        try {
          const comments = await commentApi.getCommentsByBoardId(board.id);
          counts[board.id] = comments.length;
        } catch (err: any) {
          // 401/404 에러는 조용히 처리
          if (err.response?.status === 401 || err.response?.status === 404) {
            counts[board.id] = 0;
          } else {
            console.error(`게시글 ${board.id}의 댓글 조회 실패:`, err);
            counts[board.id] = 0;
          }
        }
      })
    );

    setCommentCounts(counts);
  };

  const handleBoardClick = (id: number) => {
    navigate(`/board/${id}`);
  };

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-8">인기 게시물</h2>
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      </section>
    );
  }

  return (
    <section className="mb-6 md:mb-8">
      <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-8">인기 게시물</h2>
      <div>
        {popularBoards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            인기 게시글이 없습니다.
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-0">
            {popularBoards.map((board) => (
              <div
                key={board.id}
                className="border-b border-gray-200 pb-2 sm:pb-3 md:pb-4 last:border-b-0 cursor-pointer hover:bg-gray-100 transition-all duration-200 p-1 sm:p-1.5 md:p-2 rounded"
                onClick={() => handleBoardClick(board.id)}
              >
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 min-w-0 flex-1">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {board.usersProfileImage ? (
                        <img
                          src={board.usersProfileImage}
                          alt={board.usersName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs md:text-sm text-gray-600">
                          {board.usersName?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm md:text-md font-semibold text-gray-800 truncate leading-tight">
                        {board.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 line-clamp-1 truncate mt-0.5">
                        {board.content.replace(/<[^>]*>/g, '').substring(0, 30)}
                        {board.content.replace(/<[^>]*>/g, '').length > 30 ? '...' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center justify-end space-x-1 sm:space-x-1.5 md:space-x-2 mt-3 sm:mt-4 md:mt-6">
                      <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 flex items-center space-x-0.5">
                        <EyeIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                        <span>{board.views || 0}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 flex items-center space-x-0.5">
                        <ChatBubbleLeftIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                        <span>{commentCounts[board.id] || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularPosts;