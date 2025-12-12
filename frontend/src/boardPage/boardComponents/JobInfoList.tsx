import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  EyeIcon,
  ChatBubbleLeftIcon
} from "@heroicons/react/24/outline";
import type { BoardListResponse } from "../../types/interface";

const JobInfoList: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BoardListResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  /** 🔥 DB에서 AI 자동 생성된 게시글 불러오기 */
  const fetchAiGeneratedPosts = async () => {
    try {
      const res = await fetch("/api/board/ai/list");
      if (!res.ok) throw new Error("게시글 불러오기 실패");
      const data = await res.json();
      setPosts(data);
    } catch (e: any) {
      alert("AI 게시글 불러오기 오류: " + e.message);
    }
  };

  /** 🔥 AI 자동 생성 버튼 클릭 */
  const generateAiPost = async () => {
  try {
    if (!confirm("AI가 새로운 취업 정보글을 생성할까요?")) return;
    setLoading(true);

    const body = {
      query: "채용 OR 공채 OR 채용공고",
      days: 3,
      limit: 20,
      style: "bullet",
      botUserId: 2,
    };

    const res = await fetch("/api/board/ai/news/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 409) {
      alert("이미 최신 뉴스가 등록되어 있습니다 ✅");
      return;
    }

    if (!res.ok) throw new Error("AI 게시글 생성 실패");

    const saved = await res.json();
    alert("AI 게시글 생성 완료! 게시글 ID = " + saved.id);

    fetchAiGeneratedPosts();
  } catch (e: any) {
    alert("생성 중 오류: " + e.message);
  } finally {
    setLoading(false);
  }
};

  /** 페이지네이션 계산 */
  const indexOfLast = currentPage * postsPerPage;
  const indexOfFirst = indexOfLast - postsPerPage;
  const currentPosts = posts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  useEffect(() => {
    fetchAiGeneratedPosts();
  }, []);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          취업 정보글
          <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
            AI 자동 생성
          </span>
        </h2>
      </div>

      {/* 리스트 렌더링 */}
      <div className="space-y-4">
        {currentPosts.map((board) => (
          <div
            key={board.id}
            className="border-b border-gray-200 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-100 transition p-2 rounded"
            onClick={() => navigate(`/board/${board.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500">
                  <span className="text-white text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="text-md font-semibold text-gray-800">
                    {board.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {board.content?.substring(0, 50)}...
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
        ))}
      </div>

      {/* 페이지네이션 */}
      <div className="mt-8 flex items-center justify-center gap-2 mb-[12px]">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] disabled:opacity-50"
        >
          <ChevronDoubleLeftIcon className="w-5 h-5" />
        </button>

        <button
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 1}
          className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] disabled:opacity-50"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => setCurrentPage(num)}
            className={`w-10 h-10 flex items-center justify-center rounded-md border ${
              currentPage === num
                ? "bg-white text-blue-600 border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:text-blue-600"
            }`}
          >
            {num}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={currentPage === totalPages}
          className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] disabled:opacity-50"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>

        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] disabled:opacity-50"
        >
          <ChevronDoubleRightIcon className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default JobInfoList;
