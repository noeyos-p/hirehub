import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  // 백은 LocalDate만 내려오므로 시간은 00:00 표시
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const w = yoil[d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${dd}(${w}) ${hh}:${mm}`;
};

const AppliedNotices: React.FC = () => {
  const navigate = useNavigate();
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

  useEffect(() => { fetchApplies(); }, []);

  const handleCheckboxChange = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const allSelected = useMemo(
    () => items.length > 0 && selectedIds.length === items.length,
    [items, selectedIds]
  );

  const handleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(items.map(n => n.id));
  };

  // ✅ 이력서 보기 -> ResumeViewer로 이동
  const handleOpenResume = (row: ApplyItem) => {
    if (!row.resumeId) {
      alert("이 지원 건의 이력서 ID를 찾을 수 없습니다.");
      return;
    }
    navigate(`/myPage/resume/ResumeViewer/${row.resumeId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">지원 내역</h2>
        <button
          onClick={handleSelectAll}
          className="text-sm text-gray-600 hover:text-gray-800"
          disabled={loading || items.length === 0}
        >
          {allSelected ? "전체해제" : "전체선택"}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gray-500">지원한 공고가 없습니다.</div>
      ) : (
        <div className="space-y-5">
          {items.map((notice) => (
            <div key={notice.id} className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 accent-blue-500"
                  checked={selectedIds.includes(notice.id)}
                  onChange={() => handleCheckboxChange(notice.id)}
                  disabled={loading}
                />
                <div>
                  <div className="text-gray-900 font-semibold">{notice.companyName}</div>
                  {/* 디자인의 '공고 제목' 자리에 '지원 당시 이력서 제목'을 노출 */}
                  <div className="text-gray-700 mt-1">{notice.resumeTitle}</div>
                  <div className="text-sm text-gray-500 mt-1">-</div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-4 py-1.5 rounded-md"
                  onClick={() => handleOpenResume(notice)}
                  disabled={loading}
                >
                  이력서 보기
                </button>
                <span className="text-sm text-gray-500">
                  {/* ✅ 년/월/일/시간(00:00) */}
                  - {prettyDateTime(notice.appliedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          className="text-red-500 hover:text-red-600 text-sm font-medium"
          onClick={() => alert("삭제 기능은 추후 연결 예정입니다.")}
          disabled={selectedIds.length === 0 || loading}
        >
          삭제
        </button>
      </div>
    </div>
  );
};

export default AppliedNotices;
