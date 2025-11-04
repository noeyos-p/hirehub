# ===== Build assets =====
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || yarn install
COPY . .
RUN npm run build || yarn build

# ===== Nginx serve =====
FROM nginx:1.27-alpine

# ✅ 우리가 기존에 작업해둔 nginx.conf 파일 복사
COPY ./nginx.conf /etc/nginx/nginx.conf

# ✅ 빌드 결과물 복사
COPY --from=build /app/dist /usr/share/nginx/html

# ✅ SSL 포트 열기
EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
