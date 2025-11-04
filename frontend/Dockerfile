# ===== Build assets =====
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || yarn install
COPY . .
RUN npm run build || yarn build

# ===== Nginx serve =====
FROM nginx:1.27-alpine

# ✅ 기존 nginx.conf 대신 HTTPS 및 proxy_pass 포함된 버전 사용
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# ✅ 빌드 결과물 복사
COPY --from=build /app/dist /usr/share/nginx/html

# ✅ SSL 인증서 마운트용 볼륨 및 포트 추가
EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
