import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon, DocumentTextIcon, ClipboardDocumentIcon,
  CheckCircleIcon, ClockIcon, BookmarkIcon
} from '@heroicons/react/24/outline';
import { myPageApi } from '../api/myPageApi';
import api from '../api/api';
import { coverLetterApi } from '../api/coverLetterApi';
import type { ResumeItem } from '../types/interface';

/** ⭐ 추가: 토큰 훅 + 모달 + 알림 */
import { useHireTokens } from "../utils/useHireTokens";
import TokenModal from "../popUp/TokenModal";
import { notifyHire } from "../utils/notifyHire";

type InputMode = 'text' | 'essay' | 'resume';

export default function CoverLetterPage() {
  const navigate = useNavigate();

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

  /** 이력서 목록 */
  useEffect(() => {
    if (inputMode === 'resume' || inputMode === 'essay') {
      fetchResumes();
    }
  }, [inputMode]);

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

      let text = '';
      const essayTitle = resume.essayTitle ?? resume.essayTittle ?? '';
      const essayContent = resume.essayContent ?? '';

      let parsedData: any = null;
      if (resume.htmlContent) {
        try {
          parsedData = JSON.parse(resume.htmlContent);
        } catch { }
      }

      if (inputMode === 'essay') {
        text = essayContent || '자기소개서 내용이 없습니다.';
      } else if (inputMode === 'resume') {
        text = `제목: ${resume.title}\n\n`;

        if (essayTitle && essayContent) {
          text += `=== 자기소개서 ===\n${essayTitle}\n\n${essayContent}\n\n`;
        }

        const educations = parsedData?.education ?? resume.educationDtos ?? [];
        if (educations.length > 0) {
          text += `=== 학력 ===\n`;
          educations.forEach((edu: any) => {
            text += `${edu.name} | ${edu.major || ''} | ${edu.status}\n`;
          });
          text += `\n`;
        }

        const careers = parsedData?.career ?? resume.careerLevelDtos ?? (resume as any).careers ?? [];
        if (careers.length > 0) {
          text += `=== 경력 ===\n`;
          careers.forEach((c: any) => {
            text += `${c.companyName} | ${c.position}\n${c.content || ''}\n\n`;
          });
        }

        const certificates = parsedData?.certificate ?? resume.certificateDtos ?? [];
        if (certificates.length > 0) {
          text += `=== 자격증 ===\n`;
          certificates.forEach((cert: any) => {
            text += `- ${cert.name}\n`;
          });
          text += `\n`;
        }

        const skills = parsedData?.skill ?? resume.skillDtos ?? [];
        if (skills.length > 0) {
          text += `=== 기술 스택 ===\n${skills.map((s: any) => s.name).join(', ')}\n\n`;
        }

        const languages = parsedData?.language ?? [];
        if (languages.length > 0) {
          text += `=== 언어 ===\n${languages.map((lang: any) => lang.name).join(', ')}\n\n`;
        }
      }

      setOriginalText(text);
    } catch {
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

  /** 초기화 */
  const handleReset = () => {
    setOriginalText('');
    setImprovedText('');
    setSelectedResumeId(null);
    setSelectedResumeTitle('');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px]">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <DocumentTextIcon className="w-8 h-8 md:w-10 md:h-10 text-[#006AFF] mr-2" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI 자기소개서 수정</h1>
            </div>
            <button
              onClick={() => navigate('/cover-letter/history')}
              className="flex items-center px-4 py-2 text-sm md:text-base bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              <ClockIcon className="w-5 h-5 mr-2" />
              첨삭 이력
            </button>
          </div>
          <p className="text-sm md:text-base text-gray-600 text-center max-w-2xl mx-auto">
            AI가 당신의 자기소개서를 분석하고 더 나은 표현으로 개선해드립니다.
          </p>
        </div>

        {/* 입력 모드 선택 탭 */}
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

        {/* 이력서 선택 영역 (이력서/자소서 모드일 때만 표시) */}
        {(inputMode === 'resume' || inputMode === 'essay') && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <DocumentTextIcon className="w-6 h-6 text-[#006AFF] mr-2" />
              {inputMode === 'essay' ? '자기소개서 선택' : '이력서 선택'}
            </h2>
            {loadingResumes ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006AFF]"></div>
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <DocumentTextIcon className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 font-medium">작성된 이력서가 없습니다.</p>
                <p className="text-sm text-gray-500 mt-1">마이페이지에서 이력서를 먼저 작성해주세요.</p>
                <button
                  onClick={() => navigate('/myPage/resume')}
                  className="mt-4 px-4 py-2 bg-[#006AFF] text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                >
                  이력서 작성하기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => handleResumeSelect(resume.id)}
                    className={`group p-5 border rounded-xl text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${selectedResumeId === resume.id
                      ? 'border-[#006AFF] bg-blue-50/30 ring-1 ring-[#006AFF]'
                      : 'border-gray-100 bg-white hover:border-blue-200'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 truncate group-hover:text-[#006AFF] transition-colors">{resume.title}</h3>
                          {resume.locked && (
                            <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium flex-shrink-0">
                              제출됨
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {new Date(resume.createAt).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedResumeId === resume.id && (
                        <CheckCircleIcon className="w-6 h-6 text-[#006AFF] flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* 원본 자기소개서 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-6 h-6 text-gray-700 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">
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
                className={`w-full h-[400px] lg:h-[500px] p-5 border border-gray-200 rounded-xl resize-none text-base leading-relaxed overflow-y-auto transition-colors ${inputMode !== 'text'
                  ? 'bg-gray-50/50 cursor-not-allowed focus:outline-none text-gray-500'
                  : 'focus:ring-2 focus:ring-[#006AFF]/20 focus:border-[#006AFF] focus:outline-none text-gray-800 bg-gray-50/30 focus:bg-white'
                  }`}
              />
              <div className="absolute bottom-4 right-4 text-xs font-medium text-gray-400 bg-white/80 px-2 py-1 rounded backdrop-blur-sm border border-gray-100">
                {originalText.length}자
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center pt-2">
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
                {isLoading ? (
                  <>
                    <SparklesIcon className="w-5 h-5 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    AI 수정하기
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 개선된 자기소개서 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col h-full">
            <div className="flex items-center mb-4">
              <SparklesIcon className="w-6 h-6 text-[#006AFF] mr-2" />
              <h2 className="text-xl font-bold text-gray-900">수정된 자기소개서</h2>
            </div>
            {improvedText ? (
              <>
                <div className="flex-1 w-full h-[400px] lg:h-[500px] p-5 rounded-xl bg-gradient-to-br from-blue-50/30 to-white border border-blue-100 overflow-y-auto relative">
                  <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-gray-800">
                    {improvedText}
                  </pre>
                  <div className="sticky bottom-0 left-0 w-full text-right pointer-events-none">
                    <span className="inline-block bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-gray-500 border border-blue-100 pointer-events-auto">
                      {improvedText.length}자
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(improvedText);
                      alert('복사되었습니다!');
                    }}
                    className="px-5 py-2.5 text-[#006AFF] font-medium text-sm bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                  >
                    복사하기
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center px-6 py-2.5 bg-green-600 text-white font-semibold text-sm rounded-lg hover:bg-green-700 transition shadow-sm hover:shadow active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <BookmarkIcon className="w-5 h-5 mr-2" />
                    {isSaving ? '저장 중...' : '저장하기'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 w-full h-[400px] lg:h-[500px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-gray-50/50">
                <SparklesIcon className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">AI 수정 결과가 여기에 표시됩니다</p>
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
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006AFF] mt-2 mr-2 flex-shrink-0"></span>
              <span>자기소개서 내용을 왼쪽 입력창에 작성하거나, 목록에서 기존 이력서를 불러오세요.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006AFF] mt-2 mr-2 flex-shrink-0"></span>
              <span>"AI 수정하기" 버튼을 클릭하면 전문적인 톤앤매너로 문장이 다듬어집니다.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006AFF] mt-2 mr-2 flex-shrink-0"></span>
              <span>결과물은 복사하여 사용하거나, "저장하기"를 통해 마이페이지 '첨삭 이력'에 보관할 수 있습니다.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006AFF] mt-2 mr-2 flex-shrink-0"></span>
              <span>보다 정확한 결과를 위해 문맥이 끊기지 않는 완성된 문장 위주로 입력해주세요.</span>
            </li>
          </ul>
        </div>
      </div>
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
