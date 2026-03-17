# HireHub

기술 스택 정밀 필터링으로 맞춤 공고를 탐색하고, AI 추천과 달력 스크랩 관리를 제공하는 개발자 취업 플랫폼

---

## 주요 기능

- **채용 공고 탐색**: 공고 목록 조회 및 상세 기업 정보 확인
- **AI 채용 매칭**: 임베딩 기반 사용자-공고 자동 매칭
- **AI 자기소개서 작성**: Google Gemini 기반 자소서 생성 지원
- **AI 면접 코칭**: 면접 예상 질문 생성 및 히스토리 관리
- **실시간 상담**: WebSocket(STOMP) 기반 실시간 채팅
- **이력서 관리**: 복수 이력서 저장 및 관리
- **커뮤니티**: 게시판, 댓글, 기업 리뷰 및 평점
- **소셜 로그인**: Google, 네이버 OAuth2
- **프리미엄 구독**: PortOne 결제 연동
- **관리자 대시보드**: 사용자 관리, 콘텐츠 모더레이션, 통계

---

## 기술 스택

### Frontend
| 항목 | 기술 |
|------|------|
| Framework | React 19, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router v7 |
| HTTP Client | Axios |
| WebSocket | @stomp/stompjs, SockJS |
| Charts | Recharts |

### Backend
| 항목 | 기술 |
|------|------|
| Framework | Spring Boot 3.5.6 (Java 17) |
| Database | MySQL 8.0 |
| ORM | JPA / Hibernate |
| Auth | Spring Security, OAuth2, JWT |
| Real-time | WebSocket / STOMP |
| File Storage | AWS S3 |

### AI / ML
| 항목 | 기술 |
|------|------|
| Framework | FastAPI (Python) |
| LLM | Google Gemini API |
| Scheduler | APScheduler |

### Infrastructure
| 항목 | 기술 |
|------|------|
| Container | Docker, Docker Compose |
| Cloud | AWS EC2, AWS S3, AWS RDS |
| CI/CD | GitHub Actions |
| Maps | Kakao Map API |

---

## 프로젝트 구조

```
hirehub/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Spring Boot
├── fastapi/           # FastAPI (AI 서비스)
├── infra/             # Docker Compose 설정
└── .github/workflows/ # CI/CD 파이프라인
```

### Frontend (`frontend/src/`)
```
├── api/                   # API 모듈
├── adminPage/             # 관리자 대시보드
├── boardPage/             # 커뮤니티 게시판
├── chatBot/               # AI 챗봇
├── chatPage/              # 실시간 채팅
├── coverLetterPage/       # 자기소개서 작성
├── interviewCoachingPage/ # 면접 코칭
├── jobMatchingPage/       # 채용 매칭
├── jobPostings/           # 채용 공고 목록/상세
├── layout/                # Header, Footer
├── mainPage/              # 메인 홈
├── signPage/              # 로그인/회원가입
├── context/               # AuthContext
├── hooks/                 # 커스텀 훅
├── types/                 # TypeScript 타입 정의
└── utils/                 # 유틸리티 함수
```

### Backend (`backend/src/main/java/com/we/hirehub/`)
```
├── controller/    # REST API 엔드포인트
├── entity/        # JPA 엔티티
├── repository/    # 데이터 접근 계층
├── service/       # 비즈니스 로직
├── dto/           # 데이터 전송 객체
├── config/        # Spring 설정 (WebSocket, Security)
├── auth/          # JWT, OAuth2 인증
└── scheduler/     # 스케줄링 작업
```

---

## 로컬 개발 환경 설정

### 사전 요구사항
- Node.js 18+
- Java 17+
- Python 3.10+
- Docker & Docker Compose

### 1. 데이터베이스 실행

```bash
cd backend
docker-compose up -d
```

### 2. Backend 실행

```bash
cd backend
./gradlew bootRun
```

> Spring Boot 서버가 `http://localhost:8080` 에서 실행됩니다.

### 3. FastAPI 실행

```bash
cd fastapi
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

> AI 서버가 `http://localhost:8000` 에서 실행됩니다.

### 4. Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

> 개발 서버가 `http://localhost:5173` 에서 실행됩니다.

Vite 개발 서버는 아래 경로를 자동으로 프록시합니다:
- `/api` → `http://localhost:8080`
- `/ws` → `http://localhost:8080` (WebSocket)
- `/ai` → `http://localhost:8000`

---

## 프로덕션 배포

GitHub Actions를 통해 AWS EC2에 자동 배포됩니다.

```bash
# 프로덕션 환경 Docker Compose 실행
cd infra
docker-compose -f docker-compose.prod.yml up -d
```

---

## 환경 변수

### Backend (`application.yml`)
| 변수 | 설명 |
|------|------|
| `MYSQL_URL` | MySQL 연결 URL |
| `MYSQL_USERNAME` | DB 사용자명 |
| `MYSQL_PASSWORD` | DB 비밀번호 |
| `JWT_SECRET` | JWT 서명 키 |
| `GOOGLE_CLIENT_ID` | Google OAuth2 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 시크릿 |
| `NAVER_CLIENT_ID` | 네이버 OAuth2 클라이언트 ID |
| `NAVER_CLIENT_SECRET` | 네이버 OAuth2 시크릿 |
| `AWS_ACCESS_KEY` | AWS 접근 키 |
| `AWS_SECRET_KEY` | AWS 시크릿 키 |
| `S3_BUCKET` | S3 버킷 이름 |

### FastAPI (`.env`)
| 변수 | 설명 |
|------|------|
| `GEMINI_API_KEY` | Google Gemini API 키 |
