// src/myPage/myPageComponents/ResumeDetail.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api";
import axios from "axios";


/** ---------------- Types ---------------- */

type ResumeDto = {
  id: number;
  title: string;
  idPhoto?: string | null;
  essayTitle?: string | null;
  essayTittle?: string | null;
  essayContent?: string | null;
  htmlContent?: string | null;
  locked: boolean;
  createAt: string;
  updateAt: string;
};

type MyProfileDto = {
  id: number;
  email?: string | null;
  nickname?: string | null;
  name?: string | null;
  phone?: string | null;
  gender?: string | null;
  address?: string | null;
  position?: string | null;
  education?: string | null;
  birth?: string | null;
  age?: number | null;
  region?: string | null;
  career?: string | null;
};

type ExtraState = {
  educations: Array<{ school: string; period: string; status: string; major: string }>;
  careers: Array<{ company: string; period: string; role: string; job: string; desc: string }>;
  certs: string[];
  skills: string[];
  langs: string[];
};

const defaultExtra: ExtraState = {
  educations: [],
  careers: [],
  certs: [],
  skills: [],
  langs: [],
};

/** ---------------- Helpers ---------------- */

const prettyGender = (g?: string | null) => {
  if (!g) return "";
  const s = String(g).toLowerCase();
  if (["m", "male", "남", "남성"].includes(s)) return "남";
  if (["f", "female", "여", "여성"].includes(s)) return "여";
  return g;
};

const formatBirth = (dateStr?: string | null) => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  } catch {
    return "";
  }
};

/** 기간 파서 & 검증
 * 허용 예:
 *  - 2023-01 ~ 2024-05
 *  - 2020.03~2022.02
 *  - 2020 ~ 2022
 *  - 2023-01-01 ~ 2024-05-31
 */
const normalizeDate = (s?: string): string | undefined => {
  if (!s) return undefined;
  const t = s.trim().replace(/\s+/g, "");

  if (/^\d{4}$/.test(t)) return `${t}-01-01`;
  if (/^\d{4}[-.]\d{2}$/.test(t)) return t.replace(".", "-") + "-01";
  if (/^\d{4}[-.]\d{2}[-.]\d{2}$/.test(t)) return t.replaceAll(".", "-");

  return undefined;
};

const splitPeriod = (raw?: string) => {
  if (!raw) return { a: undefined as string | undefined, b: undefined as string | undefined };
  // 다양한 구분자 허용: ~, -, –, —, to
  const cleaned = raw.replace(/\s+/g, "");
  const parts = cleaned.split(/~|—|–|to|ㅡ/gi);
  if (parts.length === 1) return { a: parts[0], b: undefined };
  return { a: parts[0], b: parts[1] };
};

const parsePeriod = (period?: string) => {
  const { a, b } = splitPeriod(period);
  const startAt = normalizeDate(a);
  const endAt = normalizeDate(b);
  return { startAt, endAt };
};

const isValidPeriod = (period?: string) => {
  if (!period || !period.trim()) return true; // 비워두는 것도 허용
  const { startAt, endAt } = parsePeriod(period);
  // 하나만 있어도 OK
  if (!startAt && !endAt) return false;
  if (startAt && isNaN(new Date(startAt).getTime())) return false;
  if (endAt && isNaN(new Date(endAt).getTime())) return false;
  if (startAt && endAt && new Date(startAt) > new Date(endAt)) return false;
  return true;
};

const formatPeriod = (s?: string, e?: string) => {
  if (s && e) return `${s} ~ ${e}`;
  return s || e || "";
};

// 백엔드 DTO
type EducationBE = { name: string; major?: string; status?: string; type?: string; startAt?: string; endAt?: string };
type CareerBE = { companyName: string; type?: string; position?: string; startAt?: string; endAt?: string; content?: string };
type NamedBE = { name: string };

const mapExtraToBackend = (extra: ExtraState) => {
  const education: EducationBE[] = (extra.educations ?? []).map((e) => {
    const { startAt, endAt } = parsePeriod(e.period);
    return { name: e.school, major: e.major, status: e.status, type: "대학", startAt, endAt };
  });

  const career: CareerBE[] = (extra.careers ?? []).map((c) => {
    const { startAt, endAt } = parsePeriod(c.period);
    return { companyName: c.company, type: "정규", position: c.role || c.job, startAt, endAt, content: c.desc };
  });

  const certificate: NamedBE[] = (extra.certs ?? []).map((name) => ({ name }));
  const skill: NamedBE[] = (extra.skills ?? []).map((name) => ({ name }));
  const language: NamedBE[] = (extra.langs ?? []).map((name) => ({ name }));

  const htmlObj = { education, career, certificate, skill, language };

  return {
    htmlContent: JSON.stringify(htmlObj),
    educationJson: JSON.stringify(education),
    careerJson: JSON.stringify(career),
    certJson: JSON.stringify(certificate),
    skillJson: JSON.stringify(skill),
    langJson: JSON.stringify(language),
  };
};

/** ---------------- Component ---------------- */

const ResumeDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const resumeIdFromQS = useMemo(() => {
    const qs = new URLSearchParams(location.search || "");
    const v = qs.get("id");
    return v && /^\d+$/.test(v) ? Number(v) : undefined;
  }, [location.search]);

  const [resumeId, setResumeId] = useState<number | undefined>(resumeIdFromQS);
  const [title, setTitle] = useState("새 이력서");
  const [essayTitle, setEssayTitle] = useState("자기소개서");
  const [essayContent, setEssayContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<MyProfileDto | null>(null);
  const gender = prettyGender(profile?.gender);
  const birth = formatBirth(profile?.birth);
  const ageText = profile?.age != null ? `만 ${profile.age}세` : "";
  const genderAge = [gender, ageText].filter(Boolean).join(" · ");

  const [extra, setExtra] = useState<ExtraState>(defaultExtra);
  const extraRef = useRef(extra);
  useEffect(() => {
    extraRef.current = extra;
  }, [extra]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const handlePickPhoto = () => fileRef.current?.click();

  /** 프로필 로드 */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<MyProfileDto>("/api/mypage/me");
        setProfile(data);
      } catch (e: any) {
        console.error("프로필 조회 실패:", e?.response?.status, e?.response?.data || e);
        setProfile(null);
      }
    })();
  }, []);

  /** 이력서 로드 */
  useEffect(() => {
    (async () => {
      if (!resumeId) return;
      try {
        setLoading(true);
        const { data } = await api.get<ResumeDto>(`/api/mypage/resumes/${resumeId}`);
        setTitle(data?.title || "새 이력서");
        setEssayTitle(data?.essayTitle ?? data?.essayTittle ?? "자기소개서");
        setEssayContent(data?.essayContent ?? "");
        if (data?.idPhoto) setPhotoPreview(data.idPhoto);

        if (data?.htmlContent) {
          try {
            const root = JSON.parse(data.htmlContent) as any;
            setExtra({
              educations: (root.education ?? []).map((e: any) => ({
                school: e?.name || "",
                period: formatPeriod(e?.startAt, e?.endAt),
                status: e?.status || "",
                major: e?.major || "",
              })),
              careers: (root.career ?? []).map((c: any) => ({
                company: c?.companyName || "",
                period: formatPeriod(c?.startAt, c?.endAt),
                role: c?.position || "",
                job: "",
                desc: c?.content || "",
              })),
              certs: (root.certificate ?? []).map((x: any) => x?.name).filter(Boolean),
              skills: (root.skill ?? []).map((x: any) => x?.name).filter(Boolean),
              langs: (root.language ?? []).map((x: any) => x?.name).filter(Boolean),
            });
          } catch {
            setExtra(defaultExtra);
          }
        } else {
          setExtra(defaultExtra);
        }
      } catch (e) {
        console.warn("이력서 조회 실패:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [resumeId]);

  /** 최초 생성 보장 */
  const ensureResumeId = async (): Promise<number> => {
    if (resumeId) return resumeId;

    const safeExtra = extraRef.current && Object.keys(extraRef.current).length > 0 ? extraRef.current : defaultExtra;
    const mapped = mapExtraToBackend(safeExtra);
    const safePhoto = photoPreview && photoPreview.startsWith("http") ? photoPreview : null;

    const payload = {
      title: (title || "새 이력서").trim() || "새 이력서",
      idPhoto: safePhoto ?? null,
      essayTitle: (essayTitle || "자기소개서").trim() || "자기소개서",
      essayTittle: (essayTitle || "자기소개서").trim() || "자기소개서",
      essayContent: (essayContent && essayContent.trim()) || "임시 자기소개서 내용",
      ...mapped,
    };

    try {
      const res = await api.post("/api/mypage/resumes", payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      const id = res?.data?.id;
      if (!id) throw new Error("이력서 생성 실패: ID 없음");
      setResumeId(id);
      return id;
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      const serverMsg =
        data?.message || data?.error || (typeof data === "string" ? data : JSON.stringify(data)) || e?.message;
      alert(
        status && String(status).startsWith("5")
          ? "정확한 값을 입력해주세요. (예: 기간 2023-01 ~ 2024-05)"
          : `이력서 생성 중 오류가 발생했습니다.\n[${status ?? "ERR"}] ${serverMsg}`
      );
      throw e;
    }
  };

  /** 사진 업로드 */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      console.log("📤 업로드 시작:", file);

      const id = await ensureResumeId();
      console.log("📤 보낼 resumeId:", id);

      const localURL = URL.createObjectURL(file);
      setPhotoPreview(localURL);

      const form = new FormData();
      form.append("file", file);

      // ✅ 토큰 명시적으로 추가 (multipart는 인터셉터가 깨지기 쉬움)
      const res = await api.post(
  `/api/mypage/resumes/${id}/photo`,
  form,
  {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    withCredentials: true,
  }
);
      const url = res?.data?.url || res?.data?.idPhoto;
      if (url) setPhotoPreview(url);
    } catch (err) {
      console.error(err);
      alert("사진 업로드 중 오류가 발생했습니다.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /** 입력 refs */
  const eduSchoolRef = useRef<HTMLInputElement>(null);
  const eduPeriodRef = useRef<HTMLInputElement>(null);
  const eduStatusRef = useRef<HTMLInputElement>(null);
  const eduMajorRef = useRef<HTMLInputElement>(null);

  const carCompanyRef = useRef<HTMLInputElement>(null);
  const carPeriodRef = useRef<HTMLInputElement>(null);
  const carRoleRef = useRef<HTMLInputElement>(null);
  const carJobRef = useRef<HTMLInputElement>(null);
  const carDescRef = useRef<HTMLInputElement>(null);

  const certRef = useRef<HTMLInputElement>(null);
  const skillRef = useRef<HTMLInputElement>(null);
  const langRef = useRef<HTMLInputElement>(null);

  /** add 함수들 (기간 검증 포함) */
  const INVALID_PERIOD_MSG = "정확한 값을 입력해주세요. (예: 2023-01 ~ 2024-05)";

  const addEducation = () => {
    const school = eduSchoolRef.current?.value?.trim() || "";
    const period = eduPeriodRef.current?.value?.trim() || "";
    const status = eduStatusRef.current?.value?.trim() || "";
    const major = eduMajorRef.current?.value?.trim() || "";
    if (period && !isValidPeriod(period)) {
      alert(INVALID_PERIOD_MSG);
      return;
    }
    if (!school && !period && !status && !major) return;
    setExtra((p) => ({ ...p, educations: [...p.educations, { school, period, status, major }] }));
    if (eduSchoolRef.current) eduSchoolRef.current.value = "";
    if (eduPeriodRef.current) eduPeriodRef.current.value = "";
    if (eduStatusRef.current) eduStatusRef.current.value = "";
    if (eduMajorRef.current) eduMajorRef.current.value = "";
  };

  const addCareer = () => {
    const company = carCompanyRef.current?.value?.trim() || "";
    const period = carPeriodRef.current?.value?.trim() || "";
    const role = carRoleRef.current?.value?.trim() || "";
    const job = carJobRef.current?.value?.trim() || "";
    const desc = carDescRef.current?.value?.trim() || "";
    if (period && !isValidPeriod(period)) {
      alert(INVALID_PERIOD_MSG);
      return;
    }
    if (!company && !period && !role && !job && !desc) return;
    setExtra((p) => ({ ...p, careers: [...p.careers, { company, period, role, job, desc }] }));
    if (carCompanyRef.current) carCompanyRef.current.value = "";
    if (carPeriodRef.current) carPeriodRef.current.value = "";
    if (carRoleRef.current) carRoleRef.current.value = "";
    if (carJobRef.current) carJobRef.current.value = "";
    if (carDescRef.current) carDescRef.current.value = "";
  };

  const addCert = () => {
    const v = certRef.current?.value?.trim();
    if (!v) return;
    setExtra((p) => ({ ...p, certs: [...p.certs, v] }));
    if (certRef.current) certRef.current.value = "";
  };

  const addSkill = () => {
    const v = skillRef.current?.value?.trim();
    if (!v) return;
    setExtra((p) => ({ ...p, skills: [...p.skills, v] }));
    if (skillRef.current) skillRef.current.value = "";
  };

  const addLang = () => {
    const v = langRef.current?.value?.trim();
    if (!v) return;
    setExtra((p) => ({ ...p, langs: [...p.langs, v] }));
    if (langRef.current) langRef.current.value = "";
  };

  /** 삭제 핸들러들 (X 버튼) */
  const removeEducation = (idx: number) =>
    setExtra((p) => ({ ...p, educations: p.educations.filter((_, i) => i !== idx) }));
  const removeCareer = (idx: number) =>
    setExtra((p) => ({ ...p, careers: p.careers.filter((_, i) => i !== idx) }));
  const removeCert = (idx: number) =>
    setExtra((p) => ({ ...p, certs: p.certs.filter((_, i) => i !== idx) }));
  const removeSkill = (idx: number) =>
    setExtra((p) => ({ ...p, skills: p.skills.filter((_, i) => i !== idx) }));
  const removeLang = (idx: number) =>
    setExtra((p) => ({ ...p, langs: p.langs.filter((_, i) => i !== idx) }));

  /** 저장 */
  const handleSave = async () => {
    // 최종 저장 전, 리스트 내 기간들 검증
    const badEdu = extra.educations.find((e) => e.period && !isValidPeriod(e.period));
    const badCar = extra.careers.find((c) => c.period && !isValidPeriod(c.period));
    if (badEdu || badCar) {
      alert(INVALID_PERIOD_MSG);
      return;
    }

    try {
      setSaving(true);

      const mapped = mapExtraToBackend(extra && Object.keys(extra).length ? extra : defaultExtra);
      const safePhoto = photoPreview && photoPreview.startsWith("http") ? photoPreview : null;

      const payload = {
        title: (title || "새 이력서").trim() || "새 이력서",
        idPhoto: safePhoto ?? null,
        essayTitle: (essayTitle || "자기소개서").trim() || "자기소개서",
        essayTittle: (essayTitle || "자기소개서").trim() || "자기소개서",
        essayContent: (essayContent && essayContent.trim()) || "임시 자기소개서 내용",
        ...mapped,
      };

      if (resumeId) {
        await api.put(`/api/mypage/resumes/${resumeId}`, payload, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        });
      } else {
        const res = await api.post(`/api/mypage/resumes`, payload, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        });
        const id = res?.data?.id;
        if (id) setResumeId(id);
      }

      alert("저장되었습니다.");
      navigate("/myPage/Resume");
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      const serverMsg =
        data?.message || data?.error || (typeof data === "string" ? data : JSON.stringify(data)) || e?.message;

      // 5xx → 사용자가 고칠 수 있는 안내로 치환
      if (status && String(status).startsWith("5")) {
        alert("정확한 값을 입력해주세요. (예: 기간 2023-01 ~ 2024-05)");
      } else {
        alert(`저장 중 오류가 발생했습니다.\n[${status ?? "ERR"}] ${serverMsg}`);
      }
    } finally {
      setSaving(false);
    }
  };

  /** ---------------- UI ---------------- */

  return (
    <div className="max-w-5xl mx-auto py-10 px-8 bg-white">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-2xl font-bold text-gray-900">이력서 작성</h2>
        <input
          className="ml-4 flex-1 max-w-xs border-b border-gray-300 focus:border-black focus:outline-none text-sm py-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="이력서 제목"
        />
      </div>

      {/* 프로필 */}
      <div className="flex gap-8 mb-12">
        <button
          type="button"
          onClick={handlePickPhoto}
          className="w-[140px] h-[140px] bg-gray-200 flex items-center justify-center text-sm text-gray-500 overflow-hidden rounded"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="프로필" className="w-full h-full object-cover" />
          ) : (
            "사진"
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="flex-1">
          <p className="text-lg font-semibold text-gray-900">{profile?.name || ""}</p>
          {(genderAge || birth) && (
            <p className="text-sm text-gray-500">{[genderAge, birth].filter(Boolean).join(" / ")}</p>
          )}
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            {profile?.phone ? <p>{profile.phone}</p> : null}
            {profile?.email ? <p>{profile.email}</p> : null}
            {profile?.address ? <p>{profile.address}</p> : profile?.region ? <p>{profile.region}</p> : null}
          </div>
        </div>
      </div>

      {/* 학력 */}
      <div className="mb-12">
        <div className="flex items-end justify-between">
          <h3 className="text-lg font-semibold mb-3">학력</h3>
          <p className="text-xs text-gray-400 mb-3">기간 예: <b>2023-01 ~ 2024-05</b> / 2020.03~2022.02 / 2020~2022</p>
        </div>
        <div className="grid grid-cols-5 gap-4 mb-2 text-xs text-gray-400">
          <span>학교명</span>
          <span>재학기간</span>
          <span>졸업상태</span>
          <span>전공</span>
        </div>
        <div className="grid grid-cols-5 gap-4 mb-3">
          <input ref={eduSchoolRef} placeholder="학교명" className="border p-1 rounded" />
          <input ref={eduPeriodRef} placeholder="예: 2020-03 ~ 2024-02" className="border p-1 rounded" />
          <input ref={eduStatusRef} placeholder="상태" className="border p-1 rounded" />
          <input
            ref={eduMajorRef}
            placeholder="전공 (Enter 추가)"
            className="border p-1 rounded"
            onKeyDown={(e) => { if (e.key === "Enter") addEducation(); }}
          />
          <button onClick={addEducation} className="text-sm bg-gray-100 rounded px-2">추가</button>
        </div>
        <ul className="text-sm text-gray-700 space-y-1">
          {extra.educations.map((ed, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="flex-1">{ed.school} · {ed.period || "-"} · {ed.status} · {ed.major}</span>
              <button
                onClick={() => removeEducation(i)}
                className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200"
                aria-label="remove education"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 경력 */}
      <div className="mb-12">
        <div className="flex items-end justify-between">
          <h3 className="text-lg font-semibold mb-3">경력</h3>
          <p className="text-xs text-gray-400 mb-3">기간 예: <b>2023-01 ~ 2024-05</b></p>
        </div>
        <div className="grid grid-cols-5 gap-4 mb-2 text-xs text-gray-400">
          <span>회사명</span><span>근무기간</span><span>직책</span><span>직무</span><span>내용</span>
        </div>
        <div className="grid grid-cols-5 gap-4 mb-3">
          <input ref={carCompanyRef} placeholder="회사명" className="border p-1 rounded" />
          <input ref={carPeriodRef} placeholder="예: 2023-01 ~ 2024-05" className="border p-1 rounded" />
          <input ref={carRoleRef} placeholder="직책" className="border p-1 rounded" />
          <input ref={carJobRef} placeholder="직무" className="border p-1 rounded" />
          <input
            ref={carDescRef}
            placeholder="내용 (Enter 추가)"
            className="border p-1 rounded"
            onKeyDown={(e) => { if (e.key === "Enter") addCareer(); }}
          />
        </div>
        <div className="mb-2">
          <button onClick={addCareer} className="text-sm bg-gray-100 rounded px-2">추가</button>
        </div>
        <ul className="text-sm text-gray-700 space-y-1">
          {extra.careers.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="flex-1">{c.company} · {c.period || "-"} · {c.role} · {c.job} · {c.desc}</span>
              <button
                onClick={() => removeCareer(i)}
                className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200"
                aria-label="remove career"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 자격증/스킬/언어 */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div>
          <h3 className="text-lg font-semibold mb-2">자격증</h3>
          <input
            ref={certRef}
            placeholder="자격증 (Enter 추가)"
            className="border p-1 rounded w-full mb-2"
            onKeyDown={(e) => { if (e.key === "Enter") addCert(); }}
          />
          <button onClick={addCert} className="text-sm bg-gray-100 rounded px-2 mb-2">추가</button>
          <ul className="space-y-1">
            {extra.certs.map((c, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>{c}</span>
                <button onClick={() => removeCert(i)} className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200">×</button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">스킬</h3>
          <input
            ref={skillRef}
            placeholder="스킬 (Enter 추가)"
            className="border p-1 rounded w-full mb-2"
            onKeyDown={(e) => { if (e.key === "Enter") addSkill(); }}
          />
          <button onClick={addSkill} className="text-sm bg-gray-100 rounded px-2 mb-2">추가</button>
          <ul className="space-y-1">
            {extra.skills.map((s, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>{s}</span>
                <button onClick={() => removeSkill(i)} className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200">×</button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">언어</h3>
          <input
            ref={langRef}
            placeholder="언어 (Enter 추가)"
            className="border p-1 rounded w-full mb-2"
            onKeyDown={(e) => { if (e.key === "Enter") addLang(); }}
          />
          <button onClick={addLang} className="text-sm bg-gray-100 rounded px-2 mb-2">추가</button>
          <ul className="space-y-1">
            {extra.langs.map((l, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>{l}</span>
                <button onClick={() => removeLang(i)} className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200">×</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 자기소개서 */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold mb-3">자기소개서</h3>
        <input
          type="text"
          value={essayTitle}
          onChange={(e) => setEssayTitle(e.target.value)}
          className="w-full border-b p-1 mb-3"
          placeholder="자기소개서 제목"
        />
        <textarea
          rows={5}
          value={essayContent}
          onChange={(e) => setEssayContent(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="자기소개서 내용"
        />
      </div>

      <div className="flex justify-end gap-4">
        <button onClick={() => navigate(-1)} className="border px-4 py-2 rounded">다음에 하기</button>
        <button onClick={handleSave} className="bg-gray-200 px-5 py-2 rounded" disabled={saving}>
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
};

export default ResumeDetail;
