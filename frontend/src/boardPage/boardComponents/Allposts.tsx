// src/pages/board/AllPosts.tsx
import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';
import { boardApi, type BoardListResponse } from '../../api/boardApi';

const AllPosts: React.FC = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

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

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      fetchBoards();
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);
      const data = await boardApi.searchBoards(searchKeyword);
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

  const handleResetSearch = () => {
    setSearchKeyword('');
    fetchBoards();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // ✅ 로그인 여부 확인 후 글쓰기 페이지 이동
  const handleWriteClick = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인 후 이용 가능합니다.');
      navigate('/login');
      return;
    }
    navigate('/board/write');
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = boards.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(boards.length / postsPerPage);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\. /g, '.');
  };

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
      {/* 상단 영역 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">전체 게시물</h2>
        <div className="relative ml-[150px]">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="검색어를 입력하세요"
            className="border border-gray-300 rounded-lg px-4 py-1.5 pr-9 text-[14px] focus:outline-none focus:border-blue-500 w-100"
          />
          <button onClick={handleSearch} className="absolute right-3 top-2.5">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-700" />
          </button>
        </div>
        <div className="flex justify-end mr-[6px]">
          <button
            onClick={handleWriteClick}
            className="bg-[#006AFF] hover:bg-blue-600 text-white text-[15px] font-medium px-4 py-1.5 rounded-md cursor-pointer"
          >
            작성하기
          </button>
        </div>
      </div>

      {/* 🔽 검색 결과/전체 보기 표시 */}
      {isSearching && (
        <div className="flex items-center space-x-2 mb-6 ml-[4px]">
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

        {/* ✅ 페이지네이션 */}
        <div className="mt-8 flex items-center justify-center gap-2 mb-[12px]">
          <button
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronDoubleLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          {(() => {
            const pages = [];
            const maxVisible = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
            if (endPage - startPage + 1 < maxVisible) {
              startPage = Math.max(1, endPage - maxVisible + 1);
            }
            for (let i = startPage; i <= endPage; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-10 h-10 flex items-center justify-center rounded-md text-base transition border font-medium ${
                    currentPage === i
                      ? 'bg-white text-[#006AFF] border-[#006AFF]'
                      : 'bg-white text-gray-700 border-gray-300 hover:text-[#006AFF]'
                  }`}
                >
                  {i}
                </button>
              );
            }
            return pages;
          })()}
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <button
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronDoubleRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default AllPosts;
