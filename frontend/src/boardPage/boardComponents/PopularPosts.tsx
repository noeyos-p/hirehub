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
    <section className="-mb-1 md:mb-8">
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-8">인기 게시물</h2>
      <div className="-ml-2 md:ml-0">
        {popularBoards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            인기 게시글이 없습니다.
          </div>
        ) : (
          <div className="space-y-2 mb-0 -mt-2">
            {popularBoards.map((board, index) => (
              <div
                key={board.id}
                className="border-b border-gray-200 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-50 transition p-3 rounded"
                onClick={() => handleBoardClick(board.id)}
              >
                {/* 모바일 레이아웃 */}
                <div className="md:hidden flex items-start gap-3">
                  {/* 순서 번호 */}
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-gray-700">{index + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-800 truncate mb-2">
                      {board.title}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="truncate">{board.nickname || board.usersName}</span>
                      <span className="mx-2">|</span>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <EyeIcon className="w-3.5 h-3.5" />
                          <span>{board.views || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
                          <span>{commentCounts[board.id] || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 데스크톱 레이아웃 */}
                <div className="hidden md:flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* 순서 번호 */}
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-700">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-md font-semibold text-gray-800">
                        {board.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {board.content.replace(/<[^>]*>/g, '').substring(0, 30)}
                        {board.content.replace(/<[^>]*>/g, '').length > 30 ? '...' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-2 mt-6">
                      <div className="text-sm text-gray-500 flex items-center space-x-1">
                        <EyeIcon className="w-4 h-4" />
                        <span>{board.views || 0}</span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-1">
                        <ChatBubbleLeftIcon className="w-4 h-4" />
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