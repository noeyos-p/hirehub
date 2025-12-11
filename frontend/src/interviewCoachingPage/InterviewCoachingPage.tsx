import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { useNavigate } from 'react-router-dom';
import { myPageApi } from '../api/myPageApi';
import { interviewCoachingApi, type InterviewSession, type InterviewCoachingHistory } from '../api/interviewCoachingApi';
import type { ResumeDto } from '../types/interface';
import api from '../api/api';
import axios from "axios";

import { useHireTokens } from "../utils/useHireTokens";
import TokenModal from "../popUp/TokenModal";
import { notifyHire } from "../utils/notifyHire";

interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
}

const InterviewCoachingPage: React.FC = () => {
  const navigate = useNavigate();

  // STEP 상태
  const [step, setStep] = useState<'select' | 'context' | 'interview' | 'feedback'>('select');

  // 데이터 관련
  const [resumes, setResumes] = useState<ResumeDto[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeDto | null>(null);
  const [historyList, setHistoryList] = useState<InterviewCoachingHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [jobPostLink, setJobPostLink] = useState('');
  const [companyLink, setCompanyLink] = useState('');

  // 인터뷰 질문/답변 진행 상태
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 모달 상태
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [viewingResume, setViewingResume] = useState<ResumeDto | null>(null);

  // 모바일 사이드바 상태
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 🔥 HIRE TOKEN 훅
  const {
    useTokens,
    modalOpen,
    neededTokens,
    handleConfirm,
    handleClose
  } = useHireTokens();

  // 로그인 체크
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
    }
  }, [navigate]);

  // 이력서 목록 가져오기
  useEffect(() => {
    const loadResumes = async () => {
      try {
        const res = await myPageApi.getResumes({ page: 0, size: 50 });
        const resumeList = res.rows || res.content || [];

        const detailList = await Promise.all(
          resumeList.map(async r => {
            try {
              const detail = await myPageApi.getResumeDetail(r.id);
              return detail;
            } catch {
              return r;
            }
          })
        );

        setResumes(detailList);
      } catch (err) {
        console.error("이력서 로딩 실패:", err);
      }
    };

    loadResumes();
  }, []);

  // 면접 연습 이력 가져오기
  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const data = await interviewCoachingApi.getHistoryList();

        // 배열이 아닌 경우 처리
        if (Array.isArray(data)) {
          setHistoryList(data);
        } else if (data && typeof data === 'object') {
          // 객체인 경우 (예: { content: [...], totalElements: ... })
          const list = (data as any).content || (data as any).data || [];
          console.log("📝 추출된 리스트:", list);
          setHistoryList(list);
        } else {
          console.warn("예상치 못한 데이터 형식:", data);
          setHistoryList([]);
        }
      } catch (err) {
        console.error("❌ 면접 연습 이력 로딩 실패:", err);
        console.error("에러 상세:", err);
        setHistoryList([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, []);

  // 모바일 메뉴 닫기 (페이지 이동 시)
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [selectedResume, step]);

  // 이력서 요약 파싱 함수
  const getResumeSummary = (resume: ResumeDto) => {
    try {
      let educations: any[] = [];
      let careers: any[] = [];
      let skills: any[] = [];

      if ((resume as any).educationList) educations = (resume as any).educationList;
      else if (resume.educations) educations = resume.educations;
      else if (resume.educationJson) educations = JSON.parse(resume.educationJson);

      if ((resume as any).careerList) careers = (resume as any).careerList;
      else if (resume.careers) careers = resume.careers;
      else if (resume.careerJson) careers = JSON.parse(resume.careerJson);

      if ((resume as any).skillList) skills = (resume as any).skillList;
      else if (resume.skills) skills = resume.skills;
      else if (resume.skillJson) skills = JSON.parse(resume.skillJson);

      const education = educations.length > 0 ? (educations[0].name || '정보 없음') : '정보 없음';
      const career =
        careers.length > 0
          ? `${careers[0].companyName || careers[0].company || '회사'} ${careers[0].position || ''}`
          : '신입';

      const skillList =
        skills.length > 0
          ? skills.map(s => s.name || s.skill || s.skillName || s).join(', ')
          : '정보 없음';

      return { education, career, skillList };
    } catch (err) {
      return { education: "정보 없음", career: "신입", skillList: "정보 없음" };
    }
  };

  // 이력서 선택
  const handleResumeSelect = (resume: ResumeDto) => {
    try {
      console.log('선택된 이력서:', resume);
      setSelectedResume(resume);
    } catch (error) {
      console.error('이력서 선택 중 오류:', error);
      alert('이력서 선택 중 오류가 발생했습니다.');
    }
  };

  // 이력서 상세 조회 (모달용)
  const handleViewResume = async (resume: ResumeDto) => {
    try {
      handleResumeSelect(resume);
      // 전체 상세 정보 다시 가져오기
      const fullDetail = await myPageApi.getResumeDetail(resume.id);
      console.log('전체 이력서 데이터:', fullDetail);
      setViewingResume(fullDetail);
      setIsResumeModalOpen(true);
    } catch (error) {
      console.error('이력서 조회 실패:', error);
      alert('이력서를 불러올 수 없습니다.');
    }
  };

  // ⭐ 면접 시작 (질문 생성) + 토큰 5 차감
  const handleStartInterview = async () => {
    if (!selectedResume) {
      alert('이력서를 먼저 선택해주세요.');
      return;
    }

    setIsLoading(true);

    // 1) 토큰 차감
    const ok = await useTokens(
      5,
      "USE_INTERVIEW_COACHING",
      "AI 면접 질문 받기"
    );
    if (!ok) {
      setIsLoading(false);
      return; // 모달 뜸
    }

    notifyHire("HIRE 5개가 사용되었습니다.");
    setStep("interview");

    try {
      // 이전 질문 목록 가져오기
      let previousQuestions: string[] = [];
      try {
        const historyList = await interviewCoachingApi.getHistoryList();
        historyList.forEach(h =>
          h.sessions.forEach(s => s.question && previousQuestions.push(s.question))
        );
      } catch { }

      // 공고/기업 ID 추출
      let extractedJobPostId: number | undefined = undefined;
      let extractedCompanyId: number | undefined = undefined;

      if (jobPostLink) {
        const m = jobPostLink.match(/\/jobPostings\/(\d+)/) || jobPostLink.match(/\/job-post\/(\d+)/);
        if (m) extractedJobPostId = parseInt(m[1], 10);
      }
      if (companyLink) {
        const m = companyLink.match(/\/company\/(\d+)/);
        if (m) extractedCompanyId = parseInt(m[1], 10);
      }

      // 질문 생성 API 호출
      const response = await axios.post('http://localhost:8000/interview/generate-questions', {
        resumeId: selectedResume.id,
        jobPostId: extractedJobPostId,
        companyId: extractedCompanyId,
        jobPostLink: jobPostLink || undefined,
        companyLink: companyLink || undefined,
        previousQuestions,
      });

      const questions = response.data;
      if (Array.isArray(questions) && questions.length > 0) {
        setCurrentQuestion(questions[0]);
        setIsLoading(false);
        return;
      }

      throw new Error('질문 없음');
    } catch (error) {
      console.error("질문 생성 실패 → fallback 사용");

      const summary = getResumeSummary(selectedResume);
      const fallbackQuestions = [
        {
          id: 1,
          question: `이력서 기반 질문: ${summary.career} 관련 경험을 설명해주세요.`,
          category: "경험",
        },
        {
          id: 2,
          question: `가장 자신 있는 기술(${summary.skillList})을 설명해주세요.`,
          category: "기술",
        },
      ];

      setCurrentQuestion(fallbackQuestions[0]);
      setIsLoading(false);
    }
  };

  // 답변 제출 및 AI 피드백 받기
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      alert('답변을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/interview/feedback', {
        resumeId: selectedResume?.id,
        jobPostLink: jobPostLink || undefined,
        companyLink: companyLink || undefined,
        question: currentQuestion?.question,
        answer,
      });

      const feedbackText = response.data.feedback;

      if (feedbackText) {
        setFeedback(feedbackText);

        // 세션 저장
        setInterviewSessions(prev => [...prev, {
          question: currentQuestion!.question,
          category: currentQuestion!.category,
          answer: answer,
          feedback: feedbackText
        }]);

        setStep('feedback');
        setIsLoading(false);
      } else {
        throw new Error('피드백이 비어있습니다.');
      }
    } catch (error) {
      console.error('피드백 받기 실패:', error);

      // fallback: 기존 임시 피드백 로직 사용
      setTimeout(() => {
        const summary = getResumeSummary(selectedResume!);
        let contextFeedback = '';

        if (jobPostLink.trim()) {
          contextFeedback = `\n📋 **공고 관련 조언**\n- 공고에서 요구하는 경력 수준과 기술 스택을 고려하여 답변하세요.\n- 직무의 핵심 역량을 강조하면 좋습니다.\n- 공고 링크: ${jobPostLink}`;
        }

        if (companyLink.trim()) {
          contextFeedback += `\n\n🏢 **기업 정보 활용**\n- 기업의 비전과 문화를 이해하고 답변에 반영하세요.\n- 회사가 추구하는 가치와 본인의 가치관을 연결지어 설명하면 효과적입니다.\n- 기업 링크: ${companyLink}`;
        }

        const feedbackText = `[AI 면접관의 피드백]

✅ **답변의 강점**
- 구체적인 경험을 바탕으로 답변하셨습니다.
- 본인의 역할과 기여도가 명확하게 드러납니다.

⚠️ **개선이 필요한 부분**
1. **구조화**: STAR 기법(상황-과제-행동-결과)을 활용하면 더 체계적인 답변이 됩니다.
2. **정량화**: 구체적인 수치나 성과 지표를 추가하면 신뢰도가 높아집니다.
   예: "성능을 개선했다" → "응답 시간을 30% 단축했다"
3. **연결성**: 이력서의 "${summary.skillList}" 기술 경험과 연결지어 설명하면 일관성이 높아집니다.

💡 **추천 답변 템플릿**
[상황] 프로젝트 배경과 당시 상황 설명
[과제] 해결해야 할 문제나 달성할 목표
[행동] 본인이 취한 구체적인 행동과 기술 활용
[결과] 정량적 성과와 배운 점
${contextFeedback}

📌 **다음 면접을 위한 조언**
이력서에 기재된 "${summary.career}" 경험을 더 깊이 있게 준비하시면 좋을 것 같습니다.`;

        setFeedback(feedbackText);

        // 세션 저장
        setInterviewSessions(prev => [...prev, {
          question: currentQuestion!.question,
          category: currentQuestion!.category,
          answer: answer,
          feedback: feedbackText
        }]);

        setStep('feedback');
        setIsLoading(false);
      }, 2000);
    }
  };

  // 다음 질문으로
  // 다음 질문으로
const handleNextQuestion = async () => {
  setAnswer('');
  setFeedback('');
  setStep('interview');
  setQuestionIndex((prev) => prev + 1);

  // 이전 질문들
  const previousQuestions = interviewSessions.map(s => s.question);

  // 링크에서 아이디 추출
  let extractedJobPostId: number | undefined = undefined;
  let extractedCompanyId: number | undefined = undefined;

  const m1 = jobPostLink.match(/\/jobPostings\/(\d+)/) || jobPostLink.match(/\/job-post\/(\d+)/);
  if (m1) extractedJobPostId = parseInt(m1[1], 10);

  const m2 = companyLink.match(/\/company\/(\d+)/);
  if (m2) extractedCompanyId = parseInt(m2[1], 10);

  try {
    const nextResponse = await axios.post('http://localhost:8000/interview/generate-questions', {
      resumeId: selectedResume!.id,
      jobPostId: extractedJobPostId,
      companyId: extractedCompanyId,
      jobPostLink: jobPostLink || undefined,
      companyLink: companyLink || undefined,
      previousQuestions,
    });

    const nextQuestions = nextResponse.data;

    if (Array.isArray(nextQuestions) && nextQuestions.length > 0) {
      setCurrentQuestion(nextQuestions[0]);
    } else {
      throw new Error("질문 없음");
    }
  } catch (err) {
    console.error("다음 질문 생성 실패:", err);
    setCurrentQuestion({
      id: Date.now(),
      question: "이전 질문과 다른 관점에서, 본인의 기술적 강점을 하나만 설명해주세요.",
      category: "기술"
    });
  }
};


  // 저장하기
  const handleSave = async () => {
    if (interviewSessions.length === 0) {
      alert('저장할 면접 연습 내용이 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      await interviewCoachingApi.saveHistory({
        resumeId: selectedResume!.id,
        resumeTitle: selectedResume!.title || '',
        jobPostLink: jobPostLink || undefined,
        companyLink: companyLink || undefined,
        sessions: interviewSessions,
      });
      alert('면접 연습 내용이 저장되었습니다!');
    } catch (error: any) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  // 처음으로
  const handleReset = () => {
    setStep('select');
    setSelectedResume(null);
    setJobPostLink('');
    setCompanyLink('');
    setCurrentQuestion(null);
    setAnswer('');
    setFeedback('');
    setQuestionIndex(0);
    setInterviewSessions([]);
  };

  // 사이드바 콘텐츠 렌더러 (Desktop/Mobile 공용)
  const renderSidebarContent = () => (
    <nav className="space-y-4 xl:space-y-6">
      <button
        onClick={() => {
          navigate('/interview-coaching');
          setIsMobileSidebarOpen(false);
        }}
        className="w-full text-left text-sm xl:text-[16px] hover:text-[#006AFF] transition"
        style={{ color: '#006AFF' }}
      >
        면접코칭
      </button>
      <div>
        <div className="text-gray-400 text-sm xl:text-[16px] mb-2">면접연습</div>
        <div className="space-y-4">
          {(() => {
            // 질문이 있는 이력서만 필터링
            const resumesWithQuestions = resumes.filter(resume => {
              const questionCount = historyList
                .filter(h => h.resumeId === resume.id)
                .reduce((sum, h) => sum + (h.sessions?.length || 0), 0);
              return questionCount > 0;
            });

            if (resumesWithQuestions.length === 0) {
              return (
                <div className="text-sm text-gray-400">
                  저장된 이력이 없습니다
                </div>
              );
            }

            return resumesWithQuestions.map((resume) => {
              const questionCount = historyList
                .filter(h => h.resumeId === resume.id)
                .reduce((sum, h) => sum + (h.sessions?.length || 0), 0);

              return (
                <button
                  key={resume.id}
                  onClick={() => {
                    navigate('/interview-coaching/history', { state: { resumeId: resume.id } });
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full text-left text-gray-700 hover:text-[#006AFF] transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm truncate flex-1">{resume.title || '새 이력서'}</div>
                    <div className="text-xs text-gray-400 flex-shrink-0">
                      총 질문 <span style={{ color: '#006AFF' }}>{questionCount}</span>개
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
            <div className="relative w-[80%] max-w-[300px] bg-white h-full shadow-xl flex flex-col p-6 animate-slideRight">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="w-6 h-6 text-[#006AFF]" />
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
                <BriefcaseIcon className="w-8 h-8 md:w-10 md:h-10" style={{ color: '#006AFF' }} />
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI 면접 코칭</h1>
              </div>
            </div>

            {/* Step 1, 2: 이력서 선택 & 컨텍스트 입력 */}
            {(step === 'select' || step === 'context') && (
              <div className="space-y-10">
                {/* 이력서 선택 섹션 */}
                <section>
                  <div className="flex items-center mb-4">
                    <DocumentTextIcon className="w-6 h-6 text-gray-700 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">이력서 선택</h2>
                  </div>

                  {resumes.length === 0 ? (
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      {resumes.map((resume) => {
                        const summary = getResumeSummary(resume);
                        const isSelected = selectedResume?.id === resume.id;
                        const isSubmitted = resume.locked || resume.appliedAt || resume.companyName;
                        console.log('Resume:', resume.title, '| locked:', resume.locked, '| appliedAt:', resume.appliedAt, '| companyName:', resume.companyName, '| isSubmitted:', isSubmitted);
                        return (
                          <div
                            key={resume.id}
                            onClick={() => handleResumeSelect(resume)}
                            className={`bg-white rounded-2xl shadow-sm border p-5 sm:p-6 transition-all cursor-pointer active:scale-[0.98] ${isSelected
                              ? 'border-[#006AFF] ring-1 ring-[#006AFF] bg-blue-50/10'
                              : 'border-gray-200 hover:border-[#006AFF] hover:shadow-md'
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

                {/* 지원 공고/기업 링크 입력 */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* 지원할 공고 링크 */}
                  <div>
                    <div className="flex items-center mb-4">
                      <BriefcaseIcon className="w-6 h-6 text-gray-700 mr-2" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        지원할 공고 링크 <span className="text-gray-400 font-normal">(선택사항)</span>
                      </h3>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                      <p className="text-sm text-gray-600 mb-6">
                        지원할 공고 URL을 입력하면 채용 공고사항에 맞춤 질문을 받을 수 있습니다.
                      </p>
                      <input
                        type="text"
                        value={jobPostLink}
                        onChange={(e) => setJobPostLink(e.target.value)}
                        placeholder="예 : https://noeyos.store/jobPostings/1"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* 지원할 기업 링크 */}
                  <div>
                    <div className="flex items-center mb-4">
                      <BuildingOfficeIcon className="w-6 h-6 text-gray-700 mr-2" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        지원할 기업 링크 <span className="text-gray-400 font-normal">(선택사항)</span>
                      </h3>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                      <p className="text-sm text-gray-600 mb-6">
                        지원할 공고 URL을 입력하면 해당 직무와 요구사항에 맞춤 질문을 받을 수 있습니다.
                      </p>
                      <input
                        type="text"
                        value={companyLink}
                        onChange={(e) => setCompanyLink(e.target.value)}
                        placeholder="예 : https://noeyos.store/jobPostings/1"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </section>

                {/* 면접 질문 받기 버튼 */}
                <div className="flex justify-center pt-6">
                  <button
                    onClick={handleStartInterview}
                    disabled={isLoading || !selectedResume}
                    className="w-full sm:w-auto px-6 sm:px-12 py-3 sm:py-4 bg-[#006AFF] hover:bg-blue-700 text-white text-lg sm:text-[20px] font-semibold rounded-xl transition shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isLoading ? '질문 생성 중...' : '면접 질문 받기'}
                  </button>
                </div>

                {/* 사용 가이드 */}
                <section className="bg-blue-50 rounded-2xl p-8 mt-12 border" style={{ borderColor: '#C8E6FF' }}>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">사용 가이드</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-3">-</span>
                      <span>AI가 이력서를 분석하여 개인 맞춤형 면접 질문을 생성합니다.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3">-</span>
                      <span>지원할 공고나 기업을 추가하면 더 구체적인 질문을 받을 수 있습니다.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3">-</span>
                      <span>STAR 기법(상황-과제-행동-결과)을 활용하여 답변해보세요.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3">-</span>
                      <span>AI 피드백을 참고하여 답변을 개선하고 반복 연습할 수 있습니다.</span>
                    </li>
                  </ul>
                </section>
              </div>
            )}

            {/* Step 3: 면접 질문 & 답변 */}
            {step === 'interview' && currentQuestion && (
              <div className="space-y-8">
                {/* 공고/기업 링크 표시 */}
                {(jobPostLink || companyLink) && (
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 지원 공고 링크 */}
                    {jobPostLink && (
                      <div>
                        <div className="flex items-center mb-3">
                          <BriefcaseIcon className="w-5 h-5 text-gray-700 mr-2" />
                          <h3 className="text-base font-semibold text-gray-900">지원 공고</h3>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                          <a
                            href={jobPostLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 break-all underline"
                          >
                            {jobPostLink}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* 지원 기업 링크 */}
                    {companyLink && (
                      <div>
                        <div className="flex items-center mb-3">
                          <BuildingOfficeIcon className="w-5 h-5 text-gray-700 mr-2" />
                          <h3 className="text-base font-semibold text-gray-900">지원 기업</h3>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                          <a
                            href={companyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 break-all underline"
                          >
                            {companyLink}
                          </a>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* 질문 섹션 */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">질문</h2>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-gray-900 text-lg leading-relaxed">
                      {currentQuestion.question}
                    </p>
                  </div>
                </div>

                {/* 답변 섹션 */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">답변</h2>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="힌 센 사항의 말을 듣겁 했습니다."
                      className="w-full h-64 border-none focus:outline-none resize-none text-gray-700 text-base leading-relaxed"
                    />
                  </div>
                </div>

                {/* 피드백 받기 버튼 */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isLoading || !answer.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-12 py-3 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '피드백 분석 중...' : '피드백 받기'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: AI 피드백 */}
            {step === 'feedback' && (
              <div className="space-y-8">
                {/* 공고/기업 링크 표시 */}
                {(jobPostLink || companyLink) && (
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 지원 공고 링크 */}
                    {jobPostLink && (
                      <div>
                        <div className="flex items-center mb-3">
                          <BriefcaseIcon className="w-5 h-5 text-gray-700 mr-2" />
                          <h3 className="text-base font-semibold text-gray-900">지원 공고</h3>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                          <a
                            href={jobPostLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 break-all underline"
                          >
                            {jobPostLink}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* 지원 기업 링크 */}
                    {companyLink && (
                      <div>
                        <div className="flex items-center mb-3">
                          <BuildingOfficeIcon className="w-5 h-5 text-gray-700 mr-2" />
                          <h3 className="text-base font-semibold text-gray-900">지원 기업</h3>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                          <a
                            href={companyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 break-all underline"
                          >
                            {companyLink}
                          </a>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* 질문 섹션 */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">질문</h2>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-gray-900 text-lg leading-relaxed">
                      {currentQuestion?.question}
                    </p>
                  </div>
                </div>

                {/* 답변 섹션 */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">답변</h2>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {answer}
                    </p>
                  </div>
                </div>

                {/* 피드백 섹션 */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">피드백</h2>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-7">
                      {feedback}
                    </pre>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    {isSaving ? '저장 중...' : '결과 저장'}
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    다음 질문 받기
                  </button>
                </div>
              </div>
            )}
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

      {/* ⭐ TOKEN MODAL */}
      <TokenModal
        isOpen={modalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        needed={neededTokens}
      />
    </div>
  );
};

export default InterviewCoachingPage;
