import React, { useState, useEffect, useRef } from "react";
import { EyeIcon } from "@heroicons/react/24/outline";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

interface Job {
  id: number;
  title: string;
  companyName: string;
  position: string;      // 직무
  careerLevel: string;   // 경력
  education: string;     // 학력
  type?: string;         // 고용형태 (추가)
  views: number;
  location: string;
}

const AttentionSection: React.FC = () => {
  const [popularJobs, setPopularJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
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

        // ✅ 조회수 기준 내림차순 정렬 후 상위 15개
        const sortedJobs = jobs
          .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
          .slice(0, 15);

        setPopularJobs(sortedJobs);
      } catch (err) {
        console.error("공고 불러오기 실패", err);
      }
    };
    fetchJobs();
  }, []);

  const startIndex = currentPage * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;

  // ✅ 카드 클릭 시 상세 페이지로 이동
  const handleJobClick = (jobId: number) => {
    navigate(`/jobPostings/${jobId}`);
  };

  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 0));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));

  useEffect(() => {
    if (cardsContainerRef.current && buttonsContainerRef.current) {
      const cardsWidth = cardsContainerRef.current.getBoundingClientRect().width;
      const buttonsWidth = buttonsContainerRef.current.getBoundingClientRect().width;
      const adjustPosition = cardsWidth - buttonsWidth;
      buttonsContainerRef.current.style.transform = `translateX(${adjustPosition}px)`;
    }
  }, [currentPage]);

  return (
    <section className="mb-12 relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">모두가 주목하는 공고</h2>
      </div>

      <div ref={cardsContainerRef} className="flex justify-center space-x-4 pb-6">
        {popularJobs.slice(startIndex, endIndex).map(job => (
          <div
            key={job.id}
            className="min-w-[238px] h-60 bg-white rounded-lg shadow-md overflow-hidden flex-shrink-0 p-3 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleJobClick(job.id)}
          >
            <p className="font-semibold text-gray-800 text-sm">{job.companyName}</p>
            <p className="text-gray-900 font-bold mt-1">{job.title}</p>
            <p className="text-gray-500 text-xs mt-2">
              {job.position} / {job.careerLevel} / {job.education} / {job.location}
            </p>
            <div className="flex items-center space-x-1 mt-2 text-gray-500 text-xs">
              <EyeIcon className="w-3 h-3" />
              <span>{job.views ?? 0}</span>
            </div>
          </div>
        ))}
      </div>

      <div ref={buttonsContainerRef} className="flex space-x-2 absolute top-0">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 0}
          className="bg-gray-300 hover:bg-gray-400 rounded-full w-6 h-6 flex items-center justify-center text-white z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ‹
        </button>
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages - 1}
          className="bg-gray-300 hover:bg-gray-400 rounded-full w-6 h-6 flex items-center justify-center text-white z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </section>
  );
};

export default AttentionSection;