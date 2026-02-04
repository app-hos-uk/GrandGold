# Next.js Frontend Dockerfile (Cloud Run)
FROM node:20-alpine AS base

# Install pnpm (pin for reproducible installs)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace config (include all packages referenced in lockfile)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/database/package.json ./packages/database/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Backend URLs for API rewrites (baked at build time; pass in Cloud Build for production)
ARG NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:4001
ARG NEXT_PUBLIC_ORDER_SERVICE_URL=http://localhost:4004
ARG NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://localhost:4007
ARG NEXT_PUBLIC_KYC_SERVICE_URL=http://localhost:4006
ARG NEXT_PUBLIC_SELLER_SERVICE_URL=http://localhost:4002
ARG NEXT_PUBLIC_FINTECH_SERVICE_URL=http://localhost:4003
ARG NEXT_PUBLIC_PAYMENT_SERVICE_URL=http://localhost:4005
ARG NEXT_PUBLIC_INVENTORY_SERVICE_URL=http://localhost:4008
ARG NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:4009
ARG NEXT_PUBLIC_PROMOTION_SERVICE_URL=http://localhost:4010
ARG NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:4011

ENV NEXT_PUBLIC_AUTH_SERVICE_URL=$NEXT_PUBLIC_AUTH_SERVICE_URL
ENV NEXT_PUBLIC_ORDER_SERVICE_URL=$NEXT_PUBLIC_ORDER_SERVICE_URL
ENV NEXT_PUBLIC_PRODUCT_SERVICE_URL=$NEXT_PUBLIC_PRODUCT_SERVICE_URL
ENV NEXT_PUBLIC_KYC_SERVICE_URL=$NEXT_PUBLIC_KYC_SERVICE_URL
ENV NEXT_PUBLIC_SELLER_SERVICE_URL=$NEXT_PUBLIC_SELLER_SERVICE_URL
ENV NEXT_PUBLIC_FINTECH_SERVICE_URL=$NEXT_PUBLIC_FINTECH_SERVICE_URL
ENV NEXT_PUBLIC_PAYMENT_SERVICE_URL=$NEXT_PUBLIC_PAYMENT_SERVICE_URL
ENV NEXT_PUBLIC_INVENTORY_SERVICE_URL=$NEXT_PUBLIC_INVENTORY_SERVICE_URL
ENV NEXT_PUBLIC_AI_SERVICE_URL=$NEXT_PUBLIC_AI_SERVICE_URL
ENV NEXT_PUBLIC_PROMOTION_SERVICE_URL=$NEXT_PUBLIC_PROMOTION_SERVICE_URL
ENV NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=$NEXT_PUBLIC_NOTIFICATION_SERVICE_URL

COPY --from=deps /app ./
COPY packages ./packages
COPY apps/web ./apps/web
COPY tsconfig.base.json ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build packages and web app (types, utils only; web does not depend on database)
RUN pnpm turbo run build --filter=@grandgold/web

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

# Cloud Run injects PORT (default 8080)
EXPOSE 8080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
