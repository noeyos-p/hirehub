import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardApi, type BoardListResponse } from '../../api/boardApi';

const PopularPosts: React.FC = () => {
  const navigate = useNavigate();
  const [popularBoards, setPopularBoards] = useState<BoardListResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularBoards();
  }, []);

  const fetchPopularBoards = async () => {
    try {
      setLoading(true);
      const data = await boardApi.getPopularBoards();
      setPopularBoards(data.slice(0, 6));
    } catch (err) {
      console.error('인기 게시글 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 추가: 게시물 클릭 시 상세 페이지 이동
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
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-8">인기 게시물</h2>
      <div>
        {popularBoards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            인기 게시글이 없습니다.
          </div>
        ) : (
          <div className="space-y-4 mb-0">
            {popularBoards.map((board) => (
              <div
                key={board.id}
                className="border-b border-gray-200 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleBoardClick(board.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm text-gray-600">
                        {board.usersName?.charAt(0) || '?'}
                      </span>
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
                    <p className="text-sm text-gray-500">
                      조회수: {board.views || 0}
                    </p>
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