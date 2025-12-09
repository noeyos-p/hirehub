# main.py — FULL Combined Version
# 뉴스 / moderation / review / match-one / embed / models / health 전부 포함
# + 임베딩 기반 Spring 매칭 지원
# + 10만 job_posts 확장을 위한 속도 최적화 (임베딩 캐시-friendly)

import os, sys, re, json
from datetime import datetime, timedelta
from typing import List, Optional

sys.stdout.reconfigure(encoding='utf-8')

# ===== ENV 적용 =====
from dotenv import dotenv_values, load_dotenv
env = dotenv_values(".env")
for k, v in env.items():
    if v:
        os.environ[k] = v
load_dotenv()

import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
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
    primary = "models/gemini-2.5-flash"
    fallback = "models/gemini-flash-latest"

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
        "너는 뉴스 전문 편집자다.",
        f"""다음 제목을 {req.style} 스타일로 요약하라:
{titles}
""",
        max_tokens=500,
        temperature=0.25
    )

    uid = datetime.now().strftime("%Y%m%d%H%M%S")
    return {
        "title": f"AI 뉴스 요약 ({uid})",
        "content": out.strip(),
        "tags": ["뉴스", "요약"],
        "sources": items,
    }


# ------------------------------------------------------
# Moderation
# ------------------------------------------------------

KOREAN_BAD_RE = re.compile(r"(씨발|시발|ㅅ\s*ㅂ|개\s*새끼|병신|좆|지랄|씹)", re.I)
SPAM_RE = [r"(http|https)://", r"오픈채팅", r"수익\s?보장", r"상담\s?문의"]

@app.post("/ai/moderate")
def moderate(req: dict):
    text = (req or {}).get("content", "") or ""

    if KOREAN_BAD_RE.search(text) or any(re.search(p, text, re.I) for p in SPAM_RE):
        return {"approve": False, "reason": "룰 기반 차단", "categories": {"rule": 1.0}}

    data = generate_json(
        "너는 콘텐츠 안전 심사관이다.",
        f"아래 글 위험도 분석:\n{text}",
        schema_hint='{"approve": bool, "categories": {}, "reason": ""}'
    )

    cats = data.get("categories", {})
    risk_values = [float(v) for v in cats.values()] if cats else []
    max_risk = max(risk_values) if risk_values else 0

    approve = data.get("approve", True)
    if max_risk >= 0.5:
        approve = False

    return {"approve": approve, "reason": data.get("reason", ""), "categories": cats}


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

        # Primary model: gemini-2.0-flash-exp (무료)
        try:
            model = genai.GenerativeModel(
                model_name="models/gemini-2.0-flash-exp",
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

        # Fallback model: gemini-1.5-flash
        print("🔄 Fallback model 시도 중...")

        model = genai.GenerativeModel(
            model_name="models/gemini-1.5-flash",
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
        model = genai.GenerativeModel("models/gemini-2.0-flash-exp")
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
                "model": "gemini-2.0-flash-exp"
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
        model = genai.GenerativeModel("models/gemini-2.0-flash-exp")
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
                "model": "gemini-2.0-flash-exp"
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
    - gemini-2.0-flash-exp 사용 (완전 무료)
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
        # ✅ 완전 무료 모델 사용
        model = genai.GenerativeModel(
            model_name="models/gemini-2.0-flash-exp",  # 무료!
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
