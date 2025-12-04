# ===== Build assets =====
FROM node:20-alpine AS build
WORKDIR /app

# Build arguments for Vite env vars
ARG VITE_KAKAO_MAP_JS_KEY

# Set as environment variables for build
ENV VITE_KAKAO_MAP_JS_KEY=$VITE_KAKAO_MAP_JS_KEY

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || yarn install
COPY . .
RUN npm run build || yarn build

# ===== Nginx serve =====
FROM nginx:1.27-alpine
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]