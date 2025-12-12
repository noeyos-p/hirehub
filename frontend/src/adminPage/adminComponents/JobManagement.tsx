import React, { useState, useEffect } from "react";
import { TrashIcon, PhotoIcon, PencilIcon, XMarkIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { adminApi } from "../../api/adminApi";
import type { AdminJob, AdminCompany, AdminPageInfo } from "../../types/interface";

// 신규 등록용: id 제외
type NewJob = Omit<AdminJob, "id">;

const JobManagement: React.FC = () => {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
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

  const [pageInfo, setPageInfo] = useState<AdminPageInfo>({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<AdminJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ 회사 페이지네이션 관련 state 추가
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [companyPage, setCompanyPage] = useState(0);
  const [companyTotalPages, setCompanyTotalPages] = useState(0);
  const companiesPerPage = 5;
  const [companySearchKeyword, setCompanySearchKeyword] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const [newJob, setNewJob] = useState<NewJob>({
    title: "",
    content: "",
    endAt: "",
    location: "",
    careerLevel: "",
    education: "",
    position: "",
    type: "",
    photo: "",
    company: undefined,
    mainJob: "",
    qualification: "",
    preference: "",
    hireType: "",
    techStackList: [],
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  const pageSize = 6; // 페이지당 6개

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
      const res = await adminApi.getJobs({
        page,
        size: pageSize,
        sortBy: "id",
        direction: "DESC",
        keyword,
      });

      console.log("API 응답 성공:", res);

      if (res.success) {
        console.log("공고 데이터:", res.data);
        setJobs(res.data);
        setPageInfo({
          totalElements: res.totalElements,
          totalPages: res.totalPages,
          currentPage: res.currentPage,
        });
        setCurrentPage(page);
      } else {
        console.error("데이터 불러오기 실패:", res.message);
        setError(res.message || "데이터를 불러올 수 없습니다.");
      }
    } catch (err: any) {
      console.error("=== API 요청 오류 ===");
      console.error("전체 에러:", err);
      // ... error handling logic ...
      setError(err.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 회사 목록 불러오기 (페이지네이션 + 검색)
  const fetchCompanies = async (page: number, keyword: string = "") => {
    try {
      const res = await adminApi.getCompanies({
        page,
        size: companiesPerPage,
      });
      if (res.success) {
        setCompanies(res.data || []);
        setCompanyTotalPages(res.totalPages || 0);
      } else {
        console.warn("회사 목록 응답 실패:", res);
      }
    } catch (err) {
      console.error("회사 목록 불러오기 실패:", err);
    }
  };

  // ✅ 회사 검색
  const handleCompanySearch = (keyword: string) => {
    setCompanyPage(0);
    fetchCompanies(0, keyword);
    setShowCompanyDropdown(true);
  };

  // ✅ 회사 선택
  const handleSelectCompany = (comp: AdminCompany) => {
    setNewJob({ ...newJob, company: { id: comp.id, name: comp.name } });
    setShowCompanyDropdown(false);
    setCompanySearchKeyword("");
  };

  // ✅ 회사 페이지 변경
  const handleCompanyPageChange = (page: number) => {
    const safePage = Math.max(0, page);
    setCompanyPage(safePage);
    fetchCompanies(safePage, companySearchKeyword);
  };

  // ✅ 신규 등록 버튼 클릭 시
  const openCreateModal = () => {
    setNewJob({
      title: "",
      content: "",
      endAt: "",
      location: "",
      careerLevel: "",
      education: "",
      position: "",
      type: "",
      photo: "",
      company: undefined,
      mainJob: "",
      qualification: "",
      preference: "",
      hireType: "",
      techStackList: [],
    });
    setPreview(null);
    setCompanyPage(0); // 페이지 초기화
    fetchCompanies(0); // 첫 페이지 불러오기
    setIsCreateModalOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length}개의 공고를 삭제하시겠습니까?`)) return;

    try {
      for (const id of selectedIds) {
        await adminApi.deleteJob(id);
      }
      alert("선택된 공고가 삭제되었습니다.");
      setSelectedIds([]);
      fetchJobs(currentPage);
    } catch (err) {
      console.error("선택삭제 오류:", err);
      alert("선택삭제 중 오류가 발생했습니다.");
    }
  };

  /** 
   * ✅ 신규 등록 
   */
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newJob.company || !newJob.company.id) {
      alert("회사를 선택해주세요.");
      return;
    }
    console.log("📤 [신규 공고 등록 요청 시작]");
    console.log("📦 요청 데이터:", newJob);
    try {
      const res = await adminApi.createJob(newJob);

      console.log("📥 [서버 응답 도착]");
      console.log("응답 전체:", res);

      if (res.success) {
        const createdJob = res.data;

        // 이미지 업로드
        if (preview) {
          try {
            const formData = new FormData();
            const blob = await fetch(preview).then((r) => r.blob());
            formData.append("file", new File([blob], "job-photo.png", { type: "image/png" }));
            formData.append("jobPostId", createdJob.id.toString());
            await adminApi.uploadJobImage(formData);
          } catch (imgErr) {
            console.error("이미지 업로드 중 오류:", imgErr);
          }
        }

        alert("공고 등록 완료!");
        setIsCreateModalOpen(false);

        setTimeout(() => {
          fetchJobs(0);
        }, 500);
      } else {
        alert("등록 실패: " + (res.message || "서버 오류"));
      }
    } catch (err: any) {
      console.error("등록 실패:", err);
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

  const handleJobClick = (job: AdminJob) => setSelectedJob(job);

  // ✅ 공고 수정 모달 열기
  const handleEditClick = (e: React.MouseEvent, job: AdminJob) => {
    e.stopPropagation();

    const loc = job.location || "";

    // 1) 우편번호 추출: (06232) 이런 형태
    const postalRegex = /^\((\d{5})\)\s*(.*)$/;
    const postalMatch = loc.match(postalRegex);

    let base = "";
    let detail = "";

    if (postalMatch) {
      const addrWithoutPostal = postalMatch[2];

      // 2) 상세주소 분리 (마지막 공백 기준)
      const splitIndex = addrWithoutPostal.lastIndexOf(" ");
      if (splitIndex > -1) {
        base = addrWithoutPostal.substring(0, splitIndex);
        detail = addrWithoutPostal.substring(splitIndex + 1);
      } else {
        base = addrWithoutPostal;
      }

      // input에 값 넣기
      setTimeout(() => {
        const baseInput = document.getElementById("editBaseAddress") as HTMLInputElement;
        const detailInput = document.getElementById("editDetailAddress") as HTMLInputElement;

        if (baseInput) baseInput.value = `(${postalMatch[1]}) ${base}`;
        if (detailInput) detailInput.value = detail;
      }, 0);
    }

    setEditFormData({
      ...job,
      location: loc,
    });

    setIsEditModalOpen(true);
  };


  // ✅ 공고 수정 제출
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    try {
      const res = await adminApi.updateJob(editFormData.id, {
        title: editFormData.title,
        content: editFormData.content,
        location: editFormData.location,
        careerLevel: editFormData.careerLevel,
        education: editFormData.education,
        position: editFormData.position,
        type: editFormData.type,
        endAt: editFormData.endAt,
        mainJob: editFormData.mainJob,
        qualification: editFormData.qualification,
        preference: editFormData.preference,
        hireType: editFormData.hireType,
        techStackList: editFormData.techStackList || [],
      });

      if (res.success) {
        alert("수정 완료!");
        setIsEditModalOpen(false);
        fetchJobs(currentPage);
      } else {
        alert("수정 실패: " + (res.message || "서버 오류"));
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
    formData.append("jobPostId", selectedJob.id.toString());
    formData.append("file", file);

    try {
      const res = await adminApi.uploadJobImage(formData);
      if (res.success) {
        alert("이미지 업로드 성공!");
        const newUrl = `${res.fileUrl}?t=${Date.now()}`;
        setSelectedJob({ ...selectedJob, photo: newUrl });
        setJobs(jobs.map((j) => (j.id === selectedJob.id ? { ...j, photo: newUrl } : j)));
      } else {
        alert("이미지 업로드 실패: " + (res.message || "서버 오류"));
      }
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  // ✅ 이미지 삭제 함수 추가
  const handleImageDelete = async (e: React.MouseEvent, job: AdminJob) => {
    e.stopPropagation();
    if (!job.photo) {
      alert("삭제할 이미지가 없습니다.");
      return;
    }

    if (!window.confirm("이미지를 삭제하시겠습니까?")) return;

    try {
      const res = await adminApi.deleteJobImage(job.id);
      if (res.success) {
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
      const res = await adminApi.deleteJob(jobId);
      if (res.success) {
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
        alert("삭제 실패: " + (res.message || "서버 오류"));
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

    return (
      <div className="mt-8 flex items-center justify-center gap-2 mb-[12px]">
        <button
          onClick={() => handlePageChange(0)}
          disabled={currentPage === 0}
          className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronDoubleLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        {(() => {
          const pages = [];
          const maxVisible = 5;
          let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
          let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
          if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(0, endPage - maxVisible + 1);
          }
          for (let i = startPage; i <= endPage; i++) {
            pages.push(
              <button
                key={i}
                onClick={() => handlePageChange(i)}
                className={`w-10 h-10 flex items-center justify-center rounded-md text-base transition border font-medium ${currentPage === i
                  ? 'bg-white text-[#006AFF] border-[#006AFF]'
                  : 'bg-white text-gray-700 border-gray-300 hover:text-[#006AFF]'
                  }`}
              >
                {i + 1}
              </button>
            );
          }
          return pages;
        })()}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => handlePageChange(totalPages - 1)}
          disabled={currentPage === totalPages - 1}
          className="p-2.5 rounded-md bg-white border border-gray-300 hover:text-[#006AFF] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronDoubleRightIcon className="w-5 h-5" />
        </button>
      </div>
    );
  };

  // ✅ Daum Postcode API 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // ✅ 첫 렌더링 시 데이터 가져오기
  useEffect(() => {
    fetchJobs(0);
  }, []);

  // -------------------
  // UI: 원본 구조/디자인 유지
  // -------------------
  return (
    <div className="p-4 md:p-8 h-full bg-gray-50">
      {/* 타이틀 */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">공고 관리</h2>
          {/* ✅ 신규 공고 등록 버튼 */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            <span>신규 공고 등록</span>
          </button>
        </div>
        {/* ✅ 검색 폼 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchJobs(0, searchKeyword);
          }}
          className="flex flex-col md:flex-row w-full md:w-auto gap-2"
        >
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="검색 (제목 / 회사 / 직무)"
            className="border rounded px-3 py-2 text-sm w-full md:w-64"
          />
          <div className="flex w-full md:w-auto gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex-1 md:flex-none whitespace-nowrap"
            >
              검색
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchKeyword("");
                fetchJobs(0);
              }}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 flex-1 md:flex-none whitespace-nowrap"
            >
              초기화
            </button>
          </div>
        </form>
      </div>

      {/* ✅ 전체선택 + 선택삭제 영역 */}
      <div className="flex items-center gap-3 mb-4 min-h-[36px]">
        <label className="relative flex items-center gap-2 cursor-pointer group flex-shrink-0">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="sr-only peer"
          />
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${allSelected
            ? 'bg-blue-600 border-blue-600'
            : 'bg-white border-gray-300 group-hover:border-blue-400'
            }`}>
            {allSelected && (
              <svg className="w-3.5 h-3.5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 flex-shrink-0">전체 선택</span>
        </label>

        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex-shrink-0"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            선택삭제 ({selectedIds.length})
          </button>
        )}
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
                className={`relative bg-white p-4 rounded-lg shadow hover:shadow-lg transition-all cursor-pointer ${selectedIds.includes(job.id) ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                onClick={() => handleJobClick(job)}
              >
                {/* ✅ 개별 선택 체크박스 */}
                <div
                  className="absolute top-3 right-3 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <label className="relative flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(job.id)}
                      onChange={() => toggleSelect(job.id)}
                      className="sr-only peer"
                    />
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.includes(job.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300 hover:border-blue-400'
                      }`}>
                      {selectedIds.includes(job.id) && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </label>
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
              </div>

              <div>
                <p className="font-semibold text-gray-700">마감일</p>
                <p className="text-gray-600">
                  {selectedJob.endAt}
                </p>
              </div>

              {selectedJob.mainJob && (
                <div>
                  <p className="font-semibold text-gray-700">주요업무</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedJob.mainJob}</p>
                </div>
              )}

              {selectedJob.qualification && (
                <div>
                  <p className="font-semibold text-gray-700">자격요건</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedJob.qualification}</p>
                </div>
              )}

              {selectedJob.preference && (
                <div>
                  <p className="font-semibold text-gray-700">우대사항</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedJob.preference}</p>
                </div>
              )}

              {selectedJob.hireType && (
                <div>
                  <p className="font-semibold text-gray-700">채용전형</p>
                  <p className="text-gray-600">{selectedJob.hireType}</p>
                </div>
              )}

              {selectedJob.techStackList && selectedJob.techStackList.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-2">기술스택</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.techStackList.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">위치 (우편번호 포함)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="editBaseAddress"
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="우편번호 검색 버튼을 클릭하세요"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      new (window as any).daum.Postcode({
                        oncomplete: function (data: any) {
                          const baseAddress = `(${data.zonecode}) ${data.address}${data.buildingName ? ' ' + data.buildingName : ''}`;
                          const baseInput = document.getElementById('editBaseAddress') as HTMLInputElement;
                          const detailInput = document.getElementById('editDetailAddress') as HTMLInputElement;
                          baseInput.value = baseAddress;
                          // 상세주소가 있으면 합치고, 없으면 기본주소만
                          const fullAddress = detailInput.value ? `${baseAddress} ${detailInput.value}` : baseAddress;
                          setEditFormData({ ...editFormData, location: fullAddress });
                        }
                      }).open();
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 whitespace-nowrap"
                  >
                    우편번호 검색
                  </button>
                </div>
                <input
                  type="text"
                  id="editDetailAddress"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="상세주소를 입력하세요 (예: 101호, 3층)"
                  onChange={(e) => {
                    const baseInput = document.getElementById('editBaseAddress') as HTMLInputElement;
                    const baseAddress = baseInput.value;
                    const detailAddress = e.target.value;
                    const fullAddress = detailAddress ? `${baseAddress} ${detailAddress}` : baseAddress;
                    setEditFormData({ ...editFormData, location: fullAddress });
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">경력</label>
                  <select
                    value={editFormData.careerLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, careerLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="신입">신입</option>
                    <option value="경력무관">경력무관</option>
                    <option value="1년 미만">1년 미만</option>
                    <option value="1-3년">1-3년</option>
                    <option value="3-5년">3-5년</option>
                    <option value="5-10년">5-10년</option>
                    <option value="10년 이상">10년 이상</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">학력</label>
                  <select
                    value={editFormData.education}
                    onChange={(e) => setEditFormData({ ...editFormData, education: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="무관">무관</option>
                    <option value="고졸">고졸</option>
                    <option value="초대졸">초대졸</option>
                    <option value="대졸">대졸</option>
                    <option value="석사">석사</option>
                    <option value="박사">박사</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">직무</label>
                  <select
                    value={editFormData.position}
                    onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="프론트엔드">프론트엔드</option>
                    <option value="백엔드">백엔드</option>
                    <option value="풀스택">풀스택</option>
                    <option value="DevOps">DevOps</option>
                    <option value="데이터 엔지니어">데이터 엔지니어</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                  <input
                    type="date"
                    value={editFormData.endAt}
                    onChange={(e) => setEditFormData({ ...editFormData, endAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 추가 필드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주요업무</label>
                <textarea
                  value={editFormData.mainJob || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, mainJob: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="주요 업무를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">자격요건</label>
                <textarea
                  value={editFormData.qualification || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="자격요건을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">우대사항</label>
                <textarea
                  value={editFormData.preference || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, preference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="우대사항을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">채용전형</label>
                <input
                  type="text"
                  value={editFormData.hireType || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, hireType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 서류전형 → 1차 면접 → 2차 면접 → 최종합격"
                />
              </div>

              {/* 기술스택 관리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기술스택</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="editTechStackInput"
                    placeholder="기술스택을 입력하고 추가 버튼을 누르세요"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !editFormData.techStackList?.includes(value)) {
                          setEditFormData({
                            ...editFormData,
                            techStackList: [...(editFormData.techStackList || []), value]
                          });
                          input.value = "";
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("editTechStackInput") as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !editFormData.techStackList?.includes(value)) {
                        setEditFormData({
                          ...editFormData,
                          techStackList: [...(editFormData.techStackList || []), value]
                        });
                        input.value = "";
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editFormData.techStackList?.map((tech, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => {
                          setEditFormData({
                            ...editFormData,
                            techStackList: editFormData.techStackList?.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  수정 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 신규 등록 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">신규 공고 등록</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* 이미지 미리보기 및 업로드 */}
              <div className="mb-4">
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
              </div>

              {/* 회사 선택 (페이지네이션) */}
              <div className="border p-4 rounded-lg bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">회사 선택 *</label>
                {newJob.company ? (
                  <div className="flex justify-between items-center bg-white p-3 border rounded mb-2">
                    <span className="font-semibold text-blue-600">{newJob.company.name}</span>
                    <button
                      type="button"
                      onClick={() => setNewJob({ ...newJob, company: undefined })}
                      className="text-xs text-red-500 hover:underline"
                    >
                      선택 취소
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mb-2">회사를 선택해주세요.</div>
                )}

                {/* 회사 검색 - Autocomplete */}
                <div className="relative">
                  <input
                    type="text"
                    value={companySearchKeyword}
                    onChange={(e) => {
                      setCompanySearchKeyword(e.target.value);
                      if (e.target.value.length >= 2) {
                        handleCompanySearch(e.target.value);
                      } else {
                        setShowCompanyDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      if (companies.length > 0) setShowCompanyDropdown(true);
                    }}
                    placeholder="회사명 또는 업종으로 검색 (2글자 이상)"
                    className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* 드롭다운 목록 */}
                  {showCompanyDropdown && companies.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                      {companies.map((comp) => (
                        <div
                          key={comp.id}
                          onClick={() => handleSelectCompany(comp)}
                          className="p-3 cursor-pointer hover:bg-blue-50 border-b last:border-b-0"
                        >
                          <div className="font-medium text-sm">{comp.name}</div>
                          <div className="text-xs text-gray-500">{comp.industry} | {comp.ceo}</div>
                        </div>
                      ))}

                      {/* 페이지네이션 */}
                      {companyTotalPages > 1 && (
                        <div className="flex justify-center gap-2 p-2 bg-gray-50 border-t">
                          <button
                            type="button"
                            onClick={() => handleCompanyPageChange(companyPage - 1)}
                            disabled={companyPage === 0}
                            className="px-2 py-1 text-xs border rounded disabled:opacity-50 bg-white"
                          >
                            이전
                          </button>
                          <span className="text-xs flex items-center">
                            {companyPage + 1} / {companyTotalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCompanyPageChange(companyPage + 1)}
                            disabled={companyPage === companyTotalPages - 1}
                            className="px-2 py-1 text-xs border rounded disabled:opacity-50 bg-white"
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 검색 결과 없음 */}
                  {showCompanyDropdown && companies.length === 0 && companySearchKeyword.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg p-4 text-center text-sm text-gray-500">
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
                <textarea
                  value={newJob.content}
                  onChange={(e) => setNewJob({ ...newJob, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">위치 (우편번호 포함)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="baseAddress"
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="우편번호 검색 버튼을 클릭하세요"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      new (window as any).daum.Postcode({
                        oncomplete: function (data: any) {
                          const baseAddress = `(${data.zonecode}) ${data.address}${data.buildingName ? ' ' + data.buildingName : ''}`;
                          const baseInput = document.getElementById('baseAddress') as HTMLInputElement;
                          const detailInput = document.getElementById('detailAddress') as HTMLInputElement;
                          baseInput.value = baseAddress;
                          // 상세주소가 있으면 합치고, 없으면 기본주소만
                          const fullAddress = detailInput.value ? `${baseAddress} ${detailInput.value}` : baseAddress;
                          setNewJob({ ...newJob, location: fullAddress });
                        }
                      }).open();
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 whitespace-nowrap"
                  >
                    우편번호 검색
                  </button>
                </div>
                <input
                  type="text"
                  id="detailAddress"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="상세주소를 입력하세요 (예: 101호, 3층)"
                  onChange={(e) => {
                    const baseInput = document.getElementById('baseAddress') as HTMLInputElement;
                    const baseAddress = baseInput.value;
                    const detailAddress = e.target.value;
                    const fullAddress = detailAddress ? `${baseAddress} ${detailAddress}` : baseAddress;
                    setNewJob({ ...newJob, location: fullAddress });
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">경력</label>
                  <select
                    value={newJob.careerLevel}
                    onChange={(e) => setNewJob({ ...newJob, careerLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="신입">신입</option>
                    <option value="경력무관">경력무관</option>
                    <option value="1년 미만">1년 미만</option>
                    <option value="1-3년">1-3년</option>
                    <option value="3-5년">3-5년</option>
                    <option value="5-10년">5-10년</option>
                    <option value="10년 이상">10년 이상</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">학력</label>
                  <select
                    value={newJob.education}
                    onChange={(e) => setNewJob({ ...newJob, education: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="무관">무관</option>
                    <option value="고졸">고졸</option>
                    <option value="초대졸">초대졸</option>
                    <option value="대졸">대졸</option>
                    <option value="석사">석사</option>
                    <option value="박사">박사</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">직무</label>
                  <select
                    value={newJob.position}
                    onChange={(e) => setNewJob({ ...newJob, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="프론트엔드">프론트엔드</option>
                    <option value="백엔드">백엔드</option>
                    <option value="풀스택">풀스택</option>
                    <option value="DevOps">DevOps</option>
                    <option value="데이터 엔지니어">데이터 엔지니어</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">고용형태</label>
                  <input
                    type="text"
                    value={newJob.type}
                    onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                  <input
                    type="date"
                    value={newJob.endAt}
                    onChange={(e) => setNewJob({ ...newJob, endAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 추가 필드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주요업무</label>
                <textarea
                  value={newJob.mainJob}
                  onChange={(e) => setNewJob({ ...newJob, mainJob: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="주요 업무를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">자격요건</label>
                <textarea
                  value={newJob.qualification}
                  onChange={(e) => setNewJob({ ...newJob, qualification: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="자격요건을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">우대사항</label>
                <textarea
                  value={newJob.preference}
                  onChange={(e) => setNewJob({ ...newJob, preference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="우대사항을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">채용전형</label>
                <input
                  type="text"
                  value={newJob.hireType}
                  onChange={(e) => setNewJob({ ...newJob, hireType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 서류전형 → 1차 면접 → 2차 면접 → 최종합격"
                />
              </div>

              {/* 기술스택 관리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기술스택</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    id="techStackInput"
                    placeholder="기술스택을 입력하고 추가 버튼을 누르세요"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !newJob.techStackList?.includes(value)) {
                          setNewJob({ ...newJob, techStackList: [...(newJob.techStackList || []), value] });
                          input.value = "";
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("techStackInput") as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !newJob.techStackList?.includes(value)) {
                        setNewJob({ ...newJob, techStackList: [...(newJob.techStackList || []), value] });
                        input.value = "";
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newJob.techStackList?.map((tech, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => {
                          setNewJob({
                            ...newJob,
                            techStackList: newJob.techStackList?.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
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