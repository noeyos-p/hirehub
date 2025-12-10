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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { myPageApi } from '../api/myPageApi';
import api from '../api/api';
import { jobMatchingApi } from '../api/jobMatchingApi';
import type { ResumeItem } from '../types/interface';
interface MatchResult {
  jobId?: number;
  jobTitle: string;
  companyName: string;
  score: number;
  grade: string;
  reasons: string[];
}

export default function JobMatchingPage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedResumeTitle, setSelectedResumeTitle] = useState<string>('');
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoadingResumes(true);
    try {
      const response = await myPageApi.getResumes({ page: 0, size: 100 });
      setResumes(response.content);
    } catch (error) {
      console.error('이력서 목록 불러오기 실패:', error);
      alert('이력서 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedResumeId) {
      alert('이력서를 선택해주세요.');
      return;
    }

    setMatching(true);

    try {
      const res = await api.post("/api/match", { resumeId: selectedResumeId });

      console.log("✅ 매칭 서버 응답:", res.status);
      console.log("📦 매칭 데이터:", res.data);

      setMatchResults(res.data.results || []);
    } catch (error: any) {
      console.error('🔥 공고 매칭 실패:', error);
      alert('공고 매칭 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
    } finally {
      setMatching(false);
    }
  };

  const handleReset = () => {
    setSelectedResumeId(null);
    setSelectedResumeTitle('');
    setMatchResults([]);
  };

  const handleSave = async () => {
    if (matchResults.length === 0) {
      alert('저장할 매칭 결과가 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      await jobMatchingApi.saveHistory({
        resumeId: selectedResumeId!,
        resumeTitle: selectedResumeTitle,
        matchResults,
      });
      alert('매칭 결과가 저장되었습니다!');
    } catch (error: any) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const getGradeColor = (grade: string) => {
    const gradeUpper = grade?.toUpperCase();
    if (gradeUpper === 'S' || gradeUpper === 'A') return 'text-green-600 bg-green-50 border-green-200';
    if (gradeUpper === 'B' || gradeUpper === 'C') return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px]">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <MagnifyingGlassIcon className="w-8 h-8 md:w-10 md:h-10 text-[#006AFF] mr-2" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI 공고 매칭</h1>
            </div>
            <button
              onClick={() => navigate('/job-matching/history')}
              className="flex items-center px-4 py-2 text-sm md:text-base bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
            >
              <ClockIcon className="w-5 h-5 mr-2" />
              매칭 이력
            </button>
          </div>
          <p className="text-sm md:text-base text-gray-600 text-center max-w-2xl mx-auto">
            내 이력서와 가장 잘 맞는 채용 공고를 AI가 분석하여 추천해드립니다.
          </p>
        </div>

        {/* 이력서 선택 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <DocumentTextIcon className="w-6 h-6 text-gray-700 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">이력서 선택</h2>
          </div>

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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => {
                      setSelectedResumeId(resume.id);
                      setSelectedResumeTitle(resume.title);
                    }}
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

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 text-gray-700 font-medium text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  초기화
                </button>
                <button
                  onClick={handleMatch}
                  disabled={matching || !selectedResumeId}
                  className="px-8 py-2.5 bg-[#006AFF] text-white font-semibold text-sm rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl active:scale-[0.98] disabled:shadow-none disabled:scale-100"
                >
                  {matching ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      AI 매칭 분석 중...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      AI 공고 매칭 시작
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 매칭 결과 */}
        {matchResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center">
                <BriefcaseIcon className="w-6 h-6 text-[#006AFF] mr-2" />
                <h2 className="text-xl font-bold text-gray-900">매칭 결과</h2>
                <span className="ml-3 text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  총 {matchResults.length}건
                </span>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-5 py-2.5 bg-green-600 text-white font-semibold text-sm rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
              >
                <BookmarkIcon className="w-5 h-5 mr-2" />
                {isSaving ? '저장 중...' : '결과 저장하기'}
              </button>
            </div>

            <div className="space-y-4">
              {matchResults.map((result, index) => (
                <div
                  key={result.jobId || index}
                  className="group border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-300 bg-white"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                          {index + 1}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#006AFF] transition-colors line-clamp-1">
                          {result.jobTitle}
                        </h3>
                      </div>
                      <p className="text-gray-600 font-medium mb-4 flex items-center">
                        <BuildingOfficeIcon className="w-4 h-4 mr-1 text-gray-400" />
                        {result.companyName}
                      </p>

                      <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                        <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                          <SparklesIcon className="w-4 h-4 text-[#006AFF] mr-1.5" />
                          AI 매칭 분석
                        </h4>
                        <ul className="space-y-1.5">
                          {result.reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-700">
                              <CheckCircleIcon className="w-4 h-4 text-[#006AFF] mr-2 mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 md:min-w-[140px]">
                      <div className={`px-4 py-2 rounded-xl border flex flex-row md:flex-col items-center gap-2 md:gap-1 shadow-sm ${getGradeColor(result.grade)}`}>
                        <div className="text-2xl md:text-3xl font-black">{result.grade}</div>
                        <div className="text-xs font-bold opacity-80">매칭 점수 {result.score}점</div>
                      </div>

                      {result.jobId && (
                        <button
                          onClick={() => window.open(`/jobPostings/${result.jobId}`, '_blank')}
                          className="w-full md:w-auto px-5 py-2.5 bg-[#006AFF] text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold shadow-sm hover:shadow active:scale-[0.98]"
                        >
                          공고 상세보기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 이용 가이드 */}
        <div className="mt-10 bg-gradient-to-br from-[#EFF4F8] to-white border border-[#D6E4F0] rounded-xl p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <CheckCircleIcon className="w-6 h-6 text-[#006AFF] mr-2" />
            이용 가이드
          </h3>
          <ul className="space-y-3 text-gray-700 text-sm md:text-base">
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006AFF] mt-2 mr-2 flex-shrink-0"></span>
              <span>매칭 분석에 사용할 이력서를 선택해주세요.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006AFF] mt-2 mr-2 flex-shrink-0"></span>
              <span>"AI 공고 매칭" 버튼을 클릭하면 내 이력서 항목을 정밀 분석하여 가장 적합한 공고를 찾아드립니다.</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006AFF] mt-2 mr-2 flex-shrink-0"></span>
              <span>매칭 등급(S~C)과 상세 분석 사유를 확인하고, 관심 있는 공고에 바로 지원해보세요.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
