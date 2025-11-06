import React, { useEffect, useState } from "react";
import { StarIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

interface Review {
  id: number;
  usersId: number;
  nickname: string;
  content: string;
  score: number;
  date?: string;
}

interface Company {
  id: number;
  name: string;
  description: string;
  content: string;
  address: string;
  website: string;
  since: string;
  industry: string;
  benefits: string;
  ceo: string;
  photo?: string;
}


interface CompanyDetailProps {
  onBack: () => void;
}

const CompanyDetail: React.FC<CompanyDetailProps> = ({ onBack }) => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const numericCompanyId = companyId && !isNaN(Number(companyId)) ? parseInt(companyId, 10) : null;
  const companyName = companyId && isNaN(Number(companyId)) ? decodeURIComponent(companyId) : null;

  const [company, setCompany] = useState<Company | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteProcessing, setIsFavoriteProcessing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 4);

  const averageRating = Array.isArray(reviews) && reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length
    : 0;

  // 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // 회사 정보 불러오기
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) {
        setError("유효하지 않은 회사 정보입니다.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let companyRes;

        if (numericCompanyId) {
          companyRes = await api.get(`/api/companies/${numericCompanyId}`);
        } else if (companyName) {
          const allCompaniesRes = await api.get('/api/companies');
          const foundCompany = allCompaniesRes.data.find(
            (c: any) => c.name === companyName
          );

          if (!foundCompany) {
            setError(`'${companyName}' 회사를 찾을 수 없습니다.`);
            setIsLoading(false);
            return;
          }

          companyRes = { data: foundCompany };
        }

        setCompany(companyRes.data);
        setError("");

        if (companyRes.data?.id) {
          fetchFavoriteStatus(companyRes.data.id);
          fetchReviews(companyRes.data.id);
        }
      } catch (err: any) {
        setError("회사 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId, numericCompanyId, companyName]);

  const fetchFavoriteStatus = async (companyId: number) => {
    try {
      const res = await api.get(`/api/mypage/favorites/companies?page=0&size=1000`);
      const items = res.data.content || res.data.rows || res.data.items || [];
      const exists = items.some((item: any) => parseInt(item.companyId, 10) === companyId);
      setIsFavorited(exists);
    } catch (err) {
      setIsFavorited(false);
    }
  };

  const fetchReviews = async (companyId: number) => {
    try {
      const res = await api.get(`/api/reviews/company/${companyId}`);

      if (Array.isArray(res.data)) {
        setReviews(res.data);
      } else if (res.data?.content && Array.isArray(res.data.content)) {
        setReviews(res.data.content);
      } else {
        setReviews([]);
      }
    } catch (err) {
      setReviews([]);
    }
  };

  const handleFavoriteClick = async () => {
    if (!company || isFavoriteProcessing) return;

    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      return;
    }

    setIsFavoriteProcessing(true);
    const prev = isFavorited;

    try {
      if (prev) {
        await api.delete(`/api/mypage/favorites/companies/${company.id}`);
        setIsFavorited(false);
        window.dispatchEvent(new CustomEvent("favorite-changed"));
      } else {
        await api.post(`/api/mypage/favorites/companies/${company.id}`);
        setIsFavorited(true);
        window.dispatchEvent(new CustomEvent("favorite-changed"));
      }
    } catch (err: any) {
      setIsFavorited(prev);
      alert(err?.response?.data?.message || "즐겨찾기 처리에 실패했습니다.");
    } finally {
      setIsFavoriteProcessing(false);
    }
  };

  const handleAddReview = async () => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!newReview.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }
    if (newRating === 0) {
      alert("별점을 선택해주세요.");
      return;
    }

    try {
      await api.post(`/api/reviews`, {
        content: newReview,
        score: newRating,
        companyId: company!.id,
        date: new Date().toISOString()
      });

      alert("리뷰가 등록되었습니다!");
      await fetchReviews(company!.id);
      setNewReview("");
      setNewRating(0);
    } catch (err: any) {
      if (err.response?.status === 401) {
        alert("로그인이 필요합니다.");
      } else {
        alert(err?.response?.data?.message || "리뷰 등록에 실패했습니다.");
      }
    }
  };

  const handleViewCompanyJobs = () => {
    if (company) {
      navigate(`/jobPostings?company=${encodeURIComponent(company.id)}`);
    }
  };

  const RatingStars = ({ score, size = "w-5 h-5" }: { score: number; size?: string }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarSolidIcon
          key={star}
          className={`${size} ${star <= score ? "text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">로딩 중...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center py-10 px-4">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button onClick={onBack} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );

  if (!company) return null;



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex gap-6 max-w-[1440px] mx-auto px-[55px] py-6">
        {/* 왼쪽: 메인 컨텐츠 */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-8">
            <button onClick={onBack} className="text-sm text-blue-600 mb-4 hover:underline">
              ← 목록으로 돌아가기
            </button>

            {/* 회사명 및 즐겨찾기 */}
            <div className="flex items-start justify-between mb-2">
              {/* 왼쪽: 회사 정보 */}
              <div className="flex flex-col items-start"> {/* 🔹 세로 배치 + 왼쪽 정렬 */}
                {/* 회사 사진 */}
                {company.photo ? (
                  <img
                    src={company.photo}
                    alt={company.name}
                    className="w-full h-auto object-cover rounded-lg mb-2 max-w-[150px]"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <PhotoIcon className="w-16 h-16 text-gray-400" />
                    <span className="text-gray-500 ml-2">기업 사진</span>
                  </div>
                )}

                {/* 회사 이름 */}
                <h1 className="text-2xl font-semibold text-left mt-[12px]">{company.name}</h1> {/* 🔹 왼쪽 정렬 */}
              </div>
            </div>
            {/* 평균 평점 */}
            {Array.isArray(reviews) && reviews.length > 0 && (
              <div className="flex items-center space-x-2 mb-4 mt-[-8px]">
                <RatingStars score={Math.round(averageRating)} />
                <span className="text-lg font-semibold text-gray-700">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({reviews.length}개의 리뷰)</span>
              </div>
            )}

            <p className="text-gray-600 mb-6">{company.content}</p>

            {/* 리뷰 섹션 */}
            <div className="mt-10">

              {/* ⭐ 리뷰 작성 영역 */}
              {isLoggedIn ? (
                <div className="border border-gray-100 rounded-xl p-6 mb-5 bg-white w-full md:w-[49%]">
                  <h3 className="text-lg font-semibold mb-4">리뷰 작성</h3>

                  {/* 별점 선택 */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">별점을 선택해주세요</p>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <StarSolidIcon
                            className={`w-8 h-8 ${star <= (hoverRating || newRating)
                                ? "text-yellow-400"
                                : "text-gray-300"
                              }`}
                          />
                        </button>
                      ))}
                      {newRating > 0 && (
                        <span className="ml-2 text-sm text-gray-600">{newRating}점</span>
                      )}
                    </div>
                  </div>

                  {/* 리뷰 입력 */}
                  <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2">
                    <input
                      type="text"
                      placeholder="기업 리뷰를 남겨주세요"
                      className="flex-1 text-sm outline-none"
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddReview()}
                    />
                    <button
                      onClick={handleAddReview}
                      className="ml-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      ➤
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-6 mb-10 bg-gray-50 text-center">
                  <p className="text-gray-600">
                    리뷰를 작성하려면{" "}
                    <span className="text-blue-600 font-semibold">로그인</span>이 필요합니다.
                  </p>
                </div>
              )}

              {/* 리뷰 목록 */}
              <div className="mb-4">

                {!Array.isArray(reviews) || reviews.length === 0 ? (
                  <p className="text-gray-500 text-sm">아직 작성된 리뷰가 없습니다.</p>
                ) : (
                  <>
                    {/* 리뷰 카드 그리드 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visibleReviews.map((review) => (
                        <div
                          key={review.id}
                          className="border border-gray-100 rounded-xl bg-white p-4 transition"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="text-sm font-medium text-gray-700">
                                  {review.nickname}
                                </p>
                                <RatingStars score={review.score} size="w-4 h-4" />
                              </div>
                              <p className="text-sm text-gray-800 mb-1">
                                {review.content}
                              </p>
                              {review.date && (
                                <p className="text-xs text-gray-400">{review.date}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 더보기 버튼 */}
                    {reviews.length > 4 && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="text-gray-600 border border-gray-300 rounded-lg px-5 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          {showAllReviews
                            ? "접기"
                            : `${reviews.length - 4}개 리뷰 더보기`}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>


          </div>
        </div>

        {/* 오른쪽: 고정 사이드바 */}
        <div className="w-96 flex-shrink-0">
          <div className="sticky top-6 space-y-3">
            {/* 기업 정보 박스 */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
              <h3 className="text-lg font-semibold mb-4">기업 정보</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 mb-1 text-sm">주소</p>
                  <p className="font-medium text-gray-900">{company.address}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1 text-sm">홈페이지</p>
                  <p className="font-medium text-gray-900">{company.website}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1 text-sm">설립년도</p>
                  <p className="font-medium text-gray-900">
                    {company.since ? new Date(company.since).toISOString().slice(0, 10).replace(/-/g, ".") : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1 text-sm">업종</p>
                  <p className="font-medium text-gray-900">{company.industry}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1 text-sm">복리후생</p>
                  <p className="font-medium text-gray-900">{company.benefits}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1 text-sm">대표자명</p>
                  <p className="font-medium text-gray-900">{company.ceo}</p>
                </div>
              </div>
            </div>

            {/* 이 기업의 공고 모아보기 버튼 */}
            <button
              onClick={handleViewCompanyJobs}
              className="w-full py-3 bg-[#006AFF] text-white rounded-lg text-base font-semibold hover:bg-[#0053cc] transition-colors"
            >
              이 기업의 공고 모아보기
            </button>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleFavoriteClick(); // ✅ e, jobId 제거
                }}
                disabled={isFavoriteProcessing}
                className={`flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg text-base font-semibold transition-colors flex items-center justify-center gap-2 
      ${isFavoriteProcessing ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"}`}
                title={isFavorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                {isFavorited ? (
                  <StarSolidIcon className="w-5 h-5 text-[#006AFF]" />
                ) : (
                  <StarIcon className="w-5 h-5 text-gray-600" />
                )}
                <span>즐겨찾기</span>
              </button>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;