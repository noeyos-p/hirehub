import React, { useState, useEffect } from "react";
import { TrashIcon, PhotoIcon, PencilIcon, XMarkIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { adminApi } from "../../api/adminApi";
import type { AdminCompany, AdminPageInfo } from "../../types/interface";

// 신규 등록용: id 제외
type NewCompany = Omit<AdminCompany, "id">;

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [pageInfo, setPageInfo] = useState<AdminPageInfo>({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);
  // ✅ 선택 상태 추가
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allSelected = companies.length > 0 && selectedIds.length === companies.length;

  // ✅ 선택 토글 함수
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ✅ 전체 선택 / 해제
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(companies.map((c) => c.id));
  };
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<AdminCompany | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCompany, setNewCompany] = useState<NewCompany>({
    name: "",
    content: "",
    address: "",
    since: new Date().getFullYear(),
    benefits: "",
    website: "",
    industry: "",
    ceo: "",
    photo: "",
    count: "",
    companyType: "",
  });
  const [postcode, setPostcode] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [editPostcode, setEditPostcode] = useState("");
  const [editDetailAddress, setEditDetailAddress] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  // 복리후생 관리
  const [benefitsList, setBenefitsList] = useState<string[]>([]);
  const [benefitInput, setBenefitInput] = useState("");
  const [editBenefitsList, setEditBenefitsList] = useState<string[]>([]);
  const [editBenefitInput, setEditBenefitInput] = useState("");

  const pageSize = 6;
  const handleBulkDelete = async () => {
    if (!window.confirm(`${selectedIds.length}개의 기업을 삭제하시겠습니까?`)) return;

    try {
      for (const id of selectedIds) {
        await adminApi.deleteCompany(id);
      }
      alert("선택된 기업이 삭제되었습니다.");
      setSelectedIds([]);
      fetchCompanies(currentPage, searchKeyword);
    } catch (err) {
      console.error("선택삭제 실패:", err);
      alert("선택삭제 중 오류가 발생했습니다.");
    }
  };

  /** ✅ 회사 목록 불러오기 */
  const fetchCompanies = async (page: number = 0, keyword: string = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCompanies({
        page,
        size: pageSize,
        sortBy: "id",
        direction: "DESC",
        keyword
      });
      if (res.success) {
        setCompanies(res.data);
        setPageInfo({
          totalElements: res.totalElements,
          totalPages: res.totalPages,
          currentPage: res.currentPage,
        });
        setCurrentPage(page);
      } else {
        setError(res.message || "회사 목록을 불러올 수 없습니다.");
      }
    } catch (err: any) {
      console.error("회사 목록 불러오기 실패:", err);
      setError(err.message || "서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(0);
  }, []);

  // ✅ 우편번호 검색 함수 (신규 등록)
  const handlePostcodeSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        // 도로명 주소와 지번 주소 중 선택
        const fullAddress = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
        setPostcode(data.zonecode);
        setNewCompany({ ...newCompany, address: `[${data.zonecode}] ${fullAddress}` });
      }
    }).open();
  };

  // ✅ 우편번호 검색 함수 (수정)
  const handleEditPostcodeSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        const fullAddress = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
        setEditPostcode(data.zonecode);
        if (editFormData) {
          setEditFormData({ ...editFormData, address: `[${data.zonecode}] ${fullAddress}` });
        }
      }
    }).open();
  };

  // ✅ 복리후생 추가 (신규)
  const addBenefit = () => {
    if (benefitInput.trim()) {
      setBenefitsList([...benefitsList, benefitInput.trim()]);
      setBenefitInput("");
    }
  };

  // ✅ 복리후생 삭제 (신규)
  const removeBenefit = (index: number) => {
    setBenefitsList(benefitsList.filter((_, i) => i !== index));
  };

  // ✅ 복리후생 추가 (수정)
  const addEditBenefit = () => {
    if (editBenefitInput.trim()) {
      setEditBenefitsList([...editBenefitsList, editBenefitInput.trim()]);
      setEditBenefitInput("");
    }
  };

  // ✅ 복리후생 삭제 (수정)
  const removeEditBenefit = (index: number) => {
    setEditBenefitsList(editBenefitsList.filter((_, i) => i !== index));
  };

  // ✅ 신규 등록 버튼 클릭 시
  const openCreateModal = () => {
    setNewCompany({
      name: "",
      content: "",
      address: "",
      since: new Date().getFullYear(),
      benefits: "",
      website: "",
      industry: "",
      ceo: "",
      photo: "",
      count: "",
      companyType: "",
    });
    setPostcode("");
    setDetailAddress("");
    setBenefitsList([]);
    setBenefitInput("");
    setPreview(null);
    setIsCreateModalOpen(true);
  };


  /** ✅ 신규 등록 */
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 상세주소를 포함한 최종 주소 생성
      const finalAddress =
        newCompany.address +
        (detailAddress ? ` ${detailAddress}` : "");

      console.log("📤 [기업 등록 요청 데이터]", {
        ...newCompany,
        address: finalAddress,
        benefitsList: benefitsList
      });

      // id 없이 전송 (insert 처리)
      const res = await adminApi.createCompany({
        ...newCompany,
        address: finalAddress,
        benefitsList: benefitsList
      });

      console.log("📥 [서버 응답]", res);

      if (res.success) {
        const createdCompany = res.data;
        console.log("✅ 기업 등록 성공:", createdCompany);

        // 이미지 업로드가 있다면 바로 업로드
        if (preview) {
          try {
            const formData = new FormData();
            const blob = await fetch(preview).then((r) => r.blob());
            formData.append("file", new File([blob], "company-photo.png", { type: "image/png" }));
            formData.append("companyId", createdCompany.id.toString());
            await adminApi.uploadCompanyImage(createdCompany.id, formData);
          } catch (imgErr) {
            console.error("❌ 이미지 업로드 실패:", imgErr);
          }
        }
        alert("기업 등록 완료!");
        setIsCreateModalOpen(false);
        fetchCompanies(0, "");
        setSearchKeyword("");
      } else {
        console.error("❌ 등록 실패 응답:", res);
        alert("등록 실패: " + (res.message || "서버 오류"));
      }
    } catch (err: any) {
      console.error("❌❌❌ [기업 등록 오류] ❌❌❌");
      console.error("Error object:", err);
      console.error("Error message:", err?.message);
      console.error("Error response:", err?.response);
      console.error("Error response data:", err?.response?.data);
      console.error("Error response status:", err?.response?.status);
      console.error("Full error:", JSON.stringify(err, null, 2));
      alert("등록 중 오류가 발생했습니다: " + (err?.response?.data?.message || err?.message || "알 수 없는 오류"));
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

  // ✅ 신규 등록 모달
  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold">신규 기업 등록</h3>
          <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
          {/* ✅ 상단 이미지 */}
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-64 object-cover rounded-lg mb-3" />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
              <PhotoIcon className="w-16 h-16 text-gray-400" />
            </div>
          )}
          <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100">
            <PhotoIcon className="w-5 h-5" />
            <span>이미지 업로드</span>
            <input type="file" accept="image/*" onChange={handlePreviewChange} className="hidden" />
          </label>

          {/* ✅ 폼 입력 */}
          {[
            { label: "회사명", key: "name" },
            { label: "대표자명", key: "ceo" },
            { label: "업종", key: "industry" },
            { label: "홈페이지", key: "website" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium">{f.label}</label>
              <input
                type="text"
                value={(newCompany as any)[f.key]}
                onChange={(e) => setNewCompany({ ...newCompany, [f.key]: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          ))}

          {/* ✅ 사원수 */}
          <div>
            <label className="block text-sm font-medium">사원수</label>
            <input
              type="text"
              value={newCompany.count}
              onChange={(e) => setNewCompany({ ...newCompany, count: e.target.value })}
              placeholder="예: 50명, 100-500명"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* ✅ 기업구분 */}
          <div>
            <label className="block text-sm font-medium">기업구분</label>
            <select
              value={newCompany.companyType}
              onChange={(e) => setNewCompany({ ...newCompany, companyType: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">선택</option>
              <option value="대기업">대기업</option>
              <option value="중견기업">중견기업</option>
              <option value="중소기업">중소기업</option>
            </select>
          </div>

          {/* ✅ 주소 검색 */}
          <div>
            <label className="block text-sm font-medium mb-1">주소</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={postcode}
                placeholder="우편번호"
                readOnly
                className="w-32 border rounded px-3 py-2 bg-gray-50"
              />
              <button
                type="button"
                onClick={handlePostcodeSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                우편번호 검색
              </button>
            </div>
            <input
              type="text"
              value={newCompany.address}
              placeholder="주소"
              readOnly
              className="w-full border rounded px-3 py-2 bg-gray-50 mb-2"
              required
            />
            <input
              type="text"
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
              placeholder="상세주소"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* ✅ 복리후생 입력 */}
          <div>
            <label className="block text-sm font-medium mb-1">복리후생</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                placeholder="복리후생 입력 (예: 4대보험, 연차)"
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                type="button"
                onClick={addBenefit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                추가
              </button>
            </div>
            {benefitsList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {benefitsList.map((benefit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {benefit}
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="text-blue-900 hover:text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">설립년도</label>
            <input
              type="number"
              value={newCompany.since}
              onChange={(e) => setNewCompany({ ...newCompany, since: parseInt(e.target.value) || new Date().getFullYear() })}
              min="1900"
              max={new Date().getFullYear()}
              placeholder="예: 2020"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">회사 소개</label>
            <textarea
              value={newCompany.content}
              onChange={(e) => setNewCompany({ ...newCompany, content: e.target.value })}
              className="w-full border rounded px-3 py-2 h-32"
              required
            />
          </div>

          {/* ✅ 버튼 */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              취소
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              등록 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );



  // ✅ 페이지 변경
  const handlePageChange = (page: number) => {
    fetchCompanies(page, searchKeyword);
  };


  /** ✅ 회사 수정 */
  const handleEditClick = (e: React.MouseEvent, company: AdminCompany) => {
    e.stopPropagation();

    let addr = company.address || "";

    // 1️⃣ 우편번호 분리
    let extractedPostcode = "";
    const postcodeMatch = addr.match(/^\[(\d{5})\]\s*(.*)$/);
    if (postcodeMatch) {
      extractedPostcode = postcodeMatch[1];
      addr = postcodeMatch[2]; // 나머지 주소만 남김
    }

    // 2️⃣ 도로명 + 상세주소 분리
    const roadRegex = /^(.+(?:로|길|대로)\s?\d+)\s+(.*)$/;
    const match = addr.match(roadRegex);

    const road = match ? match[1] : addr;
    const detail = match ? match[2] : "";

    // 3️⃣ 단 한 번만 호출해서 모든 값 저장
    setEditPostcode(extractedPostcode);          // 우편번호
    setEditDetailAddress(detail.trim());        // 상세주소
    //복리후생
    setEditBenefitsList(company.benefitsList || []);
    setEditBenefitInput("");

    setEditFormData({
      ...company,
      address: road,                            // 도로명 주소만 저장
    });

    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    try {
      // 상세주소를 포함한 최종 주소 생성
      const finalAddress = editDetailAddress
        ? `${editFormData.address} ${editDetailAddress}`
        : editFormData.address;

      console.log("📤 [기업 수정 요청 데이터]", {
        ...editFormData,
        address: finalAddress,
        benefitsList: editBenefitsList
      });

      const res = await adminApi.updateCompany(editFormData.id, {
        ...editFormData,
        address: finalAddress,
        benefitsList: editBenefitsList
      });

      console.log("📥 [서버 응답]", res);

      if (res.success) {
        console.log("✅ 기업 수정 성공");
        alert("수정 완료");
        setIsEditModalOpen(false);
        fetchCompanies(currentPage, searchKeyword);
      } else {
        console.error("❌ 수정 실패 응답:", res);
        alert("수정 실패: " + (res.message || "서버 오류"));
      }
    } catch (err: any) {
      console.error("❌❌❌ [기업 수정 오류] ❌❌❌");
      console.error("Error object:", err);
      console.error("Error message:", err?.message);
      console.error("Error response:", err?.response);
      console.error("Error response data:", err?.response?.data);
      console.error("Error response status:", err?.response?.status);
      console.error("Full error:", JSON.stringify(err, null, 2));
      alert("수정에 실패했습니다: " + (err?.response?.data?.message || err?.message || "알 수 없는 오류"));
    }
  };

  /** ✅ 회사 삭제 */
  const handleDelete = async (e: React.MouseEvent, companyId: number) => {
    e.stopPropagation();
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await adminApi.deleteCompany(companyId);
      if (res.success) {
        alert("삭제 완료");
        if (companies.length === 1 && currentPage > 0) {
          fetchCompanies(currentPage - 1, searchKeyword);
        } else {
          fetchCompanies(currentPage, searchKeyword);
        }
        if (selectedCompany?.id === companyId) setSelectedCompany(null);
      } else {
        alert("삭제 실패: " + (res.message || "서버 오류"));
      }
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제에 실패했습니다.");
    }
  };

  // ✅ 회사 이미지 삭제 함수
  const handleImageDelete = async (e: React.MouseEvent, company: AdminCompany) => {
    e.stopPropagation();

    if (!company.photo) {
      alert("삭제할 이미지가 없습니다.");
      return;
    }

    if (!window.confirm("이미지를 삭제하시겠습니까?")) return;

    try {
      const res = await adminApi.deleteCompanyImage(company.id);

      if (res.success) {
        alert("이미지 삭제 완료!");

        // 목록 갱신
        setCompanies(companies.map(c =>
          c.id === company.id ? { ...c, photo: undefined } : c
        ));

        // 상세 모달에서도 반영
        if (selectedCompany?.id === company.id) {
          setSelectedCompany({ ...selectedCompany, photo: undefined });
        }
      } else {
        alert("이미지 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error("이미지 삭제 실패:", err);
      alert("이미지 삭제 중 오류가 발생했습니다.");
    }
  };


  /** ✅ 파일 업로드 (S3) */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompany) return;

    const formData = new FormData();
    formData.append("companyId", selectedCompany.id.toString());
    formData.append("file", file);

    try {
      const res = await adminApi.uploadCompanyImage(selectedCompany.id, formData);

      if (res.success) {
        alert("이미지 업로드 성공!");
        const newUrl = `${res.fileUrl}?t=${Date.now()}`;
        setSelectedCompany({ ...selectedCompany, photo: newUrl });
        setCompanies(companies.map(c => c.id === selectedCompany.id ? { ...c, photo: newUrl } : c));
      } else {
        alert("이미지 업로드 실패: " + (res.message || "서버 오류"));
      }
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  // ✅ 페이지네이션 렌더링
  const renderPagination = () => {
    const { totalPages, currentPage } = pageInfo;
    if (totalPages <= 1) return null;

    return (
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
    );
  };

  return (
    <div className="p-4 md:p-8 h-full bg-gray-50">
      {/* 타이틀 및 검색 */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">기업 관리</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            <span>신규 기업 등록</span>
          </button>
        </div>

        {/* ✅ 검색 폼 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCompanies(0, searchKeyword);
          }}
          className="flex flex-col md:flex-row w-full md:w-auto gap-2"
        >
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="기업명 검색"
            className="border rounded px-3 py-2 text-sm w-full md:w-64"
          />
          <div className="flex w-full md:w-auto gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex-1 md:flex-none whitespace-nowrap"
            >
              검색
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchKeyword("");
                fetchCompanies(0, "");
              }}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 flex-1 md:flex-none whitespace-nowrap"
            >
              초기화
            </button>
          </div>
        </form>
      </div>
      {/* ✅ 전체선택 + 선택삭제 영역 */}
      <div className="flex items-center gap-3 mb-4 min-h-[36px]">
        <label className="relative flex items-center gap-2 cursor-pointer group flex-shrink-0">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="sr-only peer"
          />
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${allSelected
            ? 'bg-blue-600 border-blue-600'
            : 'bg-white border-gray-300 group-hover:border-blue-400'
            }`}>
            {allSelected && (
              <svg className="w-3.5 h-3.5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 flex-shrink-0">전체 선택</span>
        </label>

        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex-shrink-0"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            선택삭제 ({selectedIds.length})
          </button>
        )}
      </div>

      {/* 로딩 / 에러 */}
      {loading && <p className="text-center text-gray-500">불러오는 중...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* 회사 목록 */}
      {!loading && !error && companies.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`relative bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer ${selectedIds.includes(company.id) ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                onClick={() => setSelectedCompany(company)}
              >
                {/* ✅ 개별 선택 체크박스 */}
                <div
                  className="absolute top-3 right-3 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <label className="relative flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(company.id)}
                      onChange={() => toggleSelect(company.id)}
                      className="sr-only peer"
                    />
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.includes(company.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300 hover:border-blue-400'
                      }`}>
                      {selectedIds.includes(company.id) && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </label>
                </div>
                {company.photo ? (
                  <img src={company.photo} alt={company.name} className="w-full h-48 object-contain bg-gray-50 rounded-md mb-3 border border-gray-100" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <h3 className="font-bold text-lg mb-2">{company.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{company.industry}</p>
                <p className="text-sm text-gray-600 mb-1">대표: {company.ceo}</p>
                {company.companyType && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mr-1">
                      {company.companyType}
                    </span>
                  </p>
                )}
                {company.count && <p className="text-sm text-gray-600 mb-1">사원수: {company.count}</p>}
                <p className="text-sm text-gray-600 mb-1">설립: {company.since}</p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={(e) => handleEditClick(e, company)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    <PencilIcon className="w-4 h-4" />
                    수정
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, company.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    <TrashIcon className="w-4 h-4" />
                    삭제
                  </button>

                  <button
                    onClick={(e) => handleImageDelete(e, company)}
                    disabled={!company.photo}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded 
    ${company.photo
                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  >
                    <PhotoIcon className="w-4 h-4" />
                    <span className="text-sm">이미지 삭제</span>
                  </button>

                </div>
              </div>
            ))}
          </div>
          {renderPagination()}
        </>
      )}



      {/* 상세보기 모달 */}
      {selectedCompany && !isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCompany(null)}>
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{selectedCompany.name}</h2>
              <button onClick={() => setSelectedCompany(null)} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">
                ×
              </button>
            </div>

            {selectedCompany.photo ? (
              <img src={selectedCompany.photo} alt={selectedCompany.name} className="w-full h-64 object-contain bg-gray-50 rounded-lg mb-4 border border-gray-100" />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <PhotoIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}

            {/* 이미지 업로드 */}
            <div className="mb-6">
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100">
                <PhotoIcon className="w-5 h-5" />
                <span>이미지 업로드</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-3 text-gray-700">
              <p><strong>대표자명:</strong> {selectedCompany.ceo}</p>
              <p><strong>설립년도:</strong> {selectedCompany.since}</p>
              {selectedCompany.companyType && <p><strong>기업구분:</strong> {selectedCompany.companyType}</p>}
              {selectedCompany.count && <p><strong>사원수:</strong> {selectedCompany.count}</p>}
              <p><strong>주소:</strong> {selectedCompany.address}</p>
              <p><strong>업종:</strong> {selectedCompany.industry}</p>
              <div>
                <p className="font-semibold text-gray-700 mb-2">복리후생</p>
                {selectedCompany.benefitsList && selectedCompany.benefitsList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.benefitsList.map((benefit, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">등록된 복리후생이 없습니다.</p>
                )}
              </div>
              <p><strong>홈페이지:</strong> <a href={selectedCompany.website} target="_blank" className="text-blue-600 underline">{selectedCompany.website}</a></p>
              <div>
                <p className="font-semibold text-gray-700">회사 소개</p>
                <p className="whitespace-pre-wrap">{selectedCompany.content}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">기업 수정</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium">회사명</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">대표자명</label>
                <input
                  type="text"
                  value={editFormData.ceo}
                  onChange={(e) => setEditFormData({ ...editFormData, ceo: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              {/* ✅ 주소 검색 (수정) */}
              <div>
                <label className="block text-sm font-medium mb-1">주소</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editPostcode}
                    placeholder="우편번호"
                    readOnly
                    className="w-32 border rounded px-3 py-2 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={handleEditPostcodeSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    우편번호 검색
                  </button>
                </div>
                <input
                  type="text"
                  value={editFormData.address}
                  placeholder="주소"
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-gray-50 mb-2"
                />
                <input
                  type="text"
                  value={editDetailAddress}
                  onChange={(e) => setEditDetailAddress(e.target.value)}
                  placeholder="상세주소"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">업종</label>
                <input
                  type="text"
                  value={editFormData.industry}
                  onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">홈페이지</label>
                <input
                  type="text"
                  value={editFormData.website}
                  onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              {/* ✅ 사원수 (수정) */}
              <div>
                <label className="block text-sm font-medium">사원수</label>
                <input
                  type="text"
                  value={editFormData.count || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, count: e.target.value })}
                  placeholder="예: 50명, 100-500명"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              {/* ✅ 기업구분 (수정) */}
              <div>
                <label className="block text-sm font-medium">기업구분</label>
                <select
                  value={editFormData.companyType || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, companyType: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">선택</option>
                  <option value="대기업">대기업</option>
                  <option value="중견기업">중견기업</option>
                  <option value="중소기업">중소기업</option>
                </select>
              </div>
              {/* ✅ 복리후생 입력 (수정) */}
              <div>
                <label className="block text-sm font-medium mb-1">복리후생</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editBenefitInput}
                    onChange={(e) => setEditBenefitInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEditBenefit())}
                    placeholder="복리후생 입력 (예: 4대보험, 연차)"
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={addEditBenefit}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    추가
                  </button>
                </div>
                {editBenefitsList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editBenefitsList.map((benefit, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {benefit}
                        <button
                          type="button"
                          onClick={() => removeEditBenefit(index)}
                          className="text-blue-900 hover:text-red-600 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">설립년도</label>
                <input
                  type="number"
                  value={editFormData.since}
                  onChange={(e) => setEditFormData({ ...editFormData, since: parseInt(e.target.value) || new Date().getFullYear() })}
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="예: 2020"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">회사 소개</label>
                <textarea
                  value={editFormData.content}
                  onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                  className="w-full border rounded px-3 py-2 h-32"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  수정 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isCreateModalOpen && renderCreateModal()}

    </div>
  );
};

export default CompanyManagement;
