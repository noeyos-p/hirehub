from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv
import openai # ✅ 구버전 라이브러리는 소문자 import
import time # ✅ 지수 백오프를 위한 time 모듈 추가

# ✅ .env 파일 로드 (main.py와 같은 폴더에 있어야 함)
load_dotenv()

# ✅ API 키 로드
api_key = os.getenv("OPENAI_API_KEY", "")

# ✅ OpenAI API 키 설정 (구버전 방식)
# 구버전은 모듈에 api_key를 직접 설정합니다.
openai.api_key = api_key

# ✅ API 키 확인 및 출력 (디버깅용)
print(f"🔑 API 키 로드 여부: {'있음' if openai.api_key else '없음'}")
if openai.api_key:
    print(f"🔑 API 키 앞 7자: {openai.api_key[:7]}...")


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
    return {"status": "AI Server is running (v0.28.1 Syntax)", "version": "1.0.0"}


def call_openai_with_retry(messages, model, max_tokens, temperature, max_retries=3):
    """지수 백오프를 사용하여 OpenAI API를 호출하는 함수 (v0.28.1 구문)"""
    base_delay = 1 # 초기 지연 시간 (초)

    for attempt in range(max_retries):
        try:
            # ✅ 구버전 OpenAI API 호출 구문
            completion = openai.ChatCompletion.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            return completion

        except openai.error.APIError as e:
            # API 관련 오류 처리 (4xx, 5xx)
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                print(f"⚠️ API 오류 발생 (시도 {attempt + 1}/{max_retries}): {e}. {delay:.1f}초 후 재시도합니다.")
                time.sleep(delay)
            else:
                raise e # 마지막 시도 실패 시 예외 발생
        
        except openai.error.RateLimitError as e:
            # 속도 제한 오류 처리
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                print(f"⚠️ 속도 제한 오류 발생 (시도 {attempt + 1}/{max_retries}): {e}. {delay:.1f}초 후 재시도합니다.")
                time.sleep(delay)
            else:
                raise e # 마지막 시도 실패 시 예외 발생
        
        except Exception as e:
            # 기타 예외 (ConnectionError 등)
            raise e


@app.post("/ai/chat")
async def chat(req: ChatRequest):
    try:
        print(f"📨 받은 메시지: {req.message}")

        # ✅ API 키 확인 (구버전 모듈 변수 사용)
        if not openai.api_key:
            print("❌ OpenAI API 키가 설정되지 않았습니다!")
            return {"answer": "OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요."}

        # API 호출에 사용할 메시지 구성
        messages = [
            {
                "role": "system",
                "content": "당신은 채용 플랫폼 HireHub의 친절한 고객 지원 AI 챗봇입니다. 사용자의 질문에 명확하고 친절하게 답변해주세요."
            },
            {
                "role": "user",
                "content": req.message
            }
        ]

        # ✅ 지수 백오프를 사용하는 API 호출 함수 사용
        completion = call_openai_with_retry(
            messages=messages,
            model="gpt-4o-mini", # 이 모델은 v0.28.1 시점에는 존재하지 않았으므로, 실제 구동 시 오류가 발생할 수 있습니다. (gpt-3.5-turbo 권장)
            max_tokens=500,
            temperature=0.7
        )

        # 응답 추출 (구버전과 최신 버전 모두 유사한 구조를 가짐)
        answer = completion.choices[0].message.content
        print(f"✅ AI 응답: {answer}")
        return {"answer": answer}

    except openai.error.AuthenticationError as e:
        print(f"❌ 인증 오류: {e}")
        return {
            "answer": "OpenAI 인증 오류가 발생했습니다. API 키를 확인해주세요."
        }
    except Exception as e:
        error_type = type(e).__name__
        print(f"❌ Error: {error_type}")
        print(f"❌ Error 상세: {e}")
        return {
            "answer": f"AI 처리 중 오류가 발생했습니다 ({error_type}): {str(e)}"
        }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    # FastAPI는 "main" 모듈에서 "app" 객체를 찾아 실행합니다.
    # --reload 옵션은 개발 환경에서 코드 변경 시 자동 재시작을 지원합니다.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)