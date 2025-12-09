import React, { useEffect, useState } from "react";
import { BookmarkIcon, StarIcon, XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon, StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import { jobPostApi } from "../../api/jobPostApi";
import type { JobPostResponse, ResumeResponse } from "../../types/interface";
    import KakaoMap from "../../page/KakaoMap";



interface JobDetailProps {
  jobId: number;
  onBack: () => void;
}

const JobDetail: React.FC<JobDetailProps> = ({ jobId, onBack }) => {
  const [job, setJob] = useState<JobPostResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrappedJobs, setScrappedJobs] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [isScrapped, setIsScrapped] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteProcessing, setIsFavoriteProcessing] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumes, setResumes] = useState<ResumeResponse[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // ✅ 상세 공고 불러오기
  const fetchJobDetail = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await jobPostApi.getJobPostById(jobId);
      setJob(data);
    } catch (err: any) {
      console.error("❌ 공고 불러오기 실패:", err);
      if (err.response?.status === 404) setError("해당 공고를 찾을 수 없습니다.");
      else setError("상세 공고를 불러오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 스크랩 상태 확인
  const fetchScrapStatus = async () => {
    try {
      const scrappedItems = await jobPostApi.getScrappedJobs();
      const exists = scrappedItems.some((item: any) => Number(item.jobPostId) === Number(jobId));
      setIsScrapped(exists);
      if (exists) {
        setScrappedJobs((prev) => new Set(prev).add(jobId));
      }
    } catch (err: any) {
      if (err.response?.status !== 401) setIsScrapped(false);
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent, targetJobId: number) => {
    e.stopPropagation();
    const isScrapped = scrappedJobs.has(targetJobId);
    try {
      if (isScrapped) {
        await jobPostApi.removeScrapJob(targetJobId);
        setScrappedJobs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(targetJobId);
          return newSet;
        });
        setIsScrapped(false);
      } else {
        await jobPostApi.addScrapJob(targetJobId);
        setScrappedJobs((prev) => new Set(prev).add(targetJobId));
        setIsScrapped(true);
      }
    } catch (err: any) {
      let errorMsg = "북마크 처리에 실패했습니다.";
      if (err.response?.status === 401) {
        errorMsg = "로그인이 필요합니다.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      alert(errorMsg);
    }
  };

  // 기업 즐겨찾기 상태 확인
  const fetchFavoriteStatus = async () => {
    if (!job?.companyId) return;
    try {
      const favoritedItems = await jobPostApi.getFavoriteCompanies();
      const exists = favoritedItems.some((item: any) => Number(item.companyId) === Number(job.companyId));
      setIsFavorited(exists);
    } catch (err: any) {
      if (err.response?.status !== 401) setIsFavorited(false);
    }
  };

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  useEffect(() => {
    if (job) {
      fetchScrapStatus();
      fetchFavoriteStatus();
    }
  }, [job]);

  useEffect(() => {
    const handleFavoriteChanged = () => {
      if (job?.companyId) fetchFavoriteStatus();
    };
    window.addEventListener("favorite-changed", handleFavoriteChanged);
    return () => window.removeEventListener("favorite-changed", handleFavoriteChanged);
  }, [job?.companyId]);

  // 기업 즐겨찾기 토글
  const handleFavoriteClick = async () => {
    if (!job?.companyId || isFavoriteProcessing) return;
    setIsFavoriteProcessing(true);
    const previousState = isFavorited;

    try {
      if (previousState) {
        await jobPostApi.removeFavoriteCompany(job.companyId);
        setIsFavorited(false);
      } else {
        await jobPostApi.addFavoriteCompany(job.companyId);
        setIsFavorited(true);
      }
    } catch (err: any) {
      setIsFavorited(previousState);
      alert(err.response?.data?.message || "즐겨찾기 처리에 실패했습니다.");
    } finally {
      setIsFavoriteProcessing(false);
    }
  };

  // 이력서 목록
  const fetchResumes = async () => {
    try {
      const list = await jobPostApi.getResumes();
      setResumes(list.filter(r => !r.locked));
    } catch (e) {
      alert("이력서 목록을 불러올 수 없습니다.");
    }
  };

  const handleApplyClick = async () => {
    setShowApplyModal(true);
    await fetchResumes();
  };

  const handleSubmitApply = async () => {
    if (!selectedResumeId) return alert("이력서를 선택해주세요.");
    if (!confirm("선택한 이력서로 지원하시겠습니까? 제출 후에는 이력서를 수정할 수 없습니다.")) return;

    try {
      setIsApplying(true);
      await jobPostApi.applyToJob({ jobPostId: job!.id, resumeId: selectedResumeId });
      alert("지원이 완료되었습니다!");
      setShowApplyModal(false);
      setSelectedResumeId(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "지원 중 오류가 발생했습니다.");
    } finally {
      setIsApplying(false);
    }
  };

  const ApplyModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">지원할 이력서 선택</h3>
          <button onClick={() => { setShowApplyModal(false); setSelectedResumeId(null); }} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {resumes.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>제출 가능한 이력서가 없습니다.</p>
              <p className="text-sm mt-2">새 이력서를 작성해주세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <label key={resume.id} className={`block border rounded-lg p-4 cursor-pointer transition-all ${selectedResumeId === resume.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="resume" value={resume.id} checked={selectedResumeId === resume.id} onChange={() => setSelectedResumeId(resume.id)} className="accent-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{resume.title}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        최종 수정: {new Date(resume.updateAt || resume.createAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t">
          <button onClick={() => { setShowApplyModal(false); setSelectedResumeId(null); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md" disabled={isApplying}>취소</button>
          <button onClick={handleSubmitApply} disabled={!selectedResumeId || isApplying} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {isApplying ? "지원 중..." : "지원하기"}
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="text-center py-10 text-gray-600">로딩 중...</div>
  );

  if (error) return (
    <div className="text-center py-10 text-red-600">
      {error}
      <button onClick={onBack} className="block mt-4 text-blue-600 underline mx-auto">목록으로 돌아가기</button>
    </div>
  );

  if (!job) return null;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px] py-4 md:py-6">
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 md:p-8">
              <button onClick={onBack} className="text-xs sm:text-sm text-blue-600 mb-3 md:mb-4 hover:underline">
                ← 목록으로 돌아가기
              </button>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2 sm:gap-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <Link to={`/company/${job.companyId}`} className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 cursor-pointer hover:underline truncate">
                    {job.companyName}
                  </Link>
                  <button onClick={handleFavoriteClick} disabled={isFavoriteProcessing} className={`transition-all flex-shrink-0 ${isFavoriteProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`} title={isFavorited ? "기업 즐겨찾기 해제" : "기업 즐겨찾기"}>
                    {isFavorited ? <StarSolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#006AFF]" /> : <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 hover:text-[#006AFF]" />}
                  </button>
                </div>
              </div>

              <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 md:mb-6">조회수: {job.views}</p>

              {/* 공고 사진 */}
              {job.photo ? (
                <img
                  src={job.photo}
                  alt={job.title}
                  className="w-full h-auto object-cover rounded-lg mb-4 mx-auto max-w-full md:max-w-[860px]"
                  onLoad={() => console.log('✅ 이미지 로드 성공:', job.photo)}
                  onError={(e) => {
                    console.error('❌ 이미지 로드 실패:', job.photo);
                    console.error('❌ Error event:', e);
                  }}
                />
              ) : (
                <div className="w-full h-48 sm:h-56 md:h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <PhotoIcon className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-400" />
                </div>
              )}

              <div className="mt-6 md:mt-10 space-y-8">
                {/* 상세 내용 */}
                <section>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 md:mb-4">상세 내용</h2>
                  {job.content ? (
                    <div
                      className="text-gray-800 leading-relaxed font-normal whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: job.content }}
                    />
                  ) : (
                    <p className="text-gray-500">등록된 상세 내용이 없습니다.</p>
                  )}
                </section>

                {/* 주요업무 */}
                {job.mainJob && (
                  <section>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 md:mb-4">주요업무</h2>
                    <div className="text-gray-800 leading-relaxed font-normal whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                      {job.mainJob}
                    </div>
                  </section>
                )}

                {/* 자격요건 */}
                {job.qualification && (
                  <section>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 md:mb-4">자격요건</h2>
                    <div className="text-gray-800 leading-relaxed font-normal whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                      {job.qualification}
                    </div>
                  </section>
                )}

                {/* 우대사항 */}
                {job.preference && (
                  <section>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 md:mb-4">우대사항</h2>
                    <div className="text-gray-800 leading-relaxed font-normal whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                      {job.preference}
                    </div>
                  </section>
                )}

                {/* 채용전형 */}
                {job.hireType && (
                  <section>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 md:mb-4">채용전형</h2>
                    <div className="text-gray-800 leading-relaxed font-normal whitespace-pre-line bg-blue-50 p-4 rounded-lg">
                      {job.hireType}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 고정 사이드바 */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-6 space-y-3">
              {/* 채용 정보 박스 */}
              <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 mb-1 text-sm">경력</p>
                    <p className="font-medium text-gray-900">{job.careerLevel}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1 text-sm">직무</p>
                    <p className="font-medium text-gray-900">{job.position}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1 text-sm">학력</p>
                    <p className="font-medium text-gray-900">{job.education}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1 text-sm">고용형태</p>
                    <p className="font-medium text-gray-900">{job.type || "정규직"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1 text-sm">근무지역</p>
                    <p className="font-medium text-gray-900">{job.location}</p>
                  </div>
                  {/* 🗺 회사 위치 지도 */}
                  {job.lat != null && job.lng != null && (
                    <div className="mt-4">
                      <p className="text-gray-500 mb-1 text-sm">회사 위치</p>
                      <KakaoMap lat={job.lat} lng={job.lng} />
                    </div>
                  )}


                  {!job.endAt ? (
                    <div>
                      <p className="text-gray-500 mb-1 text-sm">채용기간</p>
                      <p className="font-medium text-gray-900">상시채용</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500 mb-1 text-sm">마감일</p>
                      <p className="font-medium text-gray-900">{job.endAt}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 지원하기 버튼 */}
              <button
                onClick={handleApplyClick}
                className="w-full py-3 bg-[#006AFF] text-white rounded-lg text-base font-semibold hover:bg-[#0053cc] transition-colors"
              >
                지원하기
              </button>

              {/* 스크랩 + 이력서 바로가기 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleBookmarkClick(e, jobId);
                  }}
                  className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg text-base font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  {scrappedJobs.has(jobId) ? (
                    <BookmarkSolidIcon className="w-5 h-5 text-[#006AFF]" />
                  ) : (
                    <BookmarkIcon className="w-5 h-5 text-gray-600" />
                  )}
                  <span>스크랩</span>
                </button>
                <Link
                  to="/mypage/resumes"
                  className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg text-base font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  이력서 바로가기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showApplyModal && <ApplyModal />}
    </>
  );
};

export default JobDetail;