// src/myPage/resume/Resume.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api";

type ResumeItem = {
  id: number;
  title: string;
  locked: boolean;
  createAt: string; // ISO(LocalDate)
  updateAt: string; // ISO(LocalDate)
};

type PagedResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

const yoil = ["일", "월", "화", "수", "목", "금", "토"];
const prettyMDW = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const w = yoil[d.getDay()];
  return `${mm}.${dd}(${w})`;
};

const Resume = () => {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchList = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<PagedResponse<ResumeItem> | any>(
        "/api/mypage/resumes",
        { params: { page: 0, size: 50 } }
      );
      const list: ResumeItem[] = data?.items ?? data?.content ?? [];
      setResumes(list);
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 상세 저장 후 돌아와도 항상 새로고침
  useEffect(() => {
    fetchList();
  }, [location.key]);

  const handleCheckboxChange = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === resumes.length) setSelectedIds([]);
    else setSelectedIds(resumes.map((r) => r.id));
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const payload = {
        title: "새 이력서",
        idPhoto: null,
        essayTitle: "자기소개서",
        // @NotBlank 우회: 의미 있는 기본 텍스트
        essayContent: "임시 자기소개서 내용",
      };
      const res = await api.post("/api/mypage/resumes", payload, {
        headers: { "Content-Type": "application/json" },
      });
      const newId = res?.data?.id;
      if (newId) {
        navigate(`/myPage/resume/ResumeDetail?id=${newId}`);
      } else {
        await fetchList();
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "이력서 생성 중 오류가 발생했습니다.";
      console.error("이력서 생성 실패:", e?.response || e);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 잠금 여부에 따라 수정/조회 라우팅 분기
  const handleEdit = (id: number, locked: boolean) => {
    if (locked) {
      // 잠긴 이력서는 조회 전용 페이지로
      navigate(`/myPage/resume/ResumeViewer/${id}`);
    } else {
      // 잠기지 않은 이력서는 수정 페이지로
      navigate(`/myPage/resume/ResumeDetail?id=${id}`);
    }
  };


  const dateOf = (r: ResumeItem) => prettyMDW(r.updateAt || r.createAt);

  const allSelected = useMemo(
    () => resumes.length > 0 && selectedIds.length === resumes.length,
    [resumes, selectedIds]
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">이력서 관리</h2>
      </div>

      <div className="space-y-5">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className="flex items-center justify-between border-b border-gray-200 pb-4"
          >
            <div className="flex items-start gap-3">
              <div className="text-gray-700 mt-1">
                {resume.title}
                {resume.locked && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 align-middle">
                    제출됨
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                className={`text-sm px-4 py-1.5 rounded-md ${
                  resume.locked
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
                onClick={() => handleEdit(resume.id, resume.locked)}
                disabled={loading}
              >
                {resume.locked ? "조회하기" : "수정하기"}
              </button>
              <span className="text-sm text-gray-500">- {dateOf(resume)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-6 gap-6">
        <button
          onClick={handleCreate}
          className="bg-gray-200 hover:bg-gray-300 text-gray-500 text-sm font-medium px-4 py-1.5 rounded-md"
          disabled={loading}
        >
          이력서 작성
        </button>
      </div>
    </div>
  );
};

export default Resume;
