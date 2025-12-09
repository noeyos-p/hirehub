import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { myPageApi } from "../../api/myPageApi";
import { jobPostApi } from "../../api/jobPostApi";
import type { ApplyItem } from "../../types/interface";

const yoil = ["일", "월", "화", "수", "목", "금", "토"];
const prettyDateTime = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const w = yoil[d.getDay()];
  return `${y}.${m}.${dd}(${w})`;
};

const prettyMDW = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return "-";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const w = yoil[d.getDay()];
  return `${m}.${dd}(${w})`;
};

const AppliedNotices: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<ApplyItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApplies = async () => {
    try {
      setLoading(true);
      const data = await myPageApi.getApplies();
      console.log('📌 지원 내역 API 응답:', data);

      // 각 지원 내역에 대해 공고 제목 조회
      const itemsWithJobTitle = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (item) => {
          try {
            const jobPost = await jobPostApi.getJobPostById(item.jobPostsId);
            return { ...item, jobPostTitle: jobPost.title };
          } catch (e) {
            console.error(`공고 ${item.jobPostsId} 조회 실패:`, e);
            return { ...item, jobPostTitle: '공고 정보 없음' };
          }
        })
      );

      setItems(itemsWithJobTitle);
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
      alert("지원 내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplies();
  }, []);

  // ✅ 수정 후 돌아왔을 때 자동 새로고침
  useEffect(() => {
    if (location.state?.refreshed) {
      fetchApplies();
    }
  }, [location.state]);

  const handleCheckboxChange = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const allSelected = useMemo(
    () => items.length > 0 && selectedIds.length === items.length,
    [items, selectedIds]
  );

  const handleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(items.map(n => n.id));
  };

  // ✅ 이력서 보기
  const handleOpenResume = (row: ApplyItem) => {
    if (!row.resumeId) {
      alert("이 지원 건의 이력서 ID를 찾을 수 없습니다.");
      return;
    }
    navigate(`/myPage/resume/ResumeViewer/${row.resumeId}`);
  };

  // ✅ 공고 상세 페이지로 이동
  const handleGoToJobPost = (jobPostId: number) => {
    console.log('🔍 클릭한 jobPostId:', jobPostId, '타입:', typeof jobPostId);
    if (!jobPostId || isNaN(jobPostId)) {
      alert('공고 ID를 찾을 수 없습니다.');
      return;
    }
    navigate(`/jobPostings/${jobPostId}`);
  };


  return (
    <div className="max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">지원 내역</h2>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gray-500">지원한 공고가 없습니다.</div>
      ) : (
        <div className="space-y-5">
          {items.map((notice) => (
            <div
              key={notice.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="min-w-0 flex-1">
                  <div
                    className="text-gray-900 font-semibold cursor-pointer hover:text-[#006AFF] transition-colors truncate"
                    onClick={() => handleGoToJobPost(notice.jobPostsId)}
                    title="공고 상세 보기"
                  >
                    {notice.companyName}
                  </div>
                  <div className="text-gray-700 text-sm sm:text-base mt-1 line-clamp-2 sm:line-clamp-1">
                    {notice.jobPostTitle || notice.resumeTitle}
                  </div>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-2 flex-shrink-0">
                <span className="text-sm text-gray-500 order-2 sm:order-2">
                  {prettyMDW(notice.appliedAt)}
                </span>
                <button
                  className="hover:bg-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-md cursor-pointer whitespace-nowrap order-1 sm:order-1"
                  style={{ backgroundColor: '#D6E4F0' }}
                  onClick={() => handleOpenResume(notice)}
                  disabled={loading}
                >
                  이력서 보기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppliedNotices;
