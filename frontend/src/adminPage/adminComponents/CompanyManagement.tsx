import React, { useState, useEffect } from "react";
import { TrashIcon, PhotoIcon, PencilIcon, XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import api from "../../api/api";

interface Company {
  id: number;
  name: string;
  content: string;
  address: string;
  since: string;
  benefits: string;
  website: string;
  industry: string;
  ceo: string;
  photo?: string;
}

interface PageInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
}


// 신규 등록용: id 제외
type NewCompany = Omit<Company, "id">;

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
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
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCompany, setNewCompany] = useState<NewCompany>({
    name: "",
    content: "",
    address: "",
    since: "",
    benefits: "",
    website: "",
    industry: "",
    ceo: "",
    photo: "",
  });
  const [preview, setPreview] = useState<string | null>(null);

  const pageSize = 6;
  const handleBulkDelete = async () => {
    if (!window.confirm(`${selectedIds.length}개의 기업을 삭제하시겠습니까?`)) return;

    try {
      for (const id of selectedIds) {
        await api.delete(`/api/admin/company-management/${id}`);
      }
      alert("선택된 기업이 삭제되었습니다.");
      setSelectedIds([]);
      fetchCompanies(currentPage);
    } catch (err) {
      console.error("선택삭제 실패:", err);
      alert("선택삭제 중 오류가 발생했습니다.");
    }
  };

  /** ✅ 회사 목록 불러오기 */
  const fetchCompanies = async (page: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/admin/company-management", {
        params: { page, size: pageSize, sortBy: "id", direction: "DESC" },
      });
      if (res.data.success) {
        setCompanies(res.data.data);
        setPageInfo({
          totalElements: res.data.totalElements,
          totalPages: res.data.totalPages,
          currentPage: res.data.currentPage,
        });
        setCurrentPage(page);
      } else {
        setError(res.data.message || "회사 목록을 불러올 수 없습니다.");
      }
    } catch (err: any) {
      console.error("회사 목록 불러오기 실패:", err);
      setError(err.response?.data?.message || "서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(0);
  }, []);

  // ✅ 신규 등록 버튼 클릭 시
  const openCreateModal = () => {
    setNewCompany({
      name: "",
      content: "",
      address: "",
      since: "",
      benefits: "",
      website: "",
      industry: "",
      ceo: "",
      photo: "",
    });
    setPreview(null);
    setIsCreateModalOpen(true);
  };


  /** ✅ 신규 등록 */
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // id 없이 전송 (insert 처리)
      const res = await api.post("/api/admin/company-management", newCompany);
      if (res.data.success) {
        const createdCompany = res.data.data;
        // 이미지 업로드가 있다면 바로 업로드
        if (preview) {
          const formData = new FormData();
          const blob = await fetch(preview).then((r) => r.blob());
          formData.append("file", new File([blob], "company-photo.png", { type: "image/png" }));
          await api.post(`/api/admin/company-management/${createdCompany.id}/image`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
        alert("기업 등록 완료!");
        setIsCreateModalOpen(false);
        fetchCompanies(0);
      } else {
        alert("등록 실패: " + (res.data.message || "서버 오류"));
      }
    } catch (err) {
      console.error("등록 실패:", err);
      alert("등록 중 오류가 발생했습니다.");
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
            { label: "주소", key: "address" },
            { label: "업종", key: "industry" },
            { label: "홈페이지", key: "website" },
            { label: "복리후생", key: "benefits" },
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
          <div>
            <label className="block text-sm font-medium">설립년도</label>
            <input
              type="date"
              value={newCompany.since}
              onChange={(e) => setNewCompany({ ...newCompany, since: e.target.value })}
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
    fetchCompanies(page);
  };


  /** ✅ 회사 수정 */
  const handleEditClick = (e: React.MouseEvent, company: Company) => {
    e.stopPropagation();
    setEditFormData({ ...company });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    try {
      const res = await api.put(`/api/admin/company-management/${editFormData.id}`, editFormData);
      if (res.data.success) {
        alert("수정 완료");
        setIsEditModalOpen(false);
        fetchCompanies(currentPage);
      }
    } catch (err) {
      console.error("수정 실패:", err);
      alert("수정에 실패했습니다.");
    }
  };

  /** ✅ 회사 삭제 */
  const handleDelete = async (e: React.MouseEvent, companyId: number) => {
    e.stopPropagation();
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await api.delete(`/api/admin/company-management/${companyId}`);
      if (res.data.success) {
        alert("삭제 완료");
        if (companies.length === 1 && currentPage > 0) {
          fetchCompanies(currentPage - 1);
        } else {
          fetchCompanies(currentPage);
        }
        if (selectedCompany?.id === companyId) setSelectedCompany(null);
      }
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제에 실패했습니다.");
    }
  };

  // ✅ 회사 이미지 삭제 함수
  const handleImageDelete = async (e: React.MouseEvent, company: Company) => {
    e.stopPropagation();

    if (!company.photo) {
      alert("삭제할 이미지가 없습니다.");
      return;
    }

    if (!window.confirm("이미지를 삭제하시겠습니까?")) return;

    try {
      const res = await api.delete(`/api/admin/company-management/${company.id}/image`);

      if (res.data.success) {
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
      const res = await api.post(
        `/api/admin/company-management/${selectedCompany.id}/image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        alert("이미지 업로드 성공!");
        setSelectedCompany({ ...selectedCompany, photo: res.data.fileUrl });
        setCompanies(companies.map(c => c.id === selectedCompany.id ? { ...c, photo: res.data.fileUrl } : c));
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

    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages + 2) {
      // 페이지가 적으면 모두 표시
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 많으면 생략(...) 사용
      if (currentPage <= 2) {
        // 앞부분
        for (let i = 0; i < maxVisiblePages; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        // 뒷부분
        pageNumbers.push(0);
        pageNumbers.push('...');
        for (let i = totalPages - maxVisiblePages; i < totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // 중간부분
        pageNumbers.push(0);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages - 1);
      }
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        {/* 이전 버튼 */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &lt;
        </button>

        {/* 페이지 번호 */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-4 py-2 rounded-lg border transition-colors ${currentPage === pageNum
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              {pageNum + 1}
            </button>
          );
        })}

        {/* 다음 버튼 */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &gt;
        </button>
      </div>
    );
  };

  return (
    <div className="p-8 h-full bg-gray-50">
      {/* 타이틀 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">기업 관리</h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-100 text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" /> 신규
        </button>
      </div>
      {/* ✅ 전체선택 + 선택삭제 영역 */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          className="w-4 h-4 accent-blue-600"
        />
        <span className="text-sm text-gray-700">전체 선택</span>

        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="ml-3 bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-sm"
          >
            선택 삭제
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
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelectedCompany(company)}
              >
                {/* ✅ 개별 체크박스 추가 */}
                <div className="flex justify-between items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(company.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelect(company.id);
                    }}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-xs text-gray-500">ID: {company.id}</span>

                </div>
                {company.photo ? (
                  <img src={company.photo} alt={company.name} className="w-full h-48 object-cover rounded-md mb-3" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <h3 className="font-bold text-lg mb-2">{company.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{company.industry}</p>
                <p className="text-sm text-gray-600 mb-1">대표: {company.ceo}</p>
                <p className="text-sm text-gray-600 mb-1">주소: {company.address}</p>
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
              <img src={selectedCompany.photo} alt={selectedCompany.name} className="w-full h-64 object-cover rounded-lg mb-4" />
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
              <p><strong>주소:</strong> {selectedCompany.address}</p>
              <p><strong>업종:</strong> {selectedCompany.industry}</p>
              <p><strong>복리후생:</strong> {selectedCompany.benefits}</p>
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
              <div>
                <label className="block text-sm font-medium">주소</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
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
              <div>
                <label className="block text-sm font-medium">복리후생</label>
                <input
                  type="text"
                  value={editFormData.benefits}
                  onChange={(e) => setEditFormData({ ...editFormData, benefits: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">설립년도</label>
                <input
                  type="date"
                  value={editFormData.since}
                  onChange={(e) => setEditFormData({ ...editFormData, since: e.target.value })}
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
