import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AllPosts from './boardComponents/Allposts';
import PopularPosts from './boardComponents/PopularPosts';
import Ads from './boardComponents/ads';
import BoardDetail from './boardComponents/BoardDetail';

const BoardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-20">
          {/* 좌측: 게시물 목록 / 상세페이지 */}
          <div className="col-span-3">
            <Routes>
              <Route path="/" element={<AllPosts />} />
              <Route path=":id" element={<BoardDetail />} />
            </Routes>
          </div>

          {/* 우측: 인기 게시물 & 광고 */}
          <div className="col-span-2 grid grid-cols-1 gap-0">
            <div className="col-span-2">
              <PopularPosts />
            </div>
            <div className="col-span-2 relative top-[-5px]">
              <Ads />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardPage;
