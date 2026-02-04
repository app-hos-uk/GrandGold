# Promotion Service Dockerfile
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/database/package.json ./packages/database/
COPY services/promotion-service/package.json ./services/promotion-service/

RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY packages ./packages
COPY services/promotion-service ./services/promotion-service
COPY tsconfig.base.json ./

RUN pnpm turbo run build --filter=@grandgold/types --filter=@grandgold/promotion-service

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 grandgold

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/packages/utils/package.json ./packages/utils/
COPY --from=builder /app/services/promotion-service/dist ./services/promotion-service/dist
COPY --from=builder /app/services/promotion-service/package.json ./services/promotion-service/

RUN pnpm install --prod --frozen-lockfile
RUN chown -R grandgold:nodejs /app

USER grandgold
EXPOSE 8080
CMD ["node", "services/promotion-service/dist/index.js"]
