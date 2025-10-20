import React from 'react';
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';

const AllPosts: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-800">전체 게시물</h2>
        <div className="relative">
          <input
            type="text"
            className="border border-gray-300 rounded-full px-4 py-1.5 pr-9 text-sm focus:outline-none focus:border-blue-500 w-64"
          />
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 absolute right-3 top-2.5" />
        </div>
      </div>

      <div>
        <div className="space-y-4">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              onClick={() => navigate(`/board/${index + 1}`)}
              className="border-b border-gray-200 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-100 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-800">
                      게시물 제목 {index + 1}
                    </h3>
                    <p className="text-sm text-gray-600">게시물 내용 미리보기...</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">2025.10.17</p>
                  <p className="text-sm text-gray-500">조회수: 123</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center space-x-2 mt-8">
          <button className="px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded">이전</button>
          {[...Array(5)].map((_, index) => (
            <button key={index} className="px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded">
              {index + 1}
            </button>
          ))}
          <button className="px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded">다음</button>
        </div>
      </div>
    </section>
  );
};

export default AllPosts;
