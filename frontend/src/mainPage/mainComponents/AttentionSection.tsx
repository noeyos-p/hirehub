import React, { useState, useEffect, useRef } from 'react';

const AttentionSection: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0); // 현재 페이지 (0, 1, 2)
  const cardsPerPage = 5; // 페이지당 카드 수
  const totalPages = 3; // 총 페이지 수
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // 이전 페이지로 이동
  const goToPreviousPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
  };

  // 다음 페이지로 이동
  const goToNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : prev));
  };

  // 현재 페이지에 표시할 카드 범위 계산
  const startIndex = currentPage * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;

  useEffect(() => {
    if (cardsContainerRef.current && buttonsContainerRef.current) {
      const cardsWidth = cardsContainerRef.current.getBoundingClientRect().width;
      const fifthCardRight = cardsWidth; // 5번째 카드 오른쪽 끝 (전체 너비)
      const buttonsWidth = buttonsContainerRef.current.getBoundingClientRect().width; // 버튼 그룹 너비
      const adjustPosition = fifthCardRight - buttonsWidth; // 버튼 오른쪽을 5번째 카드 오른쪽에 맞춤
      buttonsContainerRef.current.style.transform = `translateX(${adjustPosition}px)`;
    }
  }, [currentPage]); // 페이지 변경 시 재조정

  return (
    <section className="mb-12 relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">모두가 주목하는 공고</h2>
      </div>
      <div ref={cardsContainerRef} className="flex justify-center space-x-4 pb-6">
        {[...Array(15)].slice(startIndex, endIndex).map((_, index) => (
          <div
            key={index + startIndex}
            className="min-w-[238px] h-60 bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0"
          >
            {/* 빈 카드 본문 */}
          </div>
        ))}
      </div>
      <div
        ref={buttonsContainerRef}
        className="flex space-x-2 absolute top-0"
      >
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 0}
          className="bg-gray-300 hover:bg-gray-400 rounded-full w-6 h-6 flex items-center justify-center text-white z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages - 1}
          className="bg-gray-300 hover:bg-gray-400 rounded-full w-6 h-6 flex items-center justify-center text-white z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default AttentionSection;