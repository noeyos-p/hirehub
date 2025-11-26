from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv  # ✅ 추가
from openai import OpenAI

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
                    "role": "user",
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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)