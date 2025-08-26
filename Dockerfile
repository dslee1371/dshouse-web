# --- Stage 1: Build Astro ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && corepack prepare pnpm@9.7.1 --activate && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm i; fi
COPY . .
RUN npm run build

# --- Stage 2: NGINX ---
FROM nginx:1.27-alpine
# 템플릿 폴더에 conf 배치 → entrypoint가 envsubst 수행
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# 헬스체크 대비 curl
RUN apk add --no-cache curl
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT:-8080}/health || exit 1
# nginx 공식 entrypoint 그대로 사용(템플릿 자동 적용)
