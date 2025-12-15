// src/myPage/myPageComponents/ResumeDetail.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { myPageApi } from "../../api/myPageApi";
import type { ResumeDto, MyProfileDto, EducationBE, CareerBE, NamedBE } from "../../types/interface";
import {
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

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
// EducationBE, CareerBE, NamedBE are imported from interface.ts

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
  const [title, setTitle] = useState("");
  const [essayTitle, setEssayTitle] = useState("");
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
  const [eduStart, setEduStart] = useState<string>("");
  const [eduEnd, setEduEnd] = useState<string>("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startPickerYear, setStartPickerYear] = useState(new Date().getFullYear());
  const [endPickerYear, setEndPickerYear] = useState(new Date().getFullYear());
  const [gradStatus, setGradStatus] = useState("");
  const [openGrad, setOpenGrad] = useState(false);

  // 경력 관련 state
  const [carStart, setCarStart] = useState<string>("");
  const [carEnd, setCarEnd] = useState<string>("");
  const [showCarStartPicker, setShowCarStartPicker] = useState(false);
  const [showCarEndPicker, setShowCarEndPicker] = useState(false);
  const [carStartPickerYear, setCarStartPickerYear] = useState(new Date().getFullYear());
  const [carEndPickerYear, setCarEndPickerYear] = useState(new Date().getFullYear());


  useEffect(() => {
    extraRef.current = extra;
  }, [extra]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const handlePickPhoto = () => fileRef.current?.click();

  const toPrettyYearMonth = (value: string) => {
    if (!value) return "";
    const [y, m] = value.split("-");
    return `${y}.${m}`;
  };


  /** 프로필 로드 */
  useEffect(() => {
    (async () => {
      try {
        const data = await myPageApi.getMyProfile();
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
        const data = await myPageApi.getResumeDetail(resumeId);
        setTitle(data?.title || "");
        setEssayTitle(data?.essayTitle ?? data?.essayTittle ?? "");
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
      title: title.trim() || "이력서",
      idPhoto: safePhoto ?? null,
      essayTitle: essayTitle.trim() || " ",
      essayTittle: essayTitle.trim() || " ",
      essayContent: essayContent.trim() || " ",
      ...mapped,
    };

    try {
      const data = await myPageApi.createResume(payload);
      const id = data?.id;
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
          ? "정확한 값을 입력해주세요. (예: 기간 2023.01 ~ 2024.05)"
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
      // ✅ 토큰 명시적으로 추가 (multipart는 인터셉터가 깨지기 쉬움)
      const data = await myPageApi.uploadResumePhoto(id, file);
      const url = data?.url || data?.idPhoto;
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
  const carRoleRef = useRef<HTMLInputElement>(null);
  const carJobRef = useRef<HTMLInputElement>(null);
  const carDescRef = useRef<HTMLInputElement>(null);

  const certRef = useRef<HTMLInputElement>(null);
  const skillRef = useRef<HTMLInputElement>(null);
  const langRef = useRef<HTMLInputElement>(null);

  /** add 함수들 (기간 검증 포함) */
  const INVALID_PERIOD_MSG = "정확한 값을 입력해주세요. (예: 2023.01 ~ 2024.05)";

  // const { eduStart, eduEnd, gradStatus, setEduStart, setEduEnd, setGradStatus, eduSchoolRef, eduMajorRef, setExtra, isValidPeriod, INVALID_PERIOD_MSG } = props/hooks;
  // 위 변수들이 함수 스코프 내에 존재한다고 가정합니다.
  const addEducation = () => {
    // 1. Ref와 State에서 모든 값 가져오기
    const school = eduSchoolRef.current?.value?.trim() || "";

    // 기간을 YYYY.MM ~ YYYY.MM 형식으로 결합
    const period =
      (eduStart && eduEnd)
        ? `${eduStart.replace('-', '.')} ~ ${eduEnd.replace('-', '.')}`
        : "";

    const status = gradStatus || "";
    const major = eduMajorRef.current?.value?.trim() || "";

    // 모든 필드가 비어있으면 추가하지 않음
    if (!school && !period && !status && !major) {
      console.log("모든 필드가 비어있습니다."); // 디버깅용
      return;
    }

    // 2. 학력 리스트 업데이트
    console.log("학력 추가:", { school, period, status, major }); // 디버깅용
    setExtra((prev) => ({
      ...prev,
      educations: [...prev.educations, { school, period, status, major }]
    }));

    // 3. 입력 필드 초기화 (Ref 초기화)
    if (eduSchoolRef.current) eduSchoolRef.current.value = "";
    if (eduMajorRef.current) eduMajorRef.current.value = "";

    // 4. 입력 필드 초기화 (State 초기화) - 빈 문자열로 초기화
    setEduStart("");
    setEduEnd("");
    setGradStatus("");
    setShowStartPicker(false);
    setShowEndPicker(false);
    setOpenGrad(false);
  };

  const addCareer = () => {
    const company = carCompanyRef.current?.value?.trim() || "";
    const period = (carStart && carEnd)
      ? `${carStart.replace('-', '.')} ~ ${carEnd.replace('-', '.')}`
      : "";
    const role = carRoleRef.current?.value?.trim() || "";
    const job = carJobRef.current?.value?.trim() || "";
    const desc = carDescRef.current?.value?.trim() || "";

    if (!company && !period && !role && !job && !desc) return;

    setExtra((p) => ({ ...p, careers: [...p.careers, { company, period, role, job, desc }] }));

    // 입력 필드 초기화 (Ref)
    if (carCompanyRef.current) carCompanyRef.current.value = "";
    if (carRoleRef.current) carRoleRef.current.value = "";
    if (carJobRef.current) carJobRef.current.value = "";
    if (carDescRef.current) carDescRef.current.value = "";

    // 입력 필드 초기화 (State)
    setCarStart("");
    setCarEnd("");
    setShowCarStartPicker(false);
    setShowCarEndPicker(false);
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
        title: title.trim() || "이력서",
        idPhoto: safePhoto ?? null,
        essayTitle: essayTitle.trim() || " ",
        essayTittle: essayTitle.trim() || " ",
        essayContent: essayContent.trim() || " ",
        ...mapped,
      };

      if (resumeId) {
        await myPageApi.updateResume(resumeId, payload);
      } else {
        const data = await myPageApi.createResume(payload);
        const id = data?.id;
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
        alert("정확한 값을 입력해주세요. (예: 기간 2023.01 ~ 2024.05)");
      } else {
        alert(`저장 중 오류가 발생했습니다.\n[${status ?? "ERR"}] ${serverMsg}`);
      }
    } finally {
      setSaving(false);
    }
  };

  /** ---------------- UI ---------------- */

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-8 bg-white">
      <div className="mb-6 sm:mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">이력서 작성</h2>
      </div>

      {/* 프로필 */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-8 sm:mb-12">
        <button
          type="button"
          onClick={handlePickPhoto}
          className="w-24 h-32 sm:w-24 sm:h-32 bg-gray-200 flex items-center justify-center text-xs sm:text-sm text-gray-500 overflow-hidden rounded flex-shrink-0"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="증명사진" className="w-full h-full object-cover" />
          ) : (
            "증명사진"
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="flex-1 min-w-0">
          <p className="text-base sm:text-lg font-semibold text-gray-900">{profile?.name || ""}</p>
          {(genderAge || birth) && (
            <p className="text-xs sm:text-sm text-gray-500">{[genderAge, birth].filter(Boolean).join(" / ")}</p>
          )}
          <div className="mt-2 text-xs sm:text-sm text-gray-600 space-y-1">
            {profile?.phone ? <p className="break-all">{profile.phone}</p> : null}
            {profile?.email ? <p className="break-all">{profile.email}</p> : null}
            {profile?.address ? <p className="break-words">{profile.address}</p> : profile?.region ? <p>{profile.region}</p> : null}
          </div>
        </div>
      </div>

      {/* 이력서 제목 */}
      <div className="mb-6 sm:mb-8">
        <input
          className="text-base sm:text-lg font-semibold focus:outline-none w-full border-b border-gray-200 pb-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="이력서 제목"
        />
      </div>

      {/* 학력 */}
      <div className="mb-8 sm:mb-12">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          학력
          <button
            type="button"
            onClick={addEducation}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-base sm:text-18 font-normal leading-none hover:bg-gray-300 transition-colors cursor-pointer"
            aria-label="학력 추가"
          >
            +
          </button>
        </h3>

        {/* 추가된 학력 리스트 */}
        {extra.educations.map((ed, i) => (
          <div key={i} className="mb-3 sm:mb-4 p-3 sm:p-4 border border-gray-100 rounded-lg relative">
            <button
              onClick={() => removeEducation(i)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg sm:text-xl font-light"
              aria-label="remove education"
            >
              ×
            </button>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-sm sm:text-base font-medium text-gray-900 break-words">{ed.school}</p>
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <p className="break-words">{ed.period || "-"}</p>
                <p className="break-words">{ed.status} {ed.major && `· ${ed.major}`}</p>
              </div>
            </div>
          </div>
        ))}

        {/* 새 학력 추가 폼 */}
        <div className="border border-gray-100 rounded-lg p-3 sm:p-4 bg-white">
          <div className="space-y-2 sm:space-y-3">

            <div>
              <input
                ref={eduSchoolRef}
                placeholder="학교명"
                className="w-full bg-transparent py-1 focus:outline-none text-xs sm:text-14"
              />
            </div>

            {/* 입학/졸업 연월, 졸업상태, 전공을 한 줄에 배치 */}
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[auto_auto_1fr] sm:gap-1">
              {/* 입학/졸업연월 통합 */}
              <div className="relative flex items-center gap-1 sm:border-r border-gray-200 sm:pr-5">
                {/* 입학연월 */}
                <button
                  type="button"
                  onClick={() => {
                    setShowStartPicker(!showStartPicker);
                    setShowEndPicker(false);
                  }}
                  className="py-1 text-xs sm:text-14 text-left focus:outline-none flex-0"
                >
                  {eduStart ? <span className="text-gray-900">{eduStart.replace('-', '.')}</span> : <span className="text-gray-500">YYYY.MM</span>}
                </button>

                <span className="text-gray-400 text-xs sm:text-sm">-</span>

                {/* 졸업연월 */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEndPicker(!showEndPicker);
                    setShowStartPicker(false);
                  }}
                  className="py-1 text-xs sm:text-14 text-left focus:outline-none flex-0"
                >
                  {eduEnd ? <span className="text-gray-900">{eduEnd.replace('-', '.')}</span> : <span className="text-gray-500">YYYY.MM</span>}
                </button>

                {/* 입학연월 달력 */}
                {showStartPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-64">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => setStartPickerYear(startPickerYear - 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        ‹
                      </button>
                      <div className="font-medium">{startPickerYear}년</div>
                      <button
                        type="button"
                        onClick={() => setStartPickerYear(startPickerYear + 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        ›
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <button
                          key={month}
                          type="button"
                          onClick={() => {
                            const value = `${startPickerYear}-${String(month).padStart(2, '0')}`;
                            setEduStart(value);
                            setShowStartPicker(false);
                          }}
                          className="py-2 px-3 text-sm hover:bg-[#E6F0FF] rounded transition-colors"
                        >
                          {month}월
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 졸업연월 달력 */}
                {showEndPicker && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-64">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => setEndPickerYear(endPickerYear - 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        ‹
                      </button>
                      <div className="font-medium">{endPickerYear}년</div>
                      <button
                        type="button"
                        onClick={() => setEndPickerYear(endPickerYear + 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        ›
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <button
                          key={month}
                          type="button"
                          onClick={() => {
                            const value = `${endPickerYear}-${String(month).padStart(2, '0')}`;
                            setEduEnd(value);
                            setShowEndPicker(false);
                          }}
                          className="py-2 px-3 text-sm hover:bg-[#E6F0FF] rounded transition-colors"
                        >
                          {month}월
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 졸업 상태 드롭다운 */}
              <div className="relative sm:border-r border-gray-200 sm:pr-2 w-full sm:w-auto -ml-2 sm:ml-0">
                <button
                  type="button"
                  onClick={() => setOpenGrad(!openGrad)}
                  className="flex items-center justify-between w-full sm:w-21 px-2 sm:px-3 py-1 bg-white text-xs sm:text-14 text-gray-800 hover:bg-gray-50"
                >
                  <span className={gradStatus ? "text-gray-900" : "text-gray-500"}>
                    {gradStatus ? gradStatus : "졸업 상태"}
                  </span>
                </button>

                {openGrad && (
                  <div className="absolute left-0 w-full sm:w-21 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {["재학중", "졸업"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setGradStatus(status);
                          setOpenGrad(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-50 text-gray-700"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>


              {/* 전공 및 학위 입력란 */}
              <input
                ref={eduMajorRef}
                placeholder="전공 및 학위"
                className="bg-transparent py-1 focus:outline-none text-xs sm:text-14 pl-0 sm:pl-2 w-full"
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === "Enter") addEducation();
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* 경력 */}
      <div className="mb-8 sm:mb-12">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          경력
          <button
            type="button"
            onClick={addCareer}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-base sm:text-18 font-normal leading-none hover:bg-gray-300 transition-colors cursor-pointer"
            aria-label="경력 추가"
          >
            +
          </button>
        </h3>

        {/* 추가된 경력 리스트 */}
        {extra.careers.map((c, i) => (
          <div key={i} className="mb-3 sm:mb-4 p-3 sm:p-4 border border-gray-100 rounded-lg relative">
            <button
              onClick={() => removeCareer(i)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg sm:text-xl font-light"
              aria-label="remove career"
            >
              ×
            </button>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-sm sm:text-base font-medium text-gray-900 break-words">{c.company}</p>
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <p className="break-words">{c.period || "-"} {c.role && `· ${c.role}`} {c.job && `· ${c.job}`}</p>
                {c.desc && <p className="text-gray-700 break-words">{c.desc}</p>}
              </div>
            </div>
          </div>
        ))}

        {/* 새 경력 추가 폼 */}
        <div className="border border-gray-100 rounded-lg p-3 sm:p-4 bg-white">
          <div className="space-y-2 sm:space-y-3">
            <div>
              <input
                ref={carCompanyRef}
                placeholder="회사명"
                className="w-full bg-transparent py-1 focus:outline-none text-xs sm:text-14"
              />
            </div>

            {/* 입사/퇴사연월, 직책, 직무를 한 줄에 배치 */}
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[auto_auto_1fr] sm:gap-2">
              {/* 입사/퇴사연월 통합 */}
              <div className="relative flex items-center gap-1 sm:border-r border-gray-200 sm:pr-5">
                {/* 입사연월 */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCarStartPicker(!showCarStartPicker);
                    setShowCarEndPicker(false);
                  }}
                  className="py-1 text-xs sm:text-14 text-left focus:outline-none flex-0"
                >
                  {carStart ? <span className="text-gray-900">{carStart.replace('-', '.')}</span> : <span className="text-gray-500">YYYY.MM</span>}
                </button>

                <span className="text-gray-400 text-xs sm:text-sm">-</span>

                {/* 퇴사연월 */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCarEndPicker(!showCarEndPicker);
                    setShowCarStartPicker(false);
                  }}
                  className="py-1 text-xs sm:text-14 text-left focus:outline-none flex-0"
                >
                  {carEnd ? <span className="text-gray-900">{carEnd.replace('-', '.')}</span> : <span className="text-gray-500">YYYY.MM</span>}
                </button>

                {/* 입사연월 달력 */}
                {showCarStartPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-64">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => setCarStartPickerYear(carStartPickerYear - 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        ‹
                      </button>
                      <div className="font-medium">{carStartPickerYear}년</div>
                      <button
                        type="button"
                        onClick={() => setCarStartPickerYear(carStartPickerYear + 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        ›
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <button
                          key={month}
                          type="button"
                          onClick={() => {
                            const value = `${carStartPickerYear}-${String(month).padStart(2, '0')}`;
                            setCarStart(value);
                            setShowCarStartPicker(false);
                          }}
                          className="py-2 px-3 text-sm hover:bg-blue-50 rounded transition-colors"
                        >
                          {month}월
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 퇴사연월 달력 */}
                {showCarEndPicker && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-64">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => setCarEndPickerYear(carEndPickerYear - 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        ‹
                      </button>
                      <div className="font-medium">{carEndPickerYear}년</div>
                      <button
                        type="button"
                        onClick={() => setCarEndPickerYear(carEndPickerYear + 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        ›
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <button
                          key={month}
                          type="button"
                          onClick={() => {
                            const value = `${carEndPickerYear}-${String(month).padStart(2, '0')}`;
                            setCarEnd(value);
                            setShowCarEndPicker(false);
                          }}
                          className="py-2 px-3 text-sm hover:bg-blue-50 rounded transition-colors"
                        >
                          {month}월
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 직책 */}
              <input
                ref={carRoleRef}
                placeholder="직책"
                className="bg-transparent py-1 focus:outline-none text-xs sm:text-14 sm:border-r border-gray-200 sm:pr-2 pl-0 sm:pl-2 w-full"
              />

              {/* 직무 */}
              <input
                ref={carJobRef}
                placeholder="직무"
                className="bg-transparent py-1 focus:outline-none text-xs sm:text-14 pl-0 sm:pl-2 w-full"
              />
            </div>

            <div>
              <input
                ref={carDescRef}
                placeholder="내용 (Enter 추가)"
                className="w-full bg-transparent py-1 focus:outline-none text-xs sm:text-14"
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === "Enter") addCareer();
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 자격증/스킬/언어 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
        {/* 자격증 */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            자격증
            <button
              type="button"
              onClick={addCert}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-base sm:text-18 font-normal leading-none hover:bg-gray-300 transition-colors cursor-pointer"
              aria-label="자격증 추가"
            >
              +
            </button>
          </h3>

          {/* 추가된 자격증 리스트 */}
          {extra.certs.map((c, i) => (
            <div key={i} className="mb-3 sm:mb-4 p-3 sm:p-4 border border-gray-100 rounded-lg relative">
              <button
                onClick={() => removeCert(i)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg sm:text-xl font-light"
                aria-label="remove certificate"
              >
                ×
              </button>
              <p className="text-sm sm:text-base font-medium text-gray-900 pr-6 break-words">{c}</p>
            </div>
          ))}

          {/* 새 자격증 추가 폼 */}
          <div className="border border-gray-100 rounded-lg p-3 sm:p-4 bg-white">
            <input
              ref={certRef}
              placeholder="자격증 (Enter 추가)"
              className="w-full bg-transparent py-1 focus:outline-none text-xs sm:text-14"
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Enter") addCert();
              }}
            />
          </div>
        </div>

        {/* 스킬 */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            스킬
            <button
              type="button"
              onClick={addSkill}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-base sm:text-18 font-normal leading-none hover:bg-gray-300 transition-colors cursor-pointer"
              aria-label="스킬 추가"
            >
              +
            </button>
          </h3>

          {/* 추가된 스킬 리스트 */}
          {extra.skills.map((s, i) => (
            <div key={i} className="mb-3 sm:mb-4 p-3 sm:p-4 border border-gray-100 rounded-lg relative">
              <button
                onClick={() => removeSkill(i)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg sm:text-xl font-light"
                aria-label="remove skill"
              >
                ×
              </button>
              <p className="text-sm sm:text-base font-medium text-gray-900 pr-6 break-words">{s}</p>
            </div>
          ))}

          {/* 새 스킬 추가 폼 */}
          <div className="border border-gray-100 rounded-lg p-3 sm:p-4 bg-white">
            <input
              ref={skillRef}
              placeholder="스킬 (Enter 추가)"
              className="w-full bg-transparent py-1 focus:outline-none text-xs sm:text-14"
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Enter") addSkill();
              }}
            />
          </div>
        </div>

        {/* 언어 */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            언어
            <button
              type="button"
              onClick={addLang}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-base sm:text-18 font-normal leading-none hover:bg-gray-300 transition-colors cursor-pointer"
              aria-label="언어 추가"
            >
              +
            </button>
          </h3>

          {/* 추가된 언어 리스트 */}
          {extra.langs.map((l, i) => (
            <div key={i} className="mb-3 sm:mb-4 p-3 sm:p-4 border border-gray-100 rounded-lg relative">
              <button
                onClick={() => removeLang(i)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg sm:text-xl font-light"
                aria-label="remove language"
              >
                ×
              </button>
              <p className="text-sm sm:text-base font-medium text-gray-900 pr-6 break-words">{l}</p>
            </div>
          ))}

          {/* 새 언어 추가 폼 */}
          <div className="border border-gray-100 rounded-lg p-3 sm:p-4 bg-white">
            <input
              ref={langRef}
              placeholder="언어 (Enter 추가)"
              className="w-full bg-transparent py-1 focus:outline-none text-xs sm:text-14"
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Enter") addLang();
              }}
            />
          </div>
        </div>
      </div>

      {/* 자기소개서 */}
      <div className="mb-8 sm:mb-10">
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">자기소개서</h3>
        <input
          type="text"
          value={essayTitle}
          onChange={(e) => setEssayTitle(e.target.value)}
          className="w-full border-b border-gray-200 p-1 mb-2 sm:mb-3 focus:outline-none focus:border-gray-400 text-xs sm:text-sm"
          placeholder="제목을 입력하세요."
        />
        <div className="relative">
          <textarea
            rows={5}
            value={essayContent}
            onChange={(e) => setEssayContent(e.target.value)}
            className="w-full border border-gray-200 p-2 sm:p-3 rounded focus:outline-none focus:border-gray-400 text-xs sm:text-sm"
            placeholder="내용을 입력하세요."
            maxLength={5000}
          />
          <div className="text-right text-xs sm:text-sm text-gray-500 mt-1">
            {essayContent.length}/5000
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
        <button onClick={() => navigate(-1)} className="border border-gray-200 px-4 py-2 rounded hover:bg-gray-50 transition-colors text-sm sm:text-base">다음에 하기</button>
        <button onClick={handleSave} className="bg-gray-200 px-5 py-2 rounded hover:bg-[#006AFF] hover:text-white transition-colors disabled:hover:bg-gray-200 disabled:hover:text-black text-sm sm:text-base" disabled={saving}>
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
};

export default ResumeDetail;