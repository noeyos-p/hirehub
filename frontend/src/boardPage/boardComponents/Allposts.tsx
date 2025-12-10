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
import { boardApi, commentApi } from '../../api/boardApi';
import type { BoardListResponse } from '../../types/interface';
import { EyeIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const AllPosts: React.FC = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // ✅ 각 게시글의 댓글 수를 저장하는 state 추가
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;

  // 🔥 AI 자동 생성 취업 정보글 (실제 DB 연동)
  const [jobInfoPosts, setJobInfoPosts] = useState<BoardListResponse[]>([]);
  const [jobInfoLoading, setJobInfoLoading] = useState(true);

  useEffect(() => {
    fetchBoards();
    fetchJobInfoPosts();  // 🔥 AI 게시글 가져오기
  }, []);

  // 🔥 AI 자동 생성 게시글 가져오기 (JobInfoList와 동일한 API)
  const fetchJobInfoPosts = async () => {
    try {
      setJobInfoLoading(true);
      const res = await fetch("/api/board/ai/list");
      if (!res.ok) throw new Error("AI 게시글 불러오기 실패");
      const data = await res.json();
      setJobInfoPosts(data);
    } catch (e: any) {
      console.error("AI 게시글 불러오기 오류:", e);
      setJobInfoPosts([]);
    } finally {
      setJobInfoLoading(false);
    }
  };

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearching(false);
      const data = await boardApi.getAllBoards();

      // 유저 작성글만 저장
      setBoards(data);

      // ✅ 각 게시글의 댓글 수를 가져오기
      await fetchAllCommentCounts(data);
    } catch (err) {
      console.error('게시글 조회 실패:', err);
      setError('게시글을 불러오는데 실패했습니다.');
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

      // 유저 작성글만 검색
      setBoards(data);
      setCurrentPage(1);

      // ✅ 검색 결과의 댓글 수도 가져오기
      await fetchAllCommentCounts(data);
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

  const handlePostClick = (id: number) => {
    navigate(`/board/${id}`, { state: { from: '/board' } });
  };

  // 🔥 AI 게시글 클릭 시 상세 페이지로 이동
  const handleJobInfoClick = (boardId: number) => {
    navigate(`/board/${boardId}`, { state: { from: '/board/job-info' } });
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
      {/* 취업 정보글 섹션 */}
      <div className="mb-12 pb-8 border-b border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
            취업 정보글
            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">AI 자동 생성</span>
          </h2>
          <button
            onClick={() => navigate('/board/job-info')}
            className="text-sm text-gray-600 hover:text-[#006AFF] font-medium transition"
          >
            더보기 →
          </button>
        </div>

        {/* 🔥 취업 정보글 목록 - 실제 DB에서 가져옴 */}
        <div className="space-y-4">
          {jobInfoLoading ? (
            <div className="text-center py-4 text-gray-500">취업 정보글 불러오는 중...</div>
          ) : jobInfoPosts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">아직 등록된 취업 정보글이 없습니다.</div>
          ) : (
            jobInfoPosts.slice(0, 5).map((board) => (
              <div
                key={board.id}
                onClick={() => handleJobInfoClick(board.id)}
                className="border-b border-gray-200 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-100 transition p-2 rounded"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-blue-500">
                      <span className="text-white text-lg">🤖</span>
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-md font-semibold text-gray-800">
                        {board.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                        {board.content?.replace(/<[^>]*>/g, '').substring(0, 50)}
                        {(board.content?.length || 0) > 50 ? '...' : ''}
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
                        <span>{board.comments?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 유저 작성 게시물 섹션 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">유저 작성글</h2>
          <button
            onClick={handleWriteClick}
            className="bg-[#D6E4F0] hover:bg-[#c0d4e8] text-gray-800 text-[15px] font-medium px-4 py-1.5 rounded-md cursor-pointer"
          >
            작성하기
          </button>
        </div>
        <button
          onClick={() => navigate('/board/user-posts')}
          className="text-sm text-gray-600 hover:text-[#006AFF] font-medium transition"
        >
          더보기 →
        </button>
      </div>

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
                      <h3 className="text-sm sm:text-md font-semibold text-gray-800">
                        {board.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                        {board.content.replace(/<[^>]*>/g, '').substring(0, 50)}
                        {board.content.length > 50 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {/* 위치를 아래로 내리기 위해 mt-4 (top margin) 적용 */}
                    <div className="flex items-center justify-end space-x-2 mt-6">
                      <div className="text-sm text-gray-500 flex items-center space-x-1">
                        <EyeIcon className="w-4 h-4" />
                        <span>{board.views || 0}</span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-1">
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                        {/* 게시글 객체에서 직접 댓글 수 사용 */}
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

      {/* 검색창 */}
      <div className="mt-8 relative">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="검색어를 입력하세요"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-[14px] focus:outline-none focus:border-blue-500"
        />
        <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" />
        </button>
      </div>
    </section>
  );
};

export default AllPosts;