import React from 'react';
import AttentionSection from './mainComponents/AttentionSection';
import PopularPosts from '../boardPage/boardComponents/PopularPosts';
import RealTimeChat from './mainComponents/RealTimeChat';

const MainPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-2">
      <div className="max-w-[1440px] px-[55px] mx-auto mt-10">
        {/* 모두가 주목하는 공고 섹션 */}
        <AttentionSection />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 인기 있는 게시물 섹션 */}
          <PopularPosts />

          {/* 실시간 채팅 섹션 */}
          <RealTimeChat />
        </div>
      </div>
    </div>
  );
};

export default MainPage;