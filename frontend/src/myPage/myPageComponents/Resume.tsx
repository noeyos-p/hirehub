// src/myPage/resume/Resume.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { myPageApi } from "../../api/myPageApi";
import type { ResumeItem, PagedResponse } from "../../types/interface";
import api from "../../api/api";

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

    // 🔽 여기 안으로 옮기기
  const [loadingResumeId, setLoadingResumeId] = useState<number | null>(null);
  const [matchResults, setMatchResults] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchList = async () => {
    try {
      setLoading(true);
      const data = await myPageApi.getResumes({ page: 0, size: 50 });
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
    // 제출되지 않은 이력서만 선택
    const unlocked = resumes.filter((r) => !r.locked);
    if (selectedIds.length === unlocked.length) setSelectedIds([]);
    else setSelectedIds(unlocked.map((r) => r.id));
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
      const data = await myPageApi.createResume(payload);
      const newId = data?.id;
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

  const handleDelete = async () => {
    if (!selectedIds.length) return;

    // 잠긴 이력서가 선택되었는지 확인
    const hasLockedResumes = resumes.some(
      (r) => selectedIds.includes(r.id) && r.locked
    );

    if (hasLockedResumes) {
      alert("제출된 이력서는 삭제할 수 없습니다. 선택을 해제해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedIds.length}개의 이력서를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      await Promise.all(selectedIds.map((id) => myPageApi.deleteResume(id)));
      alert("이력서가 삭제되었습니다.");
      await fetchList();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        "이력서 삭제 중 오류가 발생했습니다.";
      console.error("이력서 삭제 실패:", e?.response || e);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const dateOf = (r: ResumeItem) => prettyMDW(r.updateAt || r.createAt);

  const allSelected = useMemo(() => {
    const unlocked = resumes.filter((r) => !r.locked);
    return unlocked.length > 0 && selectedIds.length === unlocked.length;
  }, [resumes, selectedIds]);

  // ai 매칭시스템 기능 추가
const handleMatch = async (resume) => {
  try {
    setLoadingResumeId(resume.id);
    setMatchResults([]);

    const res = await api.post("/api/resume/match", { resumeId: resume.id });

    console.log("✅ 서버 응답 코드:", res.status);

    // axios는 status 200~299면 자동으로 성공 처리됨.
    // 별도 .ok 체크나 .json() 호출 ❌
    console.log("📦 응답 데이터:", res.data);

    setMatchResults(res.data.results || []);
  } catch (err) {
    console.error("🔥 매칭 에러 발생:", err);
    alert("매칭 중 오류: " + (err.response?.data?.message || err.message));
  } finally {
    setLoadingResumeId(null);
  }
};

  return (
    <div className="max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">이력서 관리</h2>
        <button
          onClick={handleCreate}
          className="text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-md whitespace-nowrap transition-colors"
          style={{ backgroundColor: '#006AFF' }}
          disabled={loading}
        >
          + 새 이력서 작성
        </button>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-3 sm:pb-4 gap-3 sm:gap-0"
          >
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <input
                type="checkbox"
                className="mt-0 sm:mt-[-2px] accent-blue-500 flex-shrink-0"
                checked={selectedIds.includes(resume.id)}
                onChange={() => handleCheckboxChange(resume.id)}
                disabled={loading || resume.locked}
              />
              <div className="text-gray-900 font-semibold text-sm sm:text-[15px] md:text-[16px] py-2 sm:py-3 md:py-[20px] min-w-0 flex-1">
                <span className="truncate block sm:inline">{resume.title}</span>
                {resume.locked && (
                  <span className="ml-0 sm:ml-2 mt-1 sm:mt-0 inline-block text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 align-middle">
                    제출됨
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-md whitespace-nowrap text-gray-700 transition-colors"
                style={{ backgroundColor: resume.locked ? '#EFF4F8' : '#D6E4F0' }}
                onClick={() => handleEdit(resume.id, resume.locked)}
                disabled={loading}
              >
                {resume.locked ? "조회하기" : "수정하기"}
              </button>
  {/* ⬇⬇⬇ 새로 넣을 AI 매칭 버튼 */}
<button
  className={`text-xs px-3 py-1.5 rounded-md
    ${loadingResumeId === resume.id
      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
      : "bg-blue-600 text-white hover:bg-blue-700"}
  `}
  onClick={() => handleMatch(resume)}
  disabled={loadingResumeId === resume.id}
>
  {loadingResumeId === resume.id ? "매칭 중..." : "AI 매칭"}
</button>
              <span className="text-xs sm:text-sm text-gray-500">- {dateOf(resume)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 sm:mt-6 gap-2 sm:gap-0">
        <button
          onClick={handleSelectAll}
          className="text-xs sm:text-sm text-gray-600 hover:text-gray-800"
        >
          {allSelected ? "전체해제" : "전체선택"}
        </button>
        <button
          onClick={handleDelete}
          disabled={!selectedIds.length || loading}
          className="text-red-500 hover:text-red-600 text-xs sm:text-sm font-medium disabled:opacity-50"
        >
          삭제
        </button>
      </div>
      {matchResults.length > 0 && (
  <div className="mt-8 p-4 border rounded bg-blue-50">
    <h3 className="text-lg font-semibold text-blue-900 mb-4">
      "{selectedResume?.title}" AI 매칭 결과
    </h3>

    {matchResults.map((item, i) => (
      <div key={i} className="p-4 mb-4 bg-white border rounded shadow">
        <p className="text-base font-semibold">
          {item.companyName} / {item.jobTitle}
        </p>
        <p className="mt-1">
          등급: <b>{item.grade}</b> (점수 {item.score})
        </p>

        <ul className="mt-2 text-sm text-gray-600">
          {item.reasons.map((r, idx) => (
            <li key={idx}>• {r}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
)}
    </div>
  );
};

export default Resume;
