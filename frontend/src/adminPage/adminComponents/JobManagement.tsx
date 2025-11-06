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

// ✅ 여기부터 함수 안에 useState 다 넣는다!!
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

  // ✅ 이미지 파일 상태 추가
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // ✅ 회사 목록 관련
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyPage, setCompanyPage] = useState(0);
  const [companyTotalPages, setCompanyTotalPages] = useState(0);
  const companiesPerPage = 5;

  // ✅ 신규 등록용
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

    setUploadFile(file); // ✅ 파일 상태 저장
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ✅ 공고 등록 (파일 업로드 포함)
  // 오류제어
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/admin/job-management", newJob);

      if (res.data.success) {
        const createdJob = res.data.data;

        // ✅ 파일이 있다면 업로드
        if (uploadFile) {
          const formData = new FormData();
          formData.append("file", uploadFile);
          formData.append("jobPostId", String(createdJob.id));

          await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/admin/job-management/jobpost-image`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              withCredentials: true,
            }
          );
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
        setJobs(res.data.data);
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

  // ... 이하 동일 (렌더링 부분, 모달, 수정, 삭제, 페이지네이션 등 그대로 유지)
  // ✅ 나머지 코드는 수정 불필요
  // ✅ uploadFile 관련 부분만 위에서 처리됨

  return (
    <div className="p-8 h-full bg-gray-50">
      {/* 나머지 UI 부분 그대로 유지 */}
      {/* 신규 등록 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* 이미지 업로드 */}
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

              {/* 나머지 폼 입력들 그대로 유지 */}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagement;
