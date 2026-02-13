# CMS Service (Strapi) Dockerfile
FROM node:20-alpine AS base

# Install pnpm (pin for reproducible installs)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy package.json files for workspace deps
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/database/package.json ./packages/database/
COPY services/cms-service/package.json ./services/cms-service/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy dependencies
COPY --from=deps /app ./

# Copy source code
COPY packages ./packages
COPY services/cms-service ./services/cms-service
COPY tsconfig.base.json ./

# Build Strapi admin panel
RUN pnpm --filter @grandgold/cms-service run build

# Production stage
FROM base AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 grandgold

# Copy workspace config for pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy package.jsons for workspace resolution
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/database/package.json ./packages/database/

# Copy built cms-service (includes build/, dist/, config/, src/, public/)
COPY --from=builder /app/services/cms-service ./services/cms-service

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

USER grandgold

ENV HOST=0.0.0.0
# Cloud Run injects PORT=8080; Strapi respects the PORT env var
ENV PORT=8080

EXPOSE 8080

WORKDIR /app/services/cms-service
CMD ["pnpm", "start"]
