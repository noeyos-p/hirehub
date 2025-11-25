import React, { useState, useEffect } from 'react';
import { boardApi } from '../../api/boardApi';

const Ads: React.FC = () => {
  const [ads, setAds] = useState<string[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const adsData = await boardApi.getAds();

        // ✅ photo 컬럼만 뽑아서 state에 넣음
        const imageUrls = adsData
          .map((ad) => ad.photo)
          .filter((photo) => photo); // 빈 photo 제외

        setAds(imageUrls);
      } catch (error) {
        console.error("광고 이미지 불러오기 실패:", error);
      }
    };

    fetchAds();
  }, []);

  // 이미지 자동 슬라이드
  useEffect(() => {
    if (ads.length === 0) return;

    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 10000); // 10초마다 변경

    return () => clearInterval(interval);
  }, [ads]);

  // 이미지가 없으면 로딩 또는 빈화면 처리
  if (ads.length === 0) {
    return (
      <div className="rounded-lg p-4 text-center text-sm text-gray-600 mt-0 h-[360px] flex items-center justify-center">
        로딩중...
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4 text-center text-sm text-gray-600 mt-0 h-[425px] flex items-center justify-center">
      <img
        src={ads[currentAdIndex]}
        alt={`광고 배너 ${currentAdIndex + 1}`}
        className="h-full w-auto max-w-full object-contain mx-auto transition-all duration-500"
      />
    </div>
  );
};

export default Ads;