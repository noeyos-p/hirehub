// src/myPage/myPageComponents/SchedulePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import JobDetail from "../../jobPostings/jopPostingComponents/JobDetail";

type Notice = {
  id?: number;
  date: string;
  title: string;
  companyName?: string;
  location?: string;
  type?: string;
  position?: string;
  careerLevel?: string;
  education?: string;
};

type ResumeItem = {
  id: number;
  title: string;
  locked: boolean;
  createAt: string;
  updateAt: string;
};

const API_BASE = api.defaults.baseURL;
const TOKEN_KEY = "accessToken";

function resolveAccessToken(): string | null {
  const primary = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  if (primary) return primary.startsWith("Bearer ") ? primary.slice(7) : primary;

  const keys = ["jwt", "jwtToken", "token", "Authorization"];
  for (const k of keys) {
    const v = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (v) return v.startsWith("Bearer ") ? v.slice(7) : v;
  }
  const m = document.cookie.match(/(?:^|;\s*)Authorization=([^;]+)/);
  if (m) {
    const decoded = decodeURIComponent(m[1]);
    return decoded.startsWith("Bearer ") ? decoded.replace(/^Bearer\s+/i, "") : decoded;
  }
  return null;
}

const pick = (obj: any, keys: string[], fallback: any = "") => {
  for (const path of keys) {
    const v = path.split(".").reduce((acc: any, k) => (acc && acc[k] != null ? acc[k] : undefined), obj);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return fallback;
};

const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

const SchedulePage: React.FC = () => {
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

  // 공고 상세 페이지
  const [showJobDetail, setShowJobDetail] = useState(false);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<number | null>(null);

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
    const controller = new AbortController();
    const token = resolveAccessToken();

    async function fetchFavorites() {
      try {
        setLoading(true);
        setError(null);

        const url = `${API_BASE}/api/mypage/favorites/jobposts?page=0&size=1000`;
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`(${res.status}) ${text || "스크랩 공고 로드 실패"}`);
        }

        const raw = await res.json();

        let arr: any[] = [];
        if (Array.isArray(raw)) arr = raw;
        else if (Array.isArray(raw.items)) arr = raw.items;
        else if (Array.isArray(raw.content)) arr = raw.content;
        else if (Array.isArray(raw.rows)) arr = raw.rows;
        else if (Array.isArray(raw.data)) arr = raw.data;
        else if (Array.isArray(raw.list)) arr = raw.list;
        else {
          const firstArray = Object.values(raw).find((v) => Array.isArray(v));
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
              const detailRes = await fetch(`${API_BASE}/api/jobposts/${jobPostId}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
                signal: controller.signal,
              });

              if (!detailRes.ok) {
                // 상세 정보 조회 실패 시 기본 정보만 사용
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

              const detail = await detailRes.json();

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

        const mapped = detailedNotices.filter(Boolean) as Notice[];
        setAllFavorites(mapped);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e.message || "스크랩 로드 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
    return () => controller.abort();
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

    let classes = "p-4 rounded cursor-pointer transition-all duration-200 text-base ";
    if (isSelected) classes += "border border-blue-300 font-bold scale-105";
    else if (isPast) classes += "text-gray-300 cursor-not-allowed";
    else classes += "hover:bg-gray-200 hover:scale-105";
    if (isToday) classes += "border bg-blue-300";
    return classes;
  };

  const handleJobClick = (jobId: number) => {
    setSelectedJobForDetail(jobId);
    setShowJobDetail(true);
  };

  const openApplyModal = async (jobPostId?: number) => {
    if (!jobPostId) {
      alert("공고 정보가 올바르지 않습니다.");
      return;
    }
    setCurrentJobId(jobPostId);
    setSelectedResumeId(null);

    const controller = new AbortController();
    const token = resolveAccessToken();

    try {
      const res = await fetch(`${API_BASE}/api/mypage/resumes?page=0&size=50`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("이력서 목록을 불러올 수 없습니다.");

      const data = await res.json();
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

    const token = resolveAccessToken();
    try {
      setApplying(true);
      const res = await fetch(`${API_BASE}/api/mypage/applies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ jobPostId: currentJobId, resumeId: selectedResumeId }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "지원 중 오류가 발생했습니다.");
      }

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

  // 공고 상세 모달
  if (showJobDetail && selectedJobForDetail) {
    return (
      <div className="p-4">
        <JobDetail
          jobId={selectedJobForDetail}
          onBack={() => {
            setShowJobDetail(false);
            setSelectedJobForDetail(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex p-4 gap-6">
      {/* 좌측 달력 */}
      <div className="w-2/3 bg-white rounded-lg shadow p-6" style={{ minHeight: "550px" }}>
        <div className="flex justify-between items-center mb-12">
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

        <div className="grid grid-cols-7 text-center gap-4 mb-6 font-semibold">
          <span className="text-red-500">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span className="text-blue-500">토</span>
        </div>

        <div className="grid grid-cols-7 gap-6 text-center">
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;
            const fullDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            return (
              <div
                key={day}
                onClick={() => fullDate >= todayStr && setSelectedDate(fullDate)}
                className={getDayClass(fullDate)}
              >
                <div>{day}</div>
                {calendarMap[fullDate] > 0 && <div className="mt-1 mx-auto w-2 h-2 rounded-full bg-gray-400"></div>}
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
      <div className="w-1/3 space-y-4">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice, idx) => (
            <div
              key={idx}
              className="rounded-lg p-4 shadow-sm bg-white border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
              onClick={() => notice.id && handleJobClick(notice.id)}
            >
              {/* 회사명 */}
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {notice.companyName}
              </p>

              {/* 공고 제목 */}
              <h3 className="text-sm text-gray-800 mb-2">
                {notice.title}
              </h3>

              {/* 공고 정보 */}
              <div className="space-y-1 mb-3">
                <p className="text-sm text-gray-500">
                  {notice.position && <span>{notice.position} / </span>}
                  {notice.careerLevel} / {notice.education} / {notice.location}
                </p>
                <p className="text-xs text-gray-500">
                  {notice.date}
                </p>
              </div>

              {/* 지원하기 버튼 */}
              <button
                className="w-full mt-2 px-4 py-2 bg-gray-300 text-white rounded-md text-sm hover:bg-gray-400 transition-colors"
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