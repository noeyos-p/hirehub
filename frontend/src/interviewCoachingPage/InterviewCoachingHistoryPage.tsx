import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { interviewCoachingApi, type InterviewCoachingHistory, type InterviewSession } from '../api/interviewCoachingApi';
import { myPageApi } from '../api/myPageApi';
import type { ResumeDto } from '../types/interface';

export default function InterviewCoachingHistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const resumeId = location.state?.resumeId;

  const [resumes, setResumes] = useState<ResumeDto[]>([]);
  const [historyList, setHistoryList] = useState<InterviewCoachingHistory[]>([]);
  const [filteredHistoryList, setFilteredHistoryList] = useState<InterviewCoachingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<InterviewCoachingHistory | null>(null);
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number>(0);
  const [allSessions, setAllSessions] = useState<Array<{ history: InterviewCoachingHistory; session: InterviewSession; sessionIndex: number }>>([]);

  useEffect(() => {
    fetchHistory();
    loadResumes();
  }, []);

  useEffect(() => {
    // resumeId로 필터링
    if (resumeId) {
      const filtered = historyList.filter(h => h.resumeId === resumeId);
      setFilteredHistoryList(filtered);

      // 모든 sessions를 하나의 배열로 합치기 (시간순: 오래된 것부터)
      const combined: Array<{ history: InterviewCoachingHistory; session: InterviewSession; sessionIndex: number }> = [];
      [...filtered].reverse().forEach(history => {
        history.sessions.forEach((session, index) => {
          combined.push({ history, session, sessionIndex: index });
        });
      });
      setAllSessions(combined);

      // 첫 번째 세션을 자동 선택
      if (combined.length > 0) {
        setSelectedHistory(combined[0].history);
        setSelectedSession(combined[0].session);
        setSelectedSessionIndex(0);
      } else {
        setSelectedHistory(null);
        setSelectedSession(null);
      }
    } else {
      setFilteredHistoryList(historyList);

      // 모든 sessions를 하나의 배열로 합치기 (시간순: 오래된 것부터)
      const combined: Array<{ history: InterviewCoachingHistory; session: InterviewSession; sessionIndex: number }> = [];
      [...historyList].reverse().forEach(history => {
        history.sessions.forEach((session, index) => {
          combined.push({ history, session, sessionIndex: index });
        });
      });
      setAllSessions(combined);

      // 첫 번째 세션을 자동 선택
      if (combined.length > 0) {
        setSelectedHistory(combined[0].history);
        setSelectedSession(combined[0].session);
        setSelectedSessionIndex(0);
      }
    }
  }, [historyList, resumeId]);

  const loadResumes = async () => {
    try {
      const res = await myPageApi.getResumes({ page: 0, size: 50 });
      const resumeList = res.rows || res.content || [];
      setResumes(resumeList);
    } catch (err) {
      console.error("이력서 로딩 실패:", err);
    }
  };

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
        setSelectedSession(null);
      }
      alert('삭제되었습니다.');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleDeleteSession = async (historyId: number, sessionIndex: number) => {
    if (!confirm('이 질문을 삭제하시겠습니까?')) return;

    try {
      // 세션 삭제는 백엔드 API가 있다면 호출, 없다면 로컬에서만 처리
      const updatedHistory = historyList.find(h => h.id === historyId);
      if (!updatedHistory) return;

      const newSessions = updatedHistory.sessions.filter((_, idx) => idx !== sessionIndex);

      // 로컬 상태 업데이트
      setHistoryList(prev => prev.map(h =>
        h.id === historyId ? { ...h, sessions: newSessions } : h
      ));

      if (selectedHistory?.id === historyId) {
        setSelectedHistory({ ...selectedHistory, sessions: newSessions });
        if (newSessions.length > 0) {
          setSelectedSession(newSessions[0]);
          setSelectedSessionIndex(0);
        } else {
          setSelectedSession(null);
        }
      }
    } catch (error) {
      console.error('질문 삭제 실패:', error);
      alert('질문 삭제에 실패했습니다.');
    }
  };

  const handleSelectHistory = (history: InterviewCoachingHistory) => {
    setSelectedHistory(history);
    if (history.sessions.length > 0) {
      setSelectedSession(history.sessions[0]);
      setSelectedSessionIndex(0);
    } else {
      setSelectedSession(null);
    }
  };

  const handleSelectSession = (index: number) => {
    if (allSessions[index]) {
      setSelectedHistory(allSessions[index].history);
      setSelectedSession(allSessions[index].session);
      setSelectedSessionIndex(index);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-0 md:px-8 lg:px-12 xl:px-[55px]">
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 md:bg-white shadow-none md:shadow-sm rounded-none md:rounded-lg">
        {/* 왼쪽 사이드바 */}
        <aside className="hidden md:block w-[200px] xl:w-[250px] border-r border-gray-200 pt-6 xl:pt-[44px] pb-6 xl:pb-[44px] pl-6 xl:pl-[44px] pr-6 xl:pr-[44px] bg-white flex-shrink-0">
          <nav className="space-y-4 xl:space-y-6">
            <button
              onClick={() => navigate('/interview-coaching')}
              className="w-full text-left text-sm xl:text-[16px] font-normal text-gray-500 hover:text-[#006AFF] transition"
            >
              면접코칭
            </button>
            <div>
              <div className="text-gray-400 text-[16px] mb-2">면접연습</div>
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
                    const isActive = resumeId === resume.id;

                    return (
                      <button
                        key={resume.id}
                        onClick={() => navigate('/interview-coaching/history', { state: { resumeId: resume.id } })}
                        className={`w-full text-left transition ${
                          isActive
                            ? 'text-[#006AFF] font-semibold'
                            : 'text-gray-700 hover:text-[#006AFF]'
                        }`}
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
        </aside>

        {/* 중앙: 질문 목록 */}
<div className="w-[200px] xl:w-[250px] bg-white border-r border-gray-200 min-h-screen pt-6 xl:pt-[44px] pb-6 xl:pb-[44px] pl-6 xl:pl-[44px] pr-6 xl:pr-[44px]">
  <div>
    <h2 className="text-sm xl:text-[16px] font-semibold text-black mb-3">면접 질문</h2>
  </div>

  {loading ? (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ) : allSessions.length === 0 ? (
    <div className="text-center py-12">
      <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p className="text-gray-500 text-sm">저장된 면접 연습이 없습니다.</p>
    </div>
  ) : (
    <div>
      {allSessions.map((item, index) => (
        <div
          key={index}
          className={`flex items-center justify-between py-2 cursor-pointer transition ${
            selectedSessionIndex === index
              ? 'text-[#006AFF] font-semibold'
              : 'text-gray-700 hover:text-[#006AFF]'
          }`}
          onClick={() => handleSelectSession(index)}
        >
          <div className="flex-1 min-w-0 mr-2">
            <div className="text-sm">
              질문 #{index + 1}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSession(item.history.id, item.sessionIndex);
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )}
</div>

        {/* 오른쪽: 질문 상세 내용 */}
        <main className="flex-1 pt-6 xl:pt-[44px] pb-6 xl:pb-[44px] pr-6 xl:pr-[44px] pl-6 md:pl-8 xl:pl-12 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !selectedSession ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-gray-400">
                <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>질문을 선택하세요</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 공고/기업 링크 표시 */}
              {(selectedHistory?.jobPostLink || selectedHistory?.companyLink) && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 지원 공고 링크 */}
                  {selectedHistory.jobPostLink && (
                    <div>
                      <div className="flex items-center mb-3">
                        <BriefcaseIcon className="w-5 h-5 text-gray-700 mr-2" />
                        <h3 className="text-base font-semibold text-gray-900">지원 공고</h3>
                      </div>
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <a
                          href={selectedHistory.jobPostLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 break-all underline"
                        >
                          {selectedHistory.jobPostLink}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 지원 기업 링크 */}
                  {selectedHistory.companyLink && (
                    <div>
                      <div className="flex items-center mb-3">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-700 mr-2" />
                        <h3 className="text-base font-semibold text-gray-900">지원 기업</h3>
                      </div>
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <a
                          href={selectedHistory.companyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 break-all underline"
                        >
                          {selectedHistory.companyLink}
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
                    {selectedSession.question}
                  </p>
                </div>
              </div>

              {/* 답변 섹션 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">답변</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedSession.answer}
                  </p>
                </div>
              </div>

              {/* 피드백 섹션 */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">피드백</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-7">
                    {selectedSession.feedback}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
