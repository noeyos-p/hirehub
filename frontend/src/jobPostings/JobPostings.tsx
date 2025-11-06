import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
import {
  BookmarkIcon as BookmarkSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/24/solid";
import JobDetail from "./jopPostingComponents/JobDetail";
import api from "../api/api";

const JobPostings: React.FC = () => {
  const [searchParams] = useSearchParams();
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

  // ✅ 외부 클릭 시 드롭다운 닫기
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

  // ✅ 검색어 / 회사 필터 변경 시 초기화
  useEffect(() => {
    setSelectedJobId(null);
    setCurrentPage(1);
  }, [searchQuery, companyFilter]);

  // ✅ 1️⃣ 즐겨찾기 목록 불러오기 (호이스팅 문제 해결: useEffect 위로 이동)
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

  // ✅ 2️⃣ 채용공고 목록 불러오기 (배열 보장)
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get("/api/jobposts");
        const raw = response.data;

        // ✅ 배열로 변환 (에러 방지)
        const list = Array.isArray(raw)
          ? raw
          : raw?.content || raw?.rows || raw?.items || (raw ? [raw] : []);

        console.log("✅ 받아온 공고 데이터:", list);
        setJobListings(list);
      } catch (err: any) {
        console.error("❌ 공고 불러오기 실패:", err);
        setError(
          err.response?.data?.message || "채용공고를 불러오는데 실패했습니다."
        );
        setJobListings([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // ✅ 3️⃣ 즐겨찾기 불러오기 useEffect
  useEffect(() => {
    fetchFavorites();
    const handleFavoriteChanged = () => fetchFavorites();
    window.addEventListener("favorite-changed", handleFavoriteChanged);
    return () => {
      window.removeEventListener("favorite-changed", handleFavoriteChanged);
    };
  }, []);

  // ✅ 4️⃣ 스크랩된 공고 불러오기
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

  // 나머지 코드는 동일 👇
  // (핸들러, 필터, 페이지네이션, ApplyModal 등)
  // 🔥 이하 코드는 그대로 두면 돼 — 위의 fetchFavorites 위치와 fetchJobs 수정만 변경됨.

  return (
    <div className="text-center py-10 text-gray-600">
      {isLoading
        ? "로딩 중..."
        : error
        ? `❌ 오류: ${error}`
        : jobListings.length > 0
        ? "✅ 공고가 정상적으로 불러와졌습니다."
        : "⚠️ 채용 공고가 없습니다."}
    </div>
  );
};

export default JobPostings;
