import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import AllPosts from './boardComponents/Allposts';
import PopularPosts from './boardComponents/PopularPosts';
import Ads from './boardComponents/ads';
import BoardDetail from './boardComponents/BoardDetail';
import BoardWrite from './boardComponents/BoardWrite';
import JobInfoList from './boardComponents/JobInfoList';
import UserPostsList from './boardComponents/UserPostsList';

const BoardPage: React.FC = () => {
  const location = useLocation();

  // 상세페이지나 작성페이지일 때 사이드바 숨김
  const hideSidebar = location.pathname.includes('/write') ||
    location.pathname.includes('/edit') ||
    /\/board\/\d+$/.test(location.pathname);

  // 취업정보글, 유저작성글 페이지에서는 사이드바 표시
  const showSidebar = location.pathname === '/board/job-info' ||
    location.pathname === '/board/user-posts' ||
    location.pathname === '/board/' ||
    location.pathname === '/board';

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-12">
      <div className="max-w-[1440px] mx-auto px-4 md:px-[55px]">
        <div className={`grid grid-cols-1 ${showSidebar ? 'md:grid-cols-5' : 'md:grid-cols-1'} gap-4 md:gap-20`}>

          {/* 좌측: 게시물 목록 / 상세페이지 / 작성페이지 */}
          <div className={showSidebar ? 'col-span-1 md:col-span-3' : 'col-span-1'}>

            <Routes>
              <Route path="/" element={<AllPosts />} />
              <Route path="write" element={<BoardWrite />} />
              <Route path="edit/:id" element={<BoardWrite />} />
              <Route path="job-info" element={<JobInfoList />} />
              <Route path="user-posts" element={<UserPostsList />} />
              <Route path=":id" element={<BoardDetail />} />
            </Routes>
          </div>

          {/* 우측: 인기 게시물 & 광고 (특정 페이지에서만 표시) */}
          {showSidebar && (
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 gap-0">
              <div className="col-span-1 md:col-span-2">
                <PopularPosts />
              </div>
              <div className="col-span-1 md:col-span-2 relative top-0 md:top-[-50px]">
                <Ads />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BoardPage;