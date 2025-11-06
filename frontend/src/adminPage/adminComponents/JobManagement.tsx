import React, { useState, useEffect } from "react";
import {
  TrashIcon,
  PhotoIcon,
  PencilIcon,
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import api from "../../api/api";

interface Job {
  id: number;
  title: string;
  content: string;
  startAt: string;
  endAt: string;
  location: string;
  careerLevel: string;
  education: string;
  position: string;
  type: string;
  salary: string;
  photo?: string;
  company?: {
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

  // 회사 관련
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
  const pageSize = 6;

  // ✅ 회사 목록
  const fetchCompanies = async (page: number) => {
    try {
      const res = await api.get(`/api/admin/company-management?page=${page}&size=${companiesPerPage}`);
      if (res.data.success) {
        setCompanies(res.data.data || []);
        setCompanyTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error("회사 목록 불러오기 실패:", err);
    }
  };

  const handleCompanyPageChange = (page: number) => {
    setCompanyPage(page);
    fetchCompanies(page);
  };

  // ✅ 신규 등록 버튼
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
    setCompanyPage(0);
    fetchCompanies(0);
    setIsCreateModalOpen(true);
  };

  /** ✅ 신규 등록 */
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 빈 문자열 → null, 날짜 형식 보정
      const payload = {
        title: newJob.title || null,
        content: newJob.content || null,
        startAt: newJob.startAt ? newJob.startAt : null,
        endAt: newJob.endAt ? newJob.endAt : null,
        location: newJob.location || null,
        careerLevel: newJob.careerLevel || null,
        education: newJob.education || null,
        position: newJob.position || null,
        type: newJob.type || null,
        salary: newJob.salary || null,
        photo: newJob.photo || null,
        companyId: newJob.company?.id || null,
      };

      console.log("✅ 전송 payload:", payload);

      const res = await api.post("/api/admin/job-management", payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        const createdJob = res.data.data;

        // ✅ 이미지 업로드
        if (preview) {
          const formData = new FormData();
          const blob = await fetch(preview).then((r) => r.blob());
          formData.append("file", new File([blob], "job-photo.png", { type: "image/png" }));
          formData.append("jobPostId", createdJob.id.toString());
          await api.post("/api/admin/job-management/jobpost-image", formData);
        }

        alert("공고 등록 완료!");
        setIsCreateModalOpen(false);
        setTimeout(() => fetchJobs(0), 500);
      } else {
        alert("등록 실패: " + (res.data.message || "서버 오류"));
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

  // ✅ 공고 목록 불러오기
  const fetchJobs = async (page: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/admin/job-management", {
        params: { page, size: pageSize, sortBy: "id", direction: "DESC" },
      });
      if (res.data.success) {
        setJobs(res.data.data);
        setPageInfo({
          totalElements: res.data.totalElements,
          totalPages: res.data.totalPages,
          currentPage: res.data.currentPage,
        });
        setCurrentPage(page);
      } else {
        setError(res.data.message || "데이터를 불러올 수 없습니다.");
      }
    } catch (err: any) {
      console.error("API 오류:", err);
      setError("서버 통신 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(0);
  }, []);

  // ✅ 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedJob) return;
    const formData = new FormData();
    formData.append("jobPostId", selectedJob.id.toString());
    formData.append("file", file);
    try {
      const res = await api.post("/api/admin/job-management/jobpost-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        alert("이미지 업로드 성공!");
        setSelectedJob({ ...selectedJob, photo: res.data.fileUrl });
        setJobs((prev) =>
          prev.map((j) => (j.id === selectedJob.id ? { ...j, photo: res.data.fileUrl } : j))
        );
      }
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  // ✅ 이미지 삭제
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
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, photo: undefined } : j)));
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
        fetchJobs(currentPage);
        if (selectedJob?.id === jobId) setSelectedJob(null);
      }
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제에 실패했습니다.");
    }
  };

  // ✅ 페이지 변경
  const handlePageChange = (page: number) => fetchJobs(page);

  return (
  <div className="p-8 h-full bg-gray-50">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-800">공고 관리</h2>
      <button
        onClick={openCreateModal}
        className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center gap-1"
      >
        <PlusIcon className="w-4 h-4" /> 신규 공고
      </button>
    </div>

    {/* 로딩 */}
    {loading && (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">로딩 중...</span>
      </div>
    )}

    {/* 에러 */}
    {error && (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
      </div>
    )}

    {/* 공고 없음 */}
    {!loading && !error && jobs.length === 0 && (
      <div className="text-center py-12 text-gray-500">등록된 공고가 없습니다.</div>
    )}

    {/* 공고 목록 */}
    {!loading && !error && jobs.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedJob(job)}
          >
            {job.photo ? (
              <img
                src={job.photo}
                alt={job.title}
                className="w-full h-48 object-cover rounded-md mb-3"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                <PhotoIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <h3 className="font-bold text-lg mb-2">{job.title}</h3>
            {job.company && (
              <p className="text-blue-600 font-medium mb-2">{job.company.name}</p>
            )}
            <p className="text-sm text-gray-600 mb-1">📍 {job.location}</p>
            <p className="text-sm text-gray-600 mb-1">💼 {job.position}</p>
            <p className="text-sm text-gray-600 mb-1">경력: {job.careerLevel}</p>
            <p className="text-sm text-gray-600 mb-1">고용: {job.type}</p>
            <p className="text-sm text-gray-600 mb-3">마감: {job.endAt}</p>

            <div className="flex gap-2 mt-4">
              <button
                onClick={(e) => handleImageDelete(e, job)}
                disabled={!job.photo}
                className={`flex-1 px-3 py-2 rounded text-sm ${
                  job.photo
                    ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                이미지 삭제
              </button>
              <button
                onClick={(e) => handleDelete(e, job.id)}
                className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* ✅ 여기 추가 */}
    {/* {isCreateModalOpen && renderCreateModal()} */}
  </div>
);
}

export default JobManagement;
