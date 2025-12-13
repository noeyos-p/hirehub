import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  BookmarkIcon,
  BuildingOfficeIcon,
  EyeIcon,
  StarIcon,
  ArrowPathIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { myPageApi } from '../api/myPageApi';
import api from '../api/api';
import { jobMatchingApi } from '../api/jobMatchingApi';
import { jobPostApi } from '../api/jobPostApi';
import type { ResumeItem, ResumeDto } from '../types/interface';

/** ⭐ 추가된 import */
import { useHireTokens } from "../utils/useHireTokens";
import TokenModal from "../popUp/TokenModal";
import { notifyHire } from "../utils/notifyHire";

interface MatchResult {
  jobId?: number;
  companyId?: number;
  jobTitle: string;
  companyName: string;
  score: number;
  grade: string;
  reasons: string[];
}

export default function JobMatchingPage() {
  const navigate = useNavigate();

  // 모바일 사이드바 상태
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  /** ⭐ 토큰 훅 */
  const {
    useTokens,
    modalOpen,
    neededTokens,
    handleConfirm,
    handleClose
  } = useHireTokens();

  /** 로그인 체크 */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
    }
  }, [navigate]);

  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedResumeTitle, setSelectedResumeTitle] = useState<string>('');
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 이력서 조회 모달 상태
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [viewingResume, setViewingResume] = useState<ResumeDto | null>(null);

  // 즐겨찾기 및 스크랩 상태
  const [favoritedCompanies, setFavoritedCompanies] = useState<Set<number>>(new Set());
  const [scrappedJobs, setScrappedJobs] = useState<Set<number>>(new Set());

  // 매칭 이력 상태
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);

  useEffect(() => {
    fetchResumes();
    fetchFavorites();
    fetchScrappedJobs();
    fetchHistory();
  }, []);

  const fetchResumes = async () => {
    setLoadingResumes(true);
    try {
      const response = await myPageApi.getResumes({ page: 0, size: 100 });
      setResumes(response.content);
    } catch {
      alert('이력서를 불러오지 못했습니다.');
    } finally {
      setLoadingResumes(false);
    }
  };

  // 매칭 이력 가져오기
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await jobMatchingApi.getHistoryList();
      console.log('📋 매칭 이력 데이터:', data);

      // 배열이 아닌 경우 처리
      if (Array.isArray(data)) {
        setHistoryList(data);
      } else if (data && typeof data === 'object') {
        // 객체인 경우 (예: { content: [...], totalElements: ... })
        const list = (data as any).content || (data as any).data || [];
        setHistoryList(list);
      } else {
        console.warn('예상치 못한 데이터 형식:', data);
        setHistoryList([]);
      }
    } catch (err) {
      console.error('❌ 매칭 이력 로딩 실패:', err);
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };


  // 즐겨찾기 목록 가져오기
  const fetchFavorites = async () => {
    try {
      const items = await jobPostApi.getFavoriteCompanies();
      const companyIds = new Set<number>(
        items.map((item: any) => Number(item.companyId)).filter((id: number) => !isNaN(id))
      );
      setFavoritedCompanies(companyIds);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        setFavoritedCompanies(new Set());
      }
    }
  };

  // 스크랩 목록 가져오기
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

  // 기업 즐겨찾기 토글
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
      } else {
        await jobPostApi.addFavoriteCompany(companyId);
        setFavoritedCompanies((prev) => new Set(prev).add(companyId));
      }
    } catch (err: any) {
      let errorMsg = '즐겨찾기 처리에 실패했습니다.';
      if (err.response?.status === 401) {
        errorMsg = '로그인이 필요합니다.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      alert(errorMsg);
    }
  };

  // 공고 북마크 토글
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
      let errorMsg = '북마크 처리에 실패했습니다.';
      if (err.response?.status === 401) {
        errorMsg = '로그인이 필요합니다.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      alert(errorMsg);
    }
  };

  // 공고 클릭 (페이지 이동)
  const handleJobClick = async (jobId: number) => {
    try {
      await jobPostApi.incrementJobView(jobId);
      navigate(`/jobPostings/${jobId}`);
    } catch (err) {
      console.error('조회수 증가 실패:', err);
      navigate(`/jobPostings/${jobId}`);
    }
  };

  /** ⭐ 공고 매칭 실행 (3코인 차감) */
  const handleMatch = async () => {
    if (!selectedResumeId) {
      alert('이력서를 선택해주세요.');
      return;
    }

    setMatching(true);

    /** ⭐ 토큰 차감 먼저 */
    const ok = await useTokens(
      3,
      "USE_JOBMATCHING",
      "AI 공고 매칭 실행"
    );
    if (!ok) {
      setMatching(false);
      return;
    }

    notifyHire("HIRE 3개가 사용되었습니다.");

    try {
      /** AI 매칭 API 호출 */
      console.log('🔍 매칭 API 호출 시작:', { resumeId: selectedResumeId });
      console.log('🔍 API URL:', '/api/match');

      const res = await api.post("/api/match", { resumeId: selectedResumeId });
      console.log('✅ 매칭 API 응답:', res.data);
      console.log('✅ 응답 상태:', res.status);

      const results = res.data.results || [];

      // 빈 배열이 왔을 때도 fallback 데이터 사용
      if (results.length === 0) {
        console.log('⚠️ 매칭 결과가 비어있음 → fallback 더미 데이터 사용');
        throw new Error('빈 결과');
      }

      console.log('✅ 매칭 결과:', results);
      setMatchResults(results);

      // ✅ 자동 저장
      try {
        console.log('💾 매칭 결과 자동 저장 시작');
        await jobMatchingApi.saveHistory({
          resumeId: selectedResumeId,
          resumeTitle: selectedResumeTitle,
          matchResults: results,
        });
        console.log('✅ 매칭 결과 자동 저장 완료');
        await fetchHistory(); // 이력 목록 새로고침
      } catch (saveError: any) {
        console.error('⚠️ 자동 저장 실패 (매칭 결과는 표시됨):', saveError);
        // 저장 실패해도 매칭 결과는 보여줌 (에러 무시)
      }
    } catch (error: any) {
      console.error('❌ 매칭 API 실패:', error);
      console.error('❌ 에러 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });

      // 사용자에게 에러 알림
      const errorMsg = error.response?.data?.message
        || error.response?.data?.detail
        || error.message
        || '매칭 API 호출에 실패했습니다.';

      alert(`API 연결 실패: ${errorMsg}\n\n테스트용 더미 데이터를 표시합니다.`);
      console.log('⚠️ fallback 더미 데이터 사용');

      // Fallback: 더미 매칭 결과 생성
      const fallbackResults: MatchResult[] = [
        {
          jobId: 1,
          companyId: 1,
          jobTitle: '프론트엔드 개발자',
          companyName: '테크스타트업 A',
          score: 92,
          grade: 'S',
          reasons: [
            'React 및 TypeScript 경험이 매우 우수합니다',
            '프로젝트 포트폴리오가 직무 요구사항과 높은 일치도를 보입니다',
            'UI/UX 개선 경험이 풍부하여 회사 니즈에 적합합니다'
          ]
        },
        {
          jobId: 2,
          companyId: 2,
          jobTitle: '풀스택 개발자',
          companyName: '핀테크 기업 B',
          score: 85,
          grade: 'A',
          reasons: [
            '백엔드 및 프론트엔드 개발 경험을 모두 보유하고 있습니다',
            '데이터베이스 설계 및 최적화 경험이 있습니다',
            '팀 협업 프로젝트 경험이 다수 있습니다'
          ]
        },
        {
          jobId: 3,
          companyId: 3,
          jobTitle: 'React 개발자',
          companyName: '스타트업 C',
          score: 78,
          grade: 'B',
          reasons: [
            'React 프레임워크 사용 경험이 있습니다',
            '반응형 웹 개발 경험이 있습니다',
            '코드 품질 및 테스트에 대한 이해도가 있습니다'
          ]
        },
        {
          jobId: 4,
          companyId: 4,
          jobTitle: '주니어 웹 개발자',
          companyName: 'IT 서비스 기업 D',
          score: 70,
          grade: 'C',
          reasons: [
            '웹 개발 기초 지식을 갖추고 있습니다',
            '신입 개발자로서 성장 가능성이 있습니다',
            '기본적인 프로그래밍 스킬을 보유하고 있습니다'
          ]
        },
        {
          jobId: 5,
          companyId: 5,
          jobTitle: 'UI/UX 개발자',
          companyName: '디자인 스튜디오 E',
          score: 65,
          grade: 'D',
          reasons: [
            'UI 구현 경험이 일부 있습니다',
            '디자인 도구 사용 경험이 제한적입니다',
            '추가적인 디자인 교육이 필요할 수 있습니다'
          ]
        }
      ];

      setMatchResults(fallbackResults);
    } finally {
      setMatching(false);
    }
  };

  const handleReset = () => {
    setSelectedResumeId(null);
    setSelectedResumeTitle('');
    setMatchResults([]);
    setSelectedHistory(null);
  };

  // 매칭 이력 클릭 - 목록 데이터 직접 사용 (정확한 개수 보장)
  const handleHistoryClick = (history: any) => {
    console.log('📂 매칭 이력 클릭:', history.id, '공고 개수:', history.matchResults?.length);
    setSelectedHistory(history);
    setMatchResults([]);
    setSelectedResumeId(null);
  };

  const handleSave = async () => {
    if (matchResults.length === 0) {
      alert('저장할 매칭 결과가 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      console.log('💾 매칭 결과 저장 시작:', {
        resumeId: selectedResumeId,
        resumeTitle: selectedResumeTitle,
        matchResultsCount: matchResults.length
      });

      const savedData = await jobMatchingApi.saveHistory({
        resumeId: selectedResumeId!,
        resumeTitle: selectedResumeTitle,
        matchResults,
      });

      console.log('✅ 매칭 결과 저장 성공:', savedData);
      alert('매칭 결과가 저장되었습니다!');

      // 저장 후 이력 목록 새로고침
      await fetchHistory();
    } catch (error: any) {
      console.error('❌ 매칭 결과 저장 실패:', error);
      console.error('❌ 에러 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });

      const errorMsg = error.response?.data?.message
        || error.response?.data?.detail
        || error.message
        || '저장에 실패했습니다.';

      alert(`저장 실패: ${errorMsg}\n\nAPI: /api/job-matching/history`);
    } finally {
      setIsSaving(false);
    }
  };

  // 이력서 상세 조회 (모달용)
  const handleViewResume = async (resume: ResumeItem) => {
    try {
      // 전체 상세 정보 가져오기
      const fullDetail = await myPageApi.getResumeDetail(resume.id);
      console.log('전체 이력서 데이터:', fullDetail);
      setViewingResume(fullDetail);
      setIsResumeModalOpen(true);
    } catch (error) {
      console.error('이력서 조회 실패:', error);
      alert('이력서를 불러올 수 없습니다.');
    }
  };

  const getGradeColor = (grade: string) => {
    const g = grade.toUpperCase();
    if (g === 'S' || g === 'A') return 'text-green-600 bg-green-50 border-green-200';
    if (g === 'B' || g === 'C') return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };


  // 사이드바 콘텐츠 렌더러
  const renderSidebarContent = () => (
    <nav className="space-y-4 xl:space-y-6">
            <button
              onClick={() => navigate('/job-matching')}
              className="w-full text-left text-sm xl:text-[16px] hover:text-[#006AFF] transition"
              style={{ color: '#006AFF' }}
            >
              공고 매칭
            </button>
            <div>
              <div className="text-gray-400 text-sm xl:text-[16px] mb-2">매칭 이력</div>
              <div className="space-y-4">
                {(() => {
                  if (historyLoading) {
                    return <div className="text-sm text-gray-400">로딩 중...</div>;
                  }

                  if (historyList.length === 0) {
                    return (
                      <div className="text-sm text-gray-400">
                        저장된 이력이 없습니다
                      </div>
                    );
                  }

                  // 각 매칭 이력을 개별적으로 표시 (최신순 = ID 내림차순)
                  return historyList
                    .sort((a, b) => (b.id || 0) - (a.id || 0))
                    .map((history) => {
                      const matchCount = history.matchResults?.length || 0;
                      const date = history.createdAt || history.matchedAt;
                      const dateStr = date
                        ? new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                        : '';

                      return (
                        <button
                          key={history.id}
                          onClick={() => handleHistoryClick(history)}
                          className={`w-full text-left transition ${
                            selectedHistory?.id === history.id
                              ? 'text-[#006AFF] font-medium'
                              : 'text-gray-700 hover:text-[#006AFF]'
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="text-sm truncate">{history.resumeTitle || '새 이력서'}</div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xs text-gray-400">{dateStr}</div>
                              <div className="text-xs text-gray-400 flex-shrink-0">
                                공고 <span style={{ color: '#006AFF' }}>{matchCount}</span>개
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    });
                })()}
              </div>
            </div>
          </nav>
  );

  return (
    <div className="max-w-[1440px] mx-auto px-0 md:px-6 lg:px-8 xl:px-[55px]">
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 md:bg-white shadow-none md:shadow-sm rounded-none md:rounded-lg relative">
        {/* 왼쪽 사이드바 (데스크탑) */}
        <aside className="hidden md:block w-[200px] xl:w-[250px] border-r border-gray-200 pt-6 xl:pt-[44px] pb-6 xl:pb-[44px] pl-6 xl:pl-[44px] pr-6 xl:pr-[44px] bg-white flex-shrink-0">
          {renderSidebarContent()}
        </aside>

        {/* 모바일 사이드바 (오버레이) */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* 배경 (Backdrop) */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* 사이드바 패널 */}
            <div className="relative w-[80%] max-w-[300px] bg-white h-full shadow-xl flex flex-col p-6">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <MagnifyingGlassIcon className="w-6 h-6 text-[#006AFF]" />
                  <span className="font-bold text-lg text-gray-900">메뉴</span>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-gray-500 hover:text-gray-900"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {renderSidebarContent()}
              </div>
            </div>
          </div>
        )}

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 pt-6 xl:pt-[44px] pb-6 xl:pb-[44px] pr-4 md:pr-6 xl:pr-[44px] pl-4 md:pl-8 xl:pl-12 bg-gray-50">
          <div>
            {/* 헤더 */}
            <div className="mb-12 relative flex items-center justify-center md:block">
              {/* 모바일 햄버거 버튼 */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="absolute left-0 p-2 -ml-2 text-gray-600 hover:text-[#006AFF] md:hidden"
              >
                <Bars3Icon className="w-7 h-7" />
              </button>

              <div className="flex items-center justify-center gap-3">
                <MagnifyingGlassIcon className="w-8 h-8 md:w-10 md:h-10" style={{ color: '#006AFF' }} />
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI 공고 매칭</h1>
              </div>
            </div>

            {/* 이력서 선택 */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <DocumentTextIcon className="w-6 h-6 text-gray-700 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">이력서 선택</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-300 transition"
                  >
                    초기화
                  </button>
                  <button
                    onClick={handleMatch}
                    disabled={matching || !selectedResumeId}
                    className="bg-[#006AFF] hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                  >
                    {matching ? (
                      <>
                        매칭 중...
                      </>
                    ) : (
                      <>
                        매칭하기
                      </>
                    )}
                  </button>
                </div>
              </div>

              {loadingResumes ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006AFF]"></div>
                </div>
              ) : resumes.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                  <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4 font-medium">등록된 이력서가 없습니다.</p>
                  <button
                    onClick={() => navigate('/myPage/resume')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition"
                  >
                    이력서 작성하러 가기
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {resumes.map((resume) => {
                    const isSelected = selectedResumeId === resume.id;
                    const isSubmitted = resume.locked;
                    return (
                      <div
                        key={resume.id}
                        onClick={() => {
                          setSelectedResumeId(resume.id);
                          setSelectedResumeTitle(resume.title);
                        }}
                        className={`bg-white rounded-2xl shadow-sm border-1 p-6 transition cursor-pointer ${
                          isSelected
                            ? 'border-blue-500'
                            : 'border-gray-100 hover:border-[#006AFF]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-[18px] font-semibold text-gray-900 truncate flex-1">
                                {resume.title || '새 이력서'}
                              </h3>
                              {isSubmitted && (
                                <span className="text-[10px] text-gray-500 bg-gray-100 px-3 py-1 rounded-md flex-shrink-0">
                                  제출됨
                                </span>
                              )}
                            </div>
                            <p className="text-[16px] font-light text-gray-500">
                              {new Date(resume.createAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewResume(resume);
                            }}
                            className="px-3 py-1 rounded-lg text-[12px] font-[10px] transition text-black flex-shrink-0"
                            style={{ backgroundColor: '#C2DBFF' }}
                          >
                            조회하기
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 매칭 결과 */}
            {(() => {
              let displayResults = matchResults.length > 0
                ? matchResults
                : selectedHistory?.matchResults || [];

              // 정렬: 점수 높은 순 → 같으면 회사명 가나다순
              displayResults = [...displayResults].sort((a, b) => {
                // 점수 내림차순
                if (b.score !== a.score) {
                  return b.score - a.score;
                }
                // 점수 같으면 회사명 가나다순
                return (a.companyName || '').localeCompare(b.companyName || '', 'ko-KR');
              });

              if (displayResults.length === 0) return null;

              return (
                <section className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <MagnifyingGlassIcon className="w-6 h-6 text-gray-700 mr-2" />
                      <h2 className="text-xl font-semibold text-gray-900">매칭 결과</h2>
                    </div>
                    {selectedHistory && (
                      <div className="text-sm text-gray-500">
                        {selectedHistory.resumeTitle} • {new Date(selectedHistory.createdAt || selectedHistory.matchedAt).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {displayResults.map((result: any, index: number) => {
                      const companyId = result.companyId;

                      return (
                    <div
                      key={result.jobId || index}
                      onClick={() => result.jobId && handleJobClick(result.jobId)}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 px-6 py-6 transition cursor-pointer"
                    >
                      {/* 채용공고 정보 */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 flex gap-4">
                          {/* 회사명 */}
                          <div className="w-[160px] flex items-center gap-2">
                            <p className="text-[20px] font-semibold text-gray-900 truncate">{result.companyName}</p>
                            <button
                              onClick={(e) => {
                                if (!companyId) {
                                  e.stopPropagation();
                                  console.warn('⚠️ companyId를 찾을 수 없습니다:', result);
                                  alert('기업 정보를 찾을 수 없어 즐겨찾기를 할 수 없습니다.');
                                  return;
                                }
                                handleFavoriteClick(e, companyId);
                              }}
                              className="transition-all hover:scale-110 flex-shrink-0"
                              title={companyId && favoritedCompanies.has(companyId) ? "즐겨찾기 해제" : "즐겨찾기"}
                            >
                              {companyId && favoritedCompanies.has(companyId) ? (
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
                            <p className="text-[16px] font-normal text-gray-800 mb-[9px]">{result.jobTitle}</p>
                            <p className="text-sm text-gray-500">
                              경력무관 / 학력무관 / 서울
                            </p>
                          </div>
                        </div>

                        {/* 오른쪽: 조회수, 북마크, 날짜 */}
                        <div className="flex flex-col items-end gap-2 ml-4">
                          {/* 조회수 + 북마크 */}
                          <div className="flex items-center gap-3 mb-[9px]">
                            <div className="flex items-center gap-1 text-gray-500">
                              <EyeIcon className="w-4 h-4" />
                              <span className="text-sm">0</span>
                            </div>
                            <button
                              onClick={(e) => {
                                if (!result.jobId) {
                                  e.stopPropagation();
                                  console.warn('⚠️ jobId가 없어 북마크를 할 수 없습니다:', result);
                                  alert('공고 정보가 없어 북마크를 할 수 없습니다.');
                                  return;
                                }
                                handleBookmarkClick(e, result.jobId);
                              }}
                              className="transition-all hover:scale-110"
                              title={result.jobId && scrappedJobs.has(result.jobId) ? "북마크 해제" : "북마크 추가"}
                            >
                              {result.jobId && scrappedJobs.has(result.jobId) ? (
                                <BookmarkSolidIcon className="w-5 h-5 text-[#006AFF]" />
                              ) : (
                                <BookmarkIcon className="w-5 h-5 text-gray-600 hover:text-[#006AFF]" />
                              )}
                            </button>
                          </div>
                          {/* 날짜 */}
                          <p className="text-sm text-gray-500 whitespace-nowrap">
                            ~2025.12.31
                          </p>
                        </div>
                      </div>

                      {/* 매칭 정보 */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-start gap-8">
                          {/* 등급과 점수 */}
                          <div className="flex items-center gap-3">
                            <span className={`text-4xl font-black ${
                              result.grade === 'S' || result.grade === 'A' ? 'text-green-600' :
                              result.grade === 'B' || result.grade === 'C' ? 'text-blue-600' :
                              'text-orange-600'
                            }`}>
                              {result.grade}
                            </span>
                            <span className="text-lg text-gray-600">
                              ({result.score}점)
                            </span>
                          </div>

                          {/* 매칭이유 */}
                          <div className="flex-1">
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">매칭이유</h5>
                            <div className="text-sm text-gray-700 leading-relaxed space-y-1">
                              {result.reasons.map((reason, idx) => (
                                <p key={idx}>{reason}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>
            );
          })()}

            {/* 사용 가이드 */}
            <div className="mt-10 bg-gradient-to-br from-[#EFF4F8] to-white border border-[#D6E4F0] rounded-xl p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircleIcon className="w-6 h-6 text-[#006AFF] mr-2" />
                이용 가이드
              </h3>
              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="flex items-start">
                  <span className="text-[#006AFF] mr-2 flex-shrink-0">-</span>
                  <span>매칭 분석에 사용할 이력서를 선택해주세요.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#006AFF] mr-2 flex-shrink-0">-</span>
                  <span>"AI 공고 매칭" 버튼을 클릭하면 내 이력서 항목을 정밀 분석하여 가장 적합한 공고를 찾아드립니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#006AFF] mr-2 flex-shrink-0">-</span>
                  <span>매칭 등급(S~C)과 상세 분석 사유를 확인하고, 관심 있는 공고에 바로 지원해보세요.</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>

      {/* 이력서 조회 모달 */}
      {isResumeModalOpen && viewingResume && (() => {
        const prettyGender = (g?: string | null) => {
          if (!g) return "";
          const s = String(g).toLowerCase();
          if (["m", "male", "남", "남성"].includes(s)) return "남";
          if (["f", "female", "여", "여성"].includes(s)) return "여";
          return g || "";
        };

        const prettyBirthAge = (birth?: string | null) => {
          if (!birth) return { birthText: "", ageText: "" };
          try {
            const date = new Date(birth);
            if (isNaN(date.getTime())) return { birthText: birth, ageText: "" };
            const today = new Date();
            let age = today.getFullYear() - date.getFullYear();
            const md = (today.getMonth() + 1) * 100 + today.getDate();
            const bd = (date.getMonth() + 1) * 100 + date.getDate();
            if (md < bd) age--;
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const dd = String(date.getDate()).padStart(2, "0");
            return { birthText: `${yyyy}.${mm}.${dd}`, ageText: `만 ${Math.max(age, 0)}세` };
          } catch {
            return { birthText: birth, ageText: "" };
          }
        };

        const gender = prettyGender(viewingResume.profile?.gender);
        const { birthText, ageText } = prettyBirthAge(viewingResume.profile?.birth);

        const headerRightRows = [
          { label: "휴대폰", value: viewingResume.profile?.phone },
          { label: "이메일", value: viewingResume.profile?.email },
          { label: "주소", value: viewingResume.profile?.address },
        ].filter((r) => !!r.value);

        // 데이터 파싱 - 다양한 소스에서 데이터 추출
        const parseJsonField = (json?: string | null, fallback?: any[]) => {
          if (Array.isArray(fallback) && fallback.length > 0) return fallback;
          try {
            if (json && typeof json === 'string') {
              const parsed = JSON.parse(json);
              return Array.isArray(parsed) ? parsed : [];
            }
            return fallback || [];
          } catch {
            return fallback || [];
          }
        };

        // 백엔드가 educationList 등으로 반환하므로 먼저 확인
        const educations = (viewingResume as any).educationList
          || parseJsonField(viewingResume.educationJson, viewingResume.educations)
          || [];
        const careers = (viewingResume as any).careerList
          || parseJsonField(viewingResume.careerJson, viewingResume.careers)
          || [];
        const certs = (viewingResume as any).certificateList
          || parseJsonField(viewingResume.certJson, viewingResume.certs)
          || [];
        const skills = (viewingResume as any).skillList
          || parseJsonField(viewingResume.skillJson, viewingResume.skills)
          || [];
        const langs = (viewingResume as any).languageList
          || parseJsonField(viewingResume.langJson, viewingResume.langs)
          || [];

        console.log('Modal Data:', { educations, careers, certs, skills, langs });

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              {/* 닫기 버튼 */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-end rounded-t-2xl z-10">
                <button
                  onClick={() => {
                    setIsResumeModalOpen(false);
                    setViewingResume(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 모달 내용 - ResumeViewer 스타일 */}
              <div className="px-4 sm:px-6 py-6 sm:py-10">
                {/* 상단: 프로필 */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                  <div className="w-[96px] h-[120px] bg-gray-100 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                    {viewingResume.idPhoto ? (
                      <img src={viewingResume.idPhoto} alt="증명사진" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">사진</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <h1 className="text-base sm:text-lg font-bold text-gray-900">
                        {viewingResume.profile?.name ?? "이름 없음"}
                      </h1>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {birthText ? `${birthText}` : ""}
                        {ageText ? ` (${ageText})` : ""}
                      </div>
                    </div>

                    <div className="mt-1 text-xs sm:text-sm text-gray-600">
                      {[gender].filter(Boolean).join(" · ")}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-1 text-xs sm:text-sm text-gray-700">
                      {headerRightRows.map((r, i) => (
                        <div key={i} className="flex gap-2 sm:gap-3">
                          <span className="w-12 sm:w-14 text-gray-500 flex-shrink-0">{r.label}</span>
                          <span className="break-all">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 오른쪽 상단 타이틀 */}
                  <div className="w-full sm:w-auto text-left sm:text-right">
                    <div className="text-xs sm:text-sm text-gray-500 mb-1">이력서 제목</div>
                    <div className="text-sm sm:text-base font-semibold text-gray-800 break-words">{viewingResume.title}</div>
                    <div className="mt-2 text-[10px] sm:text-xs text-gray-500">
                      {viewingResume.companyName ? <>제출 기업: {viewingResume.companyName} · </> : null}
                      {viewingResume.appliedAt ? <>제출일: {new Date(viewingResume.appliedAt).toLocaleDateString("ko-KR")}</> : null}
                    </div>
                  </div>
                </div>

                {/* 학력 */}
                <div className="mt-4 sm:mt-6">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">학력</h3>
                  <div className="border-t border-gray-200 pt-3">
                    {educations && educations.length > 0 ? (
                      <div className="space-y-4">
                        {educations.map((ed: any, i: number) => (
                          <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div>
                              <div className="text-gray-400 text-[10px] sm:text-xs">학교명</div>
                              <div className="text-gray-800 break-words">{ed.name || ed.school || ""}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-[10px] sm:text-xs">재학기간</div>
                              <div className="text-gray-800 break-words">
                                {[ed.startAt, ed.endAt].filter(Boolean).join(" ~ ") || "-"}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-[10px] sm:text-xs">졸업상태</div>
                              <div className="text-gray-800">{ed.status || "-"}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-[10px] sm:text-xs">전공</div>
                              <div className="text-gray-800 break-words">{ed.major || "-"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">학력 정보가 없습니다.</div>
                    )}
                  </div>
                </div>

                {/* 경력 */}
                <div className="mt-4 sm:mt-6">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">경력</h3>
                  <div className="border-t border-gray-200 pt-3">
                    {careers && careers.length > 0 ? (
                      <div className="space-y-4">
                        {careers.map((c: any, i: number) => (
                          <div key={i} className="space-y-2">
                            {/* 회사명, 근무기간, 직책, 직무 */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                              <div>
                                <div className="text-gray-400 text-[10px] sm:text-xs">회사명</div>
                                <div className="text-gray-800 break-words">{c.companyName || c.company || ""}</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-[10px] sm:text-xs">근무기간</div>
                                <div className="text-gray-800 break-words">
                                  {[c.startAt, c.endAt].filter(Boolean).join(" ~ ") || "-"}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-[10px] sm:text-xs">직책</div>
                                <div className="text-gray-800 break-words">{c.position || c.role || "-"}</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-[10px] sm:text-xs">직무</div>
                                <div className="text-gray-800 break-words">{c.job || "-"}</div>
                              </div>
                            </div>
                            {/* 업무내용 - 아래로 분리 */}
                            <div className="text-xs sm:text-sm">
                              <div className="text-gray-400 text-[10px] sm:text-xs mb-1">업무내용</div>
                              <div className="text-gray-800 whitespace-pre-wrap break-words">
                                {c.content || c.desc || "-"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">경력 정보가 없습니다.</div>
                    )}
                  </div>
                </div>

                {/* 자격증 / 언어 / 스킬 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mt-6">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">자격증</h3>
                    {certs && certs.length > 0 ? (
                      <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-800 space-y-1">
                        {certs.map((v: any, i: number) => (
                          <li key={i} className="break-words">{v.name || v.certName || v}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-400">정보 없음</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">언어</h3>
                    {langs && langs.length > 0 ? (
                      <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-800 space-y-1">
                        {langs.map((v: any, i: number) => (
                          <li key={i} className="break-words">{v.language || v.name || v}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-400">정보 없음</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">스킬</h3>
                    {skills && skills.length > 0 ? (
                      <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-800 space-y-1">
                        {skills.map((v: any, i: number) => (
                          <li key={i} className="break-words">{v.name || v.skill || v.skillName || v}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-400">정보 없음</div>
                    )}
                  </div>
                </div>

                {/* 자기소개서 */}
                {(viewingResume.essayTitle || viewingResume.essayContent) && (
                  <div className="mt-6 sm:mt-8">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">자기소개서</h3>
                    {viewingResume.essayTitle && (
                      <div className="text-xs sm:text-sm text-gray-700 mb-2 break-words">{viewingResume.essayTitle}</div>
                    )}
                    <div className="border border-gray-200 rounded p-3 sm:p-4 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap leading-5 sm:leading-6 break-words">
                      {viewingResume.essayContent || ""}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ⭐ 토큰 모달 */}
      <TokenModal
        isOpen={modalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        needed={neededTokens}
      />
    </div>
  );
}
