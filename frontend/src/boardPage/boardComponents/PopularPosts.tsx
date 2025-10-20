import React from 'react';
import { useNavigate } from 'react-router-dom';

const PopularPosts: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-8">인기 게시물</h2>
      <div>
        <div className="space-y-4 mb-0">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              onClick={() => navigate(`/board/${index + 1}`)} // ✅ 클릭 시 상세페이지로 이동
              className="border-b border-gray-200 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-100 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-800">
                      인기 게시물 제목 {index + 1}
                    </h3>
                    <p className="text-sm text-gray-600">
                      인기 게시물 내용 플레이스홀더
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">조회수: 456</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularPosts;
