import React, { useState, useEffect, useRef } from "react";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { jobPostApi } from "../../api/jobPostApi";
import type { JobPostResponse } from "../../types/interface";

const AttentionSection: React.FC = () => {
  const [popularJobs, setPopularJobs] = useState<JobPostResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [scrappedJobs, setScrappedJobs] = useState<Set<number>>(new Set());
  const [companyPhotos, setCompanyPhotos] = useState<Record<number, string>>({});
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // 반응형 페이지당 카드 수 계산
  const getCardsPerPage = () => {
    if (typeof window === 'undefined') return 5;
    return window.innerWidth < 768 ? 2 : 5; // 모바일: 2개, 데스크톱: 5개
  };

  const [cardsPerPage, setCardsPerPage] = useState(getCardsPerPage());
  const totalPages = Math.ceil(popularJobs.length / cardsPerPage);

  const fetchCompanyPhotos = async (jobs: JobPostResponse[]) => {
    const photos: Record<number, string> = {};
    await Promise.all(
      jobs.map(async (job) => {
        if (job.companyId && !photos[job.companyId]) {
          try {
            const company = await jobPostApi.getCompanyById(job.companyId);
            if (company.photo) {
              photos[job.companyId] = company.photo;
            }
          } catch (e) {
            console.error(`Failed to fetch photo for company ${job.companyId}`, e);
          }
        }
      })
    );
    setCompanyPhotos((prev) => ({ ...prev, ...photos }));
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobs = await jobPostApi.getJobPosts();

        console.log("✅ 받아온 공고 데이터:", jobs[0]); // 디버깅용

        // ✅ 조회수 기준 내림차순 정렬 후 상위 15개
        const sortedJobs = jobs
          .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
          .slice(0, 15);

        setPopularJobs(sortedJobs);
        fetchCompanyPhotos(sortedJobs);
      } catch (err) {
        console.error("공고 불러오기 실패", err);
      }
    };
    fetchJobs();
  }, []);

  // 스크랩 상태 확인
  useEffect(() => {
    const fetchScrapStatus = async () => {
      try {
        const scrappedItems = await jobPostApi.getScrappedJobs();
        const scrappedIds = new Set<number>(
          scrappedItems
            .map((item: any) => Number(item.jobPostId || item.id))
            .filter((id: number) => !isNaN(id))
        );
        setScrappedJobs(scrappedIds);
      } catch (err: any) {
        if (err.response?.status !== 401) {
          console.error("스크랩 상태 확인 실패:", err);
        }
      }
    };
    fetchScrapStatus();
  }, []);

  const handleBookmarkClick = async (e: React.MouseEvent, targetJobId: number) => {
    e.stopPropagation();
    const isScrapped = scrappedJobs.has(targetJobId);
    try {
      if (isScrapped) {
        await jobPostApi.removeScrapJob(targetJobId);
        setScrappedJobs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(targetJobId);
          return newSet;
        });
      } else {
        await jobPostApi.addScrapJob(targetJobId);
        setScrappedJobs((prev) => new Set(prev).add(targetJobId));
      }
    } catch (err: any) {
      let errorMsg = "북마크 처리에 실패했습니다.";
      if (err.response?.status === 401) {
        errorMsg = "로그인이 필요합니다.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      alert(errorMsg);
    }
  };

  // 카드 클릭 시 조회수 증가 후 상세 페이지로 이동
  const handleJobClick = async (jobId: number) => {
    try {
      await jobPostApi.incrementJobView(jobId);
    } catch (err) {
      console.error("조회수 증가 실패:", err);
    }
    navigate(`/jobPostings/${jobId}`);
  };

  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 0));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));

  // 터치 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentPage < totalPages - 1) {
      goToNextPage();
    }
    if (isRightSwipe && currentPage > 0) {
      goToPreviousPage();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // 각 페이지마다 이동할 거리 계산 (반응형 + 동적)
  const getSlideDistance = (page: number) => {
    if (typeof window === 'undefined') return page * 1345;

    const width = window.innerWidth;
    const isMobile = width < 768;

    if (isMobile) {
      // 모바일: 카드 2개 폭 + gap 계산 (화면 너비 390px 기준)
      const cardWidth = 180; // w-[180px]
      const gap = 4; // space-x-1
      return page * (cardWidth * 2 + gap);
    }

    // 데스크톱: 기존 로직 유지
    if (width < 1024) return page * 900;       // 태블릿
    if (width < 1280) return page * 1100;      // 작은 데스크톱
    return page * 1345;                         // 데스크톱
  };

  // 윈도우 리사이즈 시 슬라이드 거리 및 페이지 수 재계산
  useEffect(() => {
    const handleResize = () => {
      const newCardsPerPage = getCardsPerPage();
      if (newCardsPerPage !== cardsPerPage) {
        setCardsPerPage(newCardsPerPage);
        setCurrentPage(0); // 페이지 리셋
      }

      // 슬라이드 거리 재계산
      if (cardsContainerRef.current) {
        const distance = getSlideDistance(currentPage);
        cardsContainerRef.current.style.transform = `translateX(-${distance}px)`;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPage, cardsPerPage]);

  return (
    <section className="relative max-w-[1440px] mx-auto w-full">
      {/* 제목 */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">
          {isLoggedIn ? 'AI 추천 공고' : '모두가 주목하는 공고'}
        </h2>

        {/* 페이지 버튼 - 데스크톱만 표시 */}
        <div
          ref={buttonsContainerRef}
          className="hidden md:flex space-x-2"
        >
          <button
            onClick={goToPreviousPage}
            className={`bg-gray-300 hover:bg-gray-400 rounded-full w-7 h-7 flex items-center justify-center text-white text-base z-10 ${currentPage === 0 ? 'invisible' : ''
              }`}
          >
            ‹
          </button>
          <button
            onClick={goToNextPage}
            className={`bg-gray-300 hover:bg-gray-400 rounded-full w-7 h-7 flex items-center justify-center text-white text-base z-10 ${currentPage === totalPages - 1 ? 'invisible' : ''
              }`}
          >
            ›
          </button>
        </div>
      </div>

      {/* 카드 리스트 - 슬라이드 애니메이션 적용 */}
      <div
        className="overflow-hidden -ml-1 md:ml-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={cardsContainerRef}
          className="flex space-x-1 md:space-x-4 pb-6 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${getSlideDistance(currentPage)}px)` }}
        >
          {popularJobs.map((job) => (
            <div
              key={job.id}
              className="relative w-[180px] sm:w-[200px] md:w-[253px] h-[200px] sm:h-[260px] md:h-[288px] bg-white border border-gray-200 rounded-2xl md:rounded-3xl overflow-hidden flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleJobClick(job.id)}
            >
              {/* ✅ 회사 이미지 - companyPhotos 사용 */}
              <div className="w-full h-[100px] sm:h-[120px] md:h-[144px] bg-white overflow-hidden flex items-center justify-center border-b border-gray-100 p-3 md:p-4">
                {companyPhotos[job.companyId] ? (
                  <img
                    src={companyPhotos[job.companyId]}
                    alt={job.companyName}
                    className="max-w-[70%] md:max-w-[80%] max-h-[70%] md:max-h-[80%] object-contain"
                    onError={(e) => {
                      console.error(`❌ 이미지 로드 실패: ${job.companyName}`, companyPhotos[job.companyId]);
                      // 이미지 로드 실패 시 대체 UI 표시
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.error-message')) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-message w-full h-full flex items-center justify-center text-gray-400 text-sm';
                        errorDiv.textContent = '이미지 없음';
                        parent.appendChild(errorDiv);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    이미지 없음
                  </div>
                )}
              </div>

              {/* 텍스트 */}
              <div className="pt-2.5 md:pt-[16px] pb-2.5 md:pb-[20px] px-3 md:px-[24px]">
                <p className="font-bold text-gray-800 text-sm md:text-[20px] truncate">{job.companyName}</p>
                <p className="text-gray-900 font-normal text-xs md:text-[16px] mt-1 md:mt-[4px] truncate">
                  {job.title}
                </p>
                <p className="text-gray-500 text-[10px] md:text-[14px] truncate mt-1">
                  {job.position} / {job.careerLevel}
                </p>

                <p className="text-gray-400 text-[11px] md:text-[16px] text-right mt-1.5 md:mt-2">
                  {!job.endAt ? '상시채용' : `~${new Date(job.endAt).toLocaleDateString("ko-KR", {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                  }).replace(/\. /g, '.')}`}
                </p>
              </div>

              {/* 북마크 버튼 */}
              <button
                onClick={(e) => handleBookmarkClick(e, job.id)}
                className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10"
                aria-label={scrappedJobs.has(job.id) ? "북마크 제거" : "북마크 추가"}
              >
                {scrappedJobs.has(job.id) ? (
                  <BookmarkSolidIcon className="w-4 h-4 md:w-5 md:h-5 text-[#006AFF]" />
                ) : (
                  <BookmarkIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AttentionSection;