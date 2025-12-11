// Types
export type Role = "ROLE_USER" | "ROLE_ADMIN";

// Entity Interfaces
export interface OAuth2 {
  client_id: string;
  principal_name: string;
  token_type: string;
  access_token: string;
  issued_at: string; // LocalDate -> string (ISO format: YYYY-MM-DD)
  expires_at: string;
  token_scope: string;
  refresh_token: string;
  refresh_issued_at: string;
  create_at: string;
}

export interface LiveChat {
  id: number;
  content: string;
  create_at: string; // LocalDateTime -> string (ISO format)
  session_id: string;
}

export interface ChatBot {
  id: number;
  users_id: number;
  session_id: string;
  content: string;
  bot_answer: string;
  onoff: boolean;
  meta: Record<string, any>; // JSON -> object
  create_at: string; // LocalDate -> string
}

export interface Session {
  id: string;
  users_id: number;
  ctx: Record<string, any>; // JSON -> object

  // OneToMany relationships (optional - only when fetching with relations)
  liveChats?: LiveChat[];
  chatBots?: ChatBot[];
  helps?: Help[];
}

export interface Board {
  id: number;
  title: string;
  content: string;
  users_id: number;
  create_at: string; // LocalDateTime -> string
  update_at: string | null;
  views: number;

  // OneToMany relationships (optional - only when fetching with relations)
  comments?: Comments[];
}

export interface Comments {
  id: number;
  content: string;
  users_id: number;
  board_id: number;
  comment_id: number | null; // parent comment for replies
  create_at: string; // LocalDateTime -> string
  update_at: string | null;

  // ManyToOne relationships (optional - only when fetching with relations)
  users?: Users;
  board?: Board;
  parentComment?: Comments;
  childComments?: Comments[];
}

export interface Users {
  id: number;
  name: string;
  nickname: string;
  phone: string;
  dob: string; // 생년월일
  gender: string;
  email: string;
  password: string;
  education: string | null;
  career_level: string | null;
  position: string | null;
  address: string | null;
  location: string | null; // 선호하는 지역
  role: Role;

  // OneToMany relationships (optional - only when fetching with relations)
  chatBots?: ChatBot[];
  helps?: Help[];
  sessions?: Session[];
  boards?: Board[];
  faqAnswers?: FaqAnswer[];
  comments?: Comments[];
  reviews?: Review[];
  resumes?: Resume[];
  favoriteCompanies?: FavoriteCompany[];
  scrapPosts?: ScrapPosts[];
}

export interface UsersResponse {
  id: number;
  email: string;
  nickname: string;
  name: string;
  phone: string;
  dob: string;
  age: number | null;
  gender: string;
  address: string;
  location: string;
  position: string;
  careerLevel: string;
  education: string;
}


export interface UsersRequest {
  name?: string;
  nickname?: string;
  phone?: string;
  dob?: string;        // LocalDate → "yyyy-MM-dd"
  gender?: string;
  address?: string;
  location?: string;
  position?: string;
  careerLevel?: string;
  education?: string;
  age?: number;       // 선택값 (백엔드에서도 optional)
}

export interface Review {
  id: number;
  score: number;
  content: string | null;
  users_id: number;
  company_id: number;

  // ManyToOne relationships (optional - only when fetching with relations)
  users?: Users;
  company?: Company;
}

export interface Company {
  id: number;
  name: string;
  content: string;
  address: string;
  since: number; // 설립년도 (Long -> number)
  benefits: string;
  website: string;
  industry: string;
  ceo: string;
  photo: string | null; // AWS S3 URL
  count?: string;        // 사원수
  companyType?: string;  // 기업구분
  benefitsList?: string[]; // 복리후생 리스트

  // OneToMany relationships (optional - only when fetching with relations)
  jobPosts?: JobPosts[];
  reviews?: Review[];
}

export interface Help {
  id: number;
  session_id: string;
  request_at: string; // LocalDateTime -> string
  start_at: string | null;
  end_at: string | null;
  users_id: number;
  meta: Record<string, any>; // JSON -> object
}

export interface FaqAnswer {
  id: number;
  faq_question_id: number;
  content: string;
  users_id: number | null;
  create_at: string; // LocalDateTime -> string
  update_at: string | null;
}

export interface FaqQuestion {
  id: number;
  title: string;
  content: string;
  category: string | null;
  tags: string | null;
  create_at: string; // LocalDateTime -> string
  update_at: string | null;

  // OneToMany relationships (optional - only when fetching with relations)
  faqAnswers?: FaqAnswer[];
}

export interface JobPosts {
  id: number;
  title: string;
  content: string;
  start_at: string; // LocalDate -> string (YYYY-MM-DD)
  end_at: string;
  location: string;
  career_level: string;
  position: string;
  education: string;
  type: string; // 고용형태
  salary: string; // 급여
  company_id: number;

  // OneToMany relationships (optional - only when fetching with relations)
  apply?: Apply;
  scrapPosts?: ScrapPosts[];
}



export interface Apply {
  id: number;
  resume_id: number;
  job_posts_id: number; // JobPosts FK
  apply_at: string; // LocalDate -> string (YYYY-MM-DD)

  // ManyToOne relationships (optional - only when fetching with relations)
  resume?: Resume;
  jobPosts?: JobPosts;
}

export interface Resume {
  id: number;
  title: string;
  id_photo: string | null; // AWS S3 URL
  essay_title: string | null; // essayTittle -> essay_title
  essay_content: string | null;
  users_id: number;
  create_at: string; // LocalDate -> string (YYYY-MM-DD)
  update_at: string | null;
  locked: boolean; // 지원완료 된 이력서 여부

  // OneToMany relationships (optional - only when fetching with relations)
  education?: Education[];
  careerLevel?: CareerLevel[];
  certificates?: Certificate[];
  languages?: Language[];
  skills?: Skill[];
  applies?: Apply[];
}

export interface Education {
  id: number;
  name: string;
  major: string | null;
  status: string;
  type: string;
  start_at: string; // LocalDate -> string (YYYY-MM-DD)
  end_at: string | null;
  resume_id: number;

  // ManyToOne relationships (optional - only when fetching with relations)
  resume?: Resume;
}

export interface CareerLevel {
  id: number;
  company_name: string;
  type: string;
  position: string;
  start_at: string; // LocalDate -> string (YYYY-MM-DD)
  end_at: string | null;
  content: string;
  resume_id: number | null;

  // ManyToOne relationships (optional - only when fetching with relations)
  resume?: Resume;
}

export interface Certificate {
  id: number;
  name: string;
  resume_id: number | null;

  // ManyToOne relationships (optional - only when fetching with relations)
  resume?: Resume;
}

export interface Language {
  id: number;
  name: string;
  resume_id: number | null;

  // ManyToOne relationships (optional - only when fetching with relations)
  resume?: Resume;
}

export interface Skill {
  id: number;
  name: string;
  resume_id: number | null;

  // ManyToOne relationships (optional - only when fetching with relations)
  resume?: Resume;
}

export interface FavoriteCompany {
  id: number;
  users_id: number;
  company_id: number;

  // ManyToOne relationships (optional - only when fetching with relations)
  users?: Users;
  company?: Company;
}

export interface FavoriteCompanyResponse {
  id: number;
  userId?: number;
  companyId: number;
  companyName: string;
  postCount: number;
  companyPhoto?: string;
  industry?: string;
};

export interface FavoriteCompanyGroup {
  companyId: number;
  companyName: string;
  postCount: number;
  ids: number[];
  companyPhoto?: string;
  industry?: string;
}


export interface ScrapPosts {
  id: number;
  users_id: number;
  job_posts_id: number;

  // ManyToOne relationships (optional - only when fetching with relations)
  users?: Users;
  jobPosts?: JobPosts;
}

export interface ScrapPostResponse {
  id: number;
  userId: number;
  jobPostId: number;
  title: string;
  companyName: string;
  endAt: string; // LocalDate -> string (YYYY-MM-DD)
  companyPhoto?: string;
  jobPostPhoto?: string;
}

// Board DTOs
export interface BoardListResponse {
  id: number;
  title: string;
  content: string;
  usersId: number;
  usersName: string;
  nickname: string;
  usersProfileImage: string | null;
  createAt: string;
  updateAt: string | null;
  views: number;
  comments: CommentResponse[];
}

export interface CommentResponse {
  id: number;
  content: string;
  usersId: number;
  usersName: string;
  nickname: string;
  usersProfileImage: string | null;
  boardId: number;
  parentCommentId: number | null;
  createAt: string;
  updateAt: string | null;
}

export interface CreateBoardRequest {
  title: string;
  content: string;
}

export interface CreateCommentRequest {
  content: string;
  boardId: number;
  parentCommentId?: number | null;
}

// Ads
export interface Ad {
  id: number;
  photo: string;
  // Add other fields if necessary based on API response
}

// Job Postings DTOs
export interface JobPostResponse {
  id: number;
  title: string;
  companyName: string;
  companyId: number;
  views: number;
  careerLevel: string;
  position: string;
  education: string;
  type?: string;
  location: string;
  salary?: string;
  startAt?: string;
  endAt: string;
  content?: string;
  photo?: string;
  // ✅ 추가된 필드  위도와 경도
  mainJob?: string;
  qualification?: string;
  preference?: string;
  hireType?: string;
  lat?: number;
  lng?: number;
  techStacks?: string[];
}

export interface CompanyResponse {
  id: number;
  name: string;
  content: string;
  address: string;
  website: string;
  since: string;
  industry: string;
  benefits: string;
  ceo: string;
  photo?: string;
  count?: string;        // 사원수
  companyType?: string;  // 기업구분
  benefitsList?: string[]; // 복리후생 리스트

  // ⭐⭐ 반드시 추가
  lat: number | null;
  lng: number | null;
}

export interface ChartData {
  year: string;
  sales: number;
  avgSalary: number;
  newSalary: number;
}

export interface CompanyStatsResponse {
  chartData: ChartData[];
  totalEmployees: number;
  currentAvgAge: number;
}

export interface ReviewResponse {
  id: number;
  usersId: number;
  nickname: string;
  content: string;
  score: number;
  date?: string;
}

export interface ResumeResponse {
  id: number;
  title: string;
  locked: boolean;
  createAt: string;
  updateAt: string;
}

export interface CreateReviewRequest {
  content: string;
  score: number;
  companyId: number;
  date: string;
}

export interface ApplyRequest {
  jobPostId: number;
  resumeId: number;
}

export interface PagedResponse<T> {
  items?: T[];
  content?: T[];
  rows?: T[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}

export interface ChatMessage {
  id?: number;
  content: string;
  createAt: string;
  sessionId: string;
  nickname?: string;
  userId?: number;
}
export interface MyPostItem {
  id: number;
  title: string;
  content: string;
  views?: number;
  createAt?: string;
  updateAt?: string;
}
// My Page DTOs
export interface ApplyItem {
  id: number;
  resumeId: number | null;
  jobPostsId: number;
  companyName: string;
  resumeTitle: string;
  appliedAt: string;
  jobPostTitle?: string;
}

export interface ResumeItem {
  id: number;
  title: string;
  locked: boolean;
  createAt: string;
  updateAt: string;
}

export interface ProfileMini {
  id: number;
  nickname?: string | null;
  name?: string | null;
  phone?: string | null;
  gender?: string | null;
  birth?: string | null;     // yyyy-MM-dd
  address?: string | null;
  email?: string | null;
}

export interface ResumeDto {
  id: number;
  title: string;
  idPhoto?: string | null;
  essayTitle?: string | null;
  essayTittle?: string | null;
  essayContent?: string | null;
  htmlContent?: string | null;
  locked: boolean;
  createAt: string;
  updateAt: string;
  profile?: ProfileMini | null;

  // 스냅샷 메타
  companyName?: string | null;
  appliedAt?: string | null;

  // 백엔드 분해 필드
  educationJson?: string | null;
  careerJson?: string | null;
  certJson?: string | null;
  skillJson?: string | null;
  langJson?: string | null;

  // 백엔드 List 필드 (MyPageResumeService.toDto에서 반환)
  educationList?: any[];
  careerList?: any[];
  certificateList?: any[];
  skillList?: any[];
  languageList?: any[];

  // 호환성 필드
  educations?: any[];
  careers?: any[];
  certs?: any[];
  skills?: any[];
  langs?: any[];

  // DTO 필드 (자소서 첨삭 페이지 호환)
  educationDtos?: Array<{
    name: string;
    major?: string;
    status?: string;
    type?: string;
    startAt?: string;
    endAt?: string;
  }>;
  careerLevelDtos?: Array<{
    companyName: string;
    position?: string;
    type?: string;
    content?: string;
    startAt?: string;
    endAt?: string;
  }>;
  certificateDtos?: Array<{
    name: string;
  }>;
  skillDtos?: Array<{
    name: string;
  }>;
  languageDtos?: Array<{
    name: string;
  }>;
}

export interface MyProfileDto {
  id: number;
  email?: string | null;
  nickname?: string | null;
  name?: string | null;
  phone?: string | null;
  gender?: string | null;
  address?: string | null;
  position?: string | null;
  education?: string | null;
  birth?: string | null;
  age?: number | null;
  region?: string | null;
  career?: string | null;
}

export interface EducationBE {
  name: string;
  major?: string;
  status?: string;
  type?: string;
  startAt?: string;
  endAt?: string;
}

export interface CareerBE {
  companyName: string;
  type?: string;
  position?: string;
  startAt?: string;
  endAt?: string;
  content?: string;
}

export interface NamedBE {
  name: string;
}

export interface Notice {
  id?: number;
  date: string;
  title: string;
  companyName?: string;
  location?: string;
  type?: string;
  position?: string;
  careerLevel?: string;
  education?: string;
}

// Admin DTOs
export interface AdminUser {
  id: number;
  name: string;
  nickname: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface JobPostResponse {
  id: number;
  title: string;
  companyName: string;
  companyId: number;
  views: number;
  careerLevel: string;
  position: string;
  education: string;
  type?: string;
  location: string;
  salary?: string;
  endAt: string;
  content?: string;
  photo?: string;
  mainJob?: string;
  qualification?: string;
  preference?: string;
  hireType?: string;
}

export interface AdminCompany {
  id: number;
  name: string;
  content: string;
  address: string;
  since: number;
  benefits: string;
  website: string;
  industry: string;
  ceo: string;
  photo?: string;
  benefitsList?: string[];
  count?: string;        // 사원수
  companyType?: string;  // 기업구분
}

export interface AdminJob {
  id: number;
  title: string;
  content: string;
  endAt: string;
  location: string;
  careerLevel: string;
  education: string;
  position: string;
  type: string;
  photo?: string;
  company?: {
    id: number;
    name: string;
  };
  mainJob?: string;           // 주요업무
  qualification?: string;      // 자격요건
  preference?: string;         // 우대사항
  hireType?: string;          // 채용전형
  techStackList?: string[];   // 기술 스택 목록
}

export interface AdminReview {
  id: number;
  score: number;
  content: string | null;
  usersId: number;
  nickname: string | null;
  companyId: number;
  companyName: string | null;
}

export interface AdminAd {
  id: number;
  title: string;
  imageUrl?: string;
}

export interface AdminPost {
  id: number;
  title: string;
  content: string;
  usersId: number;
  nickname: string;
  authorEmail?: string;
  views: number;
  comments: number;
  createAt: string;
  updateAt?: string;
}

export interface AdminComment {
  id: number;
  content: string;
  usersId: number | null;
  nickname: string | null;
  boardId: number | null;
  boardTitle?: string | null;
  parentCommentId: number | null;
  parentCommentContent?: string | null;
  createAt: string;
  updateAt: string | null;
}

export interface AdminResumeDto {
  id: number;
  title: string;
  idPhoto?: string | null;
  essayTitle?: string | null;
  essayTittle?: string | null;
  essayContent?: string | null;
  htmlContent?: string | null;
  locked: boolean;
  educationList?: Array<{
    name?: string;
    major?: string;
    status?: string;
    type?: string;
    startAt?: string | null;
    endAt?: string | null;
  }>;
  careerList?: Array<{
    companyName?: string;
    type?: string;
    position?: string;
    startAt?: string | null;
    endAt?: string | null;
    content?: string;
  }>;
  certificateList?: Array<any>;
  skillList?: Array<any>;
  languageList?: Array<any>;
  languages?: Array<any>;
  users?: {
    userId?: number;
    nickname?: string;
    email?: string;
  };
  createAt: string;
  updateAt?: string;
}

export interface AiBoardControl {
  id: number;
  board: {
    id: number;
    title: string;
    hidden: boolean;
  };
  role: string;
  reason: string;
}

export interface AdminPageInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface AdminResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

