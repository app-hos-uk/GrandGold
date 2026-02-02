FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY services/product-service/package.json ./services/product-service/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY services/product-service ./services/product-service
COPY packages ./packages
COPY tsconfig.base.json ./

# Build
WORKDIR /app/services/product-service
RUN pnpm build

# Production
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/services/product-service/dist ./dist
COPY --from=builder /app/services/product-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4005

CMD ["node", "dist/index.js"]
