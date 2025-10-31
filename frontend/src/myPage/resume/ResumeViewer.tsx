import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";

/** ---------- Types ---------- */
type ProfileMini = {
  id: number;
  nickname?: string | null;
  name?: string | null;
  phone?: string | null;
  gender?: string | null;
  birth?: string | null;     // yyyy-MM-dd
  address?: string | null;
  email?: string | null;
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

type ResumeDto = {
  id: number;
  title: string;
  idPhoto?: string | null;
  essayTitle?: string | null;
  essayContent?: string | null;
  htmlContent?: string | null;  // JSON 문자열
  locked: boolean;
  createAt: string;
  updateAt: string;
  profile?: ProfileMini | null;

  // ✅ 스냅샷 메타(있을 수도, 없을 수도)
  companyName?: string | null;
  appliedAt?: string | null;

  // ✅ 백에서 분해해 주는 경우를 대비
  educationJson?: string | null;
  careerJson?: string | null;
  certJson?: string | null;
  skillJson?: string | null;
  langJson?: string | null;

  // ✅ 혹시 키가 다른 경우에도 대비
  educations?: any[];
  careers?: any[];
  certs?: any[];
  skills?: any[];
  langs?: any[];
};

/** ---------- Utils ---------- */
const prettyGender = (g?: string | null) => {
  if (!g) return "";
  const s = String(g).toLowerCase();
  if (["m", "male", "남", "남성"].includes(s)) return "남";
  if (["f", "female", "여", "여성"].includes(s)) return "여";
  return g || "";
};

const prettyBirthAge = (birth?: string | null) => {
  if (!birth) return { birthText: "", ageText: "" };
  try {
    const date = new Date(birth);
    if (isNaN(date.getTime())) return { birthText: birth, ageText: "" };

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const md = (today.getMonth() + 1) * 100 + today.getDate();
    const bd = (date.getMonth() + 1) * 100 + date.getDate();
    if (md < bd) age--;

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return { birthText: `${yyyy}.${mm}.${dd}`, ageText: `만 ${Math.max(age, 0)}세` };
  } catch {
    return { birthText: birth, ageText: "" };
  }
};

const ViewerSection: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-6">
    <h3 className="text-base font-semibold text-gray-800 mb-2">{title}</h3>
    <div className="border-t border-gray-200 pt-3">{children}</div>
  </div>
);

const safeJsonParse = <T,>(s?: string | null): T | null => {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
};

/** 다양한 키 조합을 전부 수용하는 초-방어적 파서 */
const normalizeToExtra = (source: any): ExtraState => {
  if (!source || typeof source !== "object") return defaultExtra;

  // 케이스 A: 우리가 저장했던 키
  const eduA = Array.isArray(source.education) ? source.education : [];
  const carA = Array.isArray(source.career) ? source.career : [];
  const cerA = Array.isArray(source.certificate) ? source.certificate : [];
  const sklA = Array.isArray(source.skill) ? source.skill : [];
  const lngA = Array.isArray(source.language) ? source.language : [];

  // 케이스 B: viewer에서 기대하던 키
  const eduB = Array.isArray(source.educations) ? source.educations : [];
  const carB = Array.isArray(source.careers) ? source.careers : [];
  const cerB = Array.isArray(source.certs) ? source.certs : [];
  const sklB = Array.isArray(source.skills) ? source.skills : [];
  const lngB = Array.isArray(source.langs) ? source.langs : [];

  // 케이스 C: 혹시 name만 들어있는 단순 배열들
  const pickName = (x: any) => (x?.name ?? x ?? "").toString();

  const educations = (eduA.length ? eduA : eduB).map((e: any) => ({
    school: e?.name ?? e?.school ?? "",
    period: [e?.startAt, e?.endAt].filter(Boolean).join(" ~ "),
    status: e?.status ?? "",
    major:  e?.major ?? "",
  }));

  const careers = (carA.length ? carA : carB).map((c: any) => ({
    company: c?.companyName ?? c?.company ?? "",
    period:  [c?.startAt, c?.endAt].filter(Boolean).join(" ~ "),
    role:    c?.position ?? c?.role ?? "",
    job:     c?.job ?? "",
    desc:    c?.content ?? c?.desc ?? "",
  }));

  const certs = (cerA.length ? cerA : cerB).map(pickName).filter(Boolean);
  const skills = (sklA.length ? sklA : sklB).map(pickName).filter(Boolean);
  const langs = (lngA.length ? lngA : lngB).map(pickName).filter(Boolean);

  return { educations, careers, certs, skills, langs };
};

/** htmlContent → ExtraState (htmlContent가 없으면 분해 JSON 파싱) */
const buildExtraFromResume = (r: ResumeDto | null): ExtraState => {
  if (!r) return defaultExtra;

  // 1) htmlContent 우선
  const fromHtml = safeJsonParse<any>(r.htmlContent);
  if (fromHtml) return normalizeToExtra(fromHtml);

  // 2) 분해 필드(educationJson 등) 합쳐서 구성
  const edu = safeJsonParse<any[]>(r.educationJson) ?? r.educations ?? [];
  const car = safeJsonParse<any[]>(r.careerJson) ?? r.careers ?? [];
  const cer = safeJsonParse<any[]>(r.certJson) ?? r.certs ?? [];
  const skl = safeJsonParse<any[]>(r.skillJson) ?? r.skills ?? [];
  const lng = safeJsonParse<any[]>(r.langJson) ?? r.langs ?? [];

  return normalizeToExtra({
    education: edu,
    career: car,
    certificate: cer,
    skill: skl,
    language: lng,
  });
};

/** ---------- Component ---------- */
const ResumeViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const applyId = useMemo(() => new URLSearchParams(location.search).get("applyId") || undefined, [location.search]);

  const [data, setData] = useState<ResumeDto | null>(null);
  const [extra, setExtra] = useState<ExtraState>(defaultExtra);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState<any>(null); // 👀 디버그용 원본 보관

  useEffect(() => {
    (async () => {
      if (!id || isNaN(Number(id))) {
        alert("잘못된 이력서 ID 입니다.");
        navigate("/myPage/Resume", { replace: true });
        return;
      }
      try {
        setLoading(true);

        let loaded: ResumeDto | null = null;

        // 1) applyId가 있으면 스냅샷 우선
        if (applyId) {
          try {
            const r1 = await api.get<ResumeDto>(`/api/mypage/applies/${applyId}/resume`);
            loaded = r1?.data ?? null;
            console.log("[ResumeViewer] snapshot loaded:", loaded);
          } catch (e) {
            console.warn("[ResumeViewer] snapshot not available, fallback to resume:", e);
          }
        }

        // 2) 폴백: 일반 이력서
        if (!loaded) {
          const r2 = await api.get<ResumeDto>(`/api/mypage/resumes/${id}`);
          loaded = r2?.data ?? null;
          console.log("[ResumeViewer] resume loaded:", loaded);
        }

        if (!loaded) throw new Error("이력서 응답 없음");

        setData(loaded);
        setExtra(buildExtraFromResume(loaded));
        setDebug(loaded); // 👀 개발 중 확인용
      } catch (e: any) {
        console.error("이력서 조회 실패:", e?.response?.status, e?.response?.data || e);
        alert("이력서를 불러올 수 없습니다.");
        navigate("/myPage/Resume", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, applyId, navigate]);

  const gender = prettyGender(data?.profile?.gender);
  const { birthText, ageText } = prettyBirthAge(data?.profile?.birth);

  const headerRightRows = useMemo(() => {
    const rows: Array<{ label: string; value?: string | null }> = [
      { label: "휴대폰", value: data?.profile?.phone },
      { label: "이메일", value: data?.profile?.email },
      { label: "주소", value: data?.profile?.address },
    ];
    return rows.filter((r) => !!r.value);
  }, [data]);

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-10 text-center">로딩 중...</div>;
  if (!data) return <div className="max-w-5xl mx-auto px-6 py-10">데이터가 없습니다.</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 bg-white">
      {/* 상단: 프로필 */}
      <div className="flex gap-6 items-start">
        <div className="w-[96px] h-[120px] bg-gray-100 rounded overflow-hidden flex items-center justify-center">
          {data.idPhoto ? (
            <img src={data.idPhoto} alt="증명사진" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-gray-400">사진</span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-bold text-gray-900">
              {data.profile?.name ?? "이름 없음"}
            </h1>
            <div className="text-sm text-gray-500">
              {birthText ? `${birthText}` : ""}
              {ageText ? ` (${ageText})` : ""}
            </div>
          </div>

          <div className="mt-1 text-sm text-gray-600">
            {[gender].filter(Boolean).join(" · ")}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-gray-700">
            {headerRightRows.map((r, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-14 text-gray-500">{r.label}</span>
                <span>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽 상단 타이틀(이력서 제목) + 스냅샷 메타 */}
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">이력서 제목</div>
          <div className="text-base font-semibold text-gray-800">{data.title}</div>
          <div className="mt-2 text-xs text-gray-500">
            {data.companyName ? <>제출 기업: {data.companyName} · </> : null}
            {data.appliedAt ? <>제출일: {new Date(`${data.appliedAt}T00:00:00`).toLocaleDateString("ko-KR")}</> : null}
          </div>
        </div>
      </div>

      {/* 학력 */}
      {extra.educations.length > 0 && (
        <ViewerSection title="학력">
          <div className="space-y-2">
            {extra.educations.map((ed, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs">학교명</div>
                  <div className="text-gray-800">{ed.school}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">재학기간</div>
                  <div className="text-gray-800">{ed.period}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">졸업상태</div>
                  <div className="text-gray-800">{ed.status}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">전공</div>
                  <div className="text-gray-800">{ed.major}</div>
                </div>
              </div>
            ))}
          </div>
        </ViewerSection>
      )}

      {/* 경력 */}
      {extra.careers.length > 0 && (
        <ViewerSection title="경력">
          <div className="space-y-2">
            {extra.careers.map((c, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs">회사명</div>
                  <div className="text-gray-800">{c.company}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">근무기간</div>
                  <div className="text-gray-800">{c.period}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">직책</div>
                  <div className="text-gray-800">{c.role}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">직무</div>
                  <div className="text-gray-800">{c.job}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">업무내용</div>
                  <div className="text-gray-800 whitespace-pre-wrap">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </ViewerSection>
      )}

      {/* 자격증 / 언어 / 스킬 */}
      {(extra.certs.length > 0 || extra.langs.length > 0 || extra.skills.length > 0) && (
        <div className="grid grid-cols-3 gap-8 mt-6">
          {extra.certs.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">자격증</h3>
              <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                {extra.certs.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          )}
          {extra.langs.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">언어</h3>
              <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                {extra.langs.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          )}
          {extra.skills.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">스킬</h3>
              <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                {extra.skills.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 자기소개서 */}
      {(data.essayTitle || data.essayContent) && (
        <div className="mt-8">
          <h3 className="text-base font-semibold text-gray-800 mb-2">자기소개서</h3>
          {data.essayTitle && (
            <div className="text-sm text-gray-700 mb-2">{data.essayTitle}</div>
          )}
          <div className="border border-gray-200 rounded p-4 text-sm text-gray-800 whitespace-pre-wrap leading-6">
            {data.essayContent || ""}
          </div>
        </div>
      )}

      {/* 👀 디버그 토글(개발 중 유용) */}
    
    </div>
  );
};

export default ResumeViewer;
