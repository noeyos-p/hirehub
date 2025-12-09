import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowLeftIcon,
  EyeIcon,
  BriefcaseIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { jobMatchingApi, type JobMatchingHistory } from '../api/jobMatchingApi';

export default function JobMatchingHistoryPage() {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState<JobMatchingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<JobMatchingHistory | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await jobMatchingApi.getHistoryList();
      setHistoryList(data);
    } catch (error) {
      console.error('매칭 이력 불러오기 실패:', error);
      alert('매칭 이력을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 매칭 이력을 삭제하시겠습니까?')) return;

    try {
      await jobMatchingApi.deleteHistory(id);
      setHistoryList(prev => prev.filter(item => item.id !== id));
      if (selectedHistory?.id === id) {
        setSelectedHistory(null);
      }
      alert('삭제되었습니다.');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
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
          <button
            onClick={() => navigate('/job-matching')}
            className="flex items-center text-gray-600 hover:text-[#006AFF] mb-4 transition"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            공고 매칭으로 돌아가기
          </button>
          <div className="flex items-center mb-4">
            <ClockIcon className="w-8 h-8 md:w-10 md:h-10 text-[#006AFF] mr-2" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">매칭 이력</h1>
          </div>
          <p className="text-sm md:text-base text-gray-600">
            저장된 공고 매칭 이력을 확인할 수 있습니다.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006AFF]"></div>
          </div>
        ) : historyList.length === 0 ? (
          <div className="text-center py-20">
            <BriefcaseIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">저장된 매칭 이력이 없습니다.</p>
            <button
              onClick={() => navigate('/job-matching')}
              className="mt-4 px-6 py-3 bg-[#006AFF] text-white rounded-lg hover:bg-[#0055DD] transition"
            >
              공고 매칭하러 가기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 왼쪽: 이력 목록 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                전체 이력 ({historyList.length})
              </h2>
              <div className="space-y-3">
                {historyList.map((history) => (
                  <div
                    key={history.id}
                    className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition border-2 ${
                      selectedHistory?.id === history.id
                        ? 'border-[#006AFF]'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedHistory(history)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate mb-1">
                          {history.resumeTitle}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {new Date(history.createdAt).toLocaleString('ko-KR')}
                        </p>
                        <p className="text-sm text-[#006AFF]">
                          매칭된 공고: {history.matchResults.length}개
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHistory(history);
                          }}
                          className="p-1.5 text-gray-500 hover:text-[#006AFF] transition"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(history.id);
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-600 transition"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 오른쪽: 상세 내용 */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {selectedHistory ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">매칭 결과</h2>
                      <span className="text-sm text-gray-500">
                        {new Date(selectedHistory.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">이력서: </span>
                      <span className="font-medium">{selectedHistory.resumeTitle}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">매칭된 공고: </span>
                      <span className="font-medium text-[#006AFF]">
                        {selectedHistory.matchResults.length}개
                      </span>
                    </div>
                  </div>

                  {/* 매칭 결과 목록 */}
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {selectedHistory.matchResults.map((result, index) => (
                      <div
                        key={result.jobId || index}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-3">
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
                          <div className={`self-start px-4 py-2 rounded-lg border ${getGradeColor(result.grade)} flex items-center gap-2`}>
                            <div className="text-xl font-bold">{result.grade}</div>
                            <div className="text-xs text-gray-600">({result.score}점)</div>
                          </div>
                        </div>

                        <div className="mt-2">
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
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <BriefcaseIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>왼쪽 목록에서 이력을 선택하세요</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
