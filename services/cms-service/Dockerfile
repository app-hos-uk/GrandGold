# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build Strapi admin
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy build artifacts
COPY --from=builder /app/build ./build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/favicon.ico ./favicon.ico

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

EXPOSE 1337

CMD ["npm", "start"]
