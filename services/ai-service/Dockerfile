FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages
COPY services/ai-service/package.json ./services/ai-service/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec turbo run build --filter=@grandgold/ai-service

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/services/ai-service/dist ./dist
COPY --from=builder /app/services/ai-service/package.json ./
COPY --from=builder /app/package.json ./
RUN corepack enable && pnpm install --prod
EXPOSE 4009
CMD ["node", "dist/index.js"]
