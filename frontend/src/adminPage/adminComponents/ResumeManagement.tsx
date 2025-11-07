// src/admin/resume/ResumeManagement.tsx
import React, { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import api from "../../api/api";

/* =========================
 * Types from Admin API
 * ========================= */
type ResumeDtoFromApi = {
  id: number;
  title: string;
  idPhoto?: string | null;
  essayTitle?: string | null;   // sometimes used by user side
  essayTittle?: string | null;  // sometimes used by admin side
  essayContent?: string | null;
  htmlContent?: string | null;
  locked: boolean;

  // Admin page may provide these lists (optional)
  educationList?: Array<{
    name?: string;
    major?: string;
    status?: string;
    type?: string;
    startAt?: string | null;
    endAt?: string | null;
  }>;

  careerList?: Array<{
    companyName?: string;
    type?: string;
    position?: string;
    startAt?: string | null;
    endAt?: string | null;
    content?: string;
  }>;

  certificateList?: Array<any>;
  skillList?: Array<any>;
  languageList?: Array<any>; // sometimes present

  // sometimes languages: string[] (fallback key from server)
  languages?: Array<any>;

  users?: {
    userId?: number;
    nickname?: string;
    email?: string;
  };

  createAt: string;
  updateAt: string;
};

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

/* =========================
 * View Models for Admin UI
 * ========================= */
type Education = {
  school: string;
  period: string; // "YYYY-MM-DD ~ YYYY-MM-DD"
  status: string;
  major: string;
};

type Career = {
  company: string;
  period: string;
  role: string;
  job: string;
  desc: string;
};

interface Resume {
  id: number;
  title: string;
  idPhoto?: string | null;
  essayTittle?: string | null;
  essayContent?: string | null;
  htmlContent?: string | null;

  educations: Education[];
  careers: Career[];
  certifications: string[];
  skills: string[];
  languages: string[];

  locked: boolean;
  users: {
    id: number;
    nickname: string;
    email: string;
  };
  createAt: string;
  updateAt: string;
}

/* =========================
 * Utils
 * ========================= */
const unique = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

const toStringList = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    // allow ['Java', 'Spring'] or [{name:'Java'}]
    return raw
      .map((v) => {
        if (v == null) return null;
        if (typeof v === "string") return v;
        if (typeof v === "object" && "name" in v && v.name != null) {
          return String((v as any).name);
        }
        return String(v);
      })
      .filter((s): s is string => typeof s === "string" && s.trim() !== "");
  }
  return [];
};

function parseHtmlContentToExtra(htmlContent?: string | null) {
  if (!htmlContent) {
    return { educations: [] as Education[], careers: [] as Career[], certifications: [] as string[], skills: [] as string[], languages: [] as string[] };
  }
  try {
    const raw = JSON.parse(htmlContent) as any;

    const eduRaw: any[] = raw?.education ?? raw?.educations ?? [];
    const carRaw: any[] = raw?.career ?? raw?.careers ?? [];
    const certRaw: any[] = raw?.certificate ?? raw?.certificates ?? [];
    const skillRaw: any[] = raw?.skill ?? raw?.skills ?? [];
    const langRaw: any[] = raw?.language ?? raw?.languages ?? raw?.langs ?? [];

    const educations: Education[] = (eduRaw || []).map((e: any) => ({
      school: e?.name ?? "",
      period: [e?.startAt, e?.endAt].filter(Boolean).join(" ~ "),
      status: e?.status ?? "",
      major: e?.major ?? "",
    }));

    const careers: Career[] = (carRaw || []).map((c: any) => ({
      company: c?.companyName ?? "",
      period: [c?.startAt, c?.endAt].filter(Boolean).join(" ~ "),
      role: c?.position ?? "",
      job: c?.type ?? "",
      desc: c?.content ?? "",
    }));

    const certifications = toStringList(certRaw);
    const skills = toStringList(skillRaw);
    const languages = toStringList(langRaw);

    return { educations, careers, certifications, skills, languages };
  } catch {
    return { educations: [] as Education[], careers: [] as Career[], certifications: [] as string[], skills: [] as string[], languages: [] as string[] };
  }
}

/** 핵심: 서버 DTO + htmlContent → 화면 모델 병합(언어 포함) */
function normalizeResume(dto: ResumeDtoFromApi): Resume {
  // users
  const users = {
    id: dto.users?.userId ?? 0,
    nickname: dto.users?.nickname ?? "",
    email: dto.users?.email ?? "",
  };

  // from DTO lists first
  const mappedEducations: Education[] =
    dto.educationList?.map((e) => ({
      school: e?.name ?? "",
      period: [e?.startAt, e?.endAt].filter(Boolean).join(" ~ "),
      status: e?.status ?? "",
      major: e?.major ?? "",
    })) ?? [];

  const mappedCareers: Career[] =
    dto.careerList?.map((c) => ({
      company: c?.companyName ?? "",
      period: [c?.startAt, c?.endAt].filter(Boolean).join(" ~ "),
      role: c?.position ?? "",
      job: c?.type ?? "",
      desc: c?.content ?? "",
    })) ?? [];

  const mappedCertsFromDto = toStringList(dto.certificateList || []);
  const mappedSkillsFromDto = toStringList(dto.skillList || []);

  // support both languageList and languages keys
  const mappedLangsFromDto = unique([
    ...toStringList(dto.languageList || []),
    ...toStringList(dto.languages || []),
  ]);

  // also parse from htmlContent ALWAYS and merge
  const extrasFromHtml = parseHtmlContentToExtra(dto.htmlContent);

  const educations = mappedEducations.length > 0 ? mappedEducations : extrasFromHtml.educations;
  const careers = mappedCareers.length > 0 ? mappedCareers : extrasFromHtml.careers;
  const certifications = unique([...mappedCertsFromDto, ...extrasFromHtml.certifications]);
  const skills = unique([...mappedSkillsFromDto, ...extrasFromHtml.skills]);
  const languages = unique([...mappedLangsFromDto, ...extrasFromHtml.languages]); // ★ 핵심

  return {
    id: dto.id,
    title: dto.title,
    idPhoto: dto.idPhoto ?? null,
    essayTittle: dto.essayTittle ?? dto.essayTitle ?? null, // both supported
    essayContent: dto.essayContent ?? null,
    htmlContent: dto.htmlContent ?? null,
    educations,
    careers,
    certifications,
    skills,
    languages,
    locked: dto.locked,
    users,
    createAt: dto.createAt,
    updateAt: dto.updateAt,
  };
}

/* =========================
 * Modal
 * ========================= */
interface ResumeDetailModalProps {
  resume: Resume | null;
  isOpen: boolean;
  onClose: () => void;
}

const ResumeDetailModal: React.FC<ResumeDetailModalProps> = ({ resume, isOpen, onClose }) => {
  if (!isOpen || !resume) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">이력서 상세</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이력서 제목</label>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">{resume.title}</p>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>작성자: {resume.users.nickname}</span>
            <span>이메일: {resume.users.email}</span>
            <span
              className={`px-2 py-1 rounded text-xs ${
                resume.locked
                  ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                  : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
              }`}
            >
              {resume.locked ? "지원됨" : "지원안됨"}
            </span>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>작성일: {new Date(resume.createAt).toLocaleDateString("ko-KR")}</p>
            <p>수정일: {new Date(resume.updateAt).toLocaleDateString("ko-KR")}</p>
          </div>

          {resume.idPhoto && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">프로필 사진</label>
              <img
                src={resume.idPhoto}
                alt="프로필 사진"
                className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
            </div>
          )}

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* 학력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              학력 ({(resume.educations || []).length})
            </label>
            {(resume.educations || []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">학력 정보가 없습니다.</p>
            ) : (
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {(resume.educations || []).map((edu, i) => (
                  <li key={i}>
                    {edu.school} · {edu.period} · {edu.status} · {edu.major}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 경력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              경력 ({(resume.careers || []).length})
            </label>
            {(resume.careers || []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">경력 정보가 없습니다.</p>
            ) : (
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {(resume.careers || []).map((career, i) => (
                  <li key={i}>
                    {career.company} · {career.period} · {career.role} · {career.job} · {career.desc}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 자격증 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              자격증 ({(resume.certifications || []).length})
            </label>
            {(resume.certifications || []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">자격증 정보가 없습니다.</p>
            ) : (
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {(resume.certifications || []).map((cert, i) => (
                  <li key={i}>{cert}</li>
                ))}
              </ul>
            )}
          </div>

          {/* 스킬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              스킬 ({(resume.skills || []).length})
            </label>
            {(resume.skills || []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">스킬 정보가 없습니다.</p>
            ) : (
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {(resume.skills || []).map((skill, i) => (
                  <li key={i}>{skill}</li>
                ))}
              </ul>
            )}
          </div>

          {/* 언어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              언어 ({(resume.languages || []).length})
            </label>
            {(resume.languages || []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">언어 정보가 없습니다.</p>
            ) : (
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {(resume.languages || []).map((lang, i) => (
                  <li key={i}>{lang}</li>
                ))}
              </ul>
            )}
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              자기소개서 제목
            </label>
            <p className="text-base font-medium text-gray-800 dark:text-white">
              {resume.essayTittle || "제목 없음"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              자기소개서 내용
            </label>
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {resume.essayContent || "내용 없음"}
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================
 * Page Component
 * ========================= */
const ResumeManagement: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchResumes = async (page: number = 0) => {
    try {
      setIsLoading(true);
      const params = { page, size: 10, sort: "createAt,desc" };
      const response = await api.get<PageResponse<ResumeDtoFromApi>>("/api/admin/resume-management", { params });

      const mapped = (response.data.content || []).map(normalizeResume);
      setResumes(mapped);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setCurrentPage(response.data.number);
    } catch (err: any) {
      alert(err?.response?.data?.message || "이력서 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchResumes(page);
  };

  const handleResumeClick = async (resumeId: number) => {
    try {
      const response = await api.get<{ success: boolean; data: ResumeDtoFromApi }>(
        `/api/admin/resume-management/${resumeId}`
      );
      if (response.data.success) {
        const mapped = normalizeResume(response.data.data);
        setSelectedResume(mapped);
        setIsModalOpen(true);
      } else {
        throw new Error("이력서 상세 정보를 불러오는데 실패했습니다.");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "이력서 상세 정보를 불러오는데 실패했습니다.");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">이력서 관리</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">전체 {totalElements}개</p>
        </div>
      </div>

      {isLoading && resumes.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">이력서를 불러오는 중...</div>
      )}

      {!isLoading && resumes.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">등록된 이력서가 없습니다.</div>
      )}

      {resumes.length > 0 && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                onClick={() => handleResumeClick(resume.id)}
                className="flex justify-between items-center border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      {resume.title}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        resume.locked
                          ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                          : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                      }`}
                    >
                      {resume.locked ? "지원됨" : "지원안됨"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">작성자: {resume.users.nickname}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    작성일: {new Date(resume.createAt).toLocaleDateString("ko-KR")} · 수정일:{" "}
                    {new Date(resume.updateAt).toLocaleDateString("ko-KR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) pageNum = i;
            else if (currentPage < 3) pageNum = i;
            else if (currentPage > totalPages - 3) pageNum = totalPages - 5 + i;
            else pageNum = currentPage - 2 + i;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === pageNum
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}

      {isModalOpen && (
        <ResumeDetailModal
          resume={selectedResume}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedResume(null);
          }}
        />
      )}
    </div>
  );
};

export default ResumeManagement;
