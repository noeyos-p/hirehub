from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import json              # 👈 여기 추가
from dotenv import load_dotenv  # ✅ 추가
from openai import OpenAI
from typing import Optional, List, Dict, Any

# ✅ .env 파일 로드 (main.py와 같은 폴더에 있어야 함)
load_dotenv()

# ✅ API 키 확인 및 출력 (디버깅용)
api_key = os.getenv("OPENAI_API_KEY", "")
print(f"🔑 API 키 로드 여부: {'있음' if api_key else '없음'}")
if api_key:
    print(f"🔑 API 키 앞 7자: {api_key[:7]}...")

# ✅ OpenAI 클라이언트 초기화
client = OpenAI(api_key=api_key)

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://noeyos.store"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


@app.get("/")
async def root():
    return {"status": "AI Server is running", "version": "1.0.0"}

#  ai 챗봇 상담기능
@app.post("/ai/chat")
async def chat(req: ChatRequest):
    try:
        print(f"📨 받은 메시지: {req.message}")

        # ✅ API 키 확인
        if not client.api_key:
            print("❌ OpenAI API 키가 설정되지 않았습니다!")
            return {"answer": "OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요."}

        # ✅ OpenAI API 호출
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "당신은 채용 플랫폼 HireHub의 친절한 고객 지원 AI 챗봇입니다. 사용자의 질문에 명확하고 친절하게 답변해주세요."
                },
                {
                    "role": "users",
                    "content": req.message
                }
            ],
            max_tokens=500,
            temperature=0.7
        )

        answer = completion.choices[0].message.content
        print(f"✅ AI 응답: {answer}")
        return {"answer": answer}

    except Exception as e:
        print(f"❌ Error: {type(e).__name__}")
        print(f"❌ Error 상세: {e}")
        return {
            "answer": f"AI 처리 중 오류가 발생했습니다: {str(e)}"
        }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# 자기소개서 ai 첨삭기능

class ResumeReviewRequest(BaseModel):
    title: Optional[str] = None
    essayTitle: Optional[str] = None
    essayContent: str

    profile: Optional[Dict[str, Any]] = None
    educations: Optional[List[Dict[str, Any]]] = None
    careers: Optional[List[Dict[str, Any]]] = None
    certs: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    langs: Optional[List[str]] = None

@app.post("/ai/review")
async def review_resume(req: ResumeReviewRequest):
    try:
        # JSON 데이터를 문자열로 정리
        profile_info = json.dumps(req.profile or {}, ensure_ascii=False, indent=2)
        educations = json.dumps(req.educations or [], ensure_ascii=False, indent=2)
        careers = json.dumps(req.careers or [], ensure_ascii=False, indent=2)
        certs = json.dumps(req.certs or [], ensure_ascii=False, indent=2)
        skills = json.dumps(req.skills or [], ensure_ascii=False, indent=2)
        langs = json.dumps(req.langs or [], ensure_ascii=False, indent=2)

        prompt = f"""
당신은 전문 채용담당자입니다.
아래 사용자가 입력한 이력서 정보를 참고하여,
자기소개서를 **상황에 맞게 정확하게 첨삭**해주세요.

### 1) 지원자의 기본 정보
{profile_info}

### 2) 학력
{educations}

### 3) 경력
{careers}

### 4) 자격증
{certs}

### 5) 스킬
{skills}

### 6) 사용 언어
{langs}

### 7) 자기소개서 제목
{req.essayTitle}

### 8) 자기소개서 본문
{req.essayContent}

---

### 🔍 첨삭 규칙
1) 지원자의 이력과 맞지 않는 내용이 있으면 정확히 지적  
2) 경력·스킬과 연결되는 표현 제안  
3) 지원 직무에 어울리지 않는 문장은 자연스럽게 개선  
4) 부족한 문맥·성과·강점 보완 추천  
5) 마지막에는 "개선된 자기소개서"를 완전한 문장으로 재작성

---

이제 첨삭을 시작해줘.
        """

        # 🔥 OpenAI 호출
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 전문 채용담당자입니다."},
                {"role": "users", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.3
        )

        feedback = completion.choices[0].message.content

        print("📤 AI 첨삭 결과 반환")
        return {"feedback": feedback}

    except Exception as e:
        print("❌ 첨삭 오류:", e)
        return {"feedback": f"AI 첨삭 중 오류 발생: {str(e)}"}

class MatchRequest(BaseModel):
    user: Dict[str, Any]
    resume: Dict[str, Any]
    company: Dict[str, Any]
    job: Dict[str, Any]


# ai 매칭 시스템
class MatchBatchRequest(BaseModel):
    user: Dict[str, Any]
    resume: Dict[str, Any]
    jobs: List[Dict[str, Any]]  # [{jobId, job, company}]


@app.post("/ai/match-batch")
async def match_batch(req: MatchBatchRequest):
    try:
        # ✅ 1) ID 1001~1021만 필터링
        filtered_jobs = [job for job in req.jobs if 1001 <= job.get("id", 0) <= 1021]

        if not filtered_jobs:
            print("⚠️ 조건에 맞는 JobPosts가 없습니다.")
            return {"results": []}

        # ✅ 2) 각 공고별로 간소화된 텍스트 생성 (토큰 절감용)
        def summarize_job(job):
            job_text = f"""
            📌 제목: {job.get('title')}
            📍 위치: {job.get('location')}
            💼 경력: {job.get('careerLevel')}
            🎓 학력: {job.get('education')}
            💰 급여: {job.get('salary')}
            📋 내용 요약: {(job.get('content') or '')[:800]}
            """
            return job_text.strip()

        summarized_jobs = [summarize_job(job) for job in filtered_jobs]

        # ✅ 3) GPT에 전달할 프롬프트 구성
        prompt = f"""
당신은 전문 채용담당자입니다.
사용자 정보와 이력서를 바탕으로, 아래 채용공고(ID 1001~1021 중 해당 공고들)에 대해
각각 **적합도 점수(0~100)** 와 **등급(A+~D)** 를 JSON 형식으로 계산하세요.

### 👤 사용자 정보
{json.dumps(req.user, ensure_ascii=False, indent=2)}

### 📄 이력서 정보
{json.dumps(req.resume, ensure_ascii=False, indent=2)}

### 📢 채용공고 리스트 (요약)
{json.dumps(summarized_jobs, ensure_ascii=False, indent=2)}

출력 형식(JSON ONLY):
{{
  "results": [
    {{
      "jobId": 1001,
      "score": 87,
      "grade": "A",
      "reasons": ["이유1", "이유2"]
    }}
  ]
}}
"""

        # ✅ 4) GPT 호출 (요약된 입력으로 토큰 초과 방지)
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.2
        )

        output = completion.choices[0].message.content
        result = json.loads(output)

        # ✅ 5) 결과 검증 및 후처리
        if "results" not in result:
            print("⚠️ GPT 응답 포맷 이상, 기본 점수 생성")
            result["results"] = []

        # GPT 응답에 grade가 없거나 점수가 이상한 경우 방어 로직
        final_results = []
        for job_result in result["results"]:
            score = int(job_result.get("score", 0))
            if score > 100:
                score = 100
            elif score < 0:
                score = 0

            # 등급 자동 계산 (A+~D)
            if score >= 95:
                grade = "A+"
            elif score >= 85:
                grade = "A"
            elif score >= 75:
                grade = "B"
            elif score >= 65:
                grade = "C"
            else:
                grade = "D"

            job_result["grade"] = job_result.get("grade", grade)
            final_results.append(job_result)

        # ✅ 6) 점수순 정렬 + 상위 10개만 반환
        final_results.sort(key=lambda x: x.get("score", 0), reverse=True)
        top10 = final_results[:10]

        print(f"✅ 매칭 완료 (필터링된 {len(filtered_jobs)}건 중 상위 10개 반환)")
        return {"results": top10}

    except Exception as e:
        print("❌ Batch Matching Error:", e)
        return {"results": []}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)