import React from 'react';
import { useNavigate } from 'react-router-dom';
import AttentionSection from './mainComponents/AttentionSection';
import PopularPosts from '../boardPage/boardComponents/PopularPosts';
import RealTimeChat from './mainComponents/RealTimeChat';

const MainPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBannerClick = () => {
    const token = localStorage.getItem('token');
    if (token) {
      // 로그인한 사용자 → 마이페이지
      navigate('/myPage');
    } else {
      // 로그인 안 한 사용자 → 로그인 페이지
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-2">
      <div className="max-w-[1440px] px-4 md:px-8 lg:px-[55px] mx-auto mt-6 md:mt-10">
        {/* 모두가 주목하는 공고 섹션 */}
        <AttentionSection />

        {/* 배너 섹션 */}
        <div className="-mt-3 md:mt-0">
          <img
            src="/images/banner1.png"
            alt="배너 광고"
            className="w-full h-auto rounded-lg cursor-pointer"
            onClick={handleBannerClick}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mt-2 md:mt-10">
          {/* 인기 있는 게시물 섹션 */}
          <PopularPosts />

          {/* 실시간 채팅 섹션 - 데스크톱만 */}
          <div className="hidden md:block">
            <RealTimeChat />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;