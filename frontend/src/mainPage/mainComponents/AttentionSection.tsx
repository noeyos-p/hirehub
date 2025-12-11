import React, { useState, useEffect, useRef } from "react";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { jobPostApi } from "../../api/jobPostApi";
import type { JobPostResponse } from "../../types/interface";
import { myPageApi } from "../../api/myPageApi";

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

const [isProfileFilled, setIsProfileFilled] = useState(false);

  // 로그인 상태 확인
useEffect(() => {
  const token = localStorage.getItem('token');
  setIsLoggedIn(!!token);

  // 로그인 안 되어 있으면 프로필도 false
  if (!token) {
    setIsProfileFilled(false);
    return;
  }

  const fetchProfile = async () => {
    try {
      const profile = await myPageApi.getMyInfo();

      const hasAnyProfile =
        profile.education ||
        profile.careerLevel ||
        profile.position ||
        profile.location;

      setIsProfileFilled(!!hasAnyProfile);
    } catch (e) {
      console.error("프로필 확인 실패", e);
      setIsProfileFilled(false);
    }
  };

  fetchProfile();
}, []);

  // 반응형 페이지당 카드 수 계산
  const getCardsPerPage = () => {
    if (typeof window === 'undefined') return 5;
    return window.innerWidth < 768 ? 2 : 5;
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

  // 🔥 공고 불러오기 (로그인 시 AI 추천, 비로그인 시 조회수 기준)
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('token');

        if (token) {
          // 🔥 로그인 시: AI 추천 공고 API 호출
          try {
            const recommendedJobs = await jobPostApi.getRecommendedJobs();
            if (recommendedJobs && recommendedJobs.length > 0) {
              console.log("🤖 AI 추천 공고:", recommendedJobs.length, "개");
              setPopularJobs(recommendedJobs.slice(0, 15));
              fetchCompanyPhotos(recommendedJobs.slice(0, 15));
              return;
            }
          } catch (err) {
            console.warn("⚠️ 추천 공고 실패, 조회수 기준으로 fallback:", err);
          }
        }

        // 🔥 비로그인 또는 추천 실패 시: 조회수 기준 인기 공고
        const jobs = await jobPostApi.getJobPosts();
        console.log("📊 조회수 기준 인기 공고:", jobs.length, "개");

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
  }, [isLoggedIn]);

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

  const getSlideDistance = (page: number) => {
    if (typeof window === 'undefined') return page * 1345;

    const width = window.innerWidth;
    const isMobile = width < 768;

    if (isMobile) {
      const cardWidth = 180;
      const gap = 4;
      return page * (cardWidth * 2 + gap);
    }

    if (width < 1024) return page * 900;
    if (width < 1280) return page * 1100;
    return page * 1345;
  };

  useEffect(() => {
    const handleResize = () => {
      const newCardsPerPage = getCardsPerPage();
      if (newCardsPerPage !== cardsPerPage) {
        setCardsPerPage(newCardsPerPage);
        setCurrentPage(0);
      }

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
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">
         {isLoggedIn && isProfileFilled ? 'AI 추천 공고' : '모두가 주목하는 공고'}
        </h2>
        <div ref={buttonsContainerRef} className="hidden md:flex space-x-2">
          <button
            onClick={goToPreviousPage}
            className={`bg-gray-300 hover:bg-gray-400 rounded-full w-7 h-7 flex items-center justify-center text-white text-base z-10 ${currentPage === 0 ? 'invisible' : ''}`}
          >
            ‹
          </button>
          <button
            onClick={goToNextPage}
            className={`bg-gray-300 hover:bg-gray-400 rounded-full w-7 h-7 flex items-center justify-center text-white text-base z-10 ${currentPage === totalPages - 1 ? 'invisible' : ''}`}
          >
            ›
          </button>
        </div>
      </div>

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
              <div className="w-full h-[100px] sm:h-[120px] md:h-[144px] bg-white overflow-hidden flex items-center justify-center border-b border-gray-100 p-2 md:p-3">
                {companyPhotos[job.companyId] ? (
                  <img
                    src={companyPhotos[job.companyId]}
                    alt={job.companyName}
                    className="max-w-[95%] max-h-[95%] object-contain rounded-lg"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    이미지 없음
                  </div>
                )}
              </div>

              <div className="pt-2.5 md:pt-[16px] pb-2.5 md:pb-[20px] px-3 md:px-[24px]">
                <p className="font-bold text-gray-800 text-sm md:text-[20px] truncate">{job.companyName}</p>
                <p className="text-gray-900 font-normal text-xs md:text-[16px] mt-1 truncate">{job.title}</p>
                <p className="text-gray-500 text-[10px] md:text-[14px] truncate mt-1">
                  {job.position} / {job.careerLevel}
                </p>
                <p className="text-gray-400 text-[10px] md:text-[14px] text-right mt-1.5">
                  {!job.endAt ? '상시채용' : `~${new Date(job.endAt).toLocaleDateString("ko-KR", {
                    year: "2-digit", month: "2-digit", day: "2-digit",
                  }).replace(/\. /g, '.')}`}
                </p>
              </div>

              <button
                onClick={(e) => handleBookmarkClick(e, job.id)}
                className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10"
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