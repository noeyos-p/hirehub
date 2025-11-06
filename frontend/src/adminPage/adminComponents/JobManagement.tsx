import React, { useState, useEffect } from "react";
import {
  TrashIcon,
  PhotoIcon,
  PencilIcon,
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import api from "../../api/api";
import axios from "axios";

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

// ✅ 신규 등록용: id 제외
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

  // ✅ 이미지 파일 상태
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // ✅ 회사 목록 관련
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyPage, setCompanyPage] = useState(0);
  const [companyTotalPages, setCompanyTotalPages] = useState(0);
  const companiesPerPage = 5;

  // ✅ 신규 등록용 기본값
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

  const pageSize = 6;

  // ✅ 이미지 선택 시 미리보기 + 파일 저장
  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ✅ 공고 등록 (파일 업로드 포함)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/admin/job-management", newJob);

      if (res.data.success) {
        const createdJob = res.data.data;

        // ✅ 파일이 있다면 업로드 (api.post 사용)
        if (uploadFile) {
          const formData = new FormData();
          formData.append("file", uploadFile);
          formData.append("jobPostId", String(createdJob.id));

          await api.post(`/api/admin/job-management/jobpost-image`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            withCredentials: true,
          });
        }

        alert("공고 등록 완료!");
        setIsCreateModalOpen(false);
        setUploadFile(null);
        setPreview(null);
        setTimeout(() => fetchJobs(0), 500);
      } else {
        alert("등록 실패: " + (res.data.message || "서버 오류"));
      }
    } catch (err) {
      console.error("등록 실패:", err);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  // ✅ 회사 목록 가져오기
  const fetchCompanies = async (page: number) => {
    try {
      const res = await api.get(
        `/api/admin/company-management?page=${page}&size=${companiesPerPage}`
      );
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

  // ✅ 신규 등록 모달 열기
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
    setUploadFile(null);
    setPreview(null);
    setCompanyPage(0);
    fetchCompanies(0);
    setIsCreateModalOpen(true);
  };

  // ✅ 공고 목록 불러오기
  const fetchJobs = async (page: number = 0) => {
    try {
      const res = await api.get("/api/admin/job-management", {
        params: { page, size: pageSize, sortBy: "id", direction: "DESC" },
      });

      if (res.data.success) {
        setJobs(res.data.data || []);
        setPageInfo({
          totalElements: res.data.totalElements,
          totalPages: res.data.totalPages,
          currentPage: res.data.currentPage,
        });
        setCurrentPage(page);
      } else {
        setError("데이터를 불러올 수 없습니다.");
      }
    } catch (err: any) {
      console.error("공고 목록 불러오기 오류:", err);
      setError("서버 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    fetchJobs(0);
  }, []);

  // ✅ 렌더링
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

      {loading && (
        <div className="text-center text-gray-500 py-10">로딩 중...</div>
      )}

      {error && (
        <div className="text-center text-red-500 py-10">{error}</div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="text-center text-gray-400 py-10">등록된 공고가 없습니다.</div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              {job.photo ? (
                <img
                  src={job.photo}
                  alt={job.title}
                  className="w-full h-40 object-cover rounded-md mb-3"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                  <PhotoIcon className="w-10 h-10 text-gray-400" />
                </div>
              )}
              <h3 className="font-bold text-lg">{job.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{job.company?.name}</p>
              <p className="text-gray-500 text-sm">{job.location}</p>
              <p className="text-gray-500 text-sm">{job.position}</p>
              <p className="text-gray-500 text-sm">마감: {job.endAt}</p>
            </div>
          ))}
        </div>
      )}

      {/* ✅ 신규 등록 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">신규 공고 등록</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-64 object-cover rounded-lg mb-3"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                  <PhotoIcon className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100">
                <PhotoIcon className="w-5 h-5" />
                <span>이미지 업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePreviewChange}
                  className="hidden"
                />
              </label>

              <div>
                <label className="block text-sm font-medium">공고 제목</label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) =>
                    setNewJob({ ...newJob, title: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">공고 내용</label>
                <textarea
                  value={newJob.content}
                  onChange={(e) =>
                    setNewJob({ ...newJob, content: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
