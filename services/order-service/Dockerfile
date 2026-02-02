# Order Service Dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/database/package.json ./packages/database/
COPY services/order-service/package.json ./services/order-service/

RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build --workspace=@grandgold/types
RUN npm run build --workspace=@grandgold/utils
RUN npm run build --workspace=@grandgold/database
RUN npm run build --workspace=@grandgold/order-service

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 grandgold

COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/packages/utils/package.json ./packages/utils/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/services/order-service/dist ./services/order-service/dist
COPY --from=builder /app/services/order-service/package.json ./services/order-service/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER grandgold
EXPOSE 4003
ENV PORT=4003

CMD ["node", "services/order-service/dist/index.js"]
