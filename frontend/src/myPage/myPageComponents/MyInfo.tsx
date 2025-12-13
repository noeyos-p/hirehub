import React, { useEffect, useMemo, useRef, useState } from "react";
import { myPageApi } from "../../api/myPageApi";
import api from "../../api/api";
import type { UsersRequest, UsersResponse } from "../../types/interface";
import { ChevronDownIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";

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
  "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구",
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
  <div className="grid grid-cols-12 items-center px-4 sm:px-6 py-4 min-h-[64px]">
    <div className="col-span-4 text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
    <div className="col-span-6 text-sm md:text-base text-text-primary dark:text-white">
      {editing ? children : value}
    </div>
    <div className="col-span-2 flex justify-end items-center min-h-[40px]">
      {onEdit && (
        <button
          className={`p-2 rounded-full transition ${
            disabled
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          onClick={disabled ? undefined : onEdit}
        >
          <Pencil className="text-gray-400 w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

const MyInfo: React.FC = () => {
  const [me, setMe] = useState<UsersResponse | null>(null);
  const [editing, setEditing] = useState<null | keyof UsersResponse>(null);
  const [draft, setDraft] = useState<Record<string, any>>({});

  /* 드롭다운 상태 관리 */
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const genderRef = useRef<HTMLDivElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef<HTMLDivElement | null>(null);
  const careerRef = useRef<HTMLDivElement | null>(null);
  const educationRef = useRef<HTMLDivElement | null>(null);

  /* 전화번호 인증 상태 */
  const [phoneCode, setPhoneCode] = useState("");
  const [isPhoneCodeSent, setIsPhoneCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  /* 메뉴 드롭다운 상태 */
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const emailFallback = useMemo(() => readJwtEmail(), []);

  useEffect(() => {
    (async () => {
      const data = await fetchMe();
      setMe(data);
    })().catch(console.error);
  }, []);

  /* 드롭다운 외부 클릭 감지 */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        genderRef.current &&
        !genderRef.current.contains(event.target as Node) &&
        locationRef.current &&
        !locationRef.current.contains(event.target as Node) &&
        positionRef.current &&
        !positionRef.current.contains(event.target as Node) &&
        careerRef.current &&
        !careerRef.current.contains(event.target as Node) &&
        educationRef.current &&
        !educationRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }

      // 메뉴 외부 클릭 감지
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const startEdit = (key: keyof UsersResponse) => {
    setEditing(key);
    setDraft({ [key]: me?.[key] ?? "" });
  };

  const cancel = () => {
    setEditing(null);
    setDraft({});
    // 전화번호 인증 상태 초기화
    setPhoneCode("");
    setIsPhoneCodeSent(false);
    setIsPhoneVerified(false);
  };

  // 전화번호 인증번호 전송
  const handleSendPhoneCode = async () => {
    const newPhone = draft.phone;
    if (!newPhone) {
      alert("전화번호를 입력해주세요.");
      return;
    }
    try {
      await api.post("/api/sms/send", { phone: newPhone });
      setIsPhoneCodeSent(true);
      alert("인증번호가 전송되었습니다.");
    } catch (e) {
      console.error(e);
      alert("인증번호 전송에 실패했습니다.");
    }
  };

  // 전화번호 인증번호 확인
  const handleVerifyPhoneCode = async () => {
    const newPhone = draft.phone;
    try {
      await api.post("/api/sms/verify", { phone: newPhone, code: phoneCode });
      setIsPhoneVerified(true);
      alert("인증이 완료되었습니다.");
    } catch (e) {
      console.error(e);
      alert("인증번호가 틀렸습니다.");
    }
  };

  const commit = async (key: keyof UsersResponse) => {
    // 전화번호 수정 시 인증 확인
    if (key === "phone" && !isPhoneVerified) {
      alert("전화번호 인증이 필요합니다.");
      return;
    }

    try {
      const payload = { [key]: draft[key] };
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

  // 회원 탈퇴
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "정말로 탈퇴하시겠습니까?\n\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다."
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    );

    if (!doubleConfirm) return;

    try {
      await api.delete("/api/users/me");
      alert("회원 탈퇴가 완료되었습니다.");

      // 로컬 스토리지 클리어
      localStorage.clear();

      // 로그인 페이지로 이동
      window.location.href = "/";
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      alert("회원 탈퇴 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            내 정보
          </h2>

          {/* 메뉴 버튼 */}
          <div className="relative -mr-4" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="메뉴"
            >
              <EllipsisVerticalIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>

            {/* 드롭다운 메뉴 */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleDeleteAccount();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  탈퇴하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 프로필 섹션 */}
        <div className="mb-4">
          <div className="flex items-center gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#006AFF] to-[#0056CC] flex items-center justify-center shadow-lg flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="white"
              viewBox="0 0 24 24"
              className="w-12 h-12 sm:w-14 sm:h-14"
            >
              <path
                fillRule="evenodd"
                d="M12 2a5 5 0 100 10 5 5 0 000-10zM4 20a8 8 0 0116 0H4z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className="ml-4">
          {editing === "nickname" ? (
            <div className="flex items-center gap-2">
              <input
                className="rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
                value={draft.nickname ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, nickname: e.target.value }))
                }
              />
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={() => commit("nickname")}>
                <Check className="text-green-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={cancel}>
                <X className="text-red-600" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-text-primary dark:text-white">
              <span className="text-lg sm:text-xl font-semibold">{me?.nickname || "닉네임 없음"}</span>
              <button
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                onClick={() => startEdit("nickname")}
              >
                <Pencil className="text-gray-400 w-4 h-4" />
              </button>
            </div>
          )}
          </div>
          </div>
        </div>

        {/* 기본 정보 섹션 */}
        <section className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-visible">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
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
                className="w-full rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
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
            <div className="flex flex-col gap-3 w-full">
              {/* 전화번호 입력 */}
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
                  value={draft.phone ?? ""}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, phone: e.target.value }));
                    setIsPhoneCodeSent(false);
                    setIsPhoneVerified(false);
                  }}
                  placeholder="전화번호를 입력하세요"
                />
                {!isPhoneVerified && (
                  <button
                    type="button"
                    onClick={handleSendPhoneCode}
                    className="px-4 py-3 text-sm font-medium text-white bg-[#006AFF] rounded-lg hover:bg-[#0056CC] whitespace-nowrap"
                  >
                    인증번호 받기
                  </button>
                )}
              </div>

              {/* 인증번호 입력 */}
              {isPhoneCodeSent && !isPhoneVerified && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    placeholder="인증번호를 입력하세요"
                    className="flex-1 rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPhoneCode}
                    disabled={!phoneCode}
                    className="px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    인증하기
                  </button>
                </div>
              )}

              {/* 인증 완료 메시지 */}
              {isPhoneVerified && (
                <p className="text-green-600 dark:text-green-400 text-sm">
                  ✓ 인증이 완료되었습니다
                </p>
              )}

              {/* 확인/취소 버튼 */}
              <div className="flex items-center gap-2">
                <button
                  className="p-2"
                  onClick={() => commit("phone")}
                  disabled={!isPhoneVerified}
                  title={!isPhoneVerified ? "인증이 필요합니다" : ""}
                >
                  <Check className={isPhoneVerified ? "text-green-600" : "text-gray-400"} />
                </button>
                <button className="p-2" onClick={cancel}>
                  <X className="text-red-600" />
                </button>
              </div>
            </div>
          </FieldRow>
            </div>
          </div>
        </section>

        {/* 이력서 자동기입정보 섹션 */}
        <section className="mb-8">
          <h3 className="text-base font-medium text-text-primary dark:text-white mb-4 px-2">이력서 자동기입정보</h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-visible">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
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
                className="rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
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
            value={ageToShow ? `${ageToShow}세` : "-"}
          />

          {/* 주소 */}
          <FieldRow
            label="주소"
            value={me?.address || "-"}
            onEdit={() => startEdit("address")}
            editing={editing === "address"}
          >
            <div className="flex items-center gap-2 w-full">
              <input
                className="w-full rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
                value={draft.address ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                placeholder="주소를 입력하세요"
              />
              <button className="p-2" onClick={() => commit("address")}>
                <Check />
              </button>
              <button className="p-2" onClick={cancel}>
                <X />
              </button>
            </div>
          </FieldRow>

          {/* 성별 */}
          <FieldRow
            label="성별"
            value={genderLabel(me?.gender)}
            onEdit={() => startEdit("gender")}
            editing={editing === "gender"}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1" ref={genderRef}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === "gender" ? null : "gender")}
                  className="w-full flex items-center justify-between rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
                >
                  <span className="truncate">{draft.gender ? GENDER_LABEL[draft.gender] : "선택하세요"}</span>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${openDropdown === "gender" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "gender" && (
                  <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        setDraft((d) => ({ ...d, gender: "MALE" }));
                        setOpenDropdown(null);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${draft.gender === "MALE" ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      남성
                    </button>
                    <button
                      onClick={() => {
                        setDraft((d) => ({ ...d, gender: "FEMALE" }));
                        setOpenDropdown(null);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${draft.gender === "FEMALE" ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      여성
                    </button>
                    <button
                      onClick={() => {
                        setDraft((d) => ({ ...d, gender: "UNKNOWN" }));
                        setOpenDropdown(null);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${draft.gender === "UNKNOWN" ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      선택 안 함
                    </button>
                  </div>
                )}
              </div>
              <button className="p-2" onClick={() => commit("gender")}>
                <Check />
              </button>
              <button className="p-2" onClick={cancel}>
                <X />
              </button>
            </div>
          </FieldRow>
            </div>
          </div>
        </section>

        {/* AI 추천공고 기입정보 섹션 */}
        <section className="mb-8">
          <h3 className="text-base font-medium text-text-primary dark:text-white mb-4 px-2">AI 추천공고 기입정보</h3>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-visible">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">

          {/* 선호지역 */}
          <FieldRow
            label="선호지역"
            value={me?.location || "-"}
            onEdit={() => startEdit("location")}
            editing={editing === "location"}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1" ref={locationRef}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === "location" ? null : "location")}
                  className="w-full flex items-center justify-between rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
                >
                  <span className="truncate">{draft.location || "선택하세요"}</span>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${openDropdown === "location" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "location" && (
                  <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-[300px] overflow-y-auto">
                    {SEOUL_DISTRICTS.map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDraft((prev) => ({ ...prev, location: d }));
                          setOpenDropdown(null);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm transition ${draft.location === d ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              <div className="relative flex-1" ref={positionRef}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === "position" ? null : "position")}
                  className="w-full flex items-center justify-between rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
                >
                  <span className="truncate">{draft.position || "선택하세요"}</span>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${openDropdown === "position" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "position" && (
                  <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {POSITION_OPTIONS.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setDraft((prev) => ({ ...prev, position: p }));
                          setOpenDropdown(null);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm transition ${draft.position === p ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              <div className="relative flex-1" ref={careerRef}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === "career" ? null : "career")}
                  className="w-full flex items-center justify-between rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
                >
                  <span className="truncate">{draft.careerLevel || "선택하세요"}</span>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${openDropdown === "career" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "career" && (
                  <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {CAREER_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setDraft((prev) => ({ ...prev, careerLevel: c }));
                          setOpenDropdown(null);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm transition ${draft.careerLevel === c ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              <div className="relative flex-1" ref={educationRef}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === "education" ? null : "education")}
                  className="w-full flex items-center justify-between rounded-lg text-[#0d141b] dark:text-white border border-[#cfdbe7] dark:border-gray-600 bg-background-light dark:bg-background-dark focus:border-[#006AFF] focus:outline-none h-14 px-4 text-base transition-all"
                >
                  <span className="truncate">{draft.education || "선택하세요"}</span>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${openDropdown === "education" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "education" && (
                  <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {EDUCATION_OPTIONS.map((e2) => (
                      <button
                        key={e2}
                        onClick={() => {
                          setDraft((prev) => ({ ...prev, education: e2 }));
                          setOpenDropdown(null);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm transition ${draft.education === e2 ? "text-[#006AFF] font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {e2}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="p-2" onClick={() => commit("education")}>
                <Check />
              </button>
              <button className="p-2" onClick={cancel}>
                <X />
              </button>
            </div>
          </FieldRow>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MyInfo;
