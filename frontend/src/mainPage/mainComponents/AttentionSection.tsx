import React, { useState, useEffect, useRef } from "react";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

interface Job {
  id: number;
  title: string;
  companyName: string;
  companyId: number;
  companyPhoto?: string;  // ✅ 백엔드에서 직접 받음
  position: string;
  careerLevel: string;
  education: string;
  type?: string;
  views: number;
  location: string;
  endAt: string;
}

const AttentionSection: React.FC = () => {
  const [popularJobs, setPopularJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [scrappedJobs, setScrappedJobs] = useState<Set<number>>(new Set());
  // ❌ companyPhotos 상태 제거 - 더 이상 필요 없음

  const cardsPerPage = 5;
  const totalPages = 3;
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get("/api/jobposts");
        const jobs: Job[] = res.data;

        console.log("✅ 받아온 공고 데이터:", jobs[0]); // 디버깅용

        // ✅ 조회수 기준 내림차순 정렬 후 상위 15개
        const sortedJobs = jobs
          .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
          .slice(0, 15);

        setPopularJobs(sortedJobs);
        // ❌ fetchCompanyPhotos 호출 제거 - 더 이상 필요 없음
      } catch (err) {
        console.error("공고 불러오기 실패", err);
      }
    };
    fetchJobs();
  }, []);

  // ❌ fetchCompanyPhotos 함수 전체 제거 - 더 이상 필요 없음

  // 스크랩 상태 확인
  useEffect(() => {
    const fetchScrapStatus = async () => {
      try {
        const res = await api.get(`/api/mypage/favorites/jobposts?page=0&size=1000`);
        const scrappedItems = res.data.rows || res.data.content || [];
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
        const res = await api.delete(`/api/mypage/favorites/jobposts/${targetJobId}`);
        if (res.status === 204 || res.status === 200) {
          setScrappedJobs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(targetJobId);
            return newSet;
          });
        }
      } else {
        const res = await api.post(`/api/mypage/favorites/jobposts/${targetJobId}`);
        if (res.status === 200 && res.data) {
          setScrappedJobs((prev) => new Set(prev).add(targetJobId));
        }
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
      await api.post(`/api/jobposts/${jobId}/views`);
    } catch (err) {
      console.error("조회수 증가 실패:", err);
    }
    navigate(`/jobPostings/${jobId}`);
  };

  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 0));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));

  // 각 페이지마다 이동할 거리 계산
  const getSlideDistance = (page: number) => {
    return page * 1345;
  };

  return (
    <section className="relative mb-12 max-w-[1440px] mx-auto w-full">
      {/* 제목 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">모두가 주목하는 공고</h2>

        {/* 페이지 버튼 - 제목 오른쪽 */}
        <div
          ref={buttonsContainerRef}
          className="flex space-x-2"
        >
          <button
            onClick={goToPreviousPage}
            className={`bg-gray-300 hover:bg-gray-400 rounded-full w-7 h-7 flex items-center justify-center text-white z-10 ${currentPage === 0 ? 'invisible' : ''
              }`}
          >
            ‹
          </button>
          <button
            onClick={goToNextPage}
            className={`bg-gray-300 hover:bg-gray-400 rounded-full w-7 h-7 flex items-center justify-center text-white z-10 ${currentPage === totalPages - 1 ? 'invisible' : ''
              }`}
          >
            ›
          </button>
        </div>
      </div>

      {/* 카드 리스트 - 슬라이드 애니메이션 적용 */}
      <div className="overflow-hidden">
        <div
          ref={cardsContainerRef}
          className="flex space-x-4 pb-6 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${getSlideDistance(currentPage)}px)` }}
        >
          {popularJobs.map((job) => (
            <div
              key={job.id}
              className="relative w-[253px] h-[288px] bg-white border border-gray-200 rounded-3xl overflow-hidden flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleJobClick(job.id)}
            >
              {/* ✅ 회사 이미지 - job.companyPhoto 직접 사용 */}
              <div className="w-full h-[144px] bg-white overflow-hidden flex items-center justify-center border-b border-gray-100 p-4">
                {job.companyPhoto ? (
                  <img
                    src={job.companyPhoto}
                    alt={job.companyName}
                    className="max-w-[80%] max-h-[80%] object-contain"
                    onError={(e) => {
                      console.error(`❌ 이미지 로드 실패: ${job.companyName}`, job.companyPhoto);
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
              <div className="pt-[16px] pb-[20px] px-[24px]">
                <p className="font-semibold text-gray-800 text-[20px] ">{job.companyName}</p>
                <p className="text-gray-900 font-normal text-[16px] mt-[4px] truncate">
                  {job.title}
                </p>
                <p className="text-gray-500 text-[14px]">
                  {job.position} / {job.careerLevel} / {job.education} / {job.location}
                </p>

                <p className="text-gray-500 text-[16px] text-right mt-2">
                  - {new Date(job.endAt).toLocaleDateString("ko-KR", {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </p>
              </div>

              {/* 북마크 버튼 */}
              <button
                onClick={(e) => handleBookmarkClick(e, job.id)}
                className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10"
                aria-label={scrappedJobs.has(job.id) ? "북마크 제거" : "북마크 추가"}
              >
                {scrappedJobs.has(job.id) ? (
                  <BookmarkSolidIcon className="w-5 h-5 text-[#006AFF]" />
                ) : (
                  <BookmarkIcon className="w-5 h-5 text-gray-600" />
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