import React, { useState, useEffect } from "react";
import {
  TrashIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import api from "../../api/api"; // ✅ 공통 axios 인스턴스

interface Ad {
  id: number;
  title: string;
  imageUrl?: string;
}

const AdsManagement: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // ✅ 선택 관련 상태 및 함수 추가
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allSelected = ads.length > 0 && selectedIds.length === ads.length;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(ads.map((a) => a.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length}개의 광고를 삭제하시겠습니까?`)) return;

    try {
      for (const id of selectedIds) {
        await handleDelete(id);
      }
      alert("선택된 광고가 삭제되었습니다.");
      setSelectedIds([]);
    } catch (err) {
      console.error("선택삭제 실패:", err);
      alert("선택삭제 중 오류가 발생했습니다.");
    }
  };

  const itemsPerPage = 4;
  const totalPages = Math.ceil(ads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAds = ads.slice(startIndex, startIndex + itemsPerPage);

  /** ✅ 전체 광고 불러오기 */
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/api/admin/ads-management/ads");
        if (res.data.success && Array.isArray(res.data.data)) {
          const formatted = res.data.data.map((ad: any) => ({
            id: ad.id,
            title: ad.title || `광고 #${ad.id}`,
            imageUrl: ad.photo || "",
          }));
          setAds(formatted);
        } else {
          console.warn("⚠️ 광고 데이터 형식이 올바르지 않습니다.", res.data);
        }
      } catch (err: any) {
        console.error("❌ 광고 조회 실패:", err.response?.data || err.message);
        alert("광고 목록을 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAds();
  }, []);

  /** 광고 선택 */
  const handleAdClick = (ad: Ad) => setSelectedAd(ad);

  /** 이미지 업로드 */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/api/admin/ads-management/ad-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        const { adId, photo } = res.data;
        const newAd: Ad = {
          id: adId,
          title: `광고 #${adId}`,
          imageUrl: photo,
        };
        setAds((prev) => [newAd, ...prev]);
        setSelectedAd(newAd);
        alert("광고가 성공적으로 등록되었습니다!");
      } else {
        alert("업로드 실패: " + res.data.message);
      }
    } catch (err: any) {
      console.error("❌ 업로드 에러:", err.response?.data || err.message);
      alert("파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      e.target.value = ""; // 동일 파일 재선택 가능하도록 초기화
    }
  };

  /** 광고 삭제 */
  const handleDelete = async (adId: number) => {
    const targetAd = ads.find((a) => a.id === adId);
    if (!targetAd) return;

    const confirmDelete = window.confirm("정말로 이 광고를 삭제하시겠습니까?");
    if (!confirmDelete) return;

    try {
      if (targetAd.imageUrl) {
        const res = await api.delete("/api/admin/ads-management/file", {
          params: { fileUrl: targetAd.imageUrl, adId }, // ✅ adId 포함
        });

        if (res.data.success) {
          console.log("🗑️ 파일 및 DB 초기화 완료:", targetAd.imageUrl);
        } else {
          console.warn("⚠️ 삭제 실패:", res.data.message);
        }
      }

      setAds((prev) => prev.filter((ad) => ad.id !== adId));
      if (selectedAd?.id === adId) setSelectedAd(null);
      alert("광고 항목이 삭제되었습니다.");
    } catch (err: any) {
      console.error("❌ 삭제 에러:", err.response?.data || err.message);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  /** 페이지 변경 */
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="p-8 h-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">광고 관리</h2>
      {/* ✅ 전체선택 + 선택삭제 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="w-4 h-4 accent-blue-600"
          />
          <span className="text-sm text-gray-700">전체 선택</span>
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-sm"
          >
            선택 삭제 ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* 좌측: 업로드/미리보기 */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="광고 이미지 업로드"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                readOnly
              />
              <label
                className={`${isUploading ? "bg-gray-200" : "bg-blue-100 hover:bg-blue-200"
                  } text-blue-600 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap`}
              >
                {isUploading ? "업로드 중..." : "등록"}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
            {selectedAd?.imageUrl ? (
              <img
                src={selectedAd.imageUrl}
                alt={selectedAd.title}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-400">
                <PhotoIcon className="w-16 h-16 mx-auto mb-2 opacity-30" />
                <p className="text-sm">사진 상세 보기 영역</p>
                <p className="text-xs mt-1">우측 목록에서 광고를 선택하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 목록 */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6 overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-gray-500 mt-10">📦 광고 불러오는 중...</p>
            ) : currentAds.length === 0 ? (
              <p className="text-center text-gray-400 mt-10">등록된 광고가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 items-start">
                {currentAds.map((ad) => (
                  <div
                    key={ad.id}
                    onClick={() => handleAdClick(ad)}
                    className={`relative bg-gray-50 rounded-lg border-2 transition cursor-pointer overflow-hidden ${selectedAd?.id === ad.id
                        ? "border-blue-500 shadow-lg"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }`}
                  >
                    {/* ✅ 개별 선택 체크박스 — 카드 상단 좌측에 절대 위치 */}
                    <div
                      className="absolute top-2 left-2 bg-white bg-opacity-80 backdrop-blur-sm rounded shadow-sm p-0.5 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(ad.id)}
                        onChange={() => toggleSelect(ad.id)}
                        className="w-4 h-4 accent-blue-600"
                      />
                    </div>

                    <div className="h-48 flex items-center justify-center bg-gray-100">
                      {ad.imageUrl ? (
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PhotoIcon className="w-12 h-12 text-gray-300" />
                      )}
                    </div>

                    <div className="p-3 flex items-center justify-between bg-white">
                      <span className="text-sm text-gray-700 font-medium truncate">
                        {ad.title}
                      </span>
                      <TrashIcon
                        className="w-5 h-5 text-gray-400 hover:text-red-500 cursor-pointer ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(ad.id);
                        }}
                      />
                    </div>
                  </div>

                ))}
              </div>
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 rounded-md text-sm transition ${currentPage === i + 1
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdsManagement;
