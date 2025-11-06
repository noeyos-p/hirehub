import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom"; // ✅ useNavigate 추가
import {
  BookmarkIcon,
  StarIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon, StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import JobDetail from "./jopPostingComponents/JobDetail"; // 'jop' 오타로 보임, 'job'으로 수정 권장
import api from "../api/api";

const JobPostings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // ✅ useNavigate 훅 추가
  const searchQuery = searchParams.get("search") || "";
  const companyFilter = searchParams.get("company") || "";
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
  const [favoritedCompanies, setFavoritedCompanies] = useState<Set<number>>(new Set());
  const [scrappedJobs, setScrappedJobs] = useState<Set<number>>(new Set());
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const itemsPerPage = 10;

  // ✅ 드롭다운 상태 관리
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const positionRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const educationRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  // ✅ 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        positionRef.current &&
        !positionRef.current.contains(event.target as Node) &&
        experienceRef.current &&
        !experienceRef.current.contains(event.target as Node) &&
        educationRef.current &&
        !educationRef.current.contains(event.target as Node) &&
        locationRef.current &&
        !locationRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await api.get("/api/mypage/favorites/companies?page=0&size=1000");
      const items = res.data.rows || res.data.content || res.data.items || [];
      const companyIds = new Set<number>(
        items.map((item: any) => Number(item.companyId)).filter((id: number) => !isNaN(id))
      );
      setFavoritedCompanies(companyIds);
    } catch (err: any) {
      console.error("❌ 즐겨찾기 목록 로딩 실패:", err);
      if (err.response?.status !== 401) {
        setFavoritedCompanies(new Set());
      }
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get("/api/jobposts");
        setJobListings(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "채용공고를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

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

  useEffect(() => {
    const fetchScrappedJobs = async () => {
      try {
        const res = await api.get("/api/mypage/favorites/jobposts?page=0&size=1000");
        const items = res.data.rows || res.data.content || [];
        const jobIds = new Set<number>(
          items.map((item: any) => Number(item.jobPostId)).filter((id: number) => !isNaN(id))
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, companyFilter]);

  const clearCompanyFilter = () => {
    window.location.href = "/jobPostings";
  };

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
        }
      } else {
        const res = await api.post(`/api/mypage/favorites/companies/${companyId}`);
        if (res.status === 200 && res.data) {
          setFavoritedCompanies((prev) => new Set(prev).add(companyId));
          window.dispatchEvent(new CustomEvent("favorite-changed"));
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
        }
      } else {
        const res = await api.post(`/api/mypage/favorites/jobposts/${jobId}`);
        if (res.status === 200 && res.data) {
          setScrappedJobs((prev) => new Set(prev).add(jobId));
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

  const handleJobClick = async (jobId: number) => {
    try {
      await api.post(`/api/jobposts/${jobId}/views`);
      setJobListings((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, views: (j.views ?? 0) + 1 } : j))
      );
      // ✅ navigate를 사용하여 URL에 공고 ID를 포함하여 이동
      navigate(`/jobPostings/${jobId}`);
    } catch (err) {
      console.error("조회수 증가 실패:", err);
      // ✅ 에러가 발생하더라도 페이지 이동은 진행
      navigate(`/jobPostings/${jobId}`);
    }
    // ✅ setSelectedJobId는 제거 (URL 기반 라우팅으로 대체)
    // setSelectedJobId(jobId);
  };

  // 이력서 목록 가져오기
  const fetchResumes = async () => {
    try {
      const { data } = await api.get("/api/mypage/resumes", {
        params: { page: 0, size: 50 },
      });
      const list: any[] = data?.items ?? data?.content ?? [];
      setResumes(list.filter((r: any) => !r.locked));
    } catch (e) {
      alert("이력서 목록을 불러올 수 없습니다.");
    }
  };

  // 지원하기 클릭
  const handleApplyClick = async () => {
    console.log("지원하기 클릭됨!");
    console.log("selectedJobId:", selectedJobId);
    setShowApplyModal(true);
    await fetchResumes();
  };

  // 지원 제출
  const handleSubmitApply = async () => {
    if (!selectedResumeId) return alert("이력서를 선택해주세요.");
    if (!selectedJobId) return;
    if (!confirm("선택한 이력서로 지원하시겠습니까? 제출 후에는 이력서를 수정할 수 없습니다.")) return;
    try {
      setIsApplying(true);
      await api.post("/api/mypage/applies", {
        jobPostId: selectedJobId,
        resumeId: selectedResumeId,
      });
      alert("지원이 완료되었습니다!");
      setShowApplyModal(false);
      setSelectedResumeId(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "지원 중 오류가 발생했습니다.");
    } finally {
      setIsApplying(false);
    }
  };

  const seoulDistricts = [
    "강남구",
    "강동구",
    "강북구",
    "강서구",
    "관악구",
    "광진구",
    "구로구",
    "금천구",
    "노원구",
    "도봉구",
    "동대문구",
    "동작구",
    "마포구",
    "서대문구",
    "서초구",
    "성동구",
    "성북구",
    "송파구",
    "양천구",
    "영등포구",
    "용산구",
    "은평구",
    "종로구",
    "중구",
    "중랑구",
  ];

  const filteredJobs = jobListings.filter((job) => {
    const jobTitle = job.title?.toLowerCase() || "";
    const jobCompany = job.companyName?.toLowerCase() || "";
    const jobPosition = job.position?.toLowerCase() || "";
    const jobCareer = job.careerLevel?.toLowerCase() || "";
    const jobEdu = job.education?.toLowerCase() || "";
    const jobLoc = job.location?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    const matchesCompany = !companyFilter || String(job.companyId) === companyFilter;
    const matchesSearch =
      !searchQuery ||
      jobTitle.includes(query) ||
      jobCompany.includes(query) ||
      jobPosition.includes(query) ||
      jobLoc.includes(query);
    const matchesPosition = !filters.position || jobPosition.includes(filters.position.toLowerCase());
    const matchesExperience = !filters.experience || jobCareer.includes(filters.experience.toLowerCase());
    const matchesEducation = !filters.education || jobEdu.includes(filters.education.toLowerCase());
    const matchesLocation = !filters.location || jobLoc.includes(filters.location.toLowerCase());
    return matchesCompany && matchesSearch && matchesPosition && matchesExperience && matchesEducation && matchesLocation;
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ✅ 필터 옵션 데이터
  const filterOptions = {
    position: [
      { value: "", label: "전체" },
      { value: "프론트", label: "프론트" },
      { value: "백엔드", label: "백엔드" },
      { value: "풀스택", label: "풀스택" },
      { value: "DevOps", label: "DevOps" },
      { value: "데이터", label: "데이터" },
      { value: "AI", label: "AI" },
    ],
    experience: [
      { value: "", label: "전체" },
      { value: "신입", label: "신입" },
      { value: "경력", label: "경력" },
      { value: "경력무관", label: "경력무관" },
    ],
    education: [
      { value: "", label: "전체" },
      { value: "고졸", label: "고졸" },
      { value: "대졸", label: "대졸" },
      { value: "학력무관", label: "학력무관" },
    ],
    location: [{ value: "", label: "전체" }, ...seoulDistricts.map((district) => ({ value: district, label: district }))],
  };

  // ✅ 드롭다운 토글
  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  // ✅ 필터 선택 핸들러
  const handleFilterSelect = (filterType: string, value: string) => {
    setFilters({ ...filters, [filterType]: value });
    setOpenDropdown(null);
  };

  // ✅ 선택된 값 표시 함수
  const getDisplayLabel = (filterType: string) => {
    const value = filters[filterType as keyof typeof filters];
    if (!value) {
      return filterType === "position"
        ? "직무"
        : filterType === "experience"
        ? "경력"
        : filterType === "education"
        ? "학력"
        : "희망지역";
    }
    return value;
  };

  // 지원하기 모달
  const ApplyModal = () => {
    console.log("ApplyModal 렌더링됨");
    console.log("resumes:", resumes);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-semibold">지원할 이력서 선택</h3>
            <button
              onClick={() => {
                setShowApplyModal(false);
                setSelectedResumeId(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {resumes.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p>제출 가능한 이력서가 없습니다.</p>
                <p className="text-sm mt-2">새 이력서를 작성해주세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resumes.map((resume: any) => (
                  <label
                    key={resume.id}
                    className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedResumeId === resume.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="resume"
                        value={resume.id}
                        checked={selectedResumeId === resume.id}
                        onChange={() => setSelectedResumeId(resume.id)}
                        className="accent-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{resume.title}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          최종 수정: {new Date(resume.updateAt || resume.createAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 p-6 border-t">
            <button
              onClick={() => {
                setShowApplyModal(false);
                setSelectedResumeId(null);
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              disabled={isApplying}
            >
              취소
            </button>
            <button
              onClick={handleSubmitApply}
              disabled={!selectedResumeId || isApplying}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? "지원 중..." : "지원하기"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ✅ JobDetail 화면 조건문 제거
  // URL 기반 라우팅으로 대체하므로 이 조건문은 필요 없음
  // if (selectedJobId) {
  //   const selectedJob = jobListings.find((j) => j.id === selectedJobId);
  //   return (
  //     <>
  //       <JobDetail jobId={selectedJobId} onBack={() => setSelectedJobId(null)} />
  //       {showApplyModal && <ApplyModal />}
  //     </>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-[55px] py-3">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>
        )}
        {companyFilter && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex items-center justify-between">
            <span>
              해당 기업의 채용공고: <strong>{filteredJobs.length}</strong>개
            </span>
            <button onClick={clearCompanyFilter} className="text-blue-600 hover:text-blue-800 underline text-xs">
              필터 해제
            </button>
          </div>
        )}
        {searchQuery && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex items-center justify-between">
            <span>
              '<strong>{searchQuery}</strong>' 검색 결과: <strong>{filteredJobs.length}</strong>개의 공고
            </span>
            <button
              onClick={() => (window.location.href = "/jobPostings")}
              className="text-blue-600 hover:text-blue-800 underline text-xs"
            >
              전체 보기
            </button>
          </div>
        )}
        {/* ✅ 필터 드롭다운 */}
        <div className="flex flex-wrap items-center gap-4 mb-3">
          {/* 직무 필터 */}
          <div className="relative" ref={positionRef}>
            <button
              onClick={() => toggleDropdown("position")}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition font-light text-[16px] text-black min-w-[120px] justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{getDisplayLabel("position")}</span>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-500 transition-transform ${openDropdown === "position" ? "rotate-180" : ""}`}
              />
            </button>
            {openDropdown === "position" && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {filterOptions.position.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect("position", option.value)}
                    className={`block w-full text-left px-4 py-2 text-[14px] transition ${
                      filters.position === option.value ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 경력 필터 */}
          <div className="relative" ref={experienceRef}>
            <button
              onClick={() => toggleDropdown("experience")}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition font-light text-[16px] text-black min-w-[120px] justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{getDisplayLabel("experience")}</span>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  openDropdown === "experience" ? "rotate-180" : ""
                }`}
              />
            </button>
            {openDropdown === "experience" && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {filterOptions.experience.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect("experience", option.value)}
                    className={`block w-full text-left px-4 py-2 text-[14px] transition ${
                      filters.experience === option.value ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 학력 필터 */}
          <div className="relative" ref={educationRef}>
            <button
              onClick={() => toggleDropdown("education")}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition font-light text-[16px] text-black min-w-[120px] justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{getDisplayLabel("education")}</span>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-500 transition-transform ${openDropdown === "education" ? "rotate-180" : ""}`}
              />
            </button>
            {openDropdown === "education" && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {filterOptions.education.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect("education", option.value)}
                    className={`block w-full text-left px-4 py-2 text-[14px] transition ${
                      filters.education === option.value ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 희망지역 필터 */}
          <div className="relative" ref={locationRef}>
            <button
              onClick={() => toggleDropdown("location")}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition font-light text-[16px] text-black min-w-[120px] justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{getDisplayLabel("location")}</span>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-500 transition-transform ${openDropdown === "location" ? "rotate-180" : ""}`}
              />
            </button>
            {openDropdown === "location" && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-[300px] overflow-y-auto">
                {filterOptions.location.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect("location", option.value)}
                    className={`block w-full text-left px-4 py-2 text-[14px] transition ${
                      filters.location === option.value ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
                  className="flex justify-between items-start hover:bg-gray-50 px-2 rounded-md transition py-[26px] px-[24px]"
                >
                  {/* 왼쪽: 회사명 + 세로선 + 공고 정보 */}
                  <div className="flex-1 flex gap-4 cursor-pointer" onClick={() => handleJobClick(job.id)}>
                    {/* 회사명 (너비 고정) */}
                    <div className="w-[160px] flex items-center gap-2">
                      <p className="text-[20px] font-semibold text-gray-900 truncate">{job.companyName}</p>
                      <button
                        onClick={(e) => handleFavoriteClick(e, job.companyId)}
                        className="transition-all hover:scale-110 flex-shrink-0"
                        title={favoritedCompanies.has(job.companyId) ? "즐겨찾기 해제" : "즐겨찾기"}
                      >
                        {favoritedCompanies.has(job.companyId) ? (
                          <StarSolidIcon className="w-5 h-5 text-[#006AFF]" />
                        ) : (
                          <StarIcon className="w-5 h-5 text-gray-400 hover:text-[#006AFF]" />
                        )}
                      </button>
                    </div>
                    {/* 세로 구분선 */}
                    <div className="w-px bg-gray-300"></div>
                    {/* 공고 정보 */}
                    <div className="flex-1 ml-[20px]">
                      <p className="text-[16px] font-normal text-gray-800 mb-[9px]">{job.title}</p>
                      <p className="text-sm text-gray-500">
                        {job.position && <span>{job.position} / </span>}
                        {job.careerLevel} / {job.education} / {job.location}
                      </p>
                    </div>
                  </div>
                  {/* 오른쪽: 조회수, 스크랩, 날짜 */}
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {/* 조회수 + 스크랩 */}
                    <div className="flex items-center gap-3 mb-[9px]">
                      <div className="flex items-center gap-1 text-gray-500">
                        <EyeIcon className="w-4 h-4" />
                        <span className="text-sm">{job.views ?? 0}</span>
                      </div>
                      <button
                        onClick={(e) => handleBookmarkClick(e, job.id)}
                        className="transition-all hover:scale-110"
                        title={scrappedJobs.has(job.id) ? "북마크 해제" : "북마크 추가"}
                      >
                        {scrappedJobs.has(job.id) ? (
                          <BookmarkSolidIcon className="w-5 h-5 text-[#006AFF]" />
                        ) : (
                          <BookmarkIcon className="w-5 h-5 text-gray-600 hover:text-[#006AFF]" />
                        )}
                      </button>
                    </div>
                    {/* 날짜 */}
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      {job.startAt?.replace(/-/g, ".")} - {job.endAt?.replace(/-/g, ".")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* ✅ 페이지네이션 */}
            <div className="mt-8 flex items-center justify-center gap-2 mb-[12px]">
              {/* 처음으로 */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDoubleLeftIcon className="w-5 h-5" />
              </button>
              {/* 이전 */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              {/* 페이지 번호 */}
              {(() => {
                const pages = [];
                const maxVisible = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                if (endPage - startPage + 1 < maxVisible) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-10 h-10 flex items-center justify-center rounded-md text-base transition border font-medium ${
                        currentPage === i
                          ? "bg-white text-[#006AFF] border-[#006AFF]"
                          : "bg-white text-gray-700 border-gray-300 hover:text-[#006AFF]"
                      }`}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}
              {/* 다음 */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
              {/* 마지막으로 */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDoubleRightIcon className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
        {/* ✅ ApplyModal은 항상 렌더링 가능하도록 */}
        {showApplyModal && <ApplyModal />}
      </div>
    </div>
  );
};

export default JobPostings;