# Inventory Service Dockerfile
FROM node:20-alpine AS base

# Install pnpm (pin for reproducible installs)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy all package.json files (include database so lockfile resolves; we do not build or copy database dist)
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/database/package.json ./packages/database/
COPY services/inventory-service/package.json ./services/inventory-service/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app ./

# Copy source code
COPY packages ./packages
COPY services/inventory-service ./services/inventory-service
COPY tsconfig.base.json ./

# Build packages and service
RUN pnpm turbo run build --filter=@grandgold/inventory-service

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 grandgold

# Copy workspace config for pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy built packages (inventory-service only needs types + utils)
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/packages/utils/package.json ./packages/utils/

# Copy built service
COPY --from=builder /app/services/inventory-service/dist ./services/inventory-service/dist
COPY --from=builder /app/services/inventory-service/package.json ./services/inventory-service/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Ensure runtime user can read app files (Cloud Run runs as non-root)
RUN chown -R grandgold:nodejs /app

USER grandgold

# Cloud Run injects PORT env var (default 8080)
EXPOSE 8080

CMD ["node", "services/inventory-service/dist/index.js"]
