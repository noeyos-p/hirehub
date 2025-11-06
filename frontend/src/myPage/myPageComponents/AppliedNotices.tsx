import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";

type ApplyItem = {
  id: number;                 // apply id
  resumeId: number | null;    // ✅ 백에서 추가된 필드
  companyName: string;
  resumeTitle: string;
  appliedAt: string;          // ✅ 필드명 주의(백: appliedAt = LocalDate)
};

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

const AppliedNotices: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<ApplyItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApplies = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<ApplyItem[]>("/api/mypage/applies");
      setItems(Array.isArray(data) ? data : []);
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

  // ✅ 이력서 수정 (Resume.tsx 로직과 동일하게)
  const handleEditResume = (row: ApplyItem) => {
    if (!row.resumeId) {
      alert("이 지원 건의 이력서 ID를 찾을 수 없습니다.");
      return;
    }
    // Resume.tsx에서와 동일한 수정 페이지로 이동
    navigate(`/myPage/resume/ResumeDetail?id=${row.resumeId}`);
  };


  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">지원 내역</h2>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gray-500">지원한 공고가 없습니다.</div>
      ) : (
        <div className="space-y-5">
          {items.map((notice) => (
            <div
              key={notice.id}
              className="flex items-center justify-between border-b border-gray-200 pb-4"
            >
              <div className="flex items-start gap-3">
                <div>
                  <div className="text-gray-900 font-semibold">{notice.companyName}</div>
                  <div className="text-gray-700 mt-1">{notice.resumeTitle}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    - {prettyDateTime(notice.appliedAt)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-4 py-1.5 rounded-md"
                    onClick={() => handleOpenResume(notice)}
                    disabled={loading}
                  >
                    이력서 보기
                  </button>

                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-1.5 rounded-md"
                    onClick={() => handleEditResume(notice)}
                    disabled={loading}
                  >
                    수정
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppliedNotices;
