FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
COPY services/inventory-service/package.json ./services/inventory-service/
COPY packages/*/package.json ./packages/*/

RUN npm install -g pnpm && pnpm install --frozen-lockfile || true

COPY services/inventory-service ./services/inventory-service
COPY packages ./packages
COPY tsconfig.base.json ./

WORKDIR /app/services/inventory-service
RUN pnpm build || npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/services/inventory-service/dist ./dist
COPY --from=builder /app/services/inventory-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4008

CMD ["node", "dist/index.js"]
