import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { myPageApi } from '../api/myPageApi';
import { jobPostApi } from '../api/jobPostApi';
import type { ResumeDto, JobPostResponse, CompanyResponse } from '../types/interface';

interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
}

interface InterviewContext {
  resumeId: number;
  resumeTitle: string;
  jobPostId?: number;
  jobPostTitle?: string;
  companyId?: number;
  companyName?: string;
}

const InterviewCoachingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'context' | 'interview' | 'feedback'>('select');
  const [resumes, setResumes] = useState<ResumeDto[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeDto | null>(null);
  const [jobPostLink, setJobPostLink] = useState<string>('');
  const [companyLink, setCompanyLink] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  // 로그인 여부 확인
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
    }
  }, [navigate]);

  // 이력서 목록 불러오기
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await myPageApi.getResumes({ page: 0, size: 50 });
        const resumeList = response.rows || response.content || [];

        // 이력서 상세 정보 가져오기
        const detailedResumes = await Promise.all(
          resumeList.map(async (resume: any) => {
            try {
              const detail = await myPageApi.getResumeDetail(resume.id);
              return detail;
            } catch (error) {
              console.error(`이력서 ${resume.id} 상세 조회 실패:`, error);
              return resume;
            }
          })
        );

        setResumes(detailedResumes);
      } catch (error) {
        console.error('이력서 불러오기 실패:', error);
        setResumes([]);
      }
    };

    fetchResumes();
  }, []);


  // 이력서 내용 요약 추출
  const getResumeSummary = (resume: ResumeDto) => {
    try {
      console.log('이력서 원본 데이터:', resume);

      // JSON 파싱 시도
      let educations: any[] = [];
      let careers: any[] = [];
      let skills: any[] = [];

      // educations 파싱 - educationList 우선
      if ((resume as any).educationList && Array.isArray((resume as any).educationList)) {
        educations = (resume as any).educationList;
      } else if (resume.educations && Array.isArray(resume.educations)) {
        educations = resume.educations;
      } else if (resume.educationJson && resume.educationJson !== 'null' && resume.educationJson !== '[]') {
        try {
          educations = JSON.parse(resume.educationJson);
        } catch (e) {
          console.error('educationJson 파싱 실패:', e);
        }
      }

      // careers 파싱 - careerList 우선
      if ((resume as any).careerList && Array.isArray((resume as any).careerList)) {
        careers = (resume as any).careerList;
      } else if (resume.careers && Array.isArray(resume.careers)) {
        careers = resume.careers;
      } else if (resume.careerJson && resume.careerJson !== 'null' && resume.careerJson !== '[]') {
        try {
          careers = JSON.parse(resume.careerJson);
        } catch (e) {
          console.error('careerJson 파싱 실패:', e);
        }
      }

      // skills 파싱 - skillList 우선
      if ((resume as any).skillList && Array.isArray((resume as any).skillList)) {
        skills = (resume as any).skillList;
      } else if (resume.skills && Array.isArray(resume.skills)) {
        skills = resume.skills;
      } else if (resume.skillJson && resume.skillJson !== 'null' && resume.skillJson !== '[]') {
        try {
          skills = JSON.parse(resume.skillJson);
        } catch (e) {
          console.error('skillJson 파싱 실패:', e);
        }
      }

      console.log('파싱된 educations:', educations);
      console.log('파싱된 careers:', careers);
      console.log('파싱된 skills:', skills);

      // 학력 추출 (name 필드 사용)
      const education = educations.length > 0
        ? (educations[0].name || educations[0].school || educations[0].schoolName || '정보 없음')
        : '정보 없음';

      // 경력 추출 (companyName 필드 사용)
      const career = careers.length > 0
        ? `${careers[0].companyName || careers[0].company || '회사'} ${careers[0].position || careers[0].role || ''}`.trim()
        : '신입';

      // 기술 추출 (name 필드 사용)
      const skillList = skills.length > 0
        ? skills.map((s: any) => s.name || s.skill || s.skillName || s).filter(Boolean).join(', ')
        : '정보 없음';

      console.log('추출 결과:', { education, career, skillList });

      return { education, career, skillList };
    } catch (error) {
      console.error('이력서 요약 추출 실패:', error, resume);
      return { education: '정보 없음', career: '신입', skillList: '정보 없음' };
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

  // 컨텍스트 설정 완료 및 질문 생성
  const handleStartInterview = async () => {
    if (!selectedResume) return;

    setIsLoading(true);
    setStep('interview');

    try {
      // TODO: 백엔드 API 연동 - 이력서, 공고, 기업 정보 기반 면접 질문 생성
      // const response = await api.post('/interview/generate-questions', {
      //   resumeId: selectedResume.id,
      //   jobPostId: selectedJobPost?.id,
      //   companyId: selectedCompany?.id,
      // });
      // setCurrentQuestion(response.data[0]);

      // 임시 질문 생성 (이력서 + 공고 + 기업 기반)
      setTimeout(() => {
        const summary = getResumeSummary(selectedResume);
        const questions: InterviewQuestion[] = [];

        // 이력서 기반 질문
        try {
          const careers = (selectedResume as any).careerList || selectedResume.careers || (selectedResume.careerJson && selectedResume.careerJson !== 'null' ? JSON.parse(selectedResume.careerJson) : []);
          if (careers.length > 0 && (careers[0].companyName || careers[0].company)) {
            questions.push({
              id: 1,
              question: `이력서에 ${careers[0].companyName || careers[0].company}에서 ${careers[0].position || '근무'} 경험을 작성하셨는데, 가장 기억에 남는 프로젝트와 본인의 역할에 대해 말씀해 주세요.`,
              category: '경험',
            });
          }
        } catch (error) {
          console.error('경력 정보 파싱 실패:', error);
        }

        // 기술 스택 질문
        if (summary.skillList !== '정보 없음') {
          questions.push({
            id: 2,
            question: `이력서에 ${summary.skillList} 기술을 보유하고 계신다고 하셨는데, 이 중 가장 자신 있는 기술과 실제 프로젝트 적용 경험을 말씀해 주세요.`,
            category: '기술',
          });
        }

        // 공고 링크가 있을 경우
        if (jobPostLink.trim()) {
          questions.push({
            id: 3,
            question: `해당 공고에 지원하시는 이유와, 본인이 이 직무에 적합한 이유를 말씀해 주세요.`,
            category: '지원동기',
          });

          questions.push({
            id: 4,
            question: `해당 직무에서 요구하는 역량과 경험에 대해, 본인의 이력서 내용이 어떻게 부합하는지 설명해 주세요.`,
            category: '직무적합성',
          });
        }

        // 기업 링크가 있을 경우
        if (companyLink.trim()) {
          questions.push({
            id: 5,
            question: `해당 기업에 대해 알고 계신 것과, 이 회사에서 이루고 싶은 목표를 말씀해 주세요.`,
            category: '기업이해도',
          });
        }

        // 자기소개서 기반 질문
        if (selectedResume.essayContent) {
          questions.push({
            id: 6,
            question: `자기소개서에 작성하신 내용을 바탕으로, 본인의 강점을 뒷받침할 수 있는 구체적인 사례를 말씀해 주세요.`,
            category: '인성',
          });
        }

        // 기본 질문 (이력서 정보가 부족할 경우)
        if (questions.length === 0) {
          questions.push({
            id: 1,
            question: '본인의 강점과 약점에 대해 말씀해 주세요.',
            category: '인성',
          });
        }

        setCurrentQuestion(questions[0]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('질문 생성 실패:', error);
      alert('질문 생성에 실패했습니다.');
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
      // const response = await api.post('/interview/feedback', {
      //   resumeId: selectedResume?.id,
      //   jobPostId: selectedJobPost?.id,
      //   companyId: selectedCompany?.id,
      //   question: currentQuestion?.question,
      //   answer: answer,
      // });
      // setFeedback(response.data.feedback);

      // 임시 피드백
      setTimeout(() => {
        const summary = getResumeSummary(selectedResume!);
        let contextFeedback = '';

        if (jobPostLink.trim()) {
          contextFeedback = `\n📋 **공고 관련 조언**\n- 공고에서 요구하는 경력 수준과 기술 스택을 고려하여 답변하세요.\n- 직무의 핵심 역량을 강조하면 좋습니다.\n- 공고 링크: ${jobPostLink}`;
        }

        if (companyLink.trim()) {
          contextFeedback += `\n\n🏢 **기업 정보 활용**\n- 기업의 비전과 문화를 이해하고 답변에 반영하세요.\n- 회사가 추구하는 가치와 본인의 가치관을 연결지어 설명하면 효과적입니다.\n- 기업 링크: ${companyLink}`;
        }

        setFeedback(`[AI 면접관의 피드백]

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
이력서에 기재된 "${summary.career}" 경험을 더 깊이 있게 준비하시면 좋을 것 같습니다.`);

        setStep('feedback');
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('피드백 받기 실패:', error);
      alert('피드백을 받는데 실패했습니다.');
      setIsLoading(false);
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
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1440px] mx-auto px-[55px]">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BriefcaseIcon className="w-10 h-10 text-[#006AFF] mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">AI 면접 코칭</h1>
          </div>
          <p className="text-gray-600">
            이력서를 기반으로 AI가 맞춤형 면접 질문을 생성하고 피드백을 제공합니다.
          </p>
        </div>

        {/* Step 1: 이력서 선택 */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8 border-l-4 border-[#006AFF]">
              <div className="flex items-start mb-4">
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
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">등록된 이력서가 없습니다.</p>
                <button
                  onClick={() => navigate('/myPage/resume')}
                  className="bg-[#006AFF] hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg transition"
                >
                  이력서 작성하러 가기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resumes.map((resume) => {
                  try {
                    const summary = getResumeSummary(resume);
                    return (
                      <button
                        key={resume.id}
                        onClick={() => handleResumeSelect(resume)}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 text-left border-2 border-transparent hover:border-[#006AFF]"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-800">{resume.title || '제목 없음'}</h3>
                          <DocumentTextIcon className="w-6 h-6 text-[#006AFF] flex-shrink-0" />
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">학력:</span> {summary.education}
                          </p>
                          <p>
                            <span className="font-medium">경력:</span> {summary.career}
                          </p>
                          <p>
                            <span className="font-medium">기술:</span> {summary.skillList}
                          </p>
                        </div>
                      </button>
                    );
                  } catch (error) {
                    console.error('이력서 렌더링 오류:', resume.id, error);
                    return (
                      <div key={resume.id} className="bg-red-50 rounded-xl p-6 border border-red-200">
                        <p className="text-red-600 text-sm">이력서 로드 오류</p>
                      </div>
                    );
                  }
                })}
              </div>
            )}

            {/* 안내 사항 */}
            <div className="bg-blue-50 rounded-xl p-6 md:p-8 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <SparklesIcon className="w-6 h-6 text-[#006AFF] mr-2" />
                AI 면접 코칭 이용 안내
              </h3>
              <ul className="space-y-3 text-gray-700 text-sm md:text-base">
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-[#006AFF] mr-2 mt-0.5 flex-shrink-0" />
                  <span>AI가 이력서를 분석하여 개인 맞춤형 면접 질문을 생성합니다.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-[#006AFF] mr-2 mt-0.5 flex-shrink-0" />
                  <span>지원할 공고나 기업을 추가하면 더 구체적인 질문을 받을 수 있습니다.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-[#006AFF] mr-2 mt-0.5 flex-shrink-0" />
                  <span>STAR 기법(상황-과제-행동-결과)을 활용하여 답변해보세요.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-[#006AFF] mr-2 mt-0.5 flex-shrink-0" />
                  <span>AI 피드백을 참고하여 답변을 개선하고 반복 연습할 수 있습니다.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: 공고/기업 선택 (선택사항) */}
        {step === 'context' && selectedResume && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <DocumentTextIcon className="w-6 h-6 text-[#006AFF] mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">선택된 이력서: {selectedResume.title}</h2>
                </div>
                <button
                  onClick={() => setStep('select')}
                  className="text-sm text-gray-600 hover:text-[#006AFF] transition"
                >
                  변경
                </button>
              </div>
            </div>

            {/* 공고 링크 입력 (선택사항) */}
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <div className="flex items-start mb-4">
                <BriefcaseIcon className="w-6 h-6 text-[#006AFF] mr-3 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    지원할 공고 링크 <span className="text-sm text-gray-500">(선택사항)</span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    지원할 공고 URL을 입력하면 해당 직무와 요구사항에 맞춘 질문을 받을 수 있습니다.
                  </p>
                  <input
                    type="text"
                    value={jobPostLink}
                    onChange={(e) => setJobPostLink(e.target.value)}
                    placeholder="예: https://www.saramin.co.kr/zf_user/jobs/relay/view?..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#006AFF]"
                  />
                </div>
              </div>
            </div>

            {/* 기업 링크 입력 (선택사항) */}
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <div className="flex items-start mb-4">
                <BuildingOfficeIcon className="w-6 h-6 text-[#006AFF] mr-3 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    관심 기업 링크 <span className="text-sm text-gray-500">(선택사항)</span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    관심 기업의 홈페이지나 채용 페이지 URL을 입력하면 기업 이해도 관련 질문을 받을 수 있습니다.
                  </p>
                  <input
                    type="text"
                    value={companyLink}
                    onChange={(e) => setCompanyLink(e.target.value)}
                    placeholder="예: https://www.samsung.com/sec/aboutsamsung/careers/"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#006AFF]"
                  />
                </div>
              </div>
            </div>

            {/* 시작 버튼 */}
            <div className="flex justify-center">
              <button
                onClick={handleStartInterview}
                disabled={isLoading}
                className="bg-[#006AFF] hover:bg-blue-600 text-white font-medium px-8 py-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center text-lg"
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="w-6 h-6 mr-2 animate-spin" />
                    AI 질문 생성 중...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-6 h-6 mr-2" />
                    면접 시작하기
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 면접 질문 & 답변 */}
        {step === 'interview' && currentQuestion && (
          <div className="space-y-6">
            {/* 컨텍스트 정보 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 border border-blue-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center text-sm md:text-base">
                    <DocumentTextIcon className="w-5 h-5 text-[#006AFF] mr-2" />
                    <span className="font-semibold">{selectedResume?.title}</span>
                  </div>
                  {jobPostLink && (
                    <div className="flex items-center text-sm md:text-base">
                      <BriefcaseIcon className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-gray-700">공고 연결됨</span>
                    </div>
                  )}
                  {companyLink && (
                    <div className="flex items-center text-sm md:text-base">
                      <BuildingOfficeIcon className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="text-gray-700">기업 연결됨</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-600 hover:text-[#006AFF] transition"
                >
                  처음으로
                </button>
              </div>
            </div>

            {/* AI 질문 */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border-l-4 border-[#006AFF]">
              <div className="flex items-start mb-4">
                <div className="bg-[#006AFF] rounded-full p-2 mr-4">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-bold text-gray-800">AI 면접관</h3>
                    <span className="ml-3 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      {currentQuestion.category}
                    </span>
                  </div>
                  <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
                    {currentQuestion.question}
                  </p>
                </div>
              </div>
            </div>

            {/* 답변 입력 */}
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <div className="flex items-start mb-4">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#006AFF] mr-3 mt-1" />
                <h3 className="text-lg font-semibold text-gray-800">나의 답변</h3>
              </div>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="면접 답변을 입력해주세요.&#10;&#10;💡 TIP: STAR 기법을 활용해보세요!&#10;- Situation (상황): 어떤 상황이었나요?&#10;- Task (과제): 무엇을 해결해야 했나요?&#10;- Action (행동): 어떻게 해결했나요?&#10;- Result (결과): 결과는 어땠나요?"
                className="w-full h-64 md:h-80 border border-gray-300 rounded-lg p-4 text-gray-700 focus:outline-none focus:border-[#006AFF] focus:ring-2 focus:ring-blue-100 resize-none"
              />
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">{answer.length}자</p>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={isLoading || !answer.trim()}
                  className="bg-[#006AFF] hover:bg-blue-600 text-white font-medium px-6 md:px-8 py-3 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      AI 피드백 받기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: AI 피드백 */}
        {step === 'feedback' && (
          <div className="space-y-6">
            {/* 질문 & 답변 요약 */}
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-500 mb-2">질문</h4>
                <p className="text-gray-700">{currentQuestion?.question}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">나의 답변</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{answer}</p>
              </div>
            </div>

            {/* AI 피드백 */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 md:p-8 border-2 border-blue-200">
              <div className="flex items-start mb-6">
                <div className="bg-gradient-to-br from-[#006AFF] to-indigo-600 rounded-full p-3 mr-4">
                  <SparklesIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">AI 면접관의 피드백</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    이력서{jobPostLink && ', 공고'}{companyLink && ', 기업 정보'} 기반 맞춤형 피드백입니다.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm">
                <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans">
                  {feedback}
                </pre>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleNextQuestion}
                className="bg-[#006AFF] hover:bg-blue-600 text-white font-medium px-8 py-3 rounded-lg transition flex items-center justify-center"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                다음 질문으로 계속하기
              </button>
              <button
                onClick={handleReset}
                className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-8 py-3 rounded-lg border-2 border-gray-300 transition flex items-center justify-center"
              >
                처음으로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewCoachingPage;
