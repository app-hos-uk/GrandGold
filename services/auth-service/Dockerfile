# Auth Service Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/database/package.json ./packages/database/

# Copy service package
COPY services/auth-service/package.json ./services/auth-service/

# Install dependencies
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build packages first
RUN npm run build --workspace=@grandgold/types
RUN npm run build --workspace=@grandgold/utils
RUN npm run build --workspace=@grandgold/database

# Build service
RUN npm run build --workspace=@grandgold/auth-service

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 grandgold

# Copy built files
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/packages/utils/package.json ./packages/utils/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /app/services/auth-service/package.json ./services/auth-service/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER grandgold

EXPOSE 4001

ENV PORT=4001

CMD ["node", "services/auth-service/dist/index.js"]
