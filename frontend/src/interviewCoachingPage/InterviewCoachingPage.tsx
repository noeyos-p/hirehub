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
} from '@heroicons/react/24/outline';

import { useNavigate } from 'react-router-dom';
import { myPageApi } from '../api/myPageApi';
import { interviewCoachingApi, type InterviewSession } from '../api/interviewCoachingApi';
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

  // 이력서 요약 파싱 함수 (그대로 유지)
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
      setStep('context');
    } catch (error) {
      console.error('이력서 선택 중 오류:', error);
      alert('이력서 선택 중 오류가 발생했습니다.');
    }
  };

  // ⭐ 면접 시작 (질문 생성) + 토큰 5 차감
  const handleStartInterview = async () => {
    if (!selectedResume) return;

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
      // TODO: 백엔드 API 연동 - AI 피드백 받기
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
  const handleNextQuestion = () => {
    setAnswer('');
    setFeedback('');
    setStep('interview');
    setQuestionIndex((prev) => prev + 1);

    const summary = getResumeSummary(selectedResume!);

    // 새로운 질문 생성
    const newQuestions = [
      {
        id: questionIndex + 10,
        question: `팀 프로젝트 중 의견 충돌이 있었던 경험과 해결 과정을 말씀해 주세요.`,
        category: '상황대처',
      },
      {
        id: questionIndex + 11,
        question: `${summary.education} 전공 과정에서 배운 것 중 실무에 가장 도움이 된 것은 무엇인가요?`,
        category: '교육',
      },
      {
        id: questionIndex + 12,
        question: `앞으로 5년 후 본인의 커리어 목표는 무엇인가요?`,
        category: '비전',
      },
    ];

    setCurrentQuestion(newQuestions[questionIndex % 3]);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px]">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BriefcaseIcon className="w-8 h-8 md:w-10 md:h-10 text-[#006AFF] mr-2" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI 면접 코칭</h1>
            </div>
            <button
              onClick={() => navigate('/interview-coaching/history')}
              className="flex items-center px-4 py-2 text-sm md:text-base bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              <ClockIcon className="w-5 h-5 mr-2" />
              연습 이력
            </button>
          </div>
          <p className="text-sm md:text-base text-gray-600 text-center max-w-2xl mx-auto">
            이력서를 기반으로 AI가 맞춤형 면접 질문을 생성하고 피드백을 제공합니다.
          </p>
        </div>

        {/* Step 1: 이력서 선택 */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-[#006AFF]">
              <div className="flex items-start">
                <DocumentTextIcon className="w-6 h-6 text-[#006AFF] mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">이력서 선택</h2>
                  <p className="text-gray-600">
                    면접 연습에 사용할 이력서를 선택해주세요. AI가 이력서 내용을 분석하여 맞춤형 질문을 생성합니다.
                  </p>
                </div>
              </div>
            </div>

            {resumes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
                <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4 font-medium">등록된 이력서가 없습니다.</p>
                <button
                  onClick={() => navigate('/myPage/resume')}
                  className="bg-[#006AFF] hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg transition"
                >
                  이력서 작성하러 가기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {resumes.map((resume) => {
                  try {
                    const summary = getResumeSummary(resume);
                    return (
                      <button
                        key={resume.id}
                        onClick={() => handleResumeSelect(resume)}
                        className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 text-left border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-[#006AFF] transition-colors">{resume.title || '제목 없음'}</h3>
                          <DocumentTextIcon className="w-6 h-6 text-gray-400 group-hover:text-[#006AFF] transition-colors flex-shrink-0" />
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p className="line-clamp-1">
                            <span className="font-semibold text-gray-700 mr-1">학력:</span>
                            {summary.education}
                          </p>
                          <p className="line-clamp-1">
                            <span className="font-semibold text-gray-700 mr-1">경력:</span>
                            {summary.career}
                          </p>
                          <p className="line-clamp-1">
                            <span className="font-semibold text-gray-700 mr-1">기술:</span>
                            {summary.skillList}
                          </p>
                        </div>
                      </button>
                    );
                  } catch (error) {
                    console.error('이력서 렌더링 오류:', resume.id, error);
                    return null;
                  }
                })}
              </div>
            )}

            {/* 안내 사항 */}
            <div className="mt-10 bg-gradient-to-br from-[#EFF4F8] to-white border border-[#D6E4F0] rounded-xl p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <SparklesIcon className="w-6 h-6 text-[#006AFF] mr-2" />
                AI 면접 코칭 이용 안내
              </h3>
              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006AFF] mt-2 mr-2 flex-shrink-0"></span>
                  <span>AI가 이력서를 분석하여 개인 맞춤형 면접 질문을 생성합니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006AFF] mt-2 mr-2 flex-shrink-0"></span>
                  <span>지원할 공고나 기업을 추가하면 더 구체적인 질문을 받을 수 있습니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006AFF] mt-2 mr-2 flex-shrink-0"></span>
                  <span>STAR 기법(상황-과제-행동-결과)을 활용하여 답변해보세요.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: 공고/기업 선택 (선택사항) */}
        {step === 'context' && selectedResume && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center">
                <DocumentTextIcon className="w-6 h-6 text-[#006AFF] mr-2" />
                <h2 className="text-xl font-bold text-gray-800">선택된 이력서: {selectedResume.title}</h2>
              </div>
              <button
                onClick={() => setStep('select')}
                className="text-sm font-medium text-gray-500 hover:text-[#006AFF] transition underline decoration-gray-300 underline-offset-4"
              >
                변경하기
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 공고 링크 입력 */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 h-full">
                <div className="flex items-center mb-4">
                  <BriefcaseIcon className="w-6 h-6 text-[#006AFF] mr-2" />
                  <h3 className="text-lg font-bold text-gray-900">지원 공고 연결</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4 h-10">
                  채용 공고 URL을 입력하면 직무 요구사항에 딱 맞는 질문을 받을 수 있습니다.
                </p>
                <input
                  type="text"
                  value={jobPostLink}
                  onChange={(e) => setJobPostLink(e.target.value)}
                  placeholder="공고 URL 입력 (선택)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20 focus:border-[#006AFF] transition bg-gray-50/30 focus:bg-white"
                />
              </div>

              {/* 기업 링크 입력 */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 h-full">
                <div className="flex items-center mb-4">
                  <BuildingOfficeIcon className="w-6 h-6 text-[#006AFF] mr-2" />
                  <h3 className="text-lg font-bold text-gray-900">관심 기업 연결</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4 h-10">
                  기업 홈페이지나 채용 페이지 URL을 입력하여 기업 맞춤형 질문을 받아보세요.
                </p>
                <input
                  type="text"
                  value={companyLink}
                  onChange={(e) => setCompanyLink(e.target.value)}
                  placeholder="기업 URL 입력 (선택)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20 focus:border-[#006AFF] transition bg-gray-50/30 focus:bg-white"
                />
              </div>
            </div>

            {/* 시작 버튼 */}
            <div className="flex justify-center pt-8">
              <button
                onClick={handleStartInterview}
                disabled={isLoading}
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-[#006AFF] hover:bg-blue-600 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="w-6 h-6 mr-3 animate-spin" />
                    맞춤형 질문 생성 중...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                    AI 면접 시작하기
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 면접 질문 & 답변 */}
        {step === 'interview' && currentQuestion && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* 컨텍스트 정보바 */}
            <div className="bg-white rounded-full shadow-sm py-2 px-6 border border-gray-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                <span className="flex items-center">
                  <DocumentTextIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                  {selectedResume?.title}
                </span>
                {(jobPostLink || companyLink) && <span className="text-gray-300">|</span>}
                {jobPostLink && <span className="text-[#006AFF]">공고 연결됨</span>}
                {companyLink && <span className="text-[#006AFF]">기업 연결됨</span>}
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-gray-400 hover:text-red-500 transition"
              >
                그만하기
              </button>
            </div>

            {/* AI 질문 카드 */}
            <div className="bg-white rounded-3xl shadow-md p-6 md:p-10 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#006AFF]"></div>
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
                  <SparklesIcon className="w-7 h-7 text-[#006AFF]" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-[#006AFF] text-xs font-bold rounded-full mb-3">
                    {currentQuestion.category} 질문
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-normal mb-2">
                    "{currentQuestion.question}"
                  </h3>
                  <p className="text-gray-500 text-sm md:text-base">
                    AI 면접관이 답변을 기다리고 있습니다. 충분히 고민 후 답변해주세요.
                  </p>
                </div>
              </div>
            </div>

            {/* 답변 입력 */}
            <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-gray-100">
              <label className="block text-gray-700 font-bold mb-3 flex items-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 text-gray-400" />
                나의 답변
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="답변을 입력해주세요.&#10;&#10;💡 STAR 기법 활용 팁:&#10;Situation(상황) - Task(과제) - Action(행동) - Result(결과) 순서로 구체적으로 작성해보세요."
                className="w-full h-64 md:h-80 border border-gray-200 rounded-2xl p-5 text-gray-700 text-lg leading-relaxed focus:outline-none focus:border-[#006AFF] focus:ring-4 focus:ring-blue-50 resize-none transition-all placeholder:text-gray-300 bg-gray-50/30 focus:bg-white"
              />
              <div className="mt-6 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                  현재 {answer.length}자
                </span>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={isLoading || !answer.trim()}
                  className="bg-[#006AFF] hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-xl transition shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                      피드백 분석 중...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      답변 제출하기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: AI 피드백 */}
        {step === 'feedback' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              {/* 질문 리마인드 */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-start gap-3">
                <div className="bg-white p-1.5 rounded-full shadow-sm mt-0.5">
                  <SparklesIcon className="w-4 h-4 text-[#006AFF]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">질문</p>
                  <p className="text-gray-800 font-medium">{currentQuestion?.question}</p>
                </div>
              </div>

              {/* 내 답변 */}
              <div className="px-6 py-6 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-500 mb-2">나의 답변</p>
                <div className="bg-gray-50 rounded-xl p-4 text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100">
                  {answer}
                </div>
              </div>

              {/* AI 피드백 */}
              <div className="px-6 py-6 bg-blue-50/30">
                <div className="flex items-center mb-4">
                  <BriefcaseIcon className="w-6 h-6 text-[#006AFF] mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">AI 면접관의 피드백</h3>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 prose prose-blue max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-7">
                    {feedback}
                  </pre>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="px-6 py-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition shadow-sm"
                >
                  {isSaving ? '저장 중...' : '결과 저장'}
                </button>
                <button
                  onClick={handleNextQuestion}
                  className="px-8 py-3 bg-[#006AFF] text-white font-bold rounded-xl hover:bg-blue-600 transition shadow-md hover:shadow-lg flex items-center"
                >
                  다음 질문 받기
                  <ArrowPathIcon className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ⭐ TOKEN MODAL */}
        <TokenModal
          isOpen={modalOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          needed={neededTokens}
        />

      </div>
    </div>
  );
};


export default InterviewCoachingPage;