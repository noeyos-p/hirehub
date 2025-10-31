import React, { useEffect, useMemo, useState, useCallback } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import api from "../../api/api";

const yoil = ["일", "월", "화", "수", "목", "금", "토"];
const prettyMDW = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const w = yoil[d.getDay()];
  return `${mm}.${dd}(${w})`;
};

const deepPick = (obj: any, paths: string[], def: any = "") => {
  for (const p of paths) {
    const v = p.split(".").reduce((acc: any, k) => (acc && acc[k] != null ? acc[k] : undefined), obj);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return def;
};

type NoticeItem = {
  id: number;        // jobPostId
  company: string;
  title: string;
  info: string;
  deadline: string;
};

type ResumeItem = {
  id: number;
  title: string;
  locked: boolean;
  createAt: string;
  updateAt: string;
};

// --- 로컬스토리지 키(유저별 키를 쓰려면 로그인 이메일/ID를 뒤에 붙여도 됨)
const LS_APPLIED = "hirehub_applied_job_ids";

const FavoriteNotices: React.FC = () => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // 지원 상태
  const [appliedIds, setAppliedIds] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(LS_APPLIED);
      if (!raw) return new Set();
      const arr: number[] = JSON.parse(raw);
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  // 모달
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyTargetJobId, setApplyTargetJobId] = useState<number | null>(null);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const persistApplied = (ids: Set<number>) => {
    try {
      localStorage.setItem(LS_APPLIED, JSON.stringify(Array.from(ids)));
    } catch {}
  };

  const firstArrayIn = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      for (const k of ["items", "content", "rows", "data", "list", "result"]) {
        if (Array.isArray((data as any)[k])) return (data as any)[k];
      }
      const arr = Object.values(data).find((v) => Array.isArray(v));
      if (Array.isArray(arr)) return arr as any[];
    }
    return [];
  };

  const mapRow = (r: any): NoticeItem | null => {
    const rawId = deepPick(r, ["jobPostId", "id", "postId", "jobPost.id"]);
    const idNum = Number(rawId);
    if (!rawId || Number.isNaN(idNum)) return null;

    const company = String(deepPick(r, ["companyName", "company", "corpName", "jobPost.companyName", "jobPost.company.name"], ""));
    const title = String(deepPick(r, ["title", "jobPostTitle", "jobPost.title"], ""));
    const loc = String(deepPick(r, ["location", "region", "addr", "jobPost.location"], ""));
    const career = String(deepPick(r, ["career", "careerLevel", "jobPost.careerLevel"], ""));
    const edu = String(deepPick(r, ["education", "edu", "jobPost.education"], ""));
    const info = [career, loc, edu].filter(Boolean).join(", ");
    const endIso = String(deepPick(r, ["endAt", "deadline", "dueDate", "jobPost.endAt"], ""));
    const deadline = prettyMDW(endIso);
    return { id: idNum, company, title, info, deadline };
  };

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/mypage/favorites/jobposts", { params: { page: 0, size: 100 } });
      const raw = firstArrayIn(data);
      const list = raw.map(mapRow).filter(Boolean) as NoticeItem[];
      setNotices(list);
      setSelectedIds([]);
    } catch (e: any) {
      console.error("스크랩 공고 목록 조회 실패:", e?.response?.status, e?.response?.data || e);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // 상세/다른 탭에서 토글되면 즉시 갱신
  useEffect(() => {
    const handler = () => fetchList();
    window.addEventListener("scrap-changed", handler);
    window.addEventListener("focus", handler);
    window.addEventListener("visibilitychange", handler);
    // 지원 변경 동기화
    const onApplied = (ev: Event) => {
      // ev에 jobId를 실어 보낸 경우 읽어 적용할 수도 있음. 여기서는 전체 새로고침까진 필요없음.
      // fetchList(); // 필요 시 주석 해제
    };
    window.addEventListener("applies-changed", onApplied);
    return () => {
      window.removeEventListener("scrap-changed", handler);
      window.removeEventListener("focus", handler);
      window.removeEventListener("visibilitychange", handler);
      window.removeEventListener("applies-changed", onApplied);
    };
  }, [fetchList]);

  const handleCheckboxChange = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const allSelected = useMemo(() => notices.length > 0 && selectedIds.length === notices.length, [notices, selectedIds]);

  const handleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(notices.map((n) => n.id));
  };

  const handleDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`선택한 ${selectedIds.length}개를 삭제할까요?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/api/mypage/favorites/jobposts/${id}`)));
      await fetchList();
    } catch (e) {
      console.error("스크랩 공고 삭제 실패:", e);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // --- 지원 플로우 ---
  const fetchResumes = async () => {
    try {
      const { data } = await api.get("/api/mypage/resumes", { params: { page: 0, size: 50 } });
      const list: ResumeItem[] = (data?.items ?? data?.content ?? []).filter((r: ResumeItem) => !r.locked);
      setResumes(list);
      setSelectedResumeId(list.length ? list[0].id : null);
    } catch (e) {
      console.error("이력서 목록 조회 실패:", e);
      alert("이력서 목록을 불러올 수 없습니다.");
      setResumes([]);
    }
  };

  const openApplyModal = async (jobPostId: number) => {
    if (appliedIds.has(jobPostId)) {
      alert("이미 지원하신 공고입니다.");
      return;
    }
    setApplyTargetJobId(jobPostId);
    setShowApplyModal(true);
    await fetchResumes();
  };

  const markApplied = (jobPostId: number) => {
    const next = new Set(appliedIds);
    next.add(jobPostId);
    setAppliedIds(next);
    persistApplied(next);
    // 다른 페이지/탭 동기화
    window.dispatchEvent(new Event("applies-changed"));
  };

  const submitApply = async () => {
    if (!applyTargetJobId) return;
    if (!selectedResumeId) {
      alert("이력서를 선택해주세요.");
      return;
    }
    if (!confirm("선택한 이력서로 지원하시겠습니까? 제출 후에는 이력서를 수정할 수 없습니다.")) return;

    try {
      setIsApplying(true);
      await api.post("/api/mypage/applies", { jobPostId: applyTargetJobId, resumeId: selectedResumeId });
      alert("지원이 완료되었습니다!");
      markApplied(applyTargetJobId); // ✅ 바로 ‘지원 완료’ 상태 반영
      setShowApplyModal(false);
      setApplyTargetJobId(null);
      setSelectedResumeId(null);
    } catch (e: any) {
      // 백엔드가 중복 지원에 409/400 등을 주면 여기서도 완료 상태로 전환해 재시도 막음
      const status = e?.response?.status;
      if (status === 409 || status === 400) {
        markApplied(applyTargetJobId!);
        setShowApplyModal(false);
        setApplyTargetJobId(null);
        setSelectedResumeId(null);
        alert(e?.response?.data?.message || "이미 지원한 공고입니다.");
      } else {
        console.error("지원 실패:", e?.response?.data || e);
        alert(e?.response?.data?.message || "지원 중 오류가 발생했습니다.");
      }
    } finally {
      setIsApplying(false);
    }
  };

  const ApplyModal: React.FC = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">지원할 이력서 선택</h3>
          <button
            onClick={() => {
              setShowApplyModal(false);
              setApplyTargetJobId(null);
              setSelectedResumeId(null);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {resumes.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>제출 가능한 이력서가 없습니다.</p>
              <p className="text-sm mt-2">이력서 작성 후 다시 시도해주세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((r) => (
                <label
                  key={r.id}
                  className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedResumeId === r.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
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
                        최종 수정: {new Date(r.updateAt || r.createAt).toLocaleDateString()}
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
            onClick={() => {
              setShowApplyModal(false);
              setApplyTargetJobId(null);
              setSelectedResumeId(null);
            }}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            disabled={isApplying}
          >
            취소
          </button>
          <button
            onClick={submitApply}
            disabled={!selectedResumeId || isApplying}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? "지원 중..." : "지원하기"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">관심 공고</h2>
        <button onClick={handleSelectAll} className="text-sm text-gray-600 hover:text-gray-800">
          {allSelected ? "전체해제" : "전체선택"}
        </button>
      </div>

      <div className="space-y-5">
        {notices.length === 0 && !loading && <div className="text-sm text-gray-500">스크랩한 공고가 없습니다.</div>}

        {notices.map((n) => {
          const applied = appliedIds.has(n.id);
          return (
            <div key={n.id} className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 accent-blue-500"
                  checked={selectedIds.includes(n.id)}
                  onChange={() => handleCheckboxChange(n.id)}
                  disabled={loading}
                />
                <div>
                  <div className="text-gray-900 font-semibold">{n.company}</div>
                  <div className="text-gray-700 mt-1">{n.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{n.info}</div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => openApplyModal(n.id)}
                  disabled={applied}
                  className={`text-sm px-4 py-1.5 rounded-md ${
                    applied
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {applied ? "지원 완료" : "지원하기"}
                </button>
                <span className="text-sm text-gray-500">- {n.deadline}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleDelete}
          disabled={!selectedIds.length || loading}
          className="text-red-500 hover:text-red-600 text-sm font-medium disabled:opacity-50"
        >
          삭제
        </button>
      </div>

      {showApplyModal && <ApplyModal />}
    </div>
  );
};

export default FavoriteNotices;
