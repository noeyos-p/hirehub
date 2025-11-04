import React, { useState, useEffect } from "react";
import { TrashIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";
import api from "../../api/api";

interface Review {
  id: number;
  score: number;
  content: string | null;
  usersId: number;
  nickname: string | null;
  companyId: number;
  companyName: string | null;
}

const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editReview, setEditReview] = useState<Review | null>(null);

  const pageSize = 10;

  // 리뷰 목록 불러오기
  const fetchReviews = async (page: number = 0) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/admin/reviews", {
        params: {
          page,
          size: pageSize,
          sortBy: "id",
          direction: "DESC",
        },
      });

      const data = response.data;
      // DTO 기반 Page 구조
      setReviews(data.content || []);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(page);
    } catch (err: any) {
      console.error("❌ 리뷰 목록 조회 실패:", err);
      setError(err.response?.data?.message || "리뷰 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(0);
  }, []);

  // 리뷰 삭제
  const handleDelete = async (reviewId: number) => {
    if (!window.confirm("정말 이 리뷰를 삭제하시겠습니까?")) return;

    try {
      await api.delete(`/api/admin/reviews/${reviewId}`);
      alert("리뷰가 삭제되었습니다.");

      // 마지막 항목 삭제 시 페이지 이동 처리
      if (reviews.length === 1 && currentPage > 0) {
        fetchReviews(currentPage - 1);
      } else {
        fetchReviews(currentPage);
      }
    } catch (err: any) {
      console.error("❌ 리뷰 삭제 실패:", err);
      alert(err.response?.data?.message || "리뷰 삭제 중 오류가 발생했습니다.");
    }
  };

  // 리뷰 수정 모달 열기
  const handleEdit = (review: Review) => {
    setEditReview({ ...review });
    setIsEditModalOpen(true);
  };

  // 리뷰 수정 제출
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReview) return;

    try {
      await api.put(`/api/admin/reviews/${editReview.id}`, {
        content: editReview.content,
        score: editReview.score,
      });

      alert("리뷰 수정 완료!");
      setIsEditModalOpen(false);
      fetchReviews(currentPage);
    } catch (err: any) {
      console.error("❌ 리뷰 수정 실패:", err);
      alert(err.response?.data?.message || "리뷰 수정 중 오류가 발생했습니다.");
    }
  };

  // 별점 렌더링
  const renderStars = (score: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= score ? "text-yellow-400 fill-current" : "text-gray-300"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  // 검색 필터
  const filteredReviews = reviews.filter((review) =>
    (review.nickname || "").toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // 페이지네이션 렌더링
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 5);

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => fetchReviews(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          이전
        </button>

        {Array.from({ length: endPage - startPage }, (_, i) => {
          const page = startPage + i;
          return (
            <button
              key={page}
              onClick={() => fetchReviews(page)}
              className={`px-4 py-2 rounded-lg border ${
                currentPage === page
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {page + 1}
            </button>
          );
        })}

        <button
          onClick={() => fetchReviews(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          다음
        </button>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">리뷰 관리</h2>

        <div className="flex items-center border border-gray-300 rounded-full px-3 py-1 w-64">
          <input
            type="text"
            placeholder="작성자 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm outline-none"
          />
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {loading && <div className="text-center py-8 text-gray-500">로딩 중...</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="flex justify-between items-center border border-gray-100 bg-white rounded-md px-4 py-3 hover:bg-gray-50 transition">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm font-semibold text-gray-800">{review.companyName}</div>
                    {renderStars(review.score)}
                  </div>
                  <div className="text-sm text-gray-600">작성자: {review.nickname || "익명"}</div>
                  <div className="text-sm text-gray-700 mt-1 line-clamp-1">{review.content}</div>
                </div>
                <div className="flex space-x-3">
                  <PencilIcon onClick={() => handleEdit(review)} className="w-5 h-5 text-gray-400 hover:text-gray-700 cursor-pointer" />
                  <TrashIcon onClick={() => handleDelete(review.id)} className="w-5 h-5 text-gray-400 hover:text-red-500 cursor-pointer" />
                </div>
              </div>
            ))}
          </div>

          {filteredReviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">{searchQuery ? "검색 결과가 없습니다." : "리뷰가 없습니다."}</div>
          )}

          {renderPagination()}
        </>
      )}

      {/* 수정 모달 */}
      {isEditModalOpen && editReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">리뷰 수정</h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">평점 (1~5)</label>
                <input
                  type="number"
                  value={editReview.score}
                  min={1}
                  max={5}
                  onChange={(e) => setEditReview({ ...editReview, score: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">내용</label>
                <textarea
                  value={editReview.content || ""}
                  onChange={(e) => setEditReview({ ...editReview, content: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
                  취소
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;
