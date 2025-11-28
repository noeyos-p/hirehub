import React, { useEffect, useMemo, useRef, useState } from "react";
import { myPageApi } from "../../api/myPageApi";
import type { UsersRequest, UsersResponse } from "../../types/interface";

/* === Daum 주소검색 타입 선언 === */
declare global {
  interface Window {
    daum: any;
  }
}

/* === 카카오 주소 검색 === */
const openPostcode = (cb: (addr: string) => void) => {
  new window.daum.Postcode({
    oncomplete: (data: any) => cb(data.address),
  }).open();
};

/* SVG 아이콘 */
const Svg = (p: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  />
);
const Pencil = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </Svg>
);
const Check = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);
const X = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}>
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </Svg>
);

/* 유틸 함수 */
function parseJwt(token?: string | null) {
  if (!token) return undefined;
  const raw = token.replace(/^Bearer\s+/i, "");
  const parts = raw.split(".");
  if (parts.length < 2) return undefined;
  let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  while (payload.length % 4) payload += "=";
  try {
    return JSON.parse(atob(payload));
  } catch {
    return undefined;
  }
}
function readJwtEmail() {
  const stored =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const json = parseJwt(stored || undefined);
  return json?.email || json?.sub || json?.username || undefined;
}
const prettyDate = (v?: string | null) => {
  if (!v) return "-";
  const d = (v + "").replaceAll("/", "-");
  const m = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : d.substring(0, 10);
  return m.replaceAll("-", ".");
};
const calcAge = (birth?: string | null) => {
  if (!birth) return undefined;
  const d = new Date(birth as string);
  if (Number.isNaN(d.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const beforeBirthday =
    today.getMonth() < d.getMonth() ||
    (today.getMonth() === d.getMonth() &&
      today.getDate() < d.getDate());
  if (beforeBirthday) age -= 1;
  return age;
};
const formatPhone = (val?: string | null) => {
  if (!val) return "-";
  const digits = (val + "").replace(/\D/g, "");
  if (digits.length === 11)
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return val;
};

const SEOUL_DISTRICTS = [
  "강남구", "강동구", "강북구", "강서구", "관악구", "광진구",
  "구로구", "금천구",  "노원구", "도봉구", "동대문구", "동작구",
  "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구",
  "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구",
];
const POSITION_OPTIONS = ["프론트엔드", "백엔드", "풀스택", "DevOps", "데이터 엔지니어", "AI/ML", "기타"];
const CAREER_OPTIONS = ["신입", "1년 미만", "1-3년", "3-5년", "5-10년", "10년 이상"];
const EDUCATION_OPTIONS = ["고졸", "초대졸", "대졸", "석사", "박사"];
const GENDER_LABEL: Record<string, string> = {
  MALE: "남성",
  FEMALE: "여성",
  UNKNOWN: "선택 안 함",
};

async function fetchMe(): Promise<UsersResponse> {
  return await myPageApi.getMyInfo();
}
async function updateMe(partial: Partial<UsersRequest>) {
  return await myPageApi.updateMyInfo(partial);
}

/* 공용 행 */
const FieldRow: React.FC<{
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
  editing?: boolean;
  children?: React.ReactNode;
  disabled?: boolean;
}> = ({ label, value, onEdit, editing, children, disabled }) => (
  <div className="grid grid-cols-12 items-center border-b border-zinc-200 py-3">
    <div className="col-span-3 text-sm text-zinc-500">{label}</div>
    <div className="col-span-6 text-sm md:text-base text-zinc-900">
      {editing ? children : value}
    </div>
    <div className="col-span-3 flex justify-end">
      {onEdit && (
        <button
          className={`p-1 rounded ${
            disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-zinc-100"
          }`}
          onClick={disabled ? undefined : onEdit}
        >
          <Pencil className="text-zinc-400" />
        </button>
      )}
    </div>
  </div>
);

const MyInfo: React.FC = () => {
  const [me, setMe] = useState<UsersResponse | null>(null);
  const [editing, setEditing] = useState<null | keyof UsersResponse>(null);
  const [draft, setDraft] = useState<Record<string, any>>({});

  /* 상세주소 (프론트 전용) */
  const [addressDetail, setAddressDetail] = useState("");
  const detailRef = useRef<HTMLInputElement | null>(null);

  const emailFallback = useMemo(() => readJwtEmail(), []);

  useEffect(() => {
    (async () => {
      const data = await fetchMe();
      setMe(data);
    })().catch(console.error);
  }, []);

  const startEdit = (key: keyof UsersResponse) => {
    setEditing(key);

    if (key === "address") {
      /* DB의 단일 address → 주소/상세주소 분리 */
      const full = me?.address || "";
      const parts = full.split(" ");
      const base = parts.slice(0, 3).join(" "); // 시/구/로 정도
      const detail = parts.slice(3).join(" ");

      setDraft({ address: base.trim() });
      setAddressDetail(detail.trim());
    } else {
      setDraft({ [key]: me?.[key] ?? "" });
    }
  };

  const cancel = () => {
    setEditing(null);
    setDraft({});
    setAddressDetail("");
  };

  const commit = async (key: keyof UsersResponse) => {
    try {
      let payload: any;

      if (key === "address") {
        /* 주소 + 상세주소 합쳐서 단일 address 로 저장 */

        const combined = `${draft.address || ""} ${addressDetail}`.trim();
        payload = { address: combined };
      } else {
        payload = { [key]: draft[key] };
      }

      const updated = await updateMe(payload);
      setMe(updated);

      cancel();
    } catch (e) {
      alert("오류가 발생했습니다.");
    }
  };

  const ageToShow = useMemo(
    () => me?.age ?? calcAge(me?.dob),
    [me]
  );

  const genderLabel = (code?: string) =>
    (code && GENDER_LABEL[code]) || "-";

  return (
    <div className="max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
        계정정보 설정
      </h2>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-10">
        {/* 프로필 */}
        <aside className="xl:col-span-4 flex flex-col sm:flex-row xl:flex-col items-center gap-4 -ml-32">
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-10 h-10 text-gray-600"
            >
              <path
                fillRule="evenodd"
                d="M12 2a5 5 0 100 10 5 5 0 000-10zM4 20a8 8 0 0116 0H4z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {editing === "nickname" ? (
            <div className="flex items-center gap-2">
              <input
                className="border border-zinc-300 rounded px-3 py-2"
                value={draft.nickname ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, nickname: e.target.value }))
                }
              />
              <button className="p-2" onClick={() => commit("nickname")}>
                <Check />
              </button>
              <button className="p-2" onClick={cancel}>
                <X />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-700 ml-8">
              <span>{me?.nickname || "닉네임 없음"}</span>
              <button
                className="p-1 rounded hover:bg-zinc-100"
                onClick={() => startEdit("nickname")}
              >
                <Pencil className="text-zinc-400" />
              </button>
            </div>
          )}
        </aside>

        {/* 상세 정보 */}
        <div className="xl:col-span-8 space-y-1">
          {/* 이메일 */}
          <FieldRow
            label="이메일"
            value={me?.email || emailFallback || "-"}
          />

          {/* 이름 */}
          <FieldRow
            label="이름"
            value={me?.name || "-"}
            onEdit={() => startEdit("name")}
            editing={editing === "name"}
          >
            <div className="flex items-center gap-2 w-full">
              <input
                className="border border-zinc-300 rounded px-3 py-2 w-full"
                value={draft.name ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
              />
              <button className="p-2" onClick={() => commit("name")}>
                <Check />
              </button>
              <button className="p-2" onClick={cancel}>
                <X />
              </button>
            </div>
          </FieldRow>

          {/* 전화번호 */}
          <FieldRow
            label="전화번호"
            value={formatPhone(me?.phone)}
            onEdit={() => startEdit("phone")}
            editing={editing === "phone"}
          >
            <div className="flex items-center gap-2 w-full">
              <input
                className="border border-zinc-300 rounded px-3 py-2 w-full"
                value={draft.phone ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, phone: e.target.value }))
                }
              />
              <button className="p-2" onClick={() => commit("phone")}>
                <Check />
              </button>
              <button className="p-2" onClick={cancel}>
                <X />
              </button>
            </div>
          </FieldRow>

          {/* 생년월일 */}
          <FieldRow
            label="생년월일"
            value={prettyDate(me?.dob)}
            onEdit={() => startEdit("dob")}
            editing={editing === "dob"}
          >
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="border border-zinc-300 rounded px-3 py-2"
                value={draft.dob ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, dob: e.target.value }))
                }
              />
              <button className="p-2" onClick={() => commit("dob")}>
                <Check />
              </button>
              <button className="p-2" onClick={cancel}>
                <X />
              </button>
            </div>
          </FieldRow>

          {/* 나이 */}
          <FieldRow
            label="나이"
            value={ageToShow ? `${ageToShow}살` : "-"}
            disabled
          />

          {/* 성별 */}
          <FieldRow
            label="성별"
            value={genderLabel(me?.gender)}
            onEdit={() => startEdit("gender")}
            editing={editing === "gender"}
          >
            <div className="flex items-center gap-2">
              <select
                className="border border-zinc-300 rounded px-3 py-2"
                value={draft.gender ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, gender: e.target.value }))
                }
              >
                <option value="">선택하세요</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
                <option value="UNKNOWN">선택 안 함</option>
              </select>
              <button className="p-2" onClick={() => commit("gender")}>
                <Check />
              </button>
              <button className="p-2" onClick={cancel}>
                <X />
              </button>
            </div>
          </FieldRow>

          {/* ============================== */}
          {/*           주소 수정             */}
          {/* ============================== */}
          <FieldRow
            label="주소"
            value={me?.address || "-"}
            onEdit={() => startEdit("address")}
            editing={editing === "address"}
          >
            <div className="flex flex-col gap-2 w-full">

              {/* 주소 input */}
              <input
                className="border border-zinc-300 rounded px-3 py-2 w-full"
                value={draft.address ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, address: e.target.value }))
                }
                placeholder="예) 서울 강남구 ..."
              />

              {/* 주소 찾기 버튼 */}
              <button
                type="button"
                onClick={() =>
                  openPostcode((addr) => {
                    setDraft((d) => ({ ...d, address: addr }));
                    setTimeout(() => detailRef.current?.focus(), 120);
                  })
                }
                className="p-2 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm w-20"
              >
                찾기
              </button>

              {/* 상세주소 */}
              <input
                ref={detailRef}
                className="border border-zinc-300 rounded px-3 py-2 w-full"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="상세 주소 (예: 101동 1203호)"
              />

              {/* 저장/취소 */}
              <div className="flex gap-2 mt-1">
                <button className="p-2" onClick={() => commit("address")}>
                  <Check />
                </button>
                <button className="p-2" onClick={cancel}>
                  <X />
                </button>
              </div>
            </div>
          </FieldRow>

          {/* 지역 */}
          <FieldRow
            label="지역"
            value={me?.location || "-"}
            onEdit={() => startEdit("location")}
            editing={editing === "location"}
          >
            <div className="flex items-center gap-2 w-full">
              <select
                className="border border-zinc-300 rounded px-3 py-2 w-full"
                value={draft.location ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, location: e.target.value }))
                }
              >
                <option value="">선택하세요</option>
                {SEOUL_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button className="p-2" onClick={() => commit("location")}>
                <Check />
              </button>
              <button className="p-2" onClick={cancel}>
                <X />
              </button>
            </div>
          </FieldRow>

          {/* 직무 */}
          <FieldRow
            label="직무"
            value={me?.position || "-"}
            onEdit={() => startEdit("position")}
            editing={editing === "position"}
          >
            <div className="flex items-center gap-2 w-full">
              <select
                className="border border-zinc-300 rounded px-3 py-2 w-full"
                value={draft.position ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, position: e.target.value }))
                }
              >
                <option value="">선택하세요</option>
                {POSITION_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button className="p-2" onClick={() => commit("position")}>
                <Check />
              </button>
              <button className="p-2" onClick={cancel}>
                <X />
              </button>
            </div>
          </FieldRow>

          {/* 경력 */}
          <FieldRow
            label="경력"
            value={me?.careerLevel || "-"}
            onEdit={() => startEdit("careerLevel")}
            editing={editing === "careerLevel"}
          >
            <div className="flex items-center gap-2 w-full">
              <select
                className="border border-zinc-300 rounded px-3 py-2 w-full"
                value={draft.careerLevel ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, careerLevel: e.target.value }))
                }
              >
                <option value="">선택하세요</option>
                {CAREER_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button className="p-2" onClick={() => commit("careerLevel")}>
                <Check />
              </button>
              <button className="p-2" onClick={cancel}>
                <X />
              </button>
            </div>
          </FieldRow>

          {/* 학력 */}
          <FieldRow
            label="학력"
            value={me?.education || "-"}
            onEdit={() => startEdit("education")}
            editing={editing === "education"}
          >
            <div className="flex items-center gap-2 w-full">
              <select
                className="border border-zinc-300 rounded px-3 py-2 w-full"
                value={draft.education ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, education: e.target.value }))
                }
              >
                <option value="">선택하세요</option>
                {EDUCATION_OPTIONS.map((e2) => (
                  <option key={e2} value={e2}>
                    {e2}
                  </option>
                ))}
              </select>
              <button className="p-2" onClick={() => commit("education")}>
                <Check />
              </button>
              <button className="p-2" onClick={cancel}>
                <X />
              </button>
            </div>
          </FieldRow>
        </div>
      </section>
    </div>
  );
};

export default MyInfo;
