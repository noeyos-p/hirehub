# ===== Build assets =====
FROM node:20-alpine AS build
WORKDIR /app

# 🔹 패키지 복사 + 의존성 설치
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || yarn install 

# 🔹 소스 복사
COPY . .

# ✅ 환경변수 주입 (.env.prod는 같은 폴더)
COPY .env.prod .env.prod
RUN export $(cat .env.prod | xargs) && npm run build || yarn build

# ===== Nginx serve =====
FROM nginx:1.27-alpine

# 🔹 Nginx 설정 복사
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# 🔹 빌드 결과물 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
