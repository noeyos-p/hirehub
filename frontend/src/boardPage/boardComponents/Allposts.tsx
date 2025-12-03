// src/pages/board/AllPosts.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';
import { boardApi, commentApi } from '../../api/boardApi';
import type { BoardListResponse, CommentResponse } from '../../types/interface'; // ✅ CommentResponse 추가
import { EyeIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

// 취업 정보글 더미 데이터 생성 함수
const generateJobInfoPosts = (): BoardListResponse[] => {
  const jobInfoData = [
    {
      title: "[IT/개발] 네이버 개발자 채용 공고 - 경력 3년 이상",
      content: "네이버에서 백엔드 개발자를 모집합니다. 주요 기술스택: Java, Spring, MySQL. 우대사항: AWS 경험자, MSA 아키텍처 경험자. 연봉: 협의 후 결정. 지원 마감일은 이번 달 말까지입니다.",
    },
    {
      title: "[면접 팁] 개발자 기술면접 준비 가이드",
      content: "기술면접에서 자주 나오는 질문들과 답변 방법을 정리했습니다. 자료구조, 알고리즘, 데이터베이스, 네트워크 등 핵심 주제별로 정리된 내용을 확인해보세요.",
    },
    {
      title: "[디자인] 카카오 UI/UX 디자이너 신입 채용",
      content: "카카오에서 UI/UX 디자이너를 모집합니다. Figma, Adobe XD 능숙자 우대. 포트폴리오 필수 제출. 신입/경력 모두 지원 가능합니다.",
    },
    {
      title: "[이력서 작성법] 합격률 높이는 이력서 작성 꿀팁",
      content: "이력서 작성 시 주의할 점과 채용담당자의 눈에 띄는 이력서 작성 방법을 공유합니다. 프로젝트 경험 기술 방법, 자기소개서 작성 요령 등을 알려드립니다.",
    },
    {
      title: "[마케팅] 쿠팡 디지털 마케터 채용 - 경력 무관",
      content: "쿠팡에서 디지털 마케터를 모집합니다. 주요 업무: 온라인 광고 운영, 데이터 분석. Google Analytics, Facebook Ads 경험자 우대. 연봉: 3000~4500만원.",
    },
    {
      title: "[연봉 협상] 신입 개발자 연봉 협상 전략",
      content: "신입 개발자가 연봉 협상 시 알아야 할 것들. 시장 평균 연봉, 협상 타이밍, 협상 멘트 예시 등을 상세히 안내합니다.",
    },
    {
      title: "[영업] 삼성전자 영업직 공개채용 - 전국 단위",
      content: "삼성전자에서 영업직 공개채용을 진행합니다. 학력: 대졸 이상. 우대사항: 영업 경력, 운전면허 소지자. 전국 사업장 배치 가능합니다.",
    },
    {
      title: "[직장생활] 개발자 첫 출근 전 준비사항",
      content: "첫 출근을 앞둔 신입 개발자들을 위한 가이드. 개발 환경 세팅, 회사 문화 적응, 동료와의 커뮤니케이션 방법 등을 알려드립니다.",
    },
    {
      title: "[IT/개발] 토스 프론트엔드 개발자 채용",
      content: "토스에서 프론트엔드 개발자를 모집합니다. React, TypeScript 필수. 주요 업무: 금융 서비스 웹/앱 개발. 복지: 재택근무 가능, 자유로운 연차 사용.",
    },
    {
      title: "[면접 팁] 압박 면접 대처법과 예상 질문",
      content: "압박 면접에서 침착하게 대응하는 방법과 자주 나오는 질문들을 정리했습니다. 실제 면접 후기와 함께 공유합니다.",
    },
    {
      title: "[데이터 분석] 배달의민족 데이터 분석가 채용",
      content: "배달의민족에서 데이터 분석가를 모집합니다. Python, SQL 필수. 주요 업무: 사용자 행동 분석, 비즈니스 인사이트 도출. 경력 2년 이상.",
    },
    {
      title: "[자소서 작성] 자기소개서 필수 포함 요소",
      content: "합격하는 자기소개서에 반드시 포함되어야 할 요소들을 정리했습니다. 지원 동기, 경험, 포부 등 각 항목별 작성 가이드를 제공합니다.",
    },
    {
      title: "[금융] 신한은행 IT 개발자 채용 - 정규직",
      content: "신한은행에서 IT 개발자를 모집합니다. 주요 업무: 금융 시스템 개발 및 유지보수. 학력: 대졸 이상. 우대: 금융권 경험자.",
    },
    {
      title: "[커리어 개발] 주니어 개발자의 성장 로드맵",
      content: "주니어 개발자가 시니어로 성장하기 위한 로드맵을 공유합니다. 기술 스택 확장, 프로젝트 경험, 네트워킹 방법 등을 안내합니다.",
    },
    {
      title: "[디자인] 라인 그래픽 디자이너 경력직 채용",
      content: "라인에서 그래픽 디자이너를 모집합니다. Illustrator, Photoshop 능숙자. 주요 업무: 브랜드 디자인, 마케팅 콘텐츠 제작. 경력 3년 이상.",
    },
    {
      title: "[면접 후기] 대기업 최종 면접 경험담",
      content: "대기업 최종 면접 경험을 공유합니다. 임원 면접에서 받은 질문, 분위기, 준비 방법 등을 상세히 전달드립니다.",
    },
    {
      title: "[IT/개발] 우아한형제들 백엔드 개발자 채용",
      content: "우아한형제들에서 백엔드 개발자를 모집합니다. Kotlin, Spring Boot 우대. 주요 업무: MSA 기반 배달 시스템 개발. 연봉: 5000만원~.",
    },
    {
      title: "[이직 준비] 경력직 이직 시 주의사항",
      content: "경력직 이직을 준비하시는 분들을 위한 가이드. 이직 타이밍, 회사 선택 기준, 퇴사 절차 등을 안내합니다.",
    },
    {
      title: "[PM/기획] 넥슨 게임 기획자 채용 공고",
      content: "넥슨에서 게임 기획자를 모집합니다. 주요 업무: 게임 콘텐츠 기획, 밸런싱. 게임 개발 경험자 우대. 신입/경력 모두 지원 가능.",
    },
    {
      title: "[포트폴리오] 개발자 포트폴리오 작성 가이드",
      content: "개발자 포트폴리오를 효과적으로 작성하는 방법을 공유합니다. GitHub 관리, 프로젝트 설명 작성법, 배포 방법 등을 알려드립니다.",
    },
  ];

  const now = new Date();

  return jobInfoData.map((data, index) => {
    // 1시간씩 과거로 설정 (최신글이 위로)
    const postDate = new Date(now.getTime() - index * 60 * 60 * 1000);

    return {
      id: -(index + 1), // 음수 ID로 더미 데이터 구분
      title: data.title,
      content: data.content,
      usersId: 0,
      usersName: "HireHub AI",
      nickname: "취업정보봇",
      usersProfileImage: null,
      createAt: postDate.toISOString(),
      updateAt: null,
      views: Math.floor(Math.random() * 500) + 50,
      comments: [],
    };
  });
};

const AllPosts: React.FC = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // ✅ 각 게시글의 댓글 수를 저장하는 state 추가
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;

  // 취업 정보글 더미 데이터 (한 번만 생성)
  const jobInfoPosts = useMemo(() => generateJobInfoPosts(), []);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearching(false);
      const data = await boardApi.getAllBoards();

      // 유저 작성글만 저장
      setBoards(data);

      // ✅ 각 게시글의 댓글 수를 가져오기
      await fetchAllCommentCounts(data);
    } catch (err) {
      console.error('게시글 조회 실패:', err);
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ 모든 게시글의 댓글 수를 가져오는 함수
  const fetchAllCommentCounts = async (boardList: BoardListResponse[]) => {
    const counts: Record<number, number> = {};

    await Promise.all(
      boardList.map(async (board) => {
        try {
          const comments = await commentApi.getCommentsByBoardId(board.id);
          counts[board.id] = comments.length;
        } catch (err: any) {
          // 401/404 에러는 조용히 처리
          if (err.response?.status === 401 || err.response?.status === 404) {
            counts[board.id] = 0;
          } else {
            console.error(`게시글 ${board.id}의 댓글 조회 실패:`, err);
            counts[board.id] = 0;
          }
        }
      })
    );

    setCommentCounts(counts);
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      fetchBoards();
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);
      const data = await boardApi.searchBoards(searchKeyword);

      // 유저 작성글만 검색
      setBoards(data);
      setCurrentPage(1);

      // ✅ 검색 결과의 댓글 수도 가져오기
      await fetchAllCommentCounts(data);
    } catch (err) {
      console.error('❌ 검색 실패:', err);
      setError('검색에 실패했습니다.');
      setBoards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSearch = () => {
    setSearchKeyword('');
    fetchBoards();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleWriteClick = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인 후 이용 가능합니다.');
      navigate('/login');
      return;
    }
    navigate('/board/write');
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = boards.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(boards.length / postsPerPage);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\. /g, '.');
  };

  const handlePostClick = (id: number) => {
    navigate(`/board/${id}`);
  };

  const handleJobInfoClick = (board: BoardListResponse) => {
    alert(`[${board.nickname}]\n\n${board.title}\n\n${board.content}\n\n※ 이 게시글은 AI가 자동으로 생성한 취업 정보글입니다.`);
  };

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      {/* 취업 정보글 섹션 */}
      <div className="mb-12 pb-8 border-b border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
            취업 정보글
            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">AI 자동 생성</span>
          </h2>
          <button
            onClick={() => navigate('/board/job-info')}
            className="text-sm text-gray-600 hover:text-[#006AFF] font-medium transition"
          >
            더보기 →
          </button>
        </div>

        {/* 취업 정보글 목록 - 최대 5개만 표시 */}
        <div className="space-y-4">
          {jobInfoPosts.slice(0, 5).map((board) => (
            <div
              key={board.id}
              onClick={() => handleJobInfoClick(board)}
              className="border-b border-gray-200 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-100 transition p-2 rounded"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-blue-500">
                    <span className="text-white text-lg">🤖</span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-md font-semibold text-gray-800">
                      {board.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                      {board.content.substring(0, 50)}
                      {board.content.length > 50 ? '...' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-2 mt-6">
                    <div className="text-sm text-gray-500 flex items-center space-x-1">
                      <EyeIcon className="w-4 h-4" />
                      <span>{board.views || 0}</span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-1">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      <span>0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 유저 작성 게시물 섹션 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">유저 작성글</h2>
          <button
            onClick={handleWriteClick}
            className="bg-[#D6E4F0] hover:bg-[#c0d4e8] text-gray-800 text-[15px] font-medium px-4 py-1.5 rounded-md cursor-pointer"
          >
            작성하기
          </button>
        </div>
        <button
          onClick={() => navigate('/board/user-posts')}
          className="text-sm text-gray-600 hover:text-[#006AFF] font-medium transition"
        >
          더보기 →
        </button>
      </div>

      {isSearching && (
        <div className="flex items-center space-x-2 mb-6 ml-[4px]">
          <span className="text-sm text-gray-600">
            검색 결과: {boards.length}개
          </span>
          <button
            onClick={handleResetSearch}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            전체 보기
          </button>
        </div>
      )}

      <div>
        {currentPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {isSearching ? '검색 결과가 없습니다.' : '게시글이 없습니다.'}
            </p>
            {isSearching && (
              <button
                onClick={handleResetSearch}
                className="mt-4 text-blue-600 hover:text-blue-800 underline"
              >
                전체 게시글 보기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentPosts.map((board) => (
              <div
                key={board.id}
                onClick={() => handlePostClick(board.id)}
                className="border-b border-gray-200 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-100 transition p-2 rounded"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-300">
                      {board.usersProfileImage ? (
                        <img
                          src={board.usersProfileImage}
                          alt={board.usersName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">
                          {board.usersName?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-md font-semibold text-gray-800">
                        {board.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                        {board.content.replace(/<[^>]*>/g, '').substring(0, 50)}
                        {board.content.length > 50 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {/* 위치를 아래로 내리기 위해 mt-4 (top margin) 적용 */}
                    <div className="flex items-center justify-end space-x-2 mt-6">
                      <div className="text-sm text-gray-500 flex items-center space-x-1">
                        <EyeIcon className="w-4 h-4" />
                        <span>{board.views || 0}</span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-1">
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                        {/* 게시글 객체에서 직접 댓글 수 사용 */}
                        <span>{commentCounts[board.id] || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 검색창 */}
      <div className="mt-8 relative">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="검색어를 입력하세요"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-[14px] focus:outline-none focus:border-blue-500"
        />
        <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" />
        </button>
      </div>
    </section>
  );
};

export default AllPosts;