// src/myPage/favorite/FavoriteCompanies.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { myPageApi } from "../../api/myPageApi";
import { jobPostApi } from "../../api/jobPostApi";
import type { FavoriteCompanyResponse, FavoriteCompanyGroup, JobPosts, PagedResponse, CompanyResponse } from "../../types/interface";

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

const mapJobPost = (r: any): JobPosts | null => {
  const rawId = r?.id ?? r?.jobPostId ?? r?.postId;
  const id = Number(rawId);
  if (!id || Number.isNaN(id)) return null;

  const companyId: number = (() => {
    const v = r?.companyId ?? r?.company?.id ?? r?.company_id;
    return v != null ? Number(v) : 0;
  })();

  return {
    id,
    title: String(r?.title ?? r?.jobPostTitle ?? r?.name ?? ""),
    content: String(r?.content ?? ""),
    start_at: String(r?.startAt ?? r?.start_at ?? ""),
    end_at: String(r?.endAt ?? r?.end_at ?? r?.deadline ?? ""),
    location: String(r?.location ?? r?.region ?? r?.address ?? ""),
    career_level: String(r?.careerLevel ?? r?.career_level ?? ""),
    position: String(r?.position ?? r?.role ?? ""),
    education: String(r?.education ?? ""),
    type: String(r?.type ?? ""),
    salary: String(r?.salary ?? ""),
    company_id: companyId,
  };
};

const computeIsOpen = (p: JobPosts): boolean => {
  if (p.end_at) {
    const end = new Date(p.end_at).getTime();
    if (!Number.isNaN(end)) return end >= Date.now();
  }
  return true;
};

const FavoriteCompanies: React.FC = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<FavoriteCompanyGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsCache, setPostsCache] = useState<Record<number, JobPosts[]>>({});
  const [companyDetailsCache, setCompanyDetailsCache] = useState<Record<number, CompanyResponse>>({});

  /** 목록 조회 - FavoriteCompanyResponse 타입 사용 */
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await myPageApi.getFavoriteCompanies({ page: 0, size: 300 });
      const list = (firstArrayIn(data) as FavoriteCompanyResponse[]) || [];

      console.log("API 응답 데이터:", list); // 디버깅용

      // 같은 companyId 합치기
      const map = new Map<number, FavoriteCompanyGroup>();
      for (const r of list) {
        const cid = Number(r?.companyId);
        if (!cid || Number.isNaN(cid)) continue;

        // postCount 필드명이 다를 수 있으니 여러 가능성 확인
        const count = Number(
          r?.postCount ??
          r?.postCount ??
          (r as any)?.post_count ??
          (r as any)?.open_post_count ??
          0
        );

        console.log(`회사 ${r.companyName}: postCount=${count}`); // 디버깅용

        const prev = map.get(cid);
        if (prev) {
          prev.postCount += count;
          prev.ids.push(Number(r.id));
        } else {
          map.set(cid, {
            companyId: cid,
            companyName: String(r.companyName ?? ""),
            postCount: count,
            ids: [Number(r.id)],
            companyPhoto: r.companyPhoto,
            industry: r.industry,
          });
        }
      }
      const companies = Array.from(map.values());
      setRows(companies);
      setSelectedIds([]);

      // 회사 상세 정보 가져오기 (로고, 산업 분야 등)
      companies.forEach(async (company) => {
        if (!companyDetailsCache[company.companyId]) {
          try {
            const details = await jobPostApi.getCompanyById(company.companyId);
            setCompanyDetailsCache(prev => ({ ...prev, [company.companyId]: details }));
          } catch (error) {
            console.error(`회사 ${company.companyId} 상세 정보 조회 실패:`, error);
          }
        }
      });
    } catch (e: any) {
      console.error("관심기업 목록 조회 실패:", e?.response?.status, e?.response?.data || e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [companyDetailsCache]);

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
      await Promise.all(selectedIds.map((cid) => myPageApi.deleteFavoriteCompany(cid)));
      await fetchList();
    } catch (e) {
      console.error("관심기업 삭제 실패:", e);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /** 특정 회사의 '채용중' 공고만 조회해서 캐시에 저장 */
  const fetchOpenPosts = async (companyId: number): Promise<JobPosts[]> => {
    const loadCandidates = async (): Promise<JobPosts[]> => {
      const data = await myPageApi.getOpenPosts(companyId);
      return firstArrayIn(data).map(mapJobPost).filter(Boolean) as JobPosts[];
    };

    const raw = await loadCandidates();
    return raw
      .filter((p) => p.company_id === companyId)
      .filter((p) => computeIsOpen(p));
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

  /** 공고 상세로 이동 */
  const goJobDetail = (jobId: number) => {
    navigate(`/jobPostings/${jobId}`);
  };

  /** 기업 페이지로 이동 */
  const goCompanyPage = (companyId: number) => {
    navigate(`/company/${companyId}`);
  };

  /** 기업 공고 모아보기 페이지로 이동 */
  const goCompanyJobListings = (companyId: number) => {
    navigate(`/jobPostings?company=${companyId}`);
  };

  return (
    <div className="flex">
      <div className="flex-1 max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">관심 기업</h2>
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
            const postsToShow = cached.slice(0, r.postCount || undefined);
            const companyDetails = companyDetailsCache[r.companyId];

            return (
              <div key={r.companyId}>
                {/* 데스크톱 레이아웃 */}
                <div className="hidden md:block border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="mt-[-2px] accent-blue-500"
                        checked={selectedIds.includes(r.companyId)}
                        onChange={() => handleCheckboxChange(r.companyId)}
                        disabled={loading}
                      />
                      <div
                        className="text-gray-900 font-semibold text-[16px] py-[20px] cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => goCompanyPage(r.companyId)}
                        title="기업 페이지로 이동"
                      >
                        {r.companyName}
                      </div>
                    </div>

                    <button
                      onClick={() => goCompanyJobListings(r.companyId)}
                      className="text-sm cursor-pointer hover:text-blue-600 transition-colors"
                      title="기업 공고 모아보기"
                    >
                      채용 중{" "}
                      <span className="text-blue-800 font-semibold">
                        {r.postCount ?? 0}
                      </span>
                      개
                    </button>
                  </div>
                </div>

                {/* 모바일 레이아웃 */}
                <div className="md:hidden bg-white rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="flex gap-3">
                    {/* 회사 로고/아이콘 */}
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                      {(companyDetails?.photo || r.companyPhoto) ? (
                        <img
                          src={companyDetails?.photo || r.companyPhoto}
                          alt={r.companyName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerText = r.companyName.substring(0, 2);
                          }}
                        />
                      ) : (
                        r.companyName.substring(0, 2)
                      )}
                    </div>

                    {/* 회사 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div
                          className="cursor-pointer hover:opacity-80"
                          onClick={() => goCompanyPage(r.companyId)}
                        >
                          <div className="text-base font-bold text-gray-900">
                            {r.companyName}
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {companyDetails?.industry || r.industry || "IT, 컨텐츠"}
                          </div>
                        </div>
                      </div>

                      {/* 회사 설명 */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {companyDetails?.content || `${r.companyName}은(는) 소프트웨어&인공지능 교육을 혁신하는 플랫폼, 콘텐츠, 솔루션을 제공합니다.`}
                      </p>

                      {/* 채용 정보 */}
                      {r.postCount > 0 && (
                        <button
                          onClick={() => goCompanyJobListings(r.companyId)}
                          className="text-sm text-blue-600 font-medium hover:underline"
                        >
                          채용 중 {r.postCount}개
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 데스크톱 삭제 버튼 */}
        <div className="hidden md:flex justify-end mt-6">
          <button
            onClick={handleDelete}
            disabled={!selectedIds.length || loading}
            className="text-red-500 hover:text-red-600 text-sm font-medium disabled:opacity-50"
          >
            삭제
          </button>
        </div>

        {/* 모바일 삭제 버튼 */}
        {selectedIds.length > 0 && (
          <div className="md:hidden fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
            >
              선택한 {selectedIds.length}개 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoriteCompanies;