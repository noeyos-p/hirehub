import React, { useState, useEffect } from "react";
import { TrashIcon, PhotoIcon, PencilIcon, XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import api from "../../api/api";

interface Job {
  id: number;
  title: string;                    // 공고 제목
  content: string;                  // 공고 내용
  startAt: string;                  // 시작일
  endAt: string;                    // 마감일
  location: string;                 // 선호 지역
  careerLevel: string;              // 경력
  education: string;                // 학력
  position: string;                 // 직무
  type: string;                     // 고용형태
  salary: string;                   // 급여
  photo?: string;                   // 공고사진
  company?: {                       // 회사 정보
    id: number;
    name: string;
  };
}

interface Company {
  id: number;
  name: string;
}

interface PageInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

// 신규 등록용: id 제외
type NewJob = Omit<Job, "id">;

const JobManagement: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  // ✅ 선택 관련 상태 및 함수 추가
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allSelected = jobs.length > 0 && selectedIds.length === jobs.length;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(jobs.map((j) => j.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length}개의 공고를 삭제하시겠습니까?`)) return;

    try {
      for (const id of selectedIds) {
        await api.delete(`/api/admin/job-management/${id}`);
      }
      alert("선택된 공고가 삭제되었습니다.");
      setSelectedIds([]);
      fetchJobs(currentPage);
    } catch (err) {
      console.error("선택삭제 오류:", err);
      alert("선택삭제 중 오류가 발생했습니다.");
    }
  };
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ 회사 페이지네이션 관련 state 추가
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyPage, setCompanyPage] = useState(0);
  const [companyTotalPages, setCompanyTotalPages] = useState(0);
  const companiesPerPage = 5;

  const [newJob, setNewJob] = useState<NewJob>({
    title: "",
    content: "",
    startAt: "",
    endAt: "",
    location: "",
    careerLevel: "",
    education: "",
    position: "",
    type: "",
    salary: "",
    photo: "",
    company: undefined,
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");


  const pageSize = 6; // 페이지당 6개

  // -------------------
  // MODIFIED: fetchJobs를 handleCreateSubmit 위로 이동했습니다.
  // 이유: handleCreateSubmit에서 호출하므로 선언이 위에 있어야 TS/빌드 에러 없음.
  // -------------------
  // ✅ 공고 목록 불러오기 (페이지네이션)
  const fetchJobs = async (page: number = 0, keyword: string = "") => {
    console.log("=== fetchJobs 시작 ===", "page:", page, "keyword:", keyword);

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (role !== "ADMIN") {
      setError("관리자 권한이 필요합니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/api/admin/job-management", {
        params: {
          page,
          size: pageSize,
          sortBy: "id",
          direction: "DESC",
          keyword, // ✅ 검색 키워드 추가됨
        },
      });

      console.log("API 응답 성공:", res.data);

      if (res.data.success) {
        console.log("공고 데이터:", res.data.data);
        setJobs(res.data.data);
        setPageInfo({
          totalElements: res.data.totalElements,
          totalPages: res.data.totalPages,
          currentPage: res.data.currentPage,
        });
        setCurrentPage(page);
      } else {
        console.error("데이터 불러오기 실패:", res.data.message);
        setError(res.data.message || "데이터를 불러올 수 없습니다.");
      }
    } catch (err: any) {
      console.error("=== API 요청 오류 ===");
      console.error("전체 에러:", err);
      console.error("응답 상태:", err.response?.status);
      console.error("응답 데이터:", err.response?.data);
      console.error("에러 메시지:", err.message);

      if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          setError("인증이 만료되었습니다. 다시 로그인해주세요.");
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          window.location.href = "/login";
        } else if (status === 403) {
          setError("관리자 권한이 필요합니다.");
        } else if (status === 500) {
          setError("서버 오류가 발생했습니다. 관리자에게 문의하세요.");
        } else {
          setError(err.response.data?.message || "오류가 발생했습니다.");
        }
      } else if (err.request) {
        setError("서버와 연결할 수 없습니다. 네트워크를 확인해주세요.");
      } else {
        setError(err.message || "알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ 회사 목록 불러오기 (페이지네이션)
  const fetchCompanies = async (page: number) => {
    try {
      const res = await api.get(`/api/admin/company-management?page=${page}&size=${companiesPerPage}`);
      // API 응답 형식이 원래와 다르면 여기 조정 필요
      if (res.data.success) {
        setCompanies(res.data.data || []);
        setCompanyTotalPages(res.data.totalPages || 0);
      } else {
        // 실패해도 UI가 깨지지 않도록 로그
        console.warn("회사 목록 응답 실패:", res.data);
      }
    } catch (err) {
      console.error("회사 목록 불러오기 실패:", err);
    }
  };

  // ✅ 회사 페이지 변경
  const handleCompanyPageChange = (page: number) => {
    const safePage = Math.max(0, page);
    setCompanyPage(safePage);
    fetchCompanies(safePage);
  };

  // ✅ 신규 등록 버튼 클릭 시
  const openCreateModal = () => {
    setNewJob({
      title: "",
      content: "",
      startAt: "",
      endAt: "",
      location: "",
      careerLevel: "",
      education: "",
      position: "",
      type: "",
      salary: "",
      photo: "",
      company: undefined,
    });
    setPreview(null);
    setCompanyPage(0); // 페이지 초기화
    fetchCompanies(0); // 첫 페이지 불러오기
    setIsCreateModalOpen(true);
  };

  /** 
   * ✅ 신규 등록 
   * MODIFIED: fetchJobs가 위로 이동했으므로 여기서 안전하게 호출 가능.
   * - 회사 미선택 체크 추가
   * - preview가 있을 때 FormData로 이미지 업로드
   */
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // MODIFIED: 회사 선택 유효성 체크 추가 (서버가 필요로 한다면 필수)
    if (!newJob.company || !newJob.company.id) {
      alert("회사를 선택해주세요.");
      return;
    }
    console.log("📤 [신규 공고 등록 요청 시작]");
    console.log("📦 요청 데이터:", newJob);
    try {
      const res = await api.post("/api/admin/job-management", newJob);

      console.log("📥 [서버 응답 도착]");
      console.log("응답 전체:", res);

      if (res.data.success) {
        const createdJob = res.data.data;

        // 이미지 업로드
        if (preview) {
          try {
            const formData = new FormData();
            const blob = await fetch(preview).then((r) => r.blob());
            formData.append("file", new File([blob], "job-photo.png", { type: "image/png" }));
            formData.append("jobPostId", createdJob.id.toString());
            // MODIFIED: 헤더는 axios/FormData 자동설정에 맡김 (Content-Type multipart 자동)
            await api.post("/api/admin/job-management/jobpost-image", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch (imgErr) {
            console.error("이미지 업로드 중 오류:", imgErr);
            // 이미지 업로드 실패해도 공고 자체는 성공했으므로 계속 진행
          }
        }

        alert("공고 등록 완료!");
        setIsCreateModalOpen(false);

        // ✅ 트랜잭션 커밋 대기 후 조회
        // MODIFIED: fetchJobs는 이미 선언되어 있음
        setTimeout(() => {
          fetchJobs(0);
        }, 500); // 0.5초 대기
      } else {
        alert("등록 실패: " + (res.data.message || "서버 오류"));
      }
    } catch (err) {
      console.error("등록 실패:", err);
      console.error("❌ 등록 중 오류 발생:", err);
      console.error("📄 에러 응답:", err.response?.data);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  /** ✅ 이미지 미리보기 */
  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ✅ 페이지 변경
  const handlePageChange = (page: number) => {
    fetchJobs(page);
  };

  const handleJobClick = (job: Job) => setSelectedJob(job);

  // ✅ 공고 수정 모달 열기
  const handleEditClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setEditFormData({ ...job });
    setIsEditModalOpen(true);
  };

  // ✅ 공고 수정 제출
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    try {
      const res = await api.put(`/api/admin/job-management/${editFormData.id}`, {
        title: editFormData.title,
        content: editFormData.content,
        location: editFormData.location,
        careerLevel: editFormData.careerLevel,
        education: editFormData.education,
        position: editFormData.position,
        type: editFormData.type,
        salary: editFormData.salary,
        startAt: editFormData.startAt,
        endAt: editFormData.endAt,
      });

      if (res.data.success) {
        alert("수정 완료!");
        setIsEditModalOpen(false);
        fetchJobs(currentPage);
      } else {
        alert("수정 실패: " + (res.data.message || "서버 오류"));
      }
    } catch (err) {
      console.error("수정 실패:", err);
      alert("수정에 실패했습니다.");
    }
  };

  // ✅ 파일 업로드 (S3)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedJob) return;

    const formData = new FormData();
    formData.append("jobPostId", selectedJob.id.toString()); // ✅ 변경
    formData.append("file", file);

    try {
      const res = await api.post("/api/admin/job-management/jobpost-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        alert("이미지 업로드 성공!");
        const newUrl = `${res.data.fileUrl}?t=${Date.now()}`;
        setSelectedJob({ ...selectedJob, photo: newUrl });
        setJobs(jobs.map((j) => (j.id === selectedJob.id ? { ...j, photo: newUrl } : j)));
      } else {
        alert("이미지 업로드 실패: " + (res.data.message || "서버 오류"));
      }
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  // ✅ 이미지 삭제 함수 추가
  const handleImageDelete = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    if (!job.photo) {
      alert("삭제할 이미지가 없습니다.");
      return;
    }

    if (!window.confirm("이미지를 삭제하시겠습니까?")) return;

    try {
      const res = await api.delete(`/api/admin/job-management/${job.id}/image`);
      if (res.data.success) {
        alert("이미지 삭제 완료!");
        // 목록 갱신
        setJobs(jobs.map((j) => (j.id === job.id ? { ...j, photo: undefined } : j)));
        // 상세 모달에서도 반영
        if (selectedJob?.id === job.id) {
          setSelectedJob({ ...selectedJob, photo: undefined });
        }
      } else {
        alert("이미지 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error("이미지 삭제 실패:", err);
      alert("이미지 삭제 중 오류가 발생했습니다.");
    }
  };

  // ✅ 공고 삭제
  const handleDelete = async (e: React.MouseEvent, jobId: number) => {
    e.stopPropagation();
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await api.delete(`/api/admin/job-management/${jobId}`);
      if (res.data.success) {
        alert("삭제 완료");
        // 현재 페이지에 데이터가 하나만 남았고, 첫 페이지가 아니면 이전 페이지로
        if (jobs.length === 1 && currentPage > 0) {
          fetchJobs(currentPage - 1);
        } else {
          fetchJobs(currentPage);
        }
        if (selectedJob?.id === jobId) {
          setSelectedJob(null);
        }
      } else {
        alert("삭제 실패: " + (res.data.message || "서버 오류"));
      }
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제에 실패했습니다.");
    }
  };

  // ✅ 페이지네이션 렌더링
  const renderPagination = () => {
    const { totalPages, currentPage } = pageInfo;
    if (totalPages <= 1) return null;

    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages + 2) {
      // 페이지가 적으면 모두 표시
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 많으면 생략(...) 사용
      if (currentPage <= 2) {
        // 앞부분
        for (let i = 0; i < maxVisiblePages; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        // 뒷부분
        pageNumbers.push(0);
        pageNumbers.push("...");
        for (let i = totalPages - maxVisiblePages; i < totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // 중간부분
        pageNumbers.push(0);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages - 1);
      }
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        {/* 이전 버튼 */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &lt;
        </button>

        {/* 페이지 번호 */}
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-4 py-2 rounded-lg border transition-colors ${currentPage === pageNum
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
            >
              {pageNum + 1}
            </button>
          );
        })}

        {/* 다음 버튼 */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &gt;
        </button>
      </div>
    );
  };

  // ✅ 첫 렌더링 시 데이터 가져오기
  useEffect(() => {
    fetchJobs(0);
  }, []);

  // -------------------
  // UI: 원본 구조/디자인 유지
  // -------------------
  return (
    <div className="p-8 h-full bg-gray-50">
      {/* 타이틀 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">공고 관리</h2>
        {/* ✅ 전체선택 + 선택삭제 영역 */}
        <div className="flex items-center justify-between mb-4 mt-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700">전체 선택</span>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-sm"
            >
              선택삭제 ({selectedIds.length})
            </button>
          )}
        </div>
        {/* ✅ 검색 폼 추가 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchJobs(0, searchKeyword);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="검색 (제목 / 회사 / 직무)"
            className="border rounded px-3 py-2 text-sm w-64"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
          >
            검색
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchKeyword("");
              fetchJobs(0);
            }}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200"
          >
            초기화
          </button>
        </form>
        <button
          onClick={openCreateModal}
          className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" /> 신규 공고
        </button>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">로딩 중...</span>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">오류 발생</p>
          <p className="text-sm">{error}</p>
          <button onClick={() => fetchJobs(currentPage)} className="mt-2 text-sm underline hover:no-underline">
            다시 시도
          </button>
        </div>
      )}

      {/* 데이터 없음 */}
      {!loading && !error && jobs.length === 0 && <div className="text-center py-12 text-gray-500">등록된 공고가 없습니다.</div>}

      {/* 공고 목록 */}
      {!loading && !error && jobs.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="relative bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleJobClick(job)}
              >
                {/* ✅ 개별 선택 체크박스 */}
                <div
                  className="absolute top-2 left-2 bg-white bg-opacity-80 backdrop-blur-sm rounded shadow-sm p-0.5 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(job.id)}
                    onChange={() => toggleSelect(job.id)}
                    className="w-4 h-4 accent-blue-600"
                  />
                </div>
                {/* 공고 사진 */}
                {job.photo ? (
                  <img src={job.photo} alt={job.title} className="w-full h-48 object-cover rounded-md mb-3" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                <h3 className="font-bold text-lg mb-2">{job.title}</h3>

                {job.company && <p className="text-blue-600 font-medium mb-2">{job.company.name}</p>}

                <p className="text-sm text-gray-600 mb-1">📍 {job.location}</p>
                <p className="text-sm text-gray-600 mb-1">💼 {job.position}</p>
                <p className="text-sm text-gray-600 mb-1">경력: {job.careerLevel}</p>
                <p className="text-sm text-gray-600 mb-1">고용: {job.type}</p>
                <p className="text-sm text-gray-600 mb-3">마감: {job.endAt}</p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={(e) => handleEditClick(e, job)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span className="text-sm">수정</span>
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, job.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span className="text-sm">삭제</span>
                  </button>
                  <button
                    onClick={(e) => handleImageDelete(e, job)}
                    disabled={!job.photo}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded ${job.photo ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    <PhotoIcon className="w-4 h-4" />
                    <span className="text-sm">이미지 삭제</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {renderPagination()}
        </>
      )}

      {/* 선택된 공고 상세 모달 */}
      {selectedJob && !isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{selectedJob.title}</h2>
              <button onClick={() => setSelectedJob(null)} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">
                ×
              </button>
            </div>

            {/* 공고 사진 */}
            {selectedJob.photo ? (
              <img src={selectedJob.photo} alt={selectedJob.title} className="w-full h-64 object-cover rounded-lg mb-4" />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <PhotoIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}

            {/* 이미지 업로드 */}
            <div className="mb-6">
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100">
                <PhotoIcon className="w-5 h-5" />
                <span>이미지 업로드</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-4">
              {selectedJob.company && (
                <div>
                  <p className="font-semibold text-gray-700">회사</p>
                  <p className="text-gray-600">{selectedJob.company.name}</p>
                </div>
              )}

              <div>
                <p className="font-semibold text-gray-700">공고 내용</p>
                <p className="text-gray-600 whitespace-pre-wrap">{selectedJob.content}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-700">위치</p>
                  <p className="text-gray-600">{selectedJob.location}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">경력</p>
                  <p className="text-gray-600">{selectedJob.careerLevel}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">학력</p>
                  <p className="text-gray-600">{selectedJob.education}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">직무</p>
                  <p className="text-gray-600">{selectedJob.position}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">고용형태</p>
                  <p className="text-gray-600">{selectedJob.type}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">급여</p>
                  <p className="text-gray-600">{selectedJob.salary}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-700">공고 기간</p>
                <p className="text-gray-600">
                  {selectedJob.startAt} ~ {selectedJob.endAt}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">공고 수정</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
                <textarea
                  value={editFormData.content}
                  onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">직무</label>
                  <input
                    type="text"
                    value={editFormData.position}
                    onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">경력</label>
                  <input
                    type="text"
                    value={editFormData.careerLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, careerLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">학력</label>
                  <input
                    type="text"
                    value={editFormData.education}
                    onChange={(e) => setEditFormData({ ...editFormData, education: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">고용형태</label>
                  <input
                    type="text"
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">급여</label>
                  <input
                    type="text"
                    value={editFormData.salary}
                    onChange={(e) => setEditFormData({ ...editFormData, salary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
                  <input
                    type="date"
                    value={editFormData.startAt}
                    onChange={(e) => setEditFormData({ ...editFormData, startAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">마감일 *</label>
                  <input
                    type="date"
                    value={editFormData.endAt}
                    onChange={(e) => setEditFormData({ ...editFormData, endAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  취소
                </button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  수정 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create Modal 렌더링은 원본과 동일하게 아래에서 트리거됨 */}
      {isCreateModalOpen && (
        // 렌더링 함수 대신 JSX 인라인으로 동일하게 유지 (원본 구조 보전)
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">신규 공고 등록</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* 상단 이미지 */}
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-64 object-cover rounded-lg mb-3" />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                  <PhotoIcon className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100">
                <PhotoIcon className="w-5 h-5" />
                <span>이미지 업로드</span>
                <input type="file" accept="image/*" onChange={handlePreviewChange} className="hidden" />
              </label>

              {/* 회사 선택 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium mb-3">회사 선택 *</label>

                <div className="space-y-2 mb-3">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      onClick={() => setNewJob({ ...newJob, company: { id: company.id, name: company.name } })}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${newJob.company?.id === company.id ? "bg-blue-100 border-blue-500" : "bg-white hover:bg-gray-100"
                        }`}
                    >
                      <p className="font-medium">{company.name}</p>
                    </div>
                  ))}
                </div>

                {companyTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" onClick={() => handleCompanyPageChange(companyPage - 1)} disabled={companyPage === 0} className="px-2 py-1 text-sm disabled:opacity-30 disabled:cursor-not-allowed">
                      &lt;
                    </button>

                    {Array.from({ length: Math.min(companyTotalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (companyTotalPages <= 5) {
                        pageNum = i;
                      } else if (companyPage < 3) {
                        pageNum = i;
                      } else if (companyPage > companyTotalPages - 3) {
                        pageNum = companyTotalPages - 5 + i;
                      } else {
                        pageNum = companyPage - 2 + i;
                      }
                      return (
                        <button key={pageNum} type="button" onClick={() => handleCompanyPageChange(pageNum)} className={`px-3 py-1 text-sm rounded ${companyPage === pageNum ? "bg-blue-600 text-white" : "bg-white border hover:bg-gray-100"}`}>
                          {pageNum + 1}
                        </button>
                      );
                    })}

                    <button type="button" onClick={() => handleCompanyPageChange(companyPage + 1)} disabled={companyPage >= companyTotalPages - 1} className="px-2 py-1 text-sm disabled:opacity-30 disabled:cursor-not-allowed">
                      &gt;
                    </button>
                  </div>
                )}

                {newJob.company && (
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-800">
                      선택된 회사: <strong>{newJob.company.name}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* 폼 입력 필드 */}
              {[
                { label: "공고 제목", key: "title" },
                { label: "선호 지역", key: "location" },
                { label: "경력", key: "careerLevel" },
                { label: "학력", key: "education" },
                { label: "직무", key: "position" },
                { label: "고용형태", key: "type" },
                { label: "급여", key: "salary" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium">{f.label}</label>
                  <input type="text" value={(newJob as any)[f.key]} onChange={(e) => setNewJob({ ...newJob, [f.key]: e.target.value })} className="w-full border rounded px-3 py-2" required />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">시작일</label>
                  <input type="date" value={newJob.startAt} onChange={(e) => setNewJob({ ...newJob, startAt: e.target.value })} className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">마감일</label>
                  <input type="date" value={newJob.endAt} onChange={(e) => setNewJob({ ...newJob, endAt: e.target.value })} className="w-full border rounded px-3 py-2" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">공고 내용</label>
                <textarea value={newJob.content} onChange={(e) => setNewJob({ ...newJob, content: e.target.value })} className="w-full border rounded px-3 py-2 h-32" required />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
                  취소
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagement;