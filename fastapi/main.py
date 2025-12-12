# main.py — FULL Combined Version
# 뉴스 / moderation / review / match-one / embed / models / health 전부 포함
# + 임베딩 기반 Spring 매칭 지원
# + 10만 job_posts 확장을 위한 속도 최적화 (임베딩 캐시-friendly)

import os, sys, re, json, hashlib
import requests
import google.generativeai as genai
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import dotenv_values, load_dotenv

sys.stdout.reconfigure(encoding='utf-8')

sys.stdout.reconfigure(encoding='utf-8')

# ===== ENV 적용 =====
env = dotenv_values(".env")
for k, v in env.items():
    if v:
        os.environ[k] = v
load_dotenv()
import time
from functools import wraps
from typing_extensions import TypedDict
from collections import deque
from fastapi.responses import StreamingResponse
import asyncio

# ===== Gemini 설정 =====
API_KEY = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=API_KEY)

print("✅ FastAPI Loaded — ALL FEATURES READY")


# ------------------------------------------------------
# 공통 유틸
# ------------------------------------------------------

def safe_json(s: str):
    """JSON 파싱 안전 버전"""
    if not s:
        return {}
    try:
        return json.loads(s)
    except:
        m = re.search(r"\{.*\}", s, re.S)
        if not m:
            return {}
        try:
            return json.loads(m.group(0))
        except:
            return {}


def safe_json_v2(s: str):
    """
    Gemini API 응답에서 JSON 추출 (개선 버전)
    """
    if not s:
        return {}

    # 1. Markdown 코드 블록 제거 (```json ... ```)
    s = re.sub(r'```json\s*', '', s)
    s = re.sub(r'```\s*$', '', s)
    s = re.sub(r'^```\s*', '', s)

    # 2. 앞뒤 공백 제거
    s = s.strip()

    # 3. 직접 파싱 시도
    try:
        return json.loads(s)
    except:
        pass

    # 4. JSON 객체만 추출 시도
    try:
        match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', s, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except:
        pass

    # 5. 최후의 수단: score와 reason만 추출
    try:
        score_match = re.search(r'"score"\s*:\s*(\d+)', s)
        reason_match = re.search(r'"reason"\s*:\s*"([^"]*)"', s)

        if score_match:
            score = int(score_match.group(1))
            reason = reason_match.group(1) if reason_match else "분석 완료"
            return {"score": score, "reason": reason}
    except:
        pass

    return {"score": 0, "reason": "JSON 파싱 실패"}


# ⭐ 이 함수가 먼저 정의되어야 함!
def call_llm(model, system, prompt, max_tokens=512, temperature=0.3):
    """LLM 호출 (모든 기능 공통 사용)"""
    try:
        m = genai.GenerativeModel(
            model_name=model,
            system_instruction=system
        )
        r = m.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
                top_k=1,
                top_p=0.95,
                candidate_count=1,
            )
        )

        cand = r.candidates[0] if r.candidates else None
        if cand and cand.content.parts:
            return "\n".join([p.text for p in cand.content.parts if getattr(p, "text", None)])
    except Exception as e:
        print(f"[LLM ERROR] {e}")
    return None


def call_llm_with_json(model, system, prompt, max_tokens=512, temperature=0.3):
    """JSON 응답을 강제하는 LLM 호출"""
    try:
        m = genai.GenerativeModel(
            model_name=model,
            system_instruction=system,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
                top_k=1,
                top_p=0.95,
                candidate_count=1,
                response_mime_type="application/json",  # ⭐ JSON 강제
            )
        )

        r = m.generate_content(prompt)

        cand = r.candidates[0] if r.candidates else None
        if cand and cand.content.parts:
            text = "\n".join([p.text for p in cand.content.parts if getattr(p, "text", None)])
            return text
    except Exception as e:
        print(f"[LLM JSON ERROR] {e}")

    return None


def generate_text(system, prompt, max_tokens=512, temperature=0.3):
    """2단계 모델 폴백 포함"""
    primary = "gemini-2.0-flash"
    fallback = "gemini-2.0-flash"

    out = call_llm(primary, system, prompt, max_tokens, temperature)
    if out:
        return out

    out = call_llm(fallback, system, prompt, max_tokens, temperature)
    return out or "⚠️ 모델 무응답"


def generate_json(system, user_prompt, schema_hint, max_tokens=512, temperature=0.2):
    """JSON만 강제로 뽑아오는 헬퍼"""
    prompt = (
        f"{user_prompt}\n\n반드시 JSON만 출력.\n스키마: {schema_hint}"
    )
    out = generate_text(system, prompt, max_tokens, temperature)
    data = safe_json(out)
    if data:
        return data
    return safe_json(out)

# save_chat_to_spring 함수 구현
SPRING_URL = "http://localhost:8080/api/chatbot/save"

def save_chat_to_spring(user_id, session_id, user_message, bot_answer):
    payload = {
        "userId": user_id,
        "sessionId": str(session_id),
        "userMessage": user_message,
        "botAnswer": bot_answer
    }

    try:
        r = requests.post(SPRING_URL, json=payload, timeout=5)
        print("📌 Chat saved:", r.status_code)
    except Exception as e:
        print("❌ Chat save failed:", e)

# ------------------------------------------------------
# FastAPI 설정
# ------------------------------------------------------

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------
# Schemas
# ------------------------------------------------------

class NewsItem(BaseModel):
    title: str
    link: str
    description: Optional[str] = None
    pubDate: Optional[str] = None
    press: Optional[str] = None

class DigestRequest(BaseModel):
    query: str = "채용 OR 공채"
    days: int = 3
    limit: int = 20
    style: str = "bullet"

class ReviewRequest(BaseModel):
    content: str

class MatchOneRequest(BaseModel):
    resume: Optional[str] = ""
    job: Optional[str] = ""

class EmbedRequest(BaseModel):
    text: str


class RateLimiter:
    """무료 티어 Rate Limit 관리"""

    def __init__(self, rpm=15, rpd=1500):
        self.rpm = rpm  # 분당 요청
        self.rpd = rpd  # 일일 요청
        self.minute_queue = deque()
        self.daily_count = 0
        self.daily_reset = datetime.now() + timedelta(days=1)

    def check_and_wait(self):
        """Rate limit 체크 및 대기"""
        now = datetime.now()

        # 일일 제한 리셋
        if now >= self.daily_reset:
            self.daily_count = 0
            self.daily_reset = now + timedelta(days=1)

        # 일일 제한 체크
        if self.daily_count >= self.rpd:
            raise Exception(f"일일 요청 제한 초과 ({self.rpd}회)")

        # 1분 이전 요청 제거
        one_minute_ago = now - timedelta(minutes=1)
        while self.minute_queue and self.minute_queue[0] < one_minute_ago:
            self.minute_queue.popleft()

        # 분당 제한 체크 및 대기
        if len(self.minute_queue) >= self.rpm:
            # 가장 오래된 요청이 1분 경과할 때까지 대기
            wait_until = self.minute_queue[0] + timedelta(minutes=1)
            wait_seconds = (wait_until - now).total_seconds()
            if wait_seconds > 0:
                print(f"⏳ Rate limit 대기: {wait_seconds:.1f}초")
                time.sleep(wait_seconds + 0.1)

        # 요청 기록
        self.minute_queue.append(now)
        self.daily_count += 1

        return True


# 전역 Rate Limiter
gemini_limiter = RateLimiter(rpm=15, rpd=1500)

# ------------------------------------------------------
# NAVER 뉴스 파트
# ------------------------------------------------------

def naver_news_search(query, start=1, display=20, sort="date"):
    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }
    params = {"query": query, "display": display, "start": start, "sort": sort}
    r = requests.get("https://openapi.naver.com/v1/search/news.json",
                     headers=headers, params=params, timeout=10)
    r.raise_for_status()
    return r.json()



@app.post("/news/fetch", response_model=List[NewsItem])
def fetch_news(req: DigestRequest):
    items = []
    remaining = req.limit
    start = 1

    while remaining > 0 and start <= 1000:
        size = min(20, remaining)
        data = naver_news_search(req.query, start, size)
        raw = data.get("items", [])
        if not raw:
            break

        for it in raw:
            items.append(
                NewsItem(
                    title=it["title"].replace("<b>", "").replace("</b>", ""),
                    link=it["link"],
                    description=it.get("description", "").replace("<b>", "").replace("</b>", ""),
                    pubDate=it.get("pubDate"),
                    press=it.get("originallink"),
                )
            )
        remaining -= len(raw)
        start += size

    # 날짜 필터
    if req.days > 0:
        cutoff = datetime.utcnow() - timedelta(days=req.days + 0.5)

        def in_range(n):
            try:
                dt = datetime.strptime(n.pubDate, "%a, %d %b %Y %H:%M:%S %z")
                return dt.timestamp() >= cutoff.timestamp()
            except:
                return False

        items = [n for n in items if in_range(n)]

    return items[:req.limit]


@app.post("/news/digest")
def news_digest(req: DigestRequest):
    queries = [
        "채용 OR 공채 OR 노동시장",
        "IT OR 기술 OR 개발자 OR AI",
        "경제 OR 산업 OR 시장"
    ]

    items = []
    for q in queries:
        items = fetch_news(DigestRequest(query=q, days=req.days, limit=req.limit))
        if items:
            break

    if not items:
        return {"title": "뉴스 없음", "content": "", "tags": [], "sources": []}

    titles = "\n".join(f"- {n.title}" for n in items)

    out = generate_text(
        "너는 뉴스 전문 편집자다. 요약 내용만 간결하게 작성하고, '알겠습니다', '다음과 같이' 같은 인사말이나 서론 없이 바로 본문을 시작해라.",
        f"""다음 뉴스 제목들을 {req.style} 스타일로 요약해라. 인사말 없이 바로 요약 내용만 작성:
{titles}
""",
        max_tokens=500,
        temperature=0.25
    )

    # 🔥 불필요한 인사말 제거
    content = out.strip()

    # "알겠습니다", "다음과 같이" 등으로 시작하는 첫 줄 제거
    lines = content.split('\n')
    if lines and any(phrase in lines[0] for phrase in ['알겠습니다', '다음과 같이', '요약했습니다', '정리했습니다', '안내드립니다']):
        content = '\n'.join(lines[1:]).strip()

    uid = datetime.now().strftime("%Y%m%d%H%M%S")
    return {
        "title": f"AI 뉴스 요약 ({uid})",
        "content": content,
        "tags": ["뉴스", "요약"],
        "sources": items,
    }


# ------------------------------------------------------
# Moderation
# ------------------------------------------------------

KOREAN_BAD_RE = re.compile(r"(씨발|시발|ㅅ\s*ㅂ|개\s*새끼|병신|좆|지랄|씹)", re.I)
SPAM_RE = [r"(http|https)://", r"오픈채팅", r"수익\s?보장", r"상담\s?문의"]

# 검열 결과 캐시 (메모리 기반, 최대 1000개)
moderation_cache = {}
MAX_CACHE_SIZE = 1000

@app.post("/ai/moderate")
def moderate(req: dict):
    text = (req or {}).get("content", "") or ""

    # 빈 텍스트는 즉시 승인
    if not text or len(text.strip()) < 2:
        return {"approve": True, "reason": "빈 내용", "categories": {}}

    # 캐시 확인 (같은 내용은 재검사 안 함)
    text_hash = hashlib.md5(text.encode()).hexdigest()
    if text_hash in moderation_cache:
        return moderation_cache[text_hash]

    # 1차: 명백한 욕설/스팸은 즉시 차단 (AI 호출 없음)
    if KOREAN_BAD_RE.search(text) or any(re.search(p, text, re.I) for p in SPAM_RE):
        result = {"approve": False, "reason": "룰 기반 차단", "categories": {"rule": 1.0}}
        moderation_cache[text_hash] = result
        return result

    # 2차: 모든 텍스트 AI 검사
    data = generate_json(
        "너는 콘텐츠 안전 심사관이다.",
        f"아래 글 위험도 분석:\n{text[:500]}",  # 500자로 제한
        schema_hint='{"approve": bool, "categories": {}, "reason": ""}'
    )

    cats = data.get("categories", {})
    risk_values = [float(v) for v in cats.values()] if cats else []
    max_risk = max(risk_values) if risk_values else 0

    approve = data.get("approve", True)
    if max_risk >= 0.5:
        approve = False

    result = {"approve": approve, "reason": data.get("reason", ""), "categories": cats}

    # 캐시 저장 (크기 제한)
    if len(moderation_cache) < MAX_CACHE_SIZE:
        moderation_cache[text_hash] = result

    return result


# ------------------------------------------------------
# Review
# ------------------------------------------------------

@app.post("/ai/review")
def review_resume(req: ReviewRequest):
    """
    이력서/자소서 첨삭 기능 (개선 버전)
    - 더 상세한 에러 로깅
    - rate limit 체크
    - fallback 모델 지원
    - 구조화된 피드백
    """
    if not req.content:
        return {"feedback": "❌ 이력서 내용이 비어있습니다."}

    content = req.content.strip()

    # 텍스트 길이 제한 (토큰 절약)
    if len(content) > 5000:
        content = content[:5000]
        print(f"⚠️ 텍스트가 너무 길어 5000자로 제한했습니다.")

    print(f"📝 첨삭 요청 받음 - 텍스트 길이: {len(content)}자")

    system_prompt = """당신은 한국 IT 기업의 전문 채용 담당자입니다.
이력서와 자기소개서를 첨삭하여 구체적이고 실용적인 개선 제안을 제공합니다.

**첨삭 기준:**
1. 명확성: 모호한 표현을 구체적으로 개선
2. 임팩트: 성과와 기여도를 강조
3. 구조: 논리적 흐름과 가독성
4. 전문성: IT 직무에 적합한 표현
5. 문법: 맞춤법과 문장 구조

**응답 형식:**
### 📊 전체 평가
- 전반적인 인상과 강점을 2-3문장으로 요약

### ✏️ 주요 개선사항
1. [항목]: 구체적인 문제점과 개선 방향
2. [항목]: 구체적인 문제점과 개선 방향
3. [항목]: 구체적인 문제점과 개선 방향

### 💡 추천 표현
- "기존 표현" → "개선된 표현"
- "기존 표현" → "개선된 표현"

### 🎯 마무리 조언
실용적인 최종 조언 1-2문장"""

    user_prompt = f"""다음 내용을 첨삭해주세요:

{content}

위 형식에 맞춰 구체적이고 실용적인 첨삭을 제공해주세요."""

    try:
        print("🤖 Gemini API 호출 시작...")

        # Primary model: gemini-2.0-flash
        try:
            model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction=system_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=1500,
                    temperature=0.4,
                    top_k=40,
                    top_p=0.95,
                )
            )

            response = model.generate_content(user_prompt)

            if response.candidates and response.candidates[0].content.parts:
                feedback = "\n".join([
                    part.text for part in response.candidates[0].content.parts
                    if hasattr(part, "text")
                ])

                if feedback and len(feedback) > 50:
                    print(f"✅ Primary model 응답 성공 - 길이: {len(feedback)}자")
                    return {"feedback": feedback}

            print("⚠️ Primary model 응답이 비어있음, fallback 시도...")

        except Exception as e:
            print(f"⚠️ Primary model 실패: {str(e)[:100]}")

        # Fallback model: gemini-2.0-flash
        print("🔄 Fallback model 시도 중...")

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=2048,
                temperature=0.4,
                stop_sequences=None,
            )
        )

        response = model.generate_content(user_prompt)

        if response.candidates and response.candidates[0].content.parts:
            feedback = "\n".join([
                part.text for part in response.candidates[0].content.parts
                if hasattr(part, "text")
            ])

            if feedback and len(feedback) > 50:
                print(f"✅ Fallback model 응답 성공 - 길이: {len(feedback)}자")

                # 응답이 완전한지 체크
                if not feedback.rstrip().endswith(('.', '!', '?', '요', '다', '니다', '습니다', '세요')):
                    print(f"⚠️ Fallback 응답도 불완전함")
                    feedback += "\n\n### ⚠️ 응답이 일부 누락되었을 수 있습니다\n위 내용을 참고하시고, 필요시 다시 요청해주세요."

                return {"feedback": feedback}

        # 두 모델 모두 실패한 경우
        print("❌ 모든 모델에서 응답 실패")
        return {
            "feedback": """### ⚠️ AI 첨삭 서비스 일시 이용 불가

현재 AI 모델이 응답하지 않습니다. 다음을 확인해주세요:

1. **잠시 후 다시 시도**: API 요청 제한에 도달했을 수 있습니다
2. **텍스트 길이 줄이기**: 너무 긴 내용은 요약해서 다시 시도
3. **기본 첨삭 가이드**:
   - 구체적인 성과 수치 포함 (예: "매출 20% 증가")
   - 기술 스택 명확히 명시
   - STAR 기법 활용 (상황-과제-행동-결과)
   - 간결하고 명확한 문장 사용

문제가 지속되면 관리자에게 문의해주세요."""
        }

    except Exception as e:
        error_msg = str(e)
        print(f"❌ 첨삭 API 오류: {error_msg}")

        # 에러 타입별 처리
        if "quota" in error_msg.lower() or "limit" in error_msg.lower():
            return {
                "feedback": """### ⚠️ API 사용량 초과

현재 일일 API 사용량을 초과했습니다.

**임시 해결 방법:**
1. 내일 다시 시도해주세요
2. 텍스트를 나눠서 여러 번 첨삭 요청
3. 아래 기본 가이드를 참고하세요

**기본 첨삭 가이드:**
- ✅ 구체적인 숫자와 성과 포함
- ✅ 기술 스택 명확히 기재
- ✅ 주요 경험 중심으로 작성
- ✅ 간결하고 임팩트 있는 표현 사용
- ❌ 추상적이고 모호한 표현 지양"""
            }
        elif "timeout" in error_msg.lower():
            return {
                "feedback": """### ⏱️ 응답 시간 초과

API 서버 응답이 지연되고 있습니다.

**해결 방법:**
1. 텍스트 양을 줄여서 다시 시도
2. 몇 분 후에 다시 시도
3. 섹션별로 나눠서 첨삭 요청"""
            }
        else:
            return {
                "feedback": f"""### ❌ 첨삭 오류 발생

오류 메시지: {error_msg[:200]}

**대처 방법:**
1. 페이지 새로고침 후 재시도
2. 브라우저 캐시 삭제
3. 관리자에게 문의

**기본 첨삭 원칙:**
- 명확하고 구체적으로 작성
- 성과와 기여도 강조
- 기술 스택 명확히 표시
- STAR 기법 활용"""
            }


# 추가: 첨삭 상태 체크 엔드포인트
@app.get("/ai/review/health")
def review_health_check():
    """첨삭 기능 상태 확인"""
    try:
        # 간단한 테스트 요청
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            "간단히 '정상'이라고만 답변해주세요.",
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=10,
                temperature=0.1,
            )
        )

        if response.candidates:
            return {
                "status": "healthy",
                "message": "AI 첨삭 서비스 정상 작동 중",
                "model": "gemini-2.0-flash"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"서비스 이용 불가: {str(e)[:100]}",
            "model": "none"
        }


@app.get("/ai/review/health")
def review_health_check():
    """첨삭 기능 상태 확인"""
    try:
        # 간단한 테스트 요청
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            "간단히 '정상'이라고만 답변해주세요.",
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=10,
                temperature=0.1,
            )
        )

        if response.candidates:
            return {
                "status": "healthy",
                "message": "AI 첨삭 서비스 정상 작동 중",
                "model": "gemini-2.0-flash"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"서비스 이용 불가: {str(e)[:100]}",
            "model": "none"
        }


# ------------------------------------------------------
# Embedding (옵션 2)
# ------------------------------------------------------

class SummRequest(BaseModel):
    text: str


@app.post("/ai/summarize")
def summarize(req: SummRequest):
    text = req.text.strip()

    if not text:
        return {"summary": "내용이 비어있습니다."}

    # 텍스트가 너무 길면 자르기 (Gemini 토큰 제한 고려)
    if len(text) > 8000:
        text = text[:4000] + "\n...(중략)...\n" + text[-2000:]

    sys_prompt = (
        "너는 한국 IT 기업 채용공고 전문 요약기다.\n"
        "규칙:\n"
        "1. 반드시 완전한 문장 5개를 작성한다.\n"
        "2. 각 문장은 마침표(.)로 끝나야 한다.\n"
        "3. 불완전한 문장은 절대 금지다.\n"
        "4. 다음 순서로 작성:\n"
        "   - 1문장: 회사 소개 또는 서비스 설명\n"
        "   - 2문장: 주요 업무 내용\n"
        "   - 1문장: 필수 자격요건 (기술스택 포함)\n"
        "   - 1문장: 우대사항 또는 복지\n"
        "5. 각 문장은 최소 10단어 이상이어야 한다.\n"
        "6. '리뷰', '분석', '조언' 같은 메타 언급 금지.\n"
        "7. 정직하고 간결한 문어체 한국어로 작성한다.\n"
    )

    user_prompt = (
        f"다음 채용공고를 정확히 5개의 완전한 문장으로 요약하세요.\n"
        f"각 문장은 반드시 마침표로 끝나야 합니다.\n\n"
        f"채용공고 내용:\n{text}\n\n"
        f"5개 문장 요약 (각 문장은 마침표로 끝남):"
    )

    # 1차 시도
    out = generate_text(
        sys_prompt,
        user_prompt,
        max_tokens=800,  # 토큰 수 증가
        temperature=0.3,
    )

    # 응답이 비어있거나 너무 짧은 경우 2차 시도
    if not out or len(out.strip()) < 100:
        print(f"⚠️ 1차 요약 실패, 2차 시도 중... (길이: {len(out) if out else 0})")

        # 더 간단한 프롬프트로 재시도
        simple_prompt = (
            f"다음 채용공고를 5문장으로 요약하세요:\n\n{text[:3000]}\n\n"
            f"요약 (5문장):"
        )

        out = generate_text(
            "너는 채용공고 요약 전문가다. 항상 5개의 완전한 문장으로 요약한다.",
            simple_prompt,
            max_tokens=800,
            temperature=0.4,
        )

    # 여전히 실패한 경우
    if not out or len(out.strip()) < 50:
        return {"summary": "요약 생성에 실패했습니다. 잠시 후 다시 시도해주세요."}

    # 문장 검증
    lines = [l.strip() for l in out.split("\n") if l.strip() and not l.strip().startswith("(")]
    sentences = []

    for line in lines:
        # 마침표로 문장 분리
        parts = [s.strip() + "." for s in line.split(".") if s.strip() and len(s.strip()) > 5]
        sentences.extend(parts)

    # 최소 3문장 이상 확보
    if len(sentences) < 3:
        print(f"⚠️ 문장 수 부족: {len(sentences)}개")
        # 원본 그대로 반환 (최소한의 내용이라도 저장)
        return {"summary": out.strip()}

    # 상위 5문장만 선택
    final_summary = " ".join(sentences[:5])

    return {"summary": final_summary}


@app.post("/ai/embed")
def embed(req: EmbedRequest):
    text = req.text.strip()
    if not text:
        return {"vector": []}

    try:
        emb = genai.embed_content(
            model="models/text-embedding-004",
            content=text
        )
        return {"vector": emb["embedding"]}
    except Exception as e:
        print("[EMBED ERROR]", e)
        return {"vector": []}


# ------------------------------------------------------
# match-one (옵션 4)
# ------------------------------------------------------

@app.post("/ai/match-one")
def match_one(req: MatchOneRequest):
    """
    무료 티어 최적화 버전
    - gemini-2.0-flash 사용
    - rate limit: 분당 15회, 일일 1,500회
    """
    resume = req.resume or ""
    job = req.job or ""

    if not resume.strip() or not job.strip():
        return {"score": 0, "reason": "입력 내용이 비어있습니다."}

    # 텍스트 길이 제한으로 토큰 절약
    resume = resume[:1000]
    job = job[:1000]

    try:
        # ✅ 무료 모델 사용
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction="""You are a Korean job matching AI.
Evaluate resume-job match and respond with score (0-100) and Korean reason.

Scoring guide:
90-100: Perfect match
70-89: Good match
50-69: Fair match
30-49: Poor match
0-29: No match""",
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=200,  # 토큰 절약
                response_mime_type="application/json",
                response_schema={
                    "type": "object",
                    "properties": {
                        "score": {"type": "integer"},
                        "reason": {"type": "string"}
                    },
                    "required": ["score", "reason"]
                }
            )
        )

        prompt = f"""Resume: {resume}

Job: {job}

Evaluate match."""

        response = model.generate_content(prompt)
        result = json.loads(response.text)

        score = int(min(max(result["score"], 0), 100))
        reason = result["reason"]

        return {"score": score, "reason": reason}

    except Exception as e:
        print(f"❌ 매칭 오류: {e}")
        # 키워드 기반 폴백
        return keyword_based_match(resume, job)


def keyword_based_match(resume: str, job: str):
    """API 실패 시 키워드 기반 폴백"""
    resume_lower = resume.lower()
    job_lower = job.lower()

    tech_keywords = {
        "backend": ["python", "java", "spring", "django", "node", "go", "kotlin"],
        "frontend": ["react", "vue", "angular", "javascript", "typescript", "css"],
        "database": ["mysql", "postgresql", "mongodb", "redis", "oracle"],
        "devops": ["aws", "docker", "kubernetes", "jenkins", "git", "linux"],
        "mobile": ["android", "ios", "swift", "flutter", "react native"]
    }

    total_matches = 0
    for keywords in tech_keywords.values():
        matches = sum(1 for kw in keywords if kw in resume_lower and kw in job_lower)
        total_matches += matches

    final_score = min(total_matches * 7, 70)
    reason = f"키워드 매칭 ({total_matches}개 일치)"

    return {"score": final_score, "reason": reason}


# ------------------------------------------------------
# 인터뷰 질문 생성 API
# ------------------------------------------------------

class GenerateRequest(BaseModel):
    resumeId: int
    jobPostId: Optional[int] = None
    companyId: Optional[int] = None
    jobPostLink: Optional[str] = None
    companyLink: Optional[str] = None
    previousQuestions: List[str] = []

def fetch_url_content(url: str) -> str:
    """URL에서 텍스트 콘텐츠 추출 (간단한 스크래핑)"""
    try:
        if not url.startswith("http"):
            return ""

        # 헤더 추가 (봇 차단 방지)
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            # HTML 태그 제거 (간단한 정규식)
            text = re.sub(r'<[^>]+>', ' ', resp.text)
            # 공백 정리
            text = re.sub(r'\s+', ' ', text).strip()
            return text[:2000] # 너무 길면 자름
    except Exception as e:
        print(f"URL fetch error: {e}")
    return ""

@app.post("/interview/generate-questions")
def generate_questions(req: GenerateRequest):

    # === 1) Spring Boot로부터 데이터 가져오기 ===
    resume_text = ""
    job_text = ""
    company_text = ""

    # ⚠️ 엔드포인트 주소는 실제 네 프로젝트 기준으로 수정 필요
    BASE = "http://localhost:8080/api"

    try:
        resume_res = requests.get(f"{BASE}/resume/{req.resumeId}")
        if resume_res.status_code == 200:
            resume_data = resume_res.json()
            resume_text = resume_data.get("content", "")
    except:
        pass

    if req.jobPostId:
        try:
            job_res = requests.get(f"{BASE}/jobposts/{req.jobPostId}")
            if job_res.status_code == 200:
                job_data = job_res.json()
                job_text = job_data.get("content", "")
        except:
            pass

    if req.companyId:
        try:
            company_res = requests.get(f"{BASE}/companies/{req.companyId}")
            if company_res.status_code == 200:
                company_data = company_res.json()
                company_text = company_data.get("content", "")
        except:
            pass

    # === 1.5) 링크에서 데이터 가져오기 (ID가 없거나 링크가 우선일 경우) ===
    if not job_text and req.jobPostLink:
        job_text = fetch_url_content(req.jobPostLink)

    if not company_text and req.companyLink:
        company_text = fetch_url_content(req.companyLink)

    # === 2) Gemini 프롬프트 구성 ===
    system_prompt = """
너는 한국 IT기업 전문 면접관이며, 사용자의 이력서·공고·기업 정보를 기반으로 
실제 면접에서 묻는 고급 질문을 생성하는 역할을 한다.

아래 규칙을 반드시 지켜라.

1) 이미 사용된 질문(previousQuestions)과 **의미적으로 유사한 질문도 절대 생성 금지**
   - 문장만 다르고 의미가 같으면 무조건 제외
   - 예: “기술적 문제를 해결한 경험은?” vs “기술적인 난관을 극복한 사례는?”
     → 서로 유사 질문으로 취급

2) 질문은 반드시 “내용적으로 서로 다른 주제”여야 한다.
   - 기술, 협업, 문제 해결, 프로젝트 리드, 성과 등 주제를 다양화할 것.

3) 공고나 기업 정보가 없으면 이력서를 중심으로 질문 생성
4) 공고/기업/이력서에서 유추 가능한 핵심 역량 기반으로 질문 생성
5) 너무 흔한 질문(예: 자기소개, 장단점)은 금지

출력 형식은 무조건 다음 JSON 배열이어야 한다:
[
  {"id": 1, "question": "...", "category": "..."},
  ...
]
    """

    user_prompt = f"""
    [이력서 내용]
    {resume_text}

    [공고 내용]
    {job_text or "없음"}

    [기업 소개]
    {company_text or "없음"}

    [제외할 질문들 (이미 질문함)]
    {json.dumps(req.previousQuestions, ensure_ascii=False) if req.previousQuestions else "없음"}

위 정보를 기반으로 주제가 서로 다르고,
이미 사용한(previousQuestions) 질문과 의미가 겹치지 않는
신규 면접 질문 5개를 생성하라.

유사 질문을 생성하면 안 된다.
JSON 배열만 출력하라.
    """

    raw = call_llm_with_json(
        model="gemini-2.0-flash",
        system=system_prompt,
        prompt=user_prompt,
        max_tokens=600,
        temperature=0.5
    )

    questions = safe_json(raw)
    if not isinstance(questions, list):
        questions = []

    return questions




# ------------------------------------------------------
# 인터뷰 답변 피드백 API
# ------------------------------------------------------

class FeedbackRequest(BaseModel):
    resumeId: Optional[int] = None
    jobPostLink: Optional[str] = None    # ✅ 추가
    companyLink: Optional[str] = None    # ✅ 추가
    question: str
    answer: str

class FeedbackResponse(BaseModel):
    feedback: str


@app.post("/interview/feedback", response_model=FeedbackResponse)
def interview_feedback(req: FeedbackRequest):
    """
    면접 답변 피드백 생성
    """
    # === 1) Spring에서 텍스트 가져오기 (선택사항) ===
    resume_text = ""
    job_text = ""
    company_text = ""

    BASE = "http://localhost:8080/api"

    # Resume 정보
    if req.resumeId:
        try:
            r = requests.get(f"{BASE}/resume/{req.resumeId}", timeout=5)
            if r.status_code == 200:
                resume_text = r.json().get("content", "")
        except:
            pass

    # 공고 링크는 직접 텍스트로 사용
    if req.jobPostLink:
        job_text = f"공고 링크: {req.jobPostLink}"

    # 기업 링크는 직접 텍스트로 사용
    if req.companyLink:
        company_text = f"기업 링크: {req.companyLink}"

    # === 2) Gemini 프롬프트 ===
    system_prompt = """너는 한국 IT기업의 실제 면접관이다.
사용자의 답변을 평가하고, 더 좋은 답변을 만들 수 있도록 첨삭해라.

반드시 완전한 문장으로 끝맺어라. 중간에 끊기지 않도록 주의해라.

출력 형식:
### 문제점 분석
- ...

### 개선 포인트
- ...

### 개선된 예시 답변
...
"""

    user_prompt = f"""
[질문]
{req.question}

[지원자 답변]
{req.answer}

[참고 - 이력서 요약]
{resume_text[:500] if resume_text else "정보 없음"}

[참고 - 공고 내용]
{job_text[:500] if job_text else "정보 없음"}

[참고 - 기업 내용]
{company_text[:500] if company_text else "정보 없음"}

위 정보를 기반으로 면접관 시각에서 첨삭해라.
반드시 완전한 문장으로 마무리해라.
"""

    try:
        feedback = generate_text(
            system=system_prompt,
            prompt=user_prompt,
            max_tokens=2048,  # ✅ 1000 → 2048로 증가
            temperature=0.3
        )

        # 응답이 너무 짧거나 없으면 기본 피드백
        if not feedback or len(feedback.strip()) < 50:
            feedback = """### 📊 답변 분석

**강점:**
- 경험을 바탕으로 답변하셨습니다.
- 본인의 생각을 명확히 전달하셨습니다.

**개선점:**
1. **STAR 기법 활용**: 상황(Situation) - 과제(Task) - 행동(Action) - 결과(Result) 구조로 답변하세요.
2. **구체적인 수치 추가**: "성능 개선" → "응답시간 30% 개선"처럼 정량적 지표를 포함하세요.
3. **기술 스택 명시**: 사용한 기술과 도구를 구체적으로 언급하세요.

**추천 답변 시간:** 2-3분

**핵심 키워드:**
- 문제 해결 능력
- 기술적 역량
- 협업 경험
- 성과 지표
"""

        return {"feedback": feedback}

    except Exception as e:
        print(f"❌ 피드백 생성 오류: {e}")
        return {
            "feedback": """### ⚠️ 피드백 생성 실패

AI 피드백 생성에 실패했습니다.

**기본 조언:**
1. STAR 기법으로 구조화하세요 (상황-과제-행동-결과)
2. 구체적인 수치를 포함하세요
3. 기술 스택을 명확히 언급하세요
4. 2-3분 분량으로 답변하세요
5. 핵심 성과를 강조하세요

잠시 후 다시 시도해주세요."""
        }

# ===========================
# AI 시스템 프롬프트 (고정)
# ===========================


SITE_DOCUMENT = """
📌 운영 목적
HireHub는 개발자·IT 직군 중심의 채용 플랫폼으로서, AI가 구직자 및 기업 이용자에게 정확하고 검증된 정보만 제공하도록 설계되어야 한다.
AI는 어디까지나 보조 수단이며, 법적·정책적 판단을 대신하지 않는다.

-------------------------------------
1. 서비스 소개
-------------------------------------

HireHub는 한국 개발자·IT 취업자를 위한 AI 기반 채용 플랫폼이다.
핵심 가치
구직자: AI 공고 추천 · 면접 코칭 · 이력서 분석
기업: 공고 관리 · 기업 페이지 제공
누구나 IT 취업 접근성을 높이는 플랫폼

-------------------------------------
2. 주요 기능
-------------------------------------
① 공고 추천
로그인 필요
사용자 기술스택, 경력, 이력서 기반 가중치 모델
점수 높은 순으로 랭킹
비로그인: 조회수 기반 “모두가 본 공고”

② 공고 조회
조회수순 / 최신순 / 회사별 / 카테고리별
상세 페이지에서 회사 소개/복지/기술스택 제공
스크랩 가능

③ 이력서 기능
여러 개 등록 가능
제출 시 선택
AI 기반 이력서 리뷰 가능

④ 지원 기능
공고 상세 → 이력서 선택 → 제출
마이페이지에서 지원 내역 확인
기업 정책 따라 취소 여부 달라짐

⑤ 기업 정보
회사 소개 / 복지 / 설립년도 / 주소 / 채용중인 공고
즐겨찾기 가능

⑥ AI 기능 (FastAPI 연동)
이력서 요약
공고 요약
이력서 첨삭
면접 질문 생성
면접 답변 피드백
키워드 기반 매칭 점수 계산
비속어 감지 / moderation

⑦ 고객센터 챗봇
기본 응답: AI 상담
WebSocket 기반 상담사 연결 가능
10분 비활성 시 자동 종료
대화 내용은 localStorage 저장
DB 저장은 선택 기능

-------------------------------------
3. 인증 / 회원 / 접근 제약
-------------------------------------
로그인 필요한 기능
공고 추천
지원하기
상담사 연결(핸드오프)
이력서 관리
AI 고도화 기능 대부분
비로그인 가능
공고 조회
기업 조회
게시판 열람
기본 챗봇
인증 정책
이메일 회원가입
JWT 기반 인증
개인정보는 상담사도 조회 불가

-------------------------------------
4. 게시판(커뮤니티) 규칙
-------------------------------------
글 작성/수정/삭제 가능
필터링 단어 포함 시 작성 차단
본인 글만 수정·삭제 가능
조회수 카운트
검색 기능 제공

-------------------------------------
5. 정책 및 금지사항
-------------------------------------
절대 제공 금지
내부 데이터, 지원자 수, 경쟁률 예측
실제 합격 가능성 예측
개인정보 노출
내부 서버 구조 / DB 스키마
회사 내부 기밀
“확정적 조언” (법률/의료 등)
HireHub 운영 정책 변경 가능하다고 언급 금지
항상 지켜야 할 원칙
사실 기반으로만 답변
사용자 불편 → 해결 경로 제공
기능 없음 → "현재 기능에서는 제공되지 않습니다"
민감 정보 요청 → “조회할 수 없습니다”
유저 감정 완화, 책임 회피 없는 정확한 안내

-------------------------------------
6. 토큰 정책 (매우 중요)
-------------------------------------
HireHub의 AI 기능은 토큰 기반 유료 기능이다.
🔹 토큰 구매
10 Tokens = 1,000원
30 Tokens = 2,900원
50 Tokens = 4,800원
결제 수단: 카드(이니시스), 카카오페이
🔹 기능별 토큰 차감량
기능명	차감 토큰
AI 면접 코칭	5 Tokens
AI 공고 매칭 점수 계산	3 Tokens
AI 자기소개서 매칭/분석	1 Token
기타 기능	정책에 따라 차감 가능
🔹 토큰 부족 시 챗봇 안내 메시지

토큰이 부족하면 반드시 아래 템플릿으로 응답해야 한다.

“해당 기능은 토큰이 필요합니다.
현재 보유 토큰이 부족해 실행할 수 없습니다.
마이페이지 → 토큰 결제에서 충전 후 다시 이용해주세요.”

🔹 금지
무료 이용 가능하다는 잘못된 안내
토큰 우회 방법 제공
내부 차감 로직 설명
"특별히 무료로 해드릴게요" 같은 표현

-------------------------------------
7. 자주 발생하는 질문 응답 규칙
-------------------------------------
① 추천 공고가 안 뜬다
"로그인이 필요하며, 사용자 정보 기반 추천입니다.
데이터 부족 시 조회수 순으로 보여드려요."

② 공고 노출 순서
비로그인: 조회수
로그인: AI 점수 기반

③ 지원 내역 확인
“마이페이지 → 지원 내역에서 확인할 수 있습니다.”

④ 복지 정보 위치
“기업 상세 페이지 하단에서 확인 가능합니다.”

⑤ 면접 질문 중복
“previousQuestions로 중복 제거하고 있습니다.”

-------------------------------------
8. 챗봇의 말투 / 스타일 가이드
-------------------------------------
공손하지만 프로페셔널한 운영진 느낌
최대한 정확한 정보 전달
헛된 희망·부정확한 예측 금지
모르면 모른다고 답변
책임 회피형 표현 금지
불편 → 해결책 제시
욕설·비속어에는 차분하게 경고

-------------------------------------
9. 챗봇의 AI 기능 실행 규칙
-------------------------------------
기능 실행 전 체크
로그인 필요 여부 확인
토큰 보유량 확인
부족하면 토큰 결제 안내
AI 기능 호출
데이터 접근 규칙
실제 DB 유저 정보 조회 불가
“확인이 불가능합니다”로 응답
게시물, 이력서 등은 사용자가 제공한 내용만 활용

-------------------------------------
10. 절대 하지 말아야 할 것
-------------------------------------
“지원률 높아요 / 합격 가능성 높아요”
“이 회사 경쟁률은 ~명입니다”
“서버 구조는 ~입니다”
“토큰 없이 사용 가능합니다”
“정책 변경 가능합니다”
특정 기업에 대한 루머 제공
정치적·법적·의료적 조언

-------------------------------------
11. 최종 응답 스타일 요약
-------------------------------------
정확·명확·과도한 친절 없음
운영 가이드 기반으로 답변
모르면 단정하지 않고 알려진 범위에서만 말하기
기능 안내는 단계적으로
판단 대신 선택지 제시

이 모든 정보를 기반으로 사용자 질의에 답변한다."라고 말한다.
"""

BASE_SYSTEM_PROMPT = f"""
너는 HireHub(noeyos.store)의 공식 AI 고객센터 챗봇이다.
아래 사이트 설명은 너의 “지식베이스”이며, 모든 답변은 이 내용을 기반으로만 해야 한다.
지식에 없는 정보는 절대 추측하거나 생성하지 말고 “현재 기능에서는 제공되지 않습니다.”라고 답변한다.

=== 사이트 설명 시작 ===
{SITE_DOCUMENT}
=== 사이트 설명 끝 ===

답변 규칙:
1. 사용자의 질문을 최대한 간단하고 정확하게 해결한다.
2. 실제 HireHub 서비스 흐름을 기준으로 설명한다.
3. 정책·기능이 없는 경우 없는 대로 정확하게 안내한다.
4. 유저가 어려워하면 단계별로 설명한다.
5. 고객센터 직원처럼 친절하고 전문적으로 답변한다.
6. 채용, 법률, 의학적 조언은 제공하지 않는다.
"""

# ------------------------------------------------------
# AI ChatBot (Gemini 기반)
# ------------------------------------------------------

class ChatRequest(BaseModel):
    userId: int
    sessionId: str
    message: str

@app.post("/ai/chat")
async def chat(req: ChatRequest):
    try:
        print(f"📨 받은 메시지: {req.message}")

        answer = generate_text(
            system=BASE_SYSTEM_PROMPT,    # <-- 사이트 설명 적용됨
            prompt=req.message,
            max_tokens=600,
            temperature=0.5
        )

        # ⭐ AI 기록 저장: Spring 로 전송
        save_chat_to_spring(
            user_id=req.userId,
            session_id=req.sessionId,
            user_message=req.message,
            bot_answer=answer
        )

        return {"answer": answer}

    except Exception as e:
        return {"answer": f"오류 발생: {str(e)}"}

# ------------------------------------------------------
# 상태 & 모델 리스트
# ------------------------------------------------------

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/ai/models")
def list_models():
    try:
        return [{"name": m.name} for m in genai.list_models()]
    except Exception as e:
        return {"error": str(e)}


# Rate limiter 데코레이터
def rate_limit(calls_per_minute=15):
    """
    Gemini API의 기본 rate limit은 분당 15회
    """
    min_interval = 60.0 / calls_per_minute
    last_called = [0.0]

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            elapsed = time.time() - last_called[0]
            left_to_wait = min_interval - elapsed

            if left_to_wait > 0:
                time.sleep(left_to_wait)

            ret = func(*args, **kwargs)
            last_called[0] = time.time()
            return ret

        return wrapper

    return decorator


# generate_text 함수에 적용
@rate_limit(calls_per_minute=15)  # 분당 15회로 제한
def generate_text_safe(system, prompt, max_tokens=512, temperature=0.3):
    """Rate limit이 적용된 안전한 버전"""
    return generate_text(system, prompt, max_tokens, temperature)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
