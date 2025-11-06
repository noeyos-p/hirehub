import React, { useState, useEffect } from 'react';

const AD_IMAGES = [
  '/ads/board/ad-rectangle-naver-1.png',
  '/ads/board/ad-rectangle-naver-2.png',
  '/ads/board/ad-rectangle-naver-3.png',
  '/ads/board/ad-rectangle-daum-1.png',
  '/ads/board/ad-rectangle-daum-2.png',
  '/ads/board/ad-rectangle-daum-3.png',
  '/ads/board/ad-rectangle-vstar-1.png',
  '/ads/board/ad-rectangle-vstar-2.png',
  '/ads/board/ad-rectangle-bithumb-1.png',
  '/ads/board/ad-rectangle-saramin-1.png',
  '/ads/board/ad-rectangle-saramin-2.png',
  '/ads/board/ad-rectangle-jobkorea-1.png',
];

const Ads: React.FC = () => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % AD_IMAGES.length);
    }, 10000); // 10초마다 바뀜

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
  }, []);
  return (
    <div className=" rounded-lg p-4 text-center text-sm text-gray-600 mt-0 h-[360px] flex items-center justify-center">
  <img
    src={AD_IMAGES[currentAdIndex]}
    alt={`광고 배너 ${currentAdIndex + 1}`}
    className="h-full w-auto max-w-full object-contain mx-auto transition-all duration-500"
  />
</div>
  );
};

export default Ads;