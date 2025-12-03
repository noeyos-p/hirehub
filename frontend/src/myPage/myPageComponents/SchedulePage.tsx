// src/myPage/myPageComponents/SchedulePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { myPageApi } from "../../api/myPageApi";
import { jobPostApi } from "../../api/jobPostApi";
import type { Notice, ResumeItem } from "../../types/interface";

const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [allFavorites, setAllFavorites] = useState<Notice[]>([]);
  const [calendarMap, setCalendarMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<number | undefined>(undefined);

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((p) => p - 1);
    } else setSelectedMonth((p) => p - 1);
  };

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((p) => p + 1);
    } else setSelectedMonth((p) => p + 1);
  };

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const startDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  const calendarDays = useMemo(
    () => [...Array(startDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)],
    [startDay, daysInMonth]
  );

  const ym = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  const filteredNotices = useMemo(
    () => allFavorites.filter((n) => n.date === selectedDate),
    [allFavorites, selectedDate]
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchFavorites() {
      try {
        setLoading(true);
        setError(null);

        const data = await myPageApi.getScrapPosts({ page: 0, size: 1000 });

        let arr: any[] = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray((data as any).items)) arr = (data as any).items;
        else if (Array.isArray((data as any).content)) arr = (data as any).content;
        else if (Array.isArray((data as any).rows)) arr = (data as any).rows;
        else if (Array.isArray((data as any).data)) arr = (data as any).data;
        else if (Array.isArray((data as any).list)) arr = (data as any).list;
        else {
          const firstArray = Object.values(data).find((v) => Array.isArray(v));
          arr = (firstArray as any[]) || [];
        }

        // 각 jobPostId로 상세 정보 가져오기
        const detailedNotices = await Promise.all(
          arr.map(async (item) => {
            const jobPostId = item.jobPostId;
            const endAt = item.endAt;

            if (!jobPostId || !endAt) return null;

            try {
              // 개별 공고 상세 정보 조회
              const detail = await jobPostApi.getJobPostById(jobPostId);

              return {
                id: jobPostId,
                title: detail.title || item.title || "",
                companyName: detail.companyName || item.companyName || "",
                date: endAt.slice(0, 10),
                location: detail.location || "",
                type: detail.type || "",
                position: detail.position || "",
                careerLevel: detail.careerLevel || "",
                education: detail.education || "",
              };
            } catch (err) {
              // 에러 발생 시 기본 정보만 반환
              return {
                id: jobPostId,
                title: item.title || "",
                companyName: item.companyName || "",
                date: endAt.slice(0, 10),
                location: "",
                type: "",
                position: "",
                careerLevel: "",
                education: "",
              };
            }
          })
        );

        if (isMounted) {
          const mapped = detailedNotices.filter(Boolean) as Notice[];
          setAllFavorites(mapped);
        }
      } catch (e: any) {
        if (isMounted) setError(e.message || "스크랩 로드 중 오류가 발생했습니다.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchFavorites();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const map: Record<string, number> = {};
    for (const n of allFavorites) {
      if (n.date.startsWith(ym)) map[n.date] = (map[n.date] || 0) + 1;
    }
    setCalendarMap(map);
    if (!selectedDate.startsWith(ym)) setSelectedDate(`${ym}-01`);
  }, [allFavorites, ym]);

  const getDayClass = (fullDate: string) => {
    const isSelected = fullDate === selectedDate;
    const isPast = fullDate < todayStr;
    const isToday = fullDate === todayStr;

    let classes = "p-2 sm:p-4 rounded cursor-pointer transition-all duration-200 text-sm sm:text-base ";
    if (isSelected) classes += "font-bold scale-105";
    else if (isPast) classes += "text-gray-400";
    else classes += "hover:bg-gray-200 hover:scale-105";
    return classes;
  };

  const getDayStyle = (fullDate: string) => {
    const isSelected = fullDate === selectedDate;
    const isToday = fullDate === todayStr;

    if (isSelected) {
      return { backgroundColor: '#EFF4F8' };
    }
    if (isToday) {
      return { backgroundColor: '#D6E4F0' };
    }
    return {};
  };

  const getNumberColor = (fullDate: string) => {
    return {};
  };

  const handleJobClick = (jobId: number) => {
    navigate(`/jobPostings/${jobId}`);
  };

  const openApplyModal = async (jobPostId?: number) => {
    if (!jobPostId) {
      alert("공고 정보가 올바르지 않습니다.");
      return;
    }
    setCurrentJobId(jobPostId);
    setSelectedResumeId(null);

    try {
      const data = await myPageApi.getResumes({ page: 0, size: 50 });
      const list: ResumeItem[] = (data?.items ?? data?.content ?? []).filter((r: any) => !r.locked);
      setResumes(list);
      setShowApplyModal(true);
    } catch (e: any) {
      alert(e?.message || "이력서 목록 로드 실패");
    }
  };

  const submitApply = async () => {
    if (!currentJobId) return alert("공고 정보가 없습니다.");
    if (!selectedResumeId) return alert("이력서를 선택해주세요.");
    if (!confirm("선택한 이력서로 지원하시겠습니까? 제출 후에는 이력서를 수정할 수 없습니다.")) return;

    try {
      setApplying(true);
      await myPageApi.applyJob({ jobPostId: currentJobId, resumeId: selectedResumeId });

      alert("지원이 완료되었습니다!");
      setShowApplyModal(false);
      setSelectedResumeId(null);
      setCurrentJobId(undefined);
    } catch (e: any) {
      alert(e?.message || "지원 실패");
    } finally {
      setApplying(false);
    }
  };

  const ApplyModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">지원할 이력서 선택</h3>
          <button
            onClick={() => { setShowApplyModal(false); setSelectedResumeId(null); }}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {resumes.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>제출 가능한 이력서가 없습니다.</p>
              <p className="text-sm mt-2">마이페이지 &gt; 이력서 관리에서 새 이력서를 작성해 주세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((r) => (
                <label
                  key={r.id}
                  className={`block border rounded-lg p-4 cursor-pointer transition-all ${selectedResumeId === r.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="resume"
                      value={r.id}
                      checked={selectedResumeId === r.id}
                      onChange={() => setSelectedResumeId(r.id)}
                      className="accent-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{r.title}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        최종 수정: {new Date(r.updateAt || r.createAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric'
                        }).replace(/\. /g, '. ').replace('.', '.')}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={() => { setShowApplyModal(false); setSelectedResumeId(null); }}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            disabled={applying}
          >
            취소
          </button>
          <button
            onClick={submitApply}
            disabled={!selectedResumeId || applying}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {applying ? "지원 중..." : "지원하기"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row p-4 gap-6">
      {/* 좌측 달력 */}
      <div className="w-full lg:w-2/3 bg-white rounded-lg shadow p-4 sm:p-6 min-h-[400px] lg:min-h-[550px]">
        <div className="flex justify-between items-center mb-8 sm:mb-12">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1" onClick={prevMonth}>{"<"}</button>
            <span className="font-semibold text-lg">{selectedYear}년 {monthNames[selectedMonth - 1]}</span>
            <button className="px-3 py-1" onClick={nextMonth}>{">"}</button>
          </div>
          <button
            onClick={() => {
              const t = new Date();
              const tStr = t.toISOString().slice(0, 10);
              setSelectedDate(tStr);
              setSelectedYear(t.getFullYear());
              setSelectedMonth(t.getMonth() + 1);
            }}
            className="px-3 py-1 bg-blue-50 rounded"
          >
            오늘
          </button>
        </div>

        <div className="grid grid-cols-7 text-center gap-2 sm:gap-4 mb-6 font-semibold text-sm sm:text-base">
          <span className="text-red-500">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span className="text-blue-500">토</span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-6 text-center">
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;
            const fullDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            return (
              <div
                key={day}
                onClick={() => setSelectedDate(fullDate)}
                className={getDayClass(fullDate)}
                style={getDayStyle(fullDate)}
              >
                <div style={getNumberColor(fullDate)}>{day}</div>
                <div className="mt-1 mx-auto w-2 h-2 rounded-full">
                  {calendarMap[fullDate] > 0 && <div className="w-2 h-2 rounded-full bg-gray-400"></div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          {loading && <span>불러오는 중…</span>}
          {error && <span className="text-red-500">{error}</span>}
        </div>
      </div>

      {/* 우측 공고 리스트 */}
      <div className="w-full lg:w-1/3 space-y-4">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice, idx) => (
            <div
              key={idx}
              className="rounded-lg p-4 shadow-sm bg-white border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
              onClick={() => notice.id && handleJobClick(notice.id)}
            >
              {/* 회사명 */}
              <p className="text-base font-semibold text-gray-900 mb-1">
                {notice.companyName}
              </p>

              {/* 공고 제목 */}
              <h3 className="text-sm text-gray-800 mb-1">
                {notice.title}
              </h3>

              {/* 공고 정보 */}
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-1">
                  {notice.position && <span>{notice.position} / </span>}
                  {notice.careerLevel} / {notice.education} / {notice.location}
                </p>
                <p className="text-xs text-gray-500">
                  {notice.date}
                </p>
              </div>

              {/* 지원하기 버튼 */}
              <button
                className="w-full mt-2 px-4 py-2 text-gray-700 rounded-md text-sm transition-colors hover:bg-opacity-80"
                style={{ backgroundColor: '#D6E4F0' }}
                onClick={(e) => {
                  e.stopPropagation();
                  openApplyModal(notice.id);
                }}
              >
                지원하기
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-400">선택한 날짜의 공고가 없습니다.</p>
          </div>
        )}
      </div>

      {showApplyModal && <ApplyModal />}
    </div>
  );
};

export default SchedulePage;