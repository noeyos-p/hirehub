import React, { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/outline";
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
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  
  // companyId가 숫자인지 문자열(회사명)인지 판단
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

  // ✅ 평균 평점 계산
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length
    : 0;

  // ✅ 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // 즐겨찾기 API로 로그인 확인 (이미 다른 곳에서 사용 중)
        await api.get('/api/mypage/favorites/companies?page=0&size=1');
        console.log("✅ 로그인 상태 확인: 로그인됨");
        setIsLoggedIn(true);
      } catch (err: any) {
        console.log("❌ 로그인 상태 확인: 로그인 안됨", err.response?.status);
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();
  }, []);

  // ✅ 회사 정보 + 리뷰 불러오기 (ID 또는 이름 기반)
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) {
        setError("유효하지 않은 회사 정보입니다.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log("🔍 회사 정보 조회 시작:", companyId);
        
        let companyRes;
        
        // ID로 조회 시도
        if (numericCompanyId) {
          console.log("🔢 ID로 조회:", numericCompanyId);
          companyRes = await api.get(`/api/companies/${numericCompanyId}`);
        } 
        // 회사명으로 조회
        else if (companyName) {
          console.log("📝 회사명으로 조회:", companyName);
          // 전체 회사 목록을 가져와서 필터링
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
        } else {
          setError("유효하지 않은 회사 정보입니다.");
          setIsLoading(false);
          return;
        }
        
        console.log("✅ 회사 정보 조회 성공:", companyRes.data);
        setCompany(companyRes.data);
        
        if (companyRes.data?.id) {
          // ✅ 각각 독립적으로 에러 처리 (로그인 안해도 페이지는 보이도록)
          fetchFavoriteStatus(companyRes.data.id).catch(err => {
            console.error("❌ 즐겨찾기 상태 확인 실패 (무시됨):", err);
          });
          
          fetchReviews(companyRes.data.id).catch(err => {
            console.error("❌ 리뷰 로드 실패 (무시됨):", err);
          });
        }
      } catch (err: any) {
        console.error("❌ 회사 정보 조회 실패:", err);
        console.error("❌ 에러 상태:", err.response?.status);
        console.error("❌ 에러 메시지:", err.response?.data?.message);
        
        if (err.response?.status === 401) {
          setError("로그인이 필요합니다.");
        } else if (err.response?.status === 404) {
          setError("해당 회사를 찾을 수 없습니다.");
        } else {
          setError(err.response?.data?.message || "회사 정보를 불러오는데 실패했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId, numericCompanyId, companyName]);

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

  // ✅ 리뷰 가져오기 함수 (ID 기반)
  const fetchReviews = async (companyId: number) => {
    try {
      const res = await api.get(`/api/reviews/company/${companyId}`);
      setReviews(res.data || []);
    } catch (err) {
      console.error("리뷰 로드 실패:", err);
      setReviews([]);
    }
  };

  // ✅ 즐겨찾기 토글
  const handleFavoriteClick = async () => {
    if (!company || isFavoriteProcessing) return;

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
      console.log("리뷰 등록 요청:", {
        content: newReview,
        score: newRating,
        companyId: company!.id
      });

      const response = await api.post(`/api/reviews`, {
        content: newReview,
        score: newRating,
        companyId: company!.id,
        date: new Date().toISOString() // 날짜 추가
      });

      console.log("✅ 리뷰 등록 성공:", response.data);
      alert("리뷰가 등록되었습니다!");

      // 등록 후 리뷰 목록 즉시 갱신 (ID 기반)
      await fetchReviews(company!.id);

      setNewReview("");
      setNewRating(0);
    } catch (err: any) {
      console.error("❌ 리뷰 등록 실패:", err);
      console.error("❌ 에러 응답:", err.response?.data);
      console.error("❌ 에러 상태:", err.response?.status);
      
      if (err.response?.status === 401) {
        alert("로그인이 필요합니다.");
        setIsLoggedIn(false); // 로그인 상태 업데이트
      } else if (err.response?.status === 500) {
        alert("서버 오류가 발생했습니다.\n백엔드 개발자에게 문의해주세요.\n(ReviewRestController에서 사용자 ID 처리 오류)");
      } else {
        alert(err?.response?.data?.message || "리뷰 등록에 실패했습니다.");
      }
    }
  };

  // ✅ 이 기업의 공고 모아보기 핸들러
  const handleViewCompanyJobs = () => {
    if (company) {
      navigate(`/jobPostings?company=${encodeURIComponent(company.name)}`);
    }
  };

  // ✅ 별점 렌더링 컴포넌트
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
            <span className="text-lg font-semibold text-gray-700">{averageRating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">({reviews.length}개의 리뷰)</span>
          </div>
        )}

        <p className="text-gray-600 mb-6">{company.description}</p>

        {/* 회사 정보 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700 mb-6">
          <div><p className="text-gray-500">주소</p><p>{company.address}</p></div>
          <div><p className="text-gray-500">홈페이지</p><p>{company.website}</p></div>
          <div><p className="text-gray-500">설립년도</p><p>{company.founded}</p></div>
          <div><p className="text-gray-500">업종</p><p>{company.industry}</p></div>
          <div><p className="text-gray-500">복리후생</p><p>{company.benefits}</p></div>
          <div><p className="text-gray-500">대표자명</p><p>{company.ceo}</p></div>
        </div>

        <div className="w-full h-80 bg-gray-200 flex items-center justify-center text-gray-500 text-sm rounded-lg mb-6">
          기업 사진
        </div>

        {/* ⭐ 리뷰 작성 영역 */}
        {isLoggedIn ? (
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
                      className={`w-8 h-8 ${star <= (hoverRating || newRating) ? "text-yellow-400" : "text-gray-300"}`}
                    />
                  </button>
                ))}
                {newRating > 0 && <span className="ml-2 text-sm text-gray-600">{newRating}점</span>}
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
        ) : (
          <div className="border border-gray-300 rounded-lg p-6 mb-8 max-w-2xl bg-gray-50">
            <p className="text-center text-gray-600">
              리뷰를 작성하려면 <span className="text-blue-600 font-semibold">로그인</span>이 필요합니다.
            </p>
          </div>
        )}

        {/* 리뷰 목록 */}
        <div className="space-y-6 mb-8">
          <h3 className="text-lg font-semibold">리뷰 ({reviews.length})</h3>
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
                  {review.date && <p className="text-xs text-gray-400">{review.date}</p>}
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