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

export interface ScrapPosts {
  id: number;
  users_id: number;
  job_posts_id: number;
  
  // ManyToOne relationships (optional - only when fetching with relations)
  users?: Users;
  jobPosts?: JobPosts;
}