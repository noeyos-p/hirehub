import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AllPosts from './boardComponents/Allposts';
import PopularPosts from './boardComponents/PopularPosts';
import Ads from './boardComponents/ads';
import BoardDetail from './boardComponents/BoardDetail';
import BoardWrite from './boardComponents/BoardWrite';

const BoardPage: React.FC = () => {

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-10 lg:py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px]">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 lg:gap-12 xl:gap-20">

          {/* 좌측: 게시물 목록 / 상세페이지 / 작성페이지 */}
          <div className="lg:col-span-3">

            <Routes>
              <Route path="/" element={<AllPosts />} />
              <Route path="write" element={<BoardWrite />} />
              <Route path=":id" element={<BoardDetail />} />
            </Routes>
          </div>

          {/* 우측: 인기 게시물 & 광고 */}
          <div className="lg:col-span-2 grid grid-cols-1 gap-0">
            <div className="col-span-2">
              <PopularPosts />
            </div>
            <div className="col-span-2 relative lg:top-[-50px]">
              <Ads />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BoardPage;