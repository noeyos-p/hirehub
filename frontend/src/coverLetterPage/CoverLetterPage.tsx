import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon, DocumentTextIcon, ClipboardDocumentIcon,
  CheckCircleIcon, ClockIcon, BookmarkIcon, Bars3Icon, XMarkIcon
} from '@heroicons/react/24/outline';
import { myPageApi } from '../api/myPageApi';
import api from '../api/api';
import { coverLetterApi } from '../api/coverLetterApi';
import type { ResumeItem, ResumeDto } from '../types/interface';
import type { CoverLetterHistory } from '../api/coverLetterApi';

/** ⭐ 추가: 토큰 훅 + 모달 + 알림 */
import { useHireTokens } from "../utils/useHireTokens";
import TokenModal from "../popUp/TokenModal";
import { notifyHire } from "../utils/notifyHire";

type InputMode = 'text' | 'essay' | 'resume';

export default function CoverLetterPage() {
  const navigate = useNavigate();

  // 모바일 사이드바 상태
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  /** 로그인 체크 */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
    }
  }, [navigate]);

  /** ⭐ 토큰 훅 적용 */
  const {
    useTokens,
    modalOpen,
    neededTokens,
    handleConfirm,
    handleClose
  } = useHireTokens();

  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [originalText, setOriginalText] = useState('');
  const [improvedText, setImprovedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedResumeTitle, setSelectedResumeTitle] = useState<string>('');
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 첨삭 이력 상태
  const [historyList, setHistoryList] = useState<CoverLetterHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<CoverLetterHistory | null>(null);

  // 이력서 조회 모달 상태
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [viewingResume, setViewingResume] = useState<ResumeDto | null>(null);

  /** 첨삭 이력 및 이력서 목록 로드 */
  useEffect(() => {
    fetchHistory();
  }, []);

  /** 이력서 목록 */
  useEffect(() => {
    if (inputMode === 'resume' || inputMode === 'essay') {
      fetchResumes();
    }
  }, [inputMode]);

  // 첨삭 이력 가져오기
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await coverLetterApi.getHistoryList();
      console.log('📋 첨삭 이력 데이터:', data);

      if (Array.isArray(data)) {
        setHistoryList(data);
      } else if (data && typeof data === 'object') {
        const list = (data as any).content || (data as any).data || [];
        setHistoryList(list);
      } else {
        console.warn('예상치 못한 데이터 형식:', data);
        setHistoryList([]);
      }
    } catch (err) {
      console.error('❌ 첨삭 이력 로딩 실패:', err);
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchResumes = async () => {
    setLoadingResumes(true);
    try {
      const response = await myPageApi.getResumes({ page: 0, size: 100 });
      setResumes(response.content);
    } catch (error) {
      alert('이력서 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingResumes(false);
    }
  };

  /** 이력서 선택 시 원본 텍스트 구성 */
  const handleResumeSelect = async (resumeId: number) => {
    setSelectedResumeId(resumeId);
    try {
      const resume = await myPageApi.getResumeDetail(resumeId);
      setSelectedResumeTitle(resume.title || '');

      console.log('📄 이력서 상세 데이터:', resume);

      let text = '';
      const essayTitle = resume.essayTitle ?? resume.essayTittle ?? '';
      const essayContent = resume.essayContent ?? '';

      // JSON 파싱 헬퍼 함수
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

      if (inputMode === 'essay') {
        text = essayContent || '자기소개서 내용이 없습니다.';
      } else if (inputMode === 'resume') {
        text = `제목: ${resume.title}\n\n`;

        if (essayTitle && essayContent) {
          text += `=== 자기소개서 ===\n${essayTitle}\n\n${essayContent}\n\n`;
        }

        // 모달과 동일한 방식으로 데이터 가져오기
        const educations = (resume as any).educationList
          || parseJsonField(resume.educationJson, resume.educations)
          || [];

        if (educations.length > 0) {
          text += `=== 학력 ===\n`;
          educations.forEach((edu: any) => {
            text += `${edu.name || edu.school || ''} | ${edu.major || ''} | ${edu.status || ''}\n`;
          });
          text += `\n`;
        }

        const careers = (resume as any).careerList
          || parseJsonField(resume.careerJson, resume.careers)
          || [];

        if (careers.length > 0) {
          text += `=== 경력 ===\n`;
          careers.forEach((c: any) => {
            text += `${c.companyName || c.company || ''} | ${c.position || c.role || ''}\n${c.content || c.desc || ''}\n\n`;
          });
        }

        const certificates = (resume as any).certificateList
          || parseJsonField(resume.certJson, resume.certs)
          || [];

        if (certificates.length > 0) {
          text += `=== 자격증 ===\n`;
          certificates.forEach((cert: any) => {
            text += `- ${cert.name || cert.certName || ''}\n`;
          });
          text += `\n`;
        }

        const skills = (resume as any).skillList
          || parseJsonField(resume.skillJson, resume.skills)
          || [];

        if (skills.length > 0) {
          text += `=== 기술 스택 ===\n${skills.map((s: any) => s.name || s.skill || s.skillName || '').join(', ')}\n\n`;
        }

        const languages = (resume as any).languageList
          || parseJsonField(resume.langJson, resume.langs)
          || [];

        if (languages.length > 0) {
          text += `=== 언어 ===\n${languages.map((lang: any) => lang.language || lang.name || '').join(', ')}\n\n`;
        }

        console.log('📝 생성된 텍스트 미리보기:', text.substring(0, 500));
      }

      setOriginalText(text);
    } catch (error) {
      console.error('❌ 이력서 로드 실패:', error);
      alert('이력서를 불러오는 중 오류가 발생했습니다.');
    }
  };

  /** ⭐ AI 첨삭 + 토큰 차감 1코인 */
  const handleImprove = async () => {
    if (!originalText.trim()) {
      alert('자기소개서 내용을 입력해주세요.');
      return;
    }

    /** 🔥 useTokens 사용 → 부족하면 모달 자동 오픈 */
    const ok = await useTokens(
      1,
      "USE_AI_REVIEW",
      "AI 자기소개서 첨삭 실행"
    );
    if (!ok) return;

    notifyHire("HIRE 1개가 사용되었습니다.");

    setIsLoading(true);
    try {
      const res = await api.post("/api/resume/ai-review", { content: originalText });
      setImprovedText(res.data.feedback || "첨삭 결과가 없습니다.");
    } catch (error: any) {
      alert('AI 첨삭 오류: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  /** 첨삭 이력 클릭 */
  const handleHistoryClick = (history: CoverLetterHistory) => {
    console.log('📂 첨삭 이력 클릭:', history.id);
    setSelectedHistory(history);
    setOriginalText(history.originalText);
    setImprovedText(history.improvedText);
    setInputMode(history.inputMode);
    setSelectedResumeId(history.resumeId || null);
    setSelectedResumeTitle(history.resumeTitle || '');
  };

  /** 초기화 */
  const handleReset = () => {
    setOriginalText('');
    setImprovedText('');
    setSelectedResumeId(null);
    setSelectedResumeTitle('');
    setSelectedHistory(null);
  };

  /** 저장 */
  const handleSave = async () => {
    if (!improvedText.trim()) {
      alert('저장할 내용이 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      await coverLetterApi.saveHistory({
        resumeId: selectedResumeId || undefined,
        resumeTitle: selectedResumeTitle || undefined,
        inputMode,
        originalText,
        improvedText,
      });
      alert('첨삭 이력이 저장되었습니다!');
      await fetchHistory(); // 이력 목록 새로고침
    } catch (error: any) {
      alert('저장 실패: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    setOriginalText('');
    setImprovedText('');
    setSelectedResumeId(null);
  };

  // 이력서 상세 조회 (모달용)
  const handleViewResume = async (resume: ResumeItem) => {
    try {
      const fullDetail = await myPageApi.getResumeDetail(resume.id);
      console.log('전체 이력서 데이터:', fullDetail);
      setViewingResume(fullDetail);
      setIsResumeModalOpen(true);
    } catch (error) {
      console.error('이력서 조회 실패:', error);
      alert('이력서를 불러올 수 없습니다.');
    }
  };

  // 사이드바 콘텐츠 렌더러
  const renderSidebarContent = () => (
    <nav className="space-y-4 xl:space-y-6">
            <button
              onClick={() => {
                setSelectedHistory(null);
                handleReset();
              }}
              className="w-full text-left text-sm xl:text-[16px] hover:text-[#006AFF] transition"
              style={{ color: selectedHistory ? '#000' : '#006AFF' }}
            >
              자소서 첨삭
            </button>
            <div>
              <div className="text-gray-400 text-sm xl:text-[16px] mb-2">첨삭 이력</div>
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

                  return historyList
                    .sort((a, b) => (b.id || 0) - (a.id || 0))
                    .map((history) => {
                      const date = history.createdAt;
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
                            <div className="text-sm truncate">{history.resumeTitle || '직접 입력'}</div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xs text-gray-400">{dateStr}</div>
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
                  <DocumentTextIcon className="w-6 h-6 text-[#006AFF]" />
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
            <div className="mb-8 relative flex items-center justify-center md:block">
              {/* 모바일 햄버거 버튼 */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="absolute left-0 p-2 -ml-2 text-gray-600 hover:text-[#006AFF] md:hidden"
              >
                <Bars3Icon className="w-7 h-7" />
              </button>

              <div className="flex items-center justify-center gap-3">
                <DocumentTextIcon className="w-8 h-8 md:w-10 md:h-10 text-[#006AFF]" />
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI 자기소개서 첨삭</h1>
              </div>
            </div>

        {/* 입력 모드 선택 탭 - 첨삭 이력 보기 중에는 숨김 */}
        {!selectedHistory && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex flex-wrap justify-center rounded-xl border border-gray-200 bg-white p-1.5 gap-2 shadow-sm">
              <button
                onClick={() => handleModeChange('text')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-medium transition text-sm whitespace-nowrap flex items-center justify-center ${inputMode === 'text'
                  ? 'bg-[#006AFF] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#006AFF]'
                  }`}
              >
                <ClipboardDocumentIcon className="w-5 h-5 mr-1.5" />
                직접 입력
              </button>
              <button
                onClick={() => handleModeChange('essay')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-medium transition text-sm whitespace-nowrap flex items-center justify-center ${inputMode === 'essay'
                  ? 'bg-[#006AFF] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#006AFF]'
                  }`}
              >
                <DocumentTextIcon className="w-5 h-5 mr-1.5" />
                자기소개서만
              </button>
              <button
                onClick={() => handleModeChange('resume')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-medium transition text-sm whitespace-nowrap flex items-center justify-center ${inputMode === 'resume'
                  ? 'bg-[#006AFF] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#006AFF]'
                  }`}
              >
                <DocumentTextIcon className="w-5 h-5 mr-1.5" />
                이력서 전체
              </button>
            </div>
          </div>
        )}

        {/* 이력서 선택 영역 */}
        {((inputMode === 'resume' || inputMode === 'essay') && !selectedHistory) && (
          <section>
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-6 h-6 text-gray-700 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                {inputMode === 'essay' ? '자기소개서 선택' : '이력서 선택'}
              </h2>
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
                      onClick={() => handleResumeSelect(resume.id)}
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
        )}

        {/* 첨삭 이력에서 선택한 이력서 표시 */}
        {selectedHistory && selectedHistory.resumeId && (
          <section>
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-6 h-6 text-gray-700 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">선택된 이력서</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(() => {
                const historyResume = resumes.find(r => r.id === selectedHistory.resumeId);
                if (!historyResume) {
                  return (
                    <div className="bg-white rounded-2xl shadow-sm border-1 p-6 border-gray-100">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-[18px] font-semibold text-gray-900 truncate flex-1">
                              {selectedHistory.resumeTitle || '이력서'}
                            </h3>
                          </div>
                          <p className="text-[16px] font-light text-gray-500">
                            {new Date(selectedHistory.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                const isSubmitted = historyResume.locked;
                return (
                  <div
                    key={historyResume.id}
                    className="bg-white rounded-2xl shadow-sm border-1 p-6 border-gray-100 pointer-events-none"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[18px] font-semibold text-gray-900 truncate flex-1">
                            {historyResume.title || '새 이력서'}
                          </h3>
                          {isSubmitted && (
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-3 py-1 rounded-md flex-shrink-0">
                              제출됨
                            </span>
                          )}
                        </div>
                        <p className="text-[16px] font-light text-gray-500">
                          {new Date(historyResume.createAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewResume(historyResume);
                        }}
                        className="px-3 py-1 rounded-lg text-[12px] font-[10px] transition text-black flex-shrink-0 pointer-events-auto"
                        style={{ backgroundColor: '#C2DBFF' }}
                      >
                        조회하기
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-8">
          {/* 원본 자기소개서 */}
          <div className="flex flex-col h-full">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-6 h-6 text-gray-700 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                {inputMode === 'text' ? '원본 자기소개서' :
                  inputMode === 'essay' ? '자기소개서 내용' : '이력서 내용'}
              </h2>
            </div>
            <div className="flex-1 relative">
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder={
                  inputMode === 'text'
                    ? '자기소개서 내용을 입력해주세요...'
                    : '위에서 이력서를 선택하면 내용이 자동으로 입력됩니다...'
                }
                readOnly={inputMode !== 'text'}
                className={`w-full h-[400px] lg:h-[500px] p-5 border border-gray-200 rounded-xl resize-none text-base leading-relaxed overflow-y-auto transition-colors bg-white ${inputMode !== 'text'
                  ? 'cursor-not-allowed focus:outline-none text-gray-500'
                  : 'focus:ring-2 focus:ring-[#006AFF]/20 focus:border-[#006AFF] focus:outline-none text-gray-800'
                  }`}
              />
              <div className="absolute bottom-4 right-4 text-xs font-medium text-gray-400 bg-white/80 px-2 py-1 rounded backdrop-blur-sm border border-gray-100">
                {originalText.length}자
              </div>
            </div>
            {!selectedHistory && (
              <div className="mt-2 flex justify-end items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 text-gray-700 font-medium text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  초기화
                </button>
                <button
                  onClick={handleImprove}
                  disabled={isLoading}
                  className="flex items-center px-6 py-2.5 bg-[#006AFF] text-white font-semibold text-sm rounded-lg hover:bg-blue-600 transition shadow-sm hover:shadow active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                >
                  {isLoading ? '첨삭 중...' : '첨삭하기'}
                </button>
              </div>
            )}
          </div>

          {/* 첨삭된 자기소개서 */}
          <div className="flex flex-col h-full">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-6 h-6 text-gray-700 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">첨삭된 자기소개서</h2>
            </div>
            {improvedText ? (
              <>
                <div className="flex-1 w-full h-[400px] lg:h-[500px] p-5 rounded-xl bg-white border border-gray-200 overflow-y-auto relative">
                  <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-gray-800">
                    {improvedText}
                  </pre>
                  <div className="sticky bottom-0 left-0 w-full text-right pointer-events-none">
                    <span className="inline-block bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-gray-400 border border-gray-100 pointer-events-auto">
                      {improvedText.length}자
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex justify-end items-center gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(improvedText);
                      alert('복사되었습니다!');
                    }}
                    className="px-5 py-2.5 text-gray-700 font-medium text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    복사하기
                  </button>
                  {!selectedHistory && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center px-6 py-2.5 bg-[#006AFF] text-white font-semibold text-sm rounded-lg hover:bg-blue-600 transition shadow-sm hover:shadow active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                    >
                      {isSaving ? '저장 중...' : '저장하기'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 w-full h-[400px] lg:h-[500px] p-5 border border-gray-200 rounded-xl flex flex-col items-center justify-center bg-white">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">AI 첨삭 결과가 여기에 표시됩니다</p>
                <p className="text-sm text-gray-400 mt-1">왼쪽에서 내용을 입력하고 버튼을 눌러주세요</p>
              </div>
            )}
          </div>
        </div>

            {/* 사용 가이드 */}
            <div className="mt-10 bg-gradient-to-br from-[#EFF4F8] to-white border border-[#D6E4F0] rounded-xl p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircleIcon className="w-6 h-6 text-[#006AFF] mr-2" />
                이용 가이드
              </h3>
              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="flex items-start">
                  <span className="text-[#006AFF] mr-2 flex-shrink-0">-</span>
                  <span>자기소개서 내용을 왼쪽 입력창에 작성하거나, 목록에서 기존 이력서를 불러오세요.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#006AFF] mr-2 flex-shrink-0">-</span>
                  <span>"첨삭하기" 버튼을 클릭하면 전문적인 톤앤매너로 문장이 다듬어집니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#006AFF] mr-2 flex-shrink-0">-</span>
                  <span>결과물은 복사하여 사용하거나, "저장하기"를 통해 사이드바 '첨삭 이력'에 보관할 수 있습니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#006AFF] mr-2 flex-shrink-0">-</span>
                  <span>보다 정확한 결과를 위해 문맥이 끊기지 않는 완성된 문장 위주로 입력해주세요.</span>
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

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
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

              <div className="px-4 sm:px-6 py-6 sm:py-10">
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

                  <div className="w-full sm:w-auto text-left sm:text-right">
                    <div className="text-xs sm:text-sm text-gray-500 mb-1">이력서 제목</div>
                    <div className="text-sm sm:text-base font-semibold text-gray-800 break-words">{viewingResume.title}</div>
                    <div className="mt-2 text-[10px] sm:text-xs text-gray-500">
                      {viewingResume.companyName ? <>제출 기업: {viewingResume.companyName} · </> : null}
                      {viewingResume.appliedAt ? <>제출일: {new Date(viewingResume.appliedAt).toLocaleDateString("ko-KR")}</> : null}
                    </div>
                  </div>
                </div>

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

                <div className="mt-4 sm:mt-6">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">경력</h3>
                  <div className="border-t border-gray-200 pt-3">
                    {careers && careers.length > 0 ? (
                      <div className="space-y-4">
                        {careers.map((c: any, i: number) => (
                          <div key={i} className="space-y-2">
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

      {/* ⭐ 토큰 모달 반드시 맨 아래 추가 */}
      <TokenModal
        isOpen={modalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        needed={neededTokens}
      />
    </div>
  );
}
