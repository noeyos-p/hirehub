import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookmarkIcon, StarIcon, EyeIcon } from "@heroicons/react/24/outline";
import {
  BookmarkIcon as BookmarkSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/24/solid";
import JobDetail from "./jopPostingComponents/JobDetail";
import api from "../api/api";

const JobPostings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const companyFilter = searchParams.get("company") || ""; // ✅ 회사 필터 추가
  
  const [filters, setFilters] = useState({
    position: "",
    experience: "",
    education: "",
    location: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobListings, setJobListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [favoritedCompanies, setFavoritedCompanies] = useState<Set<number>>(
    new Set()
  );
  const [scrappedJobs, setScrappedJobs] = useState<Set<number>>(new Set());
  const itemsPerPage = 10;

  // ✅ 즐겨찾기 목록 불러오기
  const fetchFavorites = async () => {
    try {
      const res = await api.get("/api/mypage/favorites/companies?page=0&size=1000");
      const items =
        res.data.rows || res.data.content || res.data.items || [];
      const companyIds = new Set<number>(
        items
          .map((item: any) => Number(item.companyId))
          .filter((id: number) => !isNaN(id))
      );
      setFavoritedCompanies(companyIds);
    } catch (err: any) {
      console.error("❌ 즐겨찾기 목록 로딩 실패:", err);
      if (err.response?.status !== 401) {
        setFavoritedCompanies(new Set());
      }
    }
  };

  // ✅ 공고 목록 불러오기
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get("/api/jobposts");
        setJobListings(response.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "채용공고를 불러오는데 실패했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // ✅ 즐겨찾기 변경 감지
  useEffect(() => {
    fetchFavorites();
    const handleFavoriteChanged = () => {
      fetchFavorites();
    };
    window.addEventListener("favorite-changed", handleFavoriteChanged);
    return () => {
      window.removeEventListener("favorite-changed", handleFavoriteChanged);
    };
  }, []);

  // ✅ 스크랩 목록 불러오기
  useEffect(() => {
    const fetchScrappedJobs = async () => {
      try {
        const res = await api.get("/api/mypage/favorites/jobposts?page=0&size=1000");
        const items = res.data.rows || res.data.content || [];
        const jobIds = new Set<number>(
          items
            .map((item: any) => Number(item.jobPostId))
            .filter((id: number) => !isNaN(id))
        );
        setScrappedJobs(jobIds);
      } catch (err: any) {
        if (err.response?.status !== 401) {
          setScrappedJobs(new Set());
        }
      }
    };
    fetchScrappedJobs();
  }, []);

  // ✅ 검색어/회사필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, companyFilter]);

  // ✅ 회사 필터 제거 핸들러
  const clearCompanyFilter = () => {
    window.location.href = "/jobPostings";
  };

  // ✅ 즐겨찾기 토글
  const handleFavoriteClick = async (e: React.MouseEvent, companyId: number) => {
    e.stopPropagation();
    const isFavorited = favoritedCompanies.has(companyId);
    try {
      if (isFavorited) {
        const res = await api.delete(`/api/mypage/favorites/companies/${companyId}`);
        if (res.status === 204 || res.status === 200) {
          setFavoritedCompanies((prev) => {
            const newSet = new Set(prev);
            newSet.delete(companyId);
            return newSet;
          });
          window.dispatchEvent(new CustomEvent("favorite-changed"));
          alert("기업 즐겨찾기가 해제되었습니다.");
        }
      } else {
        const res = await api.post(`/api/mypage/favorites/companies/${companyId}`);
        if (res.status === 200 && res.data) {
          setFavoritedCompanies((prev) => new Set(prev).add(companyId));
          window.dispatchEvent(new CustomEvent("favorite-changed"));
          alert("기업을 즐겨찾기에 추가했습니다.");
        }
      }
    } catch (err: any) {
      let errorMsg = "즐겨찾기 처리에 실패했습니다.";
      if (err.response?.status === 401) {
        errorMsg = "로그인이 필요합니다.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      alert(errorMsg);
    }
  };

  // ✅ 북마크 토글
  const handleBookmarkClick = async (e: React.MouseEvent, jobId: number) => {
    e.stopPropagation();
    const isScrapped = scrappedJobs.has(jobId);
    try {
      if (isScrapped) {
        const res = await api.delete(`/api/mypage/favorites/jobposts/${jobId}`);
        if (res.status === 204 || res.status === 200) {
          setScrappedJobs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });
          alert("북마크가 해제되었습니다.");
        }
      } else {
        const res = await api.post(`/api/mypage/favorites/jobposts/${jobId}`);
        if (res.status === 200 && res.data) {
          setScrappedJobs((prev) => new Set(prev).add(jobId));
          alert("북마크에 저장되었습니다.");
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

  // ✅ 조회수 증가 + 상세 이동
  const handleJobClick = async (jobId: number) => {
    try {
      await api.post(`/api/jobposts/${jobId}/views`);
      setJobListings((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, views: (j.views ?? 0) + 1 } : j
        )
      );
    } catch (err) {
      console.error("조회수 증가 실패:", err);
    }
    setSelectedJobId(jobId);
  };

  const seoulDistricts = [
    "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
    "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구",
    "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구",
    "종로구", "중구", "중랑구",
  ];

  // ✅ 필터 로직 (회사 필터 추가)
  const filteredJobs = jobListings.filter((job) => {
    const jobTitle = job.title?.toLowerCase() || "";
    const jobCompany = job.companyName?.toLowerCase() || "";
    const jobPosition = job.position?.toLowerCase() || "";
    const jobCareer = job.careerLevel?.toLowerCase() || "";
    const jobEdu = job.education?.toLowerCase() || "";
    const jobLoc = job.location?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    // ✅ 회사 필터 조건 추가
    const matchesCompany = !companyFilter || job.companyName === companyFilter;

    const matchesSearch =
      !searchQuery ||
      jobTitle.includes(query) ||
      jobCompany.includes(query) ||
      jobPosition.includes(query) ||
      jobLoc.includes(query);
    const matchesPosition =
      !filters.position ||
      jobPosition.includes(filters.position.toLowerCase());
    const matchesExperience =
      !filters.experience ||
      jobCareer.includes(filters.experience.toLowerCase());
    const matchesEducation =
      !filters.education ||
      jobEdu.includes(filters.education.toLowerCase());
    const matchesLocation =
      !filters.location ||
      jobLoc.includes(filters.location.toLowerCase());

    return (
      matchesCompany && // ✅ 회사 필터 적용
      matchesSearch &&
      matchesPosition &&
      matchesExperience &&
      matchesEducation &&
      matchesLocation
    );
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (selectedJobId) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-4">
        <JobDetail jobId={selectedJobId} onBack={() => setSelectedJobId(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-6 px-4">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* ✅ 회사 필터 배너 */}
        {companyFilter && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex items-center justify-between">
            <span>
              '<strong>{companyFilter}</strong>' 기업의 채용공고:{" "}
              <strong>{filteredJobs.length}</strong>개
            </span>
            <button
              onClick={clearCompanyFilter}
              className="text-blue-600 hover:text-blue-800 underline text-xs"
            >
              필터 해제
            </button>
          </div>
        )}

        {searchQuery && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex items-center justify-between">
            <span>
              '<strong>{searchQuery}</strong>' 검색 결과:{" "}
              <strong>{filteredJobs.length}</strong>개의 공고
            </span>
            <button
              onClick={() => (window.location.href = "/jobPostings")}
              className="text-blue-600 hover:text-blue-800 underline text-xs"
            >
              전체 보기
            </button>
          </div>
        )}

        {/* 필터 */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-700 ">
          <select
            value={filters.position}
            onChange={(e) => setFilters({ ...filters, position: e.target.value })}
            className="px-3 py-2"
            disabled={isLoading}
          >
            <option value="">직무</option>
            <option value="프론트">프론트</option>
            <option value="백엔드">백엔드</option>
            <option value="풀스택">풀스택</option>
            <option value="DevOps">DevOps</option>
            <option value="데이터">데이터</option>
            <option value="AI">AI</option>
          </select>

          <select
            value={filters.experience}
            onChange={(e) =>
              setFilters({ ...filters, experience: e.target.value })
            }
            className="px-3 py-2"
            disabled={isLoading}
          >
            <option value="">경력</option>
            <option value="신입">신입</option>
            <option value="경력">경력</option>
            <option value="경력무관">경력무관</option>
          </select>

          <select
            value={filters.education}
            onChange={(e) =>
              setFilters({ ...filters, education: e.target.value })
            }
            className="px-3 py-2"
            disabled={isLoading}
          >
            <option value="">학력</option>
            <option value="고졸">고졸</option>
            <option value="대졸">대졸</option>
            <option value="학력무관">학력무관</option>
          </select>

          <select
            value={filters.location}
            onChange={(e) =>
              setFilters({ ...filters, location: e.target.value })
            }
            className="px-3 py-2"
            disabled={isLoading}
          >
            <option value="">희망지역</option>
            {seoulDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        {/* 공고 목록 */}
        {isLoading ? (
          <div className="text-center py-10 text-gray-600">로딩 중...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {companyFilter 
              ? `${companyFilter}의 채용 공고가 없습니다.`
              : searchQuery 
              ? "검색 결과가 없습니다." 
              : "채용 공고가 없습니다."}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {paginatedJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex justify-between items-center py-4 hover:bg-gray-100 px-2 rounded-md transition"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleJobClick(job.id)}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {job.companyName}
                      </p>
                      <button
                        onClick={(e) => handleFavoriteClick(e, job.companyId)}
                        className="transition-all hover:scale-110"
                        title={
                          favoritedCompanies.has(job.companyId)
                            ? "즐겨찾기 해제"
                            : "즐겨찾기"
                        }
                      >
                        {favoritedCompanies.has(job.companyId) ? (
                          <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <StarIcon className="w-4 h-4 text-gray-400 hover:text-yellow-500" />
                        )}
                      </button>
                    </div>

                    <p className="text-sm text-gray-800">{job.title}</p>
                    <p className="text-sm text-gray-500">
                      {job.position && <span>{job.position} / </span>}
                      {job.careerLevel} / {job.education} / {job.location}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    {/* 👁 조회수 */}
                    <div className="flex items-center space-x-1 text-gray-500">
                      <EyeIcon className="w-4 h-4" />
                      <span>{job.views ?? 0}</span>
                    </div>

                    <span>
                      {job.startAt} - {job.endAt}
                    </span>

                    <button
                      onClick={(e) => handleBookmarkClick(e, job.id)}
                      className="transition-all hover:scale-110"
                      title={
                        scrappedJobs.has(job.id)
                          ? "북마크 해제"
                          : "북마크 추가"
                      }
                    >
                      {scrappedJobs.has(job.id) ? (
                        <BookmarkSolidIcon className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <BookmarkIcon className="w-5 h-5 text-gray-600 hover:text-yellow-500" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ 페이지네이션 */}
            <div className="flex justify-center items-center space-x-1 mt-8">
              <button
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                «
              </button>

              <button
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ‹
              </button>

              {(() => {
                const pages = [];
                const maxVisible = 5;
                let startPage = Math.max(
                  1,
                  currentPage - Math.floor(maxVisible / 2)
                );
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                if (endPage - startPage + 1 < maxVisible) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      className={`px-3 py-1 text-sm border rounded transition-colors ${
                        currentPage === i
                          ? "bg-gray-300 text-white border-gray-300 hover:bg-gray-400"
                          : "text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                      onClick={() => setCurrentPage(i)}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}

              <button
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                ›
              </button>

              <button
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JobPostings;