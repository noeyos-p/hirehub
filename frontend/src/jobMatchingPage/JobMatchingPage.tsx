import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { myPageApi } from '../api/myPageApi';
import api from '../api/api';
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
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

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
      const res = await api.post("/api/resume/match", { resumeId: selectedResumeId });

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
    setMatchResults([]);
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MagnifyingGlassIcon className="w-10 h-10 text-[#006AFF] mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">AI 공고 매칭</h1>
          </div>
          <p className="text-gray-600">
            내 이력서와 가장 잘 맞는 채용 공고를 AI가 분석하여 추천해드립니다.
          </p>
        </div>

        {/* 이력서 선택 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="w-6 h-6 text-gray-700 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">이력서 선택</h2>
          </div>

          {loadingResumes ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>작성된 이력서가 없습니다.</p>
              <p className="text-sm mt-1">마이페이지에서 이력서를 먼저 작성해주세요.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => setSelectedResumeId(resume.id)}
                    className={`p-4 border rounded-lg text-left transition ${
                      selectedResumeId === resume.id
                        ? 'border-[#4E98FF] bg-withe'
                        : 'border-gray-200 hover:border-[#4E98FF]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">{resume.title}</h3>
                          {resume.locked && (
                            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                              제출됨
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(resume.createAt).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedResumeId === resume.id && (
                        <CheckCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  초기화
                </button>
                <button
                  onClick={handleMatch}
                  disabled={matching || !selectedResumeId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {matching ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      매칭 중...
                    </>
                  ) : (
                    <>
                      공고 매칭
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 매칭 결과 */}
        {matchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <BriefcaseIcon className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">매칭 결과</h2>
              <span className="ml-3 text-sm text-gray-500">
                총 {matchResults.length}개의 공고
              </span>
            </div>

            <div className="space-y-4">
              {matchResults.map((result, index) => (
                <div
                  key={result.jobId || index}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {result.jobTitle}
                        </h3>
                      </div>
                      <p className="text-gray-600">{result.companyName}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border ${getGradeColor(result.grade)}`}>
                      <div className="text-2xl font-bold">{result.grade}</div>
                      <div className="text-xs">등급</div>
                      <div className="text-xs text-gray-600 mt-1">({result.score}점)</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      매칭 이유
                    </h4>
                    <ul className="space-y-1">
                      {result.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-600">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {result.jobId && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => window.open(`/jobPostings/${result.jobId}`, '_blank')}
                        className="px-4 py-2 bg-[#006AFF] text-white rounded-lg hover:bg-[#0055DD] transition text-sm"
                      >
                        공고 보기
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 사용 가이드 */}
        <div className="mt-8 bg-[#EFF4F8] border border-[#D6E4F0] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">사용 가이드</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">-</span>
              <span>매칭에 사용할 이력서를 선택해주세요.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">-</span>
              <span>"AI 공고 매칭" 버튼을 클릭하면 AI가 이력서를 분석하여 가장 적합한 공고를 찾아드립니다.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">-</span>
              <span>매칭도가 높을수록 지원자의 경력과 역량이 공고 요구사항과 잘 맞습니다.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">-</span>
              <span>매칭 이유를 확인하고 관심있는 공고에 바로 지원하세요.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
