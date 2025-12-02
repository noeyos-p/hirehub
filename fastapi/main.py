# main.py

import os
from dotenv import dotenv_values

# ⚡ .env 값 강제 overwrite
env = dotenv_values(".env")
for key, value in env.items():
    if value is not None:
        os.environ[key] = value

import time
import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from openai import OpenAI

# ===== ENV 로드 =====
load_dotenv()

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

print("NAVER_CLIENT_ID:", repr(NAVER_CLIENT_ID))
print("NAVER_CLIENT_SECRET:", repr(NAVER_CLIENT_SECRET))
print("OPENAI_API_KEY:", repr(OPENAI_API_KEY))
print(f"🔑 OPENAI 키: {'있음' if OPENAI_API_KEY else '없음'}")

client = OpenAI(api_key=OPENAI_API_KEY)

# ===== FastAPI =====
app = FastAPI()
default_origins = ["http://localhost:3000", "http://localhost:5173", "https://noeyos.store"]
env_origins = [o for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
allow_origins = env_origins if env_origins else default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== Schemas ======
class NewsItem(BaseModel):
    title: str
    link: str
    description: Optional[str] = None
    pubDate: Optional[str] = None
    press: Optional[str] = None

class DigestRequest(BaseModel):
    query: str = "채용 OR 공채 OR 채용공고"
    days: int = 3
    limit: int = 20
    style: str = "bullet"

# ===== Helper =====
def naver_news_search(query: str, start: int = 1, display: int = 20, sort: str = "date"):
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        raise RuntimeError("NAVER API 키 누락")

    url = "https://openapi.naver.com/v1/search/news.json"
    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }
    params = {"query": query, "display": display, "start": start, "sort": sort}
    r = requests.get(url, headers=headers, params=params, timeout=10)
    r.raise_for_status()
    return r.json()

# ===== Fetch News =====
@app.post("/news/fetch", response_model=List[NewsItem])
def fetch_news(req: DigestRequest):
    items = []
    remaining = max(1, req.limit)
    start = 1

    while remaining > 0 and start <= 1000:
        page_size = min(20, remaining)
        data = naver_news_search(req.query, start=start, display=page_size)
        raw = data.get("items", [])
        if not raw:
            break

        for it in raw:
            items.append(
                NewsItem(
                    title=(it.get("title") or "").replace("<b>", "").replace("</b>", ""),
                    link=it.get("link", ""),
                    description=(it.get("description") or "").replace("<b>", "").replace("</b>", ""),
                    pubDate=it.get("pubDate"),
                    press=it.get("originallink") or None,
                )
            )
        remaining -= len(raw)
        start += page_size

    # 날짜 필터
    if req.days and req.days > 0:
        cutoff = datetime.utcnow() - timedelta(days=req.days + 0.5)
        def in_range(n: NewsItem):
            try:
                dt = datetime.strptime(n.pubDate, "%a, %d %b %Y %H:%M:%S %z")
                return dt.timestamp() >= cutoff.timestamp()
            except:
                return False

        items = [n for n in items if in_range(n)]

    return items[:req.limit]

# ===== Digest =====
@app.post("/news/digest")
def news_digest(req: DigestRequest):
    """
    뉴스 요약/가공 (Spring에서 호출)
    """

    # 🔥 1차: 채용 뉴스 검색
    primary_req = DigestRequest(
        query="채용 OR 공채 OR 노동시장 OR 인사",
        days=req.days,
        limit=req.limit,
        style=req.style
    )
    items = fetch_news(primary_req)

    # 🔥 2차: IT 뉴스 fallback
    if not items:
        print("⚠️ 채용 뉴스 없음 → IT 뉴스로 재검색")
        it_req = DigestRequest(
            query="IT OR 기술 OR AI OR 개발자 OR 스타트업",
            days=req.days,
            limit=req.limit,
            style=req.style
        )
        items = fetch_news(it_req)

    # 🔥 3차: 산업 뉴스 fallback
    if not items:
        print("⚠️ IT 뉴스 없음 → 전체 산업 뉴스로 재검색")
        broad_req = DigestRequest(
            query="산업 OR 기업 OR 경제 OR 시장",
            days=req.days,
            limit=req.limit,
            style=req.style
        )
        items = fetch_news(broad_req)

    if not items:
        return {
            "title": f"뉴스 없음 ({datetime.now().strftime('%Y-%m-%d %H:%M')})",
            "content": "",
            "tags": [],
            "sources": []
        }

    # 뉴스 제목 목록
    titles = "\n".join([f"- {n.title}" for n in items[:req.limit]])

    prompt = f"""
당신은 뉴스 에디터입니다.
아래 뉴스들을 {req.style} 스타일로 요약하세요.

### 뉴스 목록
{titles}

불필요한 광고성 문장은 제외하고 산업 동향 중심으로 정리하세요.
"""

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        temperature=0.5
    )

    summary = completion.choices[0].message.content

    # 🔥 UID 붙여서 게시글 중복 방지
    uid = datetime.now().strftime('%Y%m%d%H%M%S')
    unique_prefix = f"[UID:{uid}] "
    unique_title = f"AI 뉴스 요약 ({uid})"

    return {
        "title": unique_title,
        "content": unique_prefix + summary,
        "tags": ["뉴스", "요약", "채용", "IT"],
        "sources": items[:req.limit]
    }


# ===== Scheduler =====
from apscheduler.schedulers.background import BackgroundScheduler

SPRING_BOARD_API = "http://backend:8080/api/board/ai/news/publish"

def generate_auto_board_post():
    print("⏳ [자동 뉴스 요약 + 게시글 발행 시작]")

    payload = {
        "query": "채용 OR 공채 OR 노동시장 OR IT OR 기술 OR AI OR 개발자",
        "days": 30,
        "limit": 15,
        "style": "bullet",
        "botUserId": 2
    }

    try:
        res = requests.post(SPRING_BOARD_API, json=payload, timeout=10)
        print("📨 Spring 응답:", res.status_code, res.text)
    except Exception as e:
        print("🔥 자동 처리 중 오류:", e)

scheduler = BackgroundScheduler()
scheduler.add_job(generate_auto_board_post, "interval", hours=1)
scheduler.start()
print("⏰ 스케줄러 시작됨: 1시간마다 뉴스 자동 생성")

# AI 게시판 검열
@app.post("/ai/moderate")
def moderate(req: dict):
    text = req.get("content", "")

    prompt = f"""
너는 커뮤니티 글을 검열하는 AI야.

이 글이 아래 문제를 포함하는지 판단해줘:
- 욕설/비방
- 성적/음란성
- 혐오/차별
- 범죄 조장
- 개인정보 노출
- 스팸/도배
- 기타 부적절한 행동

결과는 반드시 아래 JSON 형식으로 답해.
{{
  "approve": true or false,
  "reason": "왜 그런 판단을 했는지 한 줄 설명"
}}
글 내용:
{text}
"""

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type":"json_object"},
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
        temperature=0.1
    )

    return json.loads(completion.choices[0].message.content)
# ===== uvicorn =====
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
