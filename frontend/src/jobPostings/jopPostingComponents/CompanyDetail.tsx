import React, { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

interface Review {
  id: number;
  usersId: string;
  nickname: string;
  content: string;
  date: string;
  score: number;
}

interface Company {
  id: number;
  name: string;
  description: string;
  address: string;
  website: string;
  founded: string;
  industry: string;
  benefits: string;
  ceo: string;
}

interface CompanyDetailProps {
  onBack: () => void;
}

const CompanyDetail: React.FC<CompanyDetailProps> = ({ onBack }) => {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteProcessing, setIsFavoriteProcessing] = useState(false);

  // ✅ 평균 평점 계산
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length
    : 0;

  // ✅ 회사 정보 + 리뷰 불러오기
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const decodedName = decodeURIComponent(companyName || '');
        console.log(`🔍 회사 이름 디코딩: ${decodedName}`);
        const companyRes = await api.get(`/api/companies/${encodeURIComponent(decodedName)}`);
        console.log("✅ 회사 데이터:", companyRes.data);
        setCompany(companyRes.data);
        if (companyRes.data?.id) {
          fetchFavoriteStatus(companyRes.data.id);
          fetchReviews(companyRes.data.name);
        }
      } catch (err: any) {
        console.error("❌ 회사 로드 실패:", err.response?.data);
        setError(err.response?.data?.message || "회사 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyName]);

  // ✅ 즐겨찾기 상태 확인 함수
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

  // ✅ 리뷰 가져오기 함수
  const fetchReviews = async (companyName: string) => {
    try {
      const res = await api.get(`/api/reviews/company/${encodeURIComponent(companyName)}`);
      console.log("✅ 리뷰 데이터:", res.data);
      setReviews(res.data);
    } catch (err) {
      console.error("리뷰 로드 실패:", err);
    }
  };

  // ✅ company.id가 설정되면 즐겨찾기 상태 확인
  useEffect(() => {
    if (company?.id) {
      console.log(`🔄 CompanyDetail - company.id 변경됨: ${company.id}`);
      fetchFavoriteStatus(company.id);
    }
  }, [company?.id]);

  // ✅ 이벤트 리스너 등록 (다른 페이지에서 변경 감지)
  useEffect(() => {
    const handleFavoriteChanged = () => {
      console.log("🔔 CompanyDetail - favorite-changed 이벤트 수신!");
      if (company?.id) {
        fetchFavoriteStatus(company.id);
      }
    };

    window.addEventListener("favorite-changed", handleFavoriteChanged);
    console.log("✅ CompanyDetail - 이벤트 리스너 등록됨");

    return () => {
      window.removeEventListener("favorite-changed", handleFavoriteChanged);
      console.log("❌ CompanyDetail - 이벤트 리스너 제거됨");
    };
  }, [company?.id]);

  // ✅ 즐겨찾기 토글
  const handleFavoriteClick = async () => {
    if (!company || isFavoriteProcessing) return;

    setIsFavoriteProcessing(true);
    const prev = isFavorited;

    console.log(`🔄 CompanyDetail - 즐겨찾기 토글 시작 (현재: ${prev})`);

    try {
      if (prev) {
        console.log(`🗑️ DELETE /api/mypage/favorites/companies/${company.id}`);
        await api.delete(`/api/mypage/favorites/companies/${company.id}`);
        setIsFavorited(false);
        window.dispatchEvent(new CustomEvent("favorite-changed"));
        console.log("✅ 즐겨찾기 해제 완료 + 이벤트 발송");
      } else {
        console.log(`➕ POST /api/mypage/favorites/companies/${company.id}`);
        await api.post(`/api/mypage/favorites/companies/${company.id}`);
        setIsFavorited(true);
        window.dispatchEvent(new CustomEvent("favorite-changed"));
        console.log("✅ 즐겨찾기 추가 완료 + 이벤트 발송");
      }
    } catch (err: any) {
      console.error("즐겨찾기 처리 실패:", err?.response?.data || err);
      setIsFavorited(prev);
      alert(
        err?.response?.status === 401
          ? "로그인이 필요합니다."
          : err?.response?.data?.message || "즐겨찾기 처리에 실패했습니다."
      );
    } finally {
      setIsFavoriteProcessing(false);
    }
  };

  // ✅ 리뷰 추가
  const handleAddReview = async () => {
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
        companyId: company!.id
      });
      await fetchReviews(company!.name);
      setNewReview("");
      setNewRating(0);
      alert("리뷰가 등록되었습니다.");
    } catch (err: any) {
      alert(err?.response?.data?.message || "리뷰 등록에 실패했습니다.");
    }
  };

  // ✅ 이 기업의 공고 모아보기 핸들러
  const handleViewCompanyJobs = () => {
    if (company) {
      // JobPostings 페이지로 이동하면서 회사명을 쿼리 파라미터로 전달
      navigate(`/jobPostings?company=${encodeURIComponent(company.name)}`);
    }
  };

  // ✅ 별점 렌더링 컴포넌트
  const RatingStars = ({ score, size = "w-5 h-5" }: { score: number; size?: string }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarSolidIcon
            key={star}
            className={`${size} ${
              star <= score ? "text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) return <div className="text-center py-10 text-gray-600">로딩 중...</div>;
  if (error)
    return (
      <div className="text-center py-10 text-red-600">
        {error}
        <button onClick={onBack} className="block mt-4 text-blue-600 underline">
          목록으로 돌아가기
        </button>
      </div>
    );

  if (!company) return null;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="bg-white rounded-lg shadow p-8">
        <button onClick={onBack} className="text-sm text-blue-600 mb-4 hover:underline">
          ← 목록으로 돌아가기
        </button>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold">{company.name}</h1>
            <button
              onClick={handleFavoriteClick}
              disabled={isFavoriteProcessing}
              className={`transition-all ${
                isFavoriteProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-110"
              }`}
              title={isFavorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            >
              {isFavorited ? (
                <StarSolidIcon className="w-6 h-6 text-yellow-500" />
              ) : (
                <StarIcon className="w-6 h-6 text-gray-400 hover:text-yellow-500" />
              )}
            </button>
          </div>
          
          {/* ✅ 오른쪽 끝으로 이동 */}
          <button 
            onClick={handleViewCompanyJobs}
            className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors"
          >
            이 기업의 공고 모아보기
          </button>
        </div>

        {/* ⭐ 평균 평점 표시 */}
        {reviews.length > 0 && (
          <div className="flex items-center space-x-2 mb-4">
            <RatingStars score={Math.round(averageRating)} />
            <span className="text-lg font-semibold text-gray-700">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">
              ({reviews.length}개의 리뷰)
            </span>
          </div>
        )}

        <p className="text-gray-600 mb-6">{company.description}</p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700 mb-6">
          <div>
            <p className="text-gray-500">주소</p>
            <p>{company.address}</p>
          </div>
          <div>
            <p className="text-gray-500">홈페이지</p>
            <p>{company.website}</p>
          </div>
          <div>
            <p className="text-gray-500">설립년도</p>
            <p>{company.founded}</p>
          </div>
          <div>
            <p className="text-gray-500">업종</p>
            <p>{company.industry}</p>
          </div>
          <div>
            <p className="text-gray-500">복리후생</p>
            <p>{company.benefits}</p>
          </div>
          <div>
            <p className="text-gray-500">대표자명</p>
            <p>{company.ceo}</p>
          </div>
        </div>

        <div className="w-full h-80 bg-gray-200 flex items-center justify-center text-gray-500 text-sm rounded-lg mb-6">
          기업 사진
        </div>

        {/* ⭐ 리뷰 작성 영역 (별점 선택 추가) */}
        <div className="border border-gray-300 rounded-lg p-4 mb-8 max-w-2xl">
          <h3 className="text-lg font-semibold mb-3">리뷰 작성</h3>
          
          {/* 별점 선택 */}
          <div className="mb-3">
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
                    className={`w-8 h-8 ${
                      star <= (hoverRating || newRating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {newRating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {newRating}점
                </span>
              )}
            </div>
          </div>

          {/* 리뷰 입력 */}
          <div className="flex items-center border border-gray-300 rounded-full px-4 py-2">
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

        {/* 리뷰 목록 */}
        <div className="space-y-6 mb-8">
          <h3 className="text-lg font-semibold">
            리뷰 ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">아직 작성된 리뷰가 없습니다.</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="flex items-start space-x-3 border-b border-gray-200 pb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-700">{review.nickname}</p>
                    <RatingStars score={review.score} size="w-4 h-4" />
                  </div>
                  <p className="text-sm text-gray-800 mb-1">{review.content}</p>
                  <p className="text-xs text-gray-400">{review.date}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;