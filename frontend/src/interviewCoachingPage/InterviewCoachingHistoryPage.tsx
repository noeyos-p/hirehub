import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowLeftIcon,
  EyeIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { interviewCoachingApi, type InterviewCoachingHistory } from '../api/interviewCoachingApi';

export default function InterviewCoachingHistoryPage() {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState<InterviewCoachingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<InterviewCoachingHistory | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await interviewCoachingApi.getHistoryList();
      setHistoryList(data);
    } catch (error) {
      console.error('면접 연습 이력 불러오기 실패:', error);
      alert('면접 연습 이력을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 면접 연습 이력을 삭제하시겠습니까?')) return;

    try {
      await interviewCoachingApi.deleteHistory(id);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px]">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/interview-coaching')}
            className="flex items-center text-gray-600 hover:text-[#006AFF] mb-4 transition"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            면접 코칭으로 돌아가기
          </button>
          <div className="flex items-center mb-4">
            <ClockIcon className="w-8 h-8 md:w-10 md:h-10 text-[#006AFF] mr-2" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">면접 연습 이력</h1>
          </div>
          <p className="text-sm md:text-base text-gray-600">
            저장된 면접 연습 이력을 확인할 수 있습니다.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006AFF]"></div>
          </div>
        ) : historyList.length === 0 ? (
          <div className="text-center py-20">
            <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">저장된 면접 연습 이력이 없습니다.</p>
            <button
              onClick={() => navigate('/interview-coaching')}
              className="mt-4 px-6 py-3 bg-[#006AFF] text-white rounded-lg hover:bg-[#0055DD] transition"
            >
              면접 연습하러 가기
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
                        <div className="flex flex-wrap gap-2 mb-2">
                          {history.jobPostLink && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              <BriefcaseIcon className="w-3 h-3 mr-1" />
                              공고 연결
                            </span>
                          )}
                          {history.companyLink && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              <BuildingOfficeIcon className="w-3 h-3 mr-1" />
                              기업 연결
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#006AFF]">
                          질문 {history.sessions.length}개
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
                      <h2 className="text-xl font-semibold text-gray-900">면접 연습 내용</h2>
                      <span className="text-sm text-gray-500">
                        {new Date(selectedHistory.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div>
                        <span className="text-sm text-gray-600">이력서: </span>
                        <span className="font-medium">{selectedHistory.resumeTitle}</span>
                      </div>
                      {selectedHistory.jobPostLink && (
                        <div>
                          <span className="text-sm text-gray-600">공고 링크: </span>
                          <a
                            href={selectedHistory.jobPostLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#006AFF] hover:underline"
                          >
                            {selectedHistory.jobPostLink.substring(0, 50)}...
                          </a>
                        </div>
                      )}
                      {selectedHistory.companyLink && (
                        <div>
                          <span className="text-sm text-gray-600">기업 링크: </span>
                          <a
                            href={selectedHistory.companyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#006AFF] hover:underline"
                          >
                            {selectedHistory.companyLink.substring(0, 50)}...
                          </a>
                        </div>
                      )}
                      <div>
                        <span className="text-sm text-gray-600">총 질문 수: </span>
                        <span className="font-medium text-[#006AFF]">
                          {selectedHistory.sessions.length}개
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 면접 세션 목록 */}
                  <div className="space-y-6 max-h-[600px] overflow-y-auto">
                    {selectedHistory.sessions.map((session, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              질문 #{index + 1}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {session.category}
                            </span>
                          </div>
                          <p className="text-gray-800 font-medium">{session.question}</p>
                        </div>

                        <div className="mb-4 pb-4 border-b border-gray-100">
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">나의 답변</h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-3">
                            {session.answer}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">AI 피드백</h4>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-blue-50 rounded p-3">
                            {session.feedback}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
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
