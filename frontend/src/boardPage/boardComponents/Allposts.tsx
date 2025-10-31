import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';
import { boardApi, type BoardListResponse } from '../../api/boardApi';

const AllPosts: React.FC = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // 게시글 목록 조회
  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearching(false);
      const data = await boardApi.getAllBoards();
      setBoards(data);
    } catch (err) {
      console.error('게시글 조회 실패:', err);
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 처리
  const handleSearch = async () => {
    // 검색어가 비어있으면 전체 목록 조회
    if (!searchKeyword.trim()) {
      fetchBoards();
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);
      console.log('🔍 검색 키워드:', searchKeyword);
      
      const data = await boardApi.searchBoards(searchKeyword);
      console.log('✅ 검색 결과:', data);
      
      setBoards(data);
      setCurrentPage(1);
    } catch (err) {
      console.error('❌ 검색 실패:', err);
      setError('검색에 실패했습니다.');
      setBoards([]);
    } finally {
      setLoading(false);
    }
  };

  // 검색 초기화
  const handleResetSearch = () => {
    setSearchKeyword('');
    fetchBoards();
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 페이지네이션 계산
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = boards.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(boards.length / postsPerPage);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace('.', '');
  };

  // 게시글 클릭 핸들러
  const handlePostClick = (id: number) => {
    navigate(`/board/${id}`);
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

  if (error) {
    return (
      <section className="mb-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">전체 게시물</h2>
          {isSearching && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                검색 결과: {boards.length}개
              </span>
              <button
                onClick={handleResetSearch}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                전체 보기
              </button>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/board/write')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-500 text-sm font-medium px-4 py-1.5 rounded-md"
          >
            작성하기
          </button>
        </div>
      </div>

      <div>
        {currentPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {isSearching ? '검색 결과가 없습니다.' : '게시글이 없습니다.'}
            </p>
            {isSearching && (
              <button
                onClick={handleResetSearch}
                className="mt-4 text-blue-600 hover:text-blue-800 underline"
              >
                전체 게시글 보기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentPosts.map((board) => (
              <div
                key={board.id}
                onClick={() => handlePostClick(board.id)}
                className="border-b border-gray-200 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-100 transition p-2 rounded"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-300">
                      {board.usersProfileImage ? (
                        <img
                          src={board.usersProfileImage}
                          alt={board.usersName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">
                          {board.usersName?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-md font-semibold text-gray-800">
                        {board.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {board.content.replace(/<[^>]*>/g, '').substring(0, 50)}
                        {board.content.length > 50 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatDate(board.createAt)}
                    </p>
                    <p className="text-sm text-gray-500">
                      조회수: {board.views || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 및 검색 */}
        {boards.length > 0 && (
          <div className="flex items-center justify-between mt-8">
            {/* 페이지네이션 버튼 */}
            <div className="flex justify-center flex-1 space-x-0 mr-[-140px]">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage <= 3 
                  ? i + 1 
                  : currentPage + i - 2;
                
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border border-gray-300 rounded ${
                      currentPage === pageNum
                        ? 'bg-gray-300 text-white hover:bg-gray-400'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>

            {/* 검색 입력창 */}
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="검색어를 입력하세요"
                className="border border-gray-300 rounded-full px-4 py-1.5 pr-9 text-sm focus:outline-none focus:border-blue-500 w-48"
              />
              <button onClick={handleSearch} className="absolute right-3 top-2.5">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-700" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AllPosts;