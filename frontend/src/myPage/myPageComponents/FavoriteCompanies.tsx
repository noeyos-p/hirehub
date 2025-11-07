// src/myPage/favorite/FavoriteCompanies.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

/** 서버 응답 DTO */
type FavoriteCompanyRow = {
  favoriteId: number;
  companyId: number;
  companyName: string;
  openPostCount: number;
};
type AggregatedCompanyRow = {
  companyId: number;
  companyName: string;
  openPostCount: number;
  favoriteIds: number[];
};
type PagedResponse<T> = {
  items?: T[];
  content?: T[];
  rows?: T[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};
type JobPostLite = {
  id: number;
  companyId?: number;
  title: string;
  position?: string;
  location?: string;
  endAt?: string;
  status?: string;
  isOpen?: boolean;
};

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

const mapJobPost = (r: any): JobPostLite | null => {
  const rawId = r?.id ?? r?.jobPostId ?? r?.postId;
  const id = Number(rawId);
  if (!id || Number.isNaN(id)) return null;
  const endAt = String(r?.endAt ?? r?.deadline ?? r?.dueDate ?? "") || undefined;
  const status = String(r?.status ?? r?.state ?? "") || undefined;
  const companyId: number | undefined = (() => {
    const v = r?.companyId ?? r?.company?.id ?? r?.jobPost?.companyId;
    return v != null ? Number(v) : undefined;
  })();
  return {
    id,
    companyId,
    title: String(r?.title ?? r?.jobPostTitle ?? r?.name ?? ""),
    position: String(r?.position ?? r?.role ?? r?.job ?? "") || undefined,
    location: String(r?.location ?? r?.region ?? r?.addr ?? "") || undefined,
    endAt,
    status,
  };
};

const computeIsOpen = (p: JobPostLite): boolean => {
  if (p.status) {
    const s = p.status.toUpperCase();
    if (["OPEN", "OPENED", "OPENING", "ACTIVE"].includes(s)) return true;
    if (["CLOSE", "CLOSED", "ENDED", "INACTIVE"].includes(s)) return false;
  }
  if (p.endAt) {
    const end = new Date(p.endAt).getTime();
    if (!Number.isNaN(end)) return end >= Date.now();
  }
  return true;
};

const FavoriteCompanies: React.FC = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<AggregatedCompanyRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsCache, setPostsCache] = useState<Record<number, JobPostLite[]>>({});

  /** 목록 조회 */
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PagedResponse<FavoriteCompanyRow>>(
        "/api/mypage/favorites/companies",
        { params: { page: 0, size: 300 } }
      );
      const list = (firstArrayIn(data) as FavoriteCompanyRow[]) || [];
      // 같은 companyId 합치기
      const map = new Map<number, AggregatedCompanyRow>();
      for (const r of list) {
        const cid = Number(r?.companyId);
        if (!cid || Number.isNaN(cid)) continue;
        const prev = map.get(cid);
        if (prev) {
          prev.openPostCount += Number(r.openPostCount ?? 0);
          prev.favoriteIds.push(Number(r.favoriteId));
        } else {
          map.set(cid, {
            companyId: cid,
            companyName: String(r.companyName ?? ""),
            openPostCount: Number(r.openPostCount ?? 0),
            favoriteIds: [Number(r.favoriteId)],
          });
        }
      }
      setRows(Array.from(map.values()));
      setSelectedIds([]);
    } catch (e: any) {
      console.error("관심기업 목록 조회 실패:", e?.response?.status, e?.response?.data || e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // 즐겨찾기/포커스 변화 시 재조회
  useEffect(() => {
    const onFavChanged = () => fetchList();
    const onFocus = () => fetchList();
    window.addEventListener("favorite-changed", onFavChanged as EventListener);
    window.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("favorite-changed", onFavChanged as EventListener);
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchList]);

  /** 체크박스 */
  const handleCheckboxChange = (companyId: number) => {
    setSelectedIds((prev) =>
      prev.includes(companyId) ? prev.filter((v) => v !== companyId) : [...prev, companyId]
    );
  };

  const allSelected = useMemo(
    () => rows.length > 0 && selectedIds.length === rows.length,
    [rows, selectedIds]
  );

  const handleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(rows.map((r) => r.companyId));
  };

  /** 삭제 */
  const handleDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`선택한 ${selectedIds.length}개를 삭제할까요?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((cid) => api.delete(`/api/mypage/favorites/companies/${cid}`)));
      await fetchList();
    } catch (e) {
      console.error("관심기업 삭제 실패:", e);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /** 특정 회사의 '채용중' 공고만 조회해서 캐시에 저장 */
  const fetchOpenPosts = async (companyId: number): Promise<JobPostLite[]> => {
    const loadCandidates = async (): Promise<JobPostLite[]> => {
      try {
        const { data } = await api.get(`/api/companies/${companyId}/jobposts`, {
          params: { status: "open", size: 200 },
        });
        return firstArrayIn(data).map(mapJobPost).filter(Boolean) as JobPostLite[];
      } catch {}
      try {
        const { data } = await api.get(`/api/jobposts`, {
          params: { companyId, status: "open", size: 200 },
        });
        return firstArrayIn(data).map(mapJobPost).filter(Boolean) as JobPostLite[];
      } catch {}
      try {
        const { data } = await api.get(`/api/jobposts/company/${companyId}`);
        return firstArrayIn(data).map(mapJobPost).filter(Boolean) as JobPostLite[];
      } catch (e) {
        console.error("채용중 공고 조회 실패:", e);
        return [];
      }
    };

    const raw = await loadCandidates();
    return raw
      .map((p) => ({ ...p, isOpen: computeIsOpen(p) }))
      .filter((p) => (p.companyId == null ? true : p.companyId === companyId))
      .filter((p) => p.isOpen);
  };

  const toggleOpenPosts = async (companyId: number) => {
    if (expandedCompanyId === companyId) {
      setExpandedCompanyId(null);
      return;
    }
    setExpandedCompanyId(companyId);
    if (postsCache[companyId]) return;

    setLoadingPosts(true);
    const posts = await fetchOpenPosts(companyId);
    setPostsCache((prev) => ({ ...prev, [companyId]: posts }));
    setLoadingPosts(false);
  };

  /** ✅ 공고 상세로 이동 - 프로젝트 라우팅 구조에 맞춤 */
  const goJobDetail = (jobId: number) => {
    navigate(`/jobPostings/${jobId}`);
  };

  return (
    <div className="flex">
      <div className="flex-1 px-6 py-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">관심 기업</h2>
          <button onClick={handleSelectAll} className="text-sm text-gray-600 hover:text-gray-800">
            {allSelected ? "전체해제" : "전체선택"}
          </button>
        </div>

        <div className="space-y-5">
          {rows.length === 0 && !loading && (
            <div className="text-sm text-gray-500">즐겨찾기한 기업이 없습니다.</div>
          )}

          {rows.map((r) => {
            const isOpen = expandedCompanyId === r.companyId;
            const cached = postsCache[r.companyId] || [];
            const postsToShow = cached.slice(0, r.openPostCount || undefined);

            return (
              <div key={r.companyId} className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="mt-[-2px] accent-blue-500"
                      checked={selectedIds.includes(r.companyId)}
                      onChange={() => handleCheckboxChange(r.companyId)}
                      disabled={loading}
                    />
                    <div className="text-gray-900 font-semibold text-[16px] py-[20px]">{r.companyName}</div>
                  </div>

                  <button
                    onClick={() => toggleOpenPosts(r.companyId)}
                    className="text-sm"
                    title="현재 채용중 공고 보기"
                  >
                    채용 중{" "}
                    <span className="text-blue-800 underline underline-offset-2">
                      {r.openPostCount ?? 0}
                    </span>
                    개
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-3 rounded-md border border-gray-100 bg-gray-50 p-3">
                    {loadingPosts && cached.length === 0 ? (
                      <div className="text-sm text-gray-500">불러오는 중…</div>
                    ) : postsToShow.length === 0 ? (
                      <div className="text-sm text-gray-500">현재 채용중인 공고가 없습니다.</div>
                    ) : (
                      <ul className="space-y-2">
                        {postsToShow.map((p) => (
                          <li key={p.id}>
                            {/* ✅ 프로젝트 라우팅에 맞게 수정 */}
                            <div
                              onClick={() => goJobDetail(p.id)}
                              className="flex items-center justify-between bg-white rounded-md px-3 py-2 border hover:border-gray-300 cursor-pointer transition-colors"
                              title="채용 상세 보기"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate">{p.title}</div>
                                <div className="text-xs text-gray-500">
                                  {[p.position, p.location].filter(Boolean).join(" · ")}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                {p.endAt ? `마감: ${prettyMDW(p.endAt)}` : ""}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
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
      </div>
    </div>
  );
};

export default FavoriteCompanies;