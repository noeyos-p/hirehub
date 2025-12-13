// src/myPage/resume/Resume.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { myPageApi } from "../../api/myPageApi";
import type { ResumeItem, PagedResponse } from "../../types/interface";

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

      // ✅ 이력서 자동기입정보 확인
      const userInfo = await myPageApi.getMyInfo();

      const missingFields: string[] = [];
      if (!userInfo.dob) missingFields.push("생년월일");
      if (!userInfo.address) missingFields.push("주소");
      if (!userInfo.gender || userInfo.gender === "UNKNOWN") missingFields.push("성별");

      if (missingFields.length > 0) {
        const fieldsText = missingFields.join(", ");
        const confirmResult = window.confirm(
          `이력서 자동기입정보(${fieldsText})가 입력되지 않았습니다.\n\n내 정보 페이지에서 먼저 입력해주세요.\n\n지금 내 정보 페이지로 이동하시겠습니까?`
        );

        if (confirmResult) {
          navigate("/myPage/MyInfo");
        }
        setLoading(false);
        return;
      }

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

  return (
    <div className="max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
      {/* 데스크톱 헤더 */}
      <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
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

      {/* 모바일 액션 버튼 */}
      <div className="md:hidden mb-6">
        <button
          onClick={handleCreate}
          className="w-full bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm text-gray-600 font-medium">새 이력서 작성</span>
        </button>
      </div>

      {/* 이력서 목록 */}
      <div className="space-y-4 sm:space-y-5">
        {resumes.map((resume) => (
          <div key={resume.id}>
            {/* 모바일 카드 레이아웃 */}
            <div className="md:hidden bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <h3
                  className="text-base font-semibold text-gray-900 flex-1 cursor-pointer hover:text-blue-600"
                  onClick={() => navigate(`/myPage/resume/ResumeViewer/${resume.id}`)}
                >
                  {resume.title}
                  {resume.locked && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 align-middle">
                      제출됨
                    </span>
                  )}
                </h3>
                <button className="text-gray-400 p-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {dateOf(resume)}
                </div>
                {!resume.locked && (
                  <button
                    className="text-xs px-3 py-1.5 rounded-md whitespace-nowrap text-gray-700 transition-colors"
                    style={{ backgroundColor: '#D6E4F0' }}
                    onClick={() => navigate(`/myPage/resume/ResumeDetail?id=${resume.id}`)}
                    disabled={loading}
                  >
                    수정하기
                  </button>
                )}
              </div>
            </div>

            {/* 데스크톱 레이아웃 */}
            <div className="hidden md:flex items-center justify-between border-b border-gray-200 pb-3 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="checkbox"
                  className="mt-0 sm:mt-[-2px] accent-[#006AFF] flex-shrink-0"
                  checked={selectedIds.includes(resume.id)}
                  onChange={() => handleCheckboxChange(resume.id)}
                  disabled={loading || resume.locked}
                />
                <div
                  className="text-gray-900 font-semibold text-sm sm:text-[15px] md:text-[16px] py-2 sm:py-3 md:py-[20px] cursor-pointer hover:text-blue-600"
                  onClick={() => navigate(`/myPage/resume/ResumeViewer/${resume.id}`)}
                >
                  {resume.title}
                  {resume.locked && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 align-middle">
                      제출됨
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {!resume.locked && (
                  <button
                    className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-md whitespace-nowrap text-gray-700 transition-colors"
                    style={{ backgroundColor: '#D6E4F0' }}
                    onClick={() => handleEdit(resume.id, resume.locked)}
                    disabled={loading}
                  >
                    수정하기
                  </button>
                )}
                <span className="text-xs sm:text-sm text-gray-500">- {dateOf(resume)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 데스크톱 하단 버튼 */}
      <div className="hidden md:flex justify-between items-center mt-4 sm:mt-6">
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
    </div>
  );
};

export default Resume;
