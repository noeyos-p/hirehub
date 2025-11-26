# 1. Python 기반 이미지 사용
FROM python:3.10-slim

# 2. 컨테이너 내부 작업 디렉토리 설정
WORKDIR /app

# 3. 필요한 파일 복사
COPY requirements.txt .

# 4. 패키지 설치
RUN pip install --no-cache-dir -r requirements.txt

# 5. 전체 코드 복사
COPY . .

# 6. FastAPI는 보통 uvicorn으로 실행하므로 EXPOSE 선언
EXPOSE 8000

# 7. 서버 실행 명령어
CMD ["python", "main.py"]
