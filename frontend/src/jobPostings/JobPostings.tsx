import React, { useEffect, useState, useRef, useMemo } from "react";
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
import JobDetail from "./jopPostingComponents/JobDetail";
import { jobPostApi } from "../api/jobPostApi";
import type { JobPostResponse, ResumeResponse } from "../types/interface";

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
  const [selectedTechStacks, setSelectedTechStacks] = useState<string[]>([]); // ✅ 다중 선택된 기술스택
  const [sortBy, setSortBy] = useState<"recent" | "deadline">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobListings, setJobListings] = useState<JobPostResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [favoritedCompanies, setFavoritedCompanies] = useState<Set<number>>(new Set());
  const [scrappedJobs, setScrappedJobs] = useState<Set<number>>(new Set());
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const itemsPerPage = 10;

  // 회사 이미지 상태 (모바일 전용)
  const [companyPhotos, setCompanyPhotos] = useState<Record<number, string>>({});

  // 무한 스크롤을 위한 state (모바일 전용)
  const [displayedCount, setDisplayedCount] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 모바일 여부 감지 (768px 이하)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ✅ 드롭다운 상태 관리
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const positionRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const educationRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const techStackRef = useRef<HTMLDivElement>(null); // ✅ 추가

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        !locationRef.current.contains(event.target as Node) &&
        techStackRef.current && // ✅ 추가
        !techStackRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchFavorites = async () => {
    try {
      const items = await jobPostApi.getFavoriteCompanies();
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

  // 회사 이미지 가져오기 (중복 제거 최적화)
  const fetchCompanyPhotos = async (jobs: JobPostResponse[]) => {
    // 중복 제거: 고유한 companyId만 추출
    const uniqueCompanyIds = Array.from(new Set(jobs.map(job => job.companyId)));

    // 이미 로드된 회사는 제외
    const newCompanyIds = uniqueCompanyIds.filter(id => !companyPhotos[id]);

    if (newCompanyIds.length === 0) return; // 새로 로드할 회사가 없으면 종료

    const photos: Record<number, string> = {};
    await Promise.all(
      newCompanyIds.map(async (companyId) => {
        try {
          const company = await jobPostApi.getCompanyById(companyId);
          if (company.photo) {
            photos[companyId] = company.photo;
          }
        } catch (e) {
          console.error(`Failed to fetch photo for company ${companyId}`, e);
        }
      })
    );
    setCompanyPhotos((prev) => ({ ...prev, ...photos }));
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await jobPostApi.getJobPosts();
        // 최신순(ID 역순) 정렬
        const sortedData = data.sort((a, b) => b.id - a.id);
        setJobListings(sortedData);
        // 모바일이고 공고가 있으면 회사 이미지 로드
        if (isMobile && data.length > 0) {
          fetchCompanyPhotos(data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "채용공고를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [isMobile]);

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
        const items = await jobPostApi.getScrappedJobs();
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
    setDisplayedCount(10); // 필터 변경 시 초기화
  }, [searchQuery, companyFilter, filters]);

  // 무한 스크롤: Intersection Observer (모바일 전용)
  useEffect(() => {
    if (!isMobile) return; // 데스크톱에서는 무한 스크롤 비활성화

    const observer = new IntersectionObserver(
      (entries) => {
        // 관찰 대상이 화면에 보이고, 더 불러올 데이터가 있고, 로딩 중이 아닐 때
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setDisplayedCount((prev) => prev + 10);
        }
      },
      { threshold: 0.1, rootMargin: "100px" } // 100px 전에 미리 로드
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoading, isMobile]);

  const clearCompanyFilter = () => {
    window.location.href = "/jobPostings";
  };

  const handleFavoriteClick = async (e: React.MouseEvent, companyId: number) => {
    e.stopPropagation();
    const isFavorited = favoritedCompanies.has(companyId);
    try {
      if (isFavorited) {
        await jobPostApi.removeFavoriteCompany(companyId);
        setFavoritedCompanies((prev) => {
          const newSet = new Set(prev);
          newSet.delete(companyId);
          return newSet;
        });
        window.dispatchEvent(new CustomEvent("favorite-changed"));
      } else {
        await jobPostApi.addFavoriteCompany(companyId);
        setFavoritedCompanies((prev) => new Set(prev).add(companyId));
        window.dispatchEvent(new CustomEvent("favorite-changed"));
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
        await jobPostApi.removeScrapJob(jobId);
        setScrappedJobs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } else {
        await jobPostApi.addScrapJob(jobId);
        setScrappedJobs((prev) => new Set(prev).add(jobId));
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
      const list = await jobPostApi.getResumes();
      setResumes(list.filter((r) => !r.locked));
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
      await jobPostApi.applyToJob({
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

  // ✅ 기술스택 데이터 정제를 위한 헬퍼 함수
  const getJobTechStacks = (job: JobPostResponse) => {
    if (!job.techStacks) return [];
    // 콤마(,)로 구분된 문자열을 분리하고 공백 제거
    return job.techStacks
      .flatMap(stack => stack.split(','))
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  // ✅ 동적 기술스택 옵션 생성 (중복 제거 및 정렬)
  // ✅ 기술스택 정규화 함수 (대소문자, 공백, 버전 무시) - 매칭용
  const normalizeTechStack = (stack: string) => {
    let s = stack.toLowerCase();
    // 공백, 점(.), 하이픈(-) 제거
    s = s.replace(/[\s\.\-]+/g, "");
    // 버전 번호 제거 (숫자로 시작하는 뒷부분)
    s = s.replace(/\d[\d\+x]*$/, "");
    return s;
  };

  // ✅ 기술스택 표시용 정제 함수 (예: "Java 17+" -> "Java")
  const cleanTechStack = (stack: string) => {
    // 버전 패턴: 공백(옵션) + 숫자 + (숫자/./+/x/문자)의 반복이 끝에 옴
    // 예: " 17", "17+", " 3.x", "5"
    const cleaned = stack.replace(/\s?\d[\d\.\+x\-]*$/i, "");
    // 너무 짧아지면(1글자 이하) 원본 유지 (예: "C++", "S3" 등 보호)
    // S3 -> S (X)
    // C++ -> C++ (숫자 없음, OK)
    if (cleaned.length < 2) return stack;
    return cleaned;
  }

  // ✅ 동적 기술스택 옵션 생성 (중복 제거 및 대소문자/버전 통합)
  const techStackOptions = useMemo(() => {
    const stackMap = new Map<string, string>();

    jobListings.forEach(job => {
      getJobTechStacks(job).forEach(stack => {
        const normalized = normalizeTechStack(stack);
        const display = cleanTechStack(stack).trim();

        if (stackMap.has(normalized)) {
          const current = stackMap.get(normalized)!;
          // 더 일반적인(짧은) 이름을 선호 (Java17+ -> Java)
          if (display.length < current.length) {
            stackMap.set(normalized, display);
          }
          // 길이가 같다면 대문자가 포함된 쪽 선호
          else if (display.length === current.length && display !== display.toLowerCase() && current === current.toLowerCase()) {
            stackMap.set(normalized, display);
          }
        } else {
          stackMap.set(normalized, display);
        }
      });
    });

    // 알파벳 순 정렬
    const sortedStacks = Array.from(stackMap.values()).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    // 중복 제거 (cleanTechStack 후에 normalized가 다른데 display가 같아질 수도 있음. 예: Node.js vs Nodejs -> 둘다 Nodejs가 될 수 있음?)
    // Set으로 한번 더 유니크하게 만듦
    const uniqueStacks = Array.from(new Set(sortedStacks));

    return [
      { value: "", label: "전체" },
      ...uniqueStacks.map(stack => ({ value: stack, label: stack }))
    ];
  }, [jobListings]);

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
    const matchesExperience = !filters.experience ||
      (filters.experience === "경력"
        ? jobCareer.includes("년") // "경력" 선택 시 "N년" 포함된 것 매칭
        : jobCareer.includes(filters.experience.toLowerCase()));
    const matchesEducation = !filters.education || jobEdu.includes(filters.education.toLowerCase());
    const matchesLocation = !filters.location || jobLoc.includes(filters.location.toLowerCase());

    // ✅ 기술스택 필터 (다중 선택 OR 로직 + 정규화 적용)
    const matchesTechStack = selectedTechStacks.length === 0 ||
      getJobTechStacks(job).some(stack =>
        selectedTechStacks.some(selected => normalizeTechStack(selected) === normalizeTechStack(stack))
      );

    return matchesCompany && matchesSearch && matchesPosition && matchesExperience && matchesEducation && matchesLocation && matchesTechStack;
  });

  // ✅ 정렬 로직 적용
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === "recent") {
      return b.id - a.id; // 최신순 (ID 역순)
    } else {
      // 마감일 순 (오름차순). null(상시채용)은 뒤로 보냄
      if (!a.endAt && !b.endAt) return b.id - a.id;
      if (!a.endAt) return 1;
      if (!b.endAt) return -1;
      return new Date(a.endAt).getTime() - new Date(b.endAt).getTime();
    }
  });

  // 무한 스크롤용: 현재까지 표시할 공고
  const displayedJobs = filteredJobs.slice(0, displayedCount);

  // 더 불러올 데이터가 있는지 확인
  useEffect(() => {
    setHasMore(displayedCount < filteredJobs.length);
  }, [displayedCount, filteredJobs.length]);

  // 무한 스크롤로 새 공고 로드 시 회사 이미지도 추가 로드 (모바일 전용)
  useEffect(() => {
    if (isMobile && displayedJobs.length > 0) {
      fetchCompanyPhotos(displayedJobs);
    }
  }, [displayedCount, isMobile]);

  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);
  const paginatedJobs = sortedJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      { value: "경력무관", label: "경력무관" },
      { value: "1-3", label: "1~3년" },
      { value: "3-5", label: "3~5년" },
      { value: "5-10", label: "5~10년" },
    ],

    education: [
      { value: "", label: "전체" },
      { value: "고졸", label: "고졸" },
      { value: "초대졸", label: "초대졸" }, // 데이터에 존재하므로 추가
      { value: "대졸", label: "대졸" },
      { value: "무관", label: "학력무관" }, // 데이터는 "무관"
    ],
    location: [{ value: "", label: "전체" }, ...seoulDistricts.map((district) => ({ value: district, label: district }))],
    techStack: techStackOptions, // ✅ 동적으로 생성된 옵션 사용
  };

  // ✅ 드롭다운 토글
  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  // ✅ 필터 선택 핸들러
  const handleFilterSelect = (filterType: string, value: string) => {
    if (filterType === "techStack") {
      if (!value) {
        setSelectedTechStacks([]);
      } else {
        if (!selectedTechStacks.includes(value)) {
          setSelectedTechStacks([...selectedTechStacks, value]);
        }
      }
      setOpenDropdown(null);
    } else {
      setFilters({ ...filters, [filterType]: value });
      setOpenDropdown(null);
    }
  };

  // ✅ 선택된 기술스택 제거 핸들러
  const removeTechStack = (stackToRemove: string) => {
    setSelectedTechStacks(selectedTechStacks.filter(stack => stack !== stackToRemove));
  };

  // ✅ 선택된 값 표시 함수
  const getDisplayLabel = (filterType: string) => {
    if (filterType === "techStack") {
      return selectedTechStacks.length > 0 ? `기술스택 (${selectedTechStacks.length})` : "기술스택";
    }
    const value = filters[filterType as keyof typeof filters];
    if (!value) {
      if (filterType === "position") return "직무";
      if (filterType === "experience") return "경력";
      if (filterType === "education") return "학력";
      if (filterType === "location") return "희망지역";
      return "전체";
    }
    return value;
  };

  // 지원하기 모달
  const ApplyModal = () => {
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
                {resumes.map((resume) => (
                  <label
                    key={resume.id}
                    className={`block border rounded-lg p-4 cursor-pointer transition-all ${selectedResumeId === resume.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
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


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-2 sm:px-6 md:px-8 lg:px-12 xl:px-[55px] py-3">
        {/* ... (Error, CompanyFilter, SearchQuery blocks) use same logic as existing ... */}
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

        {/* ✅ 필터 드롭다운 및 정렬 옵션 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center justify-center gap-2 w-full md:w-auto max-w-[390px] md:max-w-none">
            {/* Position Filter */}
            <div className="relative flex-1 md:flex-none" ref={positionRef}>
            <button
              onClick={() => toggleDropdown("position")}
              disabled={isLoading}
              className="w-full md:w-auto flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition font-light text-xs md:text-[16px] text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate text-xs md:text-base">{getDisplayLabel("position")}</span>
              <ChevronDownIcon
                className={`w-3 md:w-4 h-3 md:h-4 text-gray-500 transition-transform flex-shrink-0 ${openDropdown === "position" ? "rotate-180" : ""}`}
              />
            </button>
            {openDropdown === "position" && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {filterOptions.position.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect("position", option.value)}
                    className={`block w-full text-left px-4 py-2 text-[14px] transition ${filters.position === option.value ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Experience Filter */}
          <div className="relative flex-1 md:flex-none" ref={experienceRef}>
            <button
              onClick={() => toggleDropdown("experience")}
              disabled={isLoading}
              className="w-full md:w-auto flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition font-light text-xs md:text-[16px] text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate text-xs md:text-base">{getDisplayLabel("experience")}</span>
              <ChevronDownIcon
                className={`w-3 md:w-4 h-3 md:h-4 text-gray-500 transition-transform ${openDropdown === "experience" ? "rotate-180" : ""
                  }`}
              />
            </button>
            {openDropdown === "experience" && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {filterOptions.experience.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect("experience", option.value)}
                    className={`block w-full text-left px-4 py-2 text-[14px] transition ${filters.experience === option.value ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Education Filter */}
          <div className="relative flex-1 md:flex-none" ref={educationRef}>
            <button
              onClick={() => toggleDropdown("education")}
              disabled={isLoading}
              className="w-full md:w-auto flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition font-light text-xs md:text-[16px] text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate text-xs md:text-base">{getDisplayLabel("education")}</span>
              <ChevronDownIcon
                className={`w-3 md:w-4 h-3 md:h-4 text-gray-500 transition-transform ${openDropdown === "education" ? "rotate-180" : ""}`}
              />
            </button>
            {openDropdown === "education" && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {filterOptions.education.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect("education", option.value)}
                    className={`block w-full text-left px-4 py-2 text-[14px] transition ${filters.education === option.value ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Location Filter */}
          <div className="relative flex-1 md:flex-none" ref={locationRef}>
            <button
              onClick={() => toggleDropdown("location")}
              disabled={isLoading}
              className="w-full md:w-auto flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition font-light text-xs md:text-[16px] text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate text-xs md:text-base">{getDisplayLabel("location")}</span>
              <ChevronDownIcon
                className={`w-3 md:w-4 h-3 md:h-4 text-gray-500 transition-transform ${openDropdown === "location" ? "rotate-180" : ""}`}
              />
            </button>
            {openDropdown === "location" && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {filterOptions.location.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect("location", option.value)}
                    className={`block w-full text-left px-4 py-2 text-[14px] transition ${filters.location === option.value ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Tech Stack Filter */}
          <div className="relative flex-1 md:flex-none" ref={techStackRef}>
            <button
              onClick={() => toggleDropdown("techStack")}
              disabled={isLoading}
              className="w-full md:w-auto flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition font-light text-xs md:text-[16px] text-black disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              <span className="truncate text-xs md:text-base">{getDisplayLabel("techStack")}</span>
              <ChevronDownIcon
                className={`w-3 md:w-4 h-3 md:h-4 text-gray-500 transition-transform ${openDropdown === "techStack" ? "rotate-180" : ""}`}
              />
            </button>
            {openDropdown === "techStack" && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-[300px] overflow-y-auto">
                {filterOptions.techStack.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterSelect("techStack", option.value)}
                    className={`block w-full text-left px-4 py-2 text-[14px] transition focus:outline-none ${selectedTechStacks.includes(option.value) ? "text-[#006AFF] font-medium bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>

          {/* 정렬 옵션 (필터 오른쪽) */}
          <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto md:mr-6">
            <button
              onClick={() => setSortBy("recent")}
              className={`flex-1 md:flex-none px-3 py-1.5 text-xs md:text-sm rounded-md transition-all focus:outline-none ${sortBy === "recent"
                ? "bg-white text-blue-600 shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              최신 작성순
            </button>
            <button
              onClick={() => setSortBy("deadline")}
              className={`flex-1 md:flex-none px-3 py-1.5 text-xs md:text-sm rounded-md transition-all focus:outline-none ${sortBy === "deadline"
                ? "bg-white text-blue-600 shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              마감일 순
            </button>
          </div>
        </div>

        {/* ✅ 선택된 기술스택 칩 표시 */}
        {selectedTechStacks.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTechStacks.map((stack) => (
              <span
                key={stack}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {stack}
                <button
                  onClick={() => removeTechStack(stack)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 text-blue-600 focus:outline-none"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setSelectedTechStacks([])}
              className="text-xs text-gray-500 hover:text-gray-700 underline self-center focus:outline-none"
            >
              초기화
            </button>
          </div>
        )}

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
            {/* 모바일: 카드 형식 */}
            {isMobile ? (
              <div className="flex flex-wrap gap-1 justify-center pb-6">
                {displayedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="relative w-[180px] sm:w-[200px] md:w-[253px] h-[200px] sm:h-[260px] md:h-[288px] bg-white border border-gray-200 rounded-2xl md:rounded-3xl overflow-hidden flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleJobClick(job.id)}
                  >
                    {/* ✅ 회사 이미지 - companyPhotos 사용 */}
                    <div className="w-full h-[100px] sm:h-[120px] md:h-[144px] bg-white overflow-hidden flex items-center justify-center border-b border-gray-100 p-2 md:p-3">
                      {companyPhotos[job.companyId] ? (
                        <img
                          src={companyPhotos[job.companyId]}
                          alt={job.companyName}
                          className="max-w-[95%] md:max-w-[95%] max-h-[95%] md:max-h-[95%] object-contain rounded-lg"
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

                      <p className="text-gray-400 text-[10px] sm:text-[11px] md:text-[14px] lg:text-[16px] text-right mt-1.5 md:mt-2">
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
            ) : (
              /* 데스크톱: 리스트 형식 */
              <div className="divide-y divide-gray-200">
                {paginatedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col sm:flex-row justify-between items-start hover:bg-gray-50 px-2 sm:px-4 md:px-6 rounded-md transition py-4 sm:py-5 md:py-[26px] gap-3 sm:gap-0"
                  >
                    {/* 우측 정렬 옵션 (최신순 / 마감일순) */}
                    <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4 cursor-pointer w-full sm:w-auto" onClick={() => handleJobClick(job.id)}>
                      {/* 회사명 */}
                      <div className="w-full sm:w-[140px] md:w-[160px] flex items-center gap-2">
                        <p className="text-base sm:text-lg md:text-[20px] font-semibold text-gray-900 truncate">{job.companyName}</p>
                        <button
                          onClick={(e) => handleFavoriteClick(e, job.companyId)}
                          className="transition-all hover:scale-110 flex-shrink-0"
                          title={favoritedCompanies.has(job.companyId) ? "즐겨찾기 해제" : "즐겨찾기"}
                        >
                          {favoritedCompanies.has(job.companyId) ? (
                            <StarSolidIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#006AFF]" />
                          ) : (
                            <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-[#006AFF]" />
                          )}
                        </button>
                      </div>
                      {/* 세로 구분선 */}
                      <div className="hidden sm:block w-px bg-gray-300"></div>
                      {/* 공고 정보 */}
                      <div className="flex-1 sm:ml-[20px]">
                        <p className="text-sm sm:text-[15px] md:text-[16px] font-normal text-gray-800 mb-1 sm:mb-[9px] line-clamp-2 sm:line-clamp-1">{job.title}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {job.position && <span>{job.position} / </span>}
                          {job.careerLevel} / {job.education} / {job.location}
                        </p>
                      </div>
                    </div>
                    {/* 오른쪽: 조회수, 스크랩, 날짜 */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 ml-0 sm:ml-4 w-full sm:w-auto justify-between sm:justify-start">
                      {/* 조회수 + 스크랩 */}
                      <div className="flex items-center gap-2 sm:gap-3 mb-0 sm:mb-[9px]">
                        <div className="flex items-center gap-1 text-gray-500">
                          <EyeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">{job.views ?? 0}</span>
                        </div>
                        <button
                          onClick={(e) => handleBookmarkClick(e, job.id)}
                          className="transition-all hover:scale-110"
                          title={scrappedJobs.has(job.id) ? "북마크 해제" : "북마크 추가"}
                        >
                          {scrappedJobs.has(job.id) ? (
                            <BookmarkSolidIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#006AFF]" />
                          ) : (
                            <BookmarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 hover:text-[#006AFF]" />
                          )}
                        </button>
                      </div>
                      {/* 날짜 */}
                      <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {!job.startAt && !job.endAt ? '상시채용' : `~${job.endAt?.replace(/-/g, ".")}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 모바일: 무한 스크롤 UI */}
            {isMobile && (
              <>
                {/* 로딩 인디케이터 & Observer 타겟 */}
                {hasMore && (
                  <div ref={observerTarget} className="py-8 flex justify-center">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#006AFF]"></div>
                      <span className="text-sm">더 불러오는 중...</span>
                    </div>
                  </div>
                )}

                {/* 모든 데이터 로드 완료 */}
                {!hasMore && filteredJobs.length > 10 && (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    모든 채용공고를 불러왔습니다. (총 {filteredJobs.length}개)
                  </div>
                )}
              </>
            )}

            {/* 데스크톱: 페이지네이션 */}
            {!isMobile && (
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
                        className={`w-10 h-10 flex items-center justify-center rounded-md text-base transition border font-medium ${currentPage === i
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
            )}
          </>
        )}
        {/* ✅ ApplyModal은 항상 렌더링 가능하도록 */}
        {showApplyModal && <ApplyModal />}
      </div >
    </div >
  );
};

export default JobPostings;