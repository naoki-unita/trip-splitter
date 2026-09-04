# --- 依存関係インストール専用ステージ ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- ビルドステージ ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 為替APIキーをビルド時に注入したい場合はここで受け取る(任意)
ARG NEXT_PUBLIC_EXCHANGE_API_KEY
ENV NEXT_PUBLIC_EXCHANGE_API_KEY=$NEXT_PUBLIC_EXCHANGE_API_KEY
RUN npm run build

# --- 実行ステージ (standalone出力で最小イメージに) ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
