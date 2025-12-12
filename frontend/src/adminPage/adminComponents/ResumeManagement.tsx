// src/admin/resume/ResumeManagement.tsx
import React, { useEffect, useState } from "react";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { adminApi } from "../../api/adminApi";
import type { AdminResumeDto } from "../../types/interface";

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
function normalizeResume(dto: AdminResumeDto): Resume {
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
    updateAt: dto.updateAt || "",
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
              className={`px-2 py-1 rounded text-xs ${resume.locked
                ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                }`}
            >
              {resume.locked ? "지원됨" : "지원안됨"}
            </span>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>작성일: {new Date(resume.createAt).toLocaleDateString("ko-KR")}</p>
            <p>수정일: {resume.updateAt ? new Date(resume.updateAt).toLocaleDateString("ko-KR") : "없음"}</p>
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
      const res = await adminApi.getResumes({ page, size: 10, sort: "createAt,desc" });

      if (res.success) {
        // Backend returns 'content' for Page<Resume>, but frontend interface expects 'data'
        const list = res.data || (res as any).content || [];
        const mapped = list.map(normalizeResume);
        setResumes(mapped);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
        setCurrentPage(res.currentPage || page);
      } else {
        throw new Error(res.message || "이력서 목록을 불러오는데 실패했습니다.");
      }
    } catch (err: any) {
      alert(err.message || "이력서 목록을 불러오는데 실패했습니다.");
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
      const res = await adminApi.getResumeDetail(resumeId);
      if (res.success) {
        const mapped = normalizeResume(res.data);
        setSelectedResume(mapped);
        setIsModalOpen(true);
      } else {
        throw new Error(res.message || "이력서 상세 정보를 불러오는데 실패했습니다.");
      }
    } catch (err: any) {
      alert(err.message || "이력서 상세 정보를 불러오는데 실패했습니다.");
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">이력서 관리</h2>
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
                      className={`px-2 py-0.5 rounded text-xs ${resume.locked
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
                    {resume.updateAt ? new Date(resume.updateAt).toLocaleDateString("ko-KR") : "없음"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
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
