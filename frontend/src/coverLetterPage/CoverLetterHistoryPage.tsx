import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowLeftIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { coverLetterApi, type CoverLetterHistory } from '../api/coverLetterApi';

export default function CoverLetterHistoryPage() {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState<CoverLetterHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<CoverLetterHistory | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await coverLetterApi.getHistoryList();
      setHistoryList(data);
    } catch (error) {
      console.error('첨삭 이력 불러오기 실패:', error);
      alert('첨삭 이력을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 첨삭 이력을 삭제하시겠습니까?')) return;

    try {
      await coverLetterApi.deleteHistory(id);
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

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'text': return '직접 입력';
      case 'essay': return '자기소개서';
      case 'resume': return '이력서 전체';
      default: return mode;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px]">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/cover-letter')}
            className="flex items-center text-gray-600 hover:text-[#006AFF] mb-4 transition"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            자기소개서 수정으로 돌아가기
          </button>
          <div className="flex items-center mb-4">
            <ClockIcon className="w-8 h-8 md:w-10 md:h-10 text-[#006AFF] mr-2" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">첨삭 이력</h1>
          </div>
          <p className="text-sm md:text-base text-gray-600">
            저장된 자기소개서 첨삭 이력을 확인할 수 있습니다.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006AFF]"></div>
          </div>
        ) : historyList.length === 0 ? (
          <div className="text-center py-20">
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">저장된 첨삭 이력이 없습니다.</p>
            <button
              onClick={() => navigate('/cover-letter')}
              className="mt-4 px-6 py-3 bg-[#006AFF] text-white rounded-lg hover:bg-[#0055DD] transition"
            >
              자기소개서 수정하러 가기
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                            {getModeLabel(history.inputMode)}
                          </span>
                          {history.resumeTitle && (
                            <h3 className="font-medium text-gray-900 truncate">
                              {history.resumeTitle}
                            </h3>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(history.createdAt).toLocaleString('ko-KR')}
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
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {history.originalText.substring(0, 100)}
                      {history.originalText.length > 100 ? '...' : ''}
                    </p>
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
                      <h2 className="text-xl font-semibold text-gray-900">상세 내용</h2>
                      <span className="text-sm text-gray-500">
                        {new Date(selectedHistory.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    {selectedHistory.resumeTitle && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">이력서: </span>
                        <span className="font-medium">{selectedHistory.resumeTitle}</span>
                      </div>
                    )}
                    <div className="mb-4">
                      <span className="text-sm text-gray-600">입력 방식: </span>
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                        {getModeLabel(selectedHistory.inputMode)}
                      </span>
                    </div>
                  </div>

                  {/* 원본 텍스트 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <DocumentTextIcon className="w-5 h-5 mr-2 text-gray-600" />
                      원본 내용
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                        {selectedHistory.originalText}
                      </pre>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedHistory.originalText.length} 글자
                    </p>
                  </div>

                  {/* 수정된 텍스트 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <DocumentTextIcon className="w-5 h-5 mr-2 text-[#006AFF]" />
                      수정된 내용
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                        {selectedHistory.improvedText}
                      </pre>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {selectedHistory.improvedText.length} 글자
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedHistory.improvedText);
                          alert('복사되었습니다!');
                        }}
                        className="px-3 py-1 text-sm bg-[#006AFF] text-white rounded-lg hover:bg-[#0055DD] transition"
                      >
                        복사하기
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
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
