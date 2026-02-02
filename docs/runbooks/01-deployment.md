# GrandGold Marketplace – Deployment Runbook

**Quick reference.** For full steps, prerequisites, and troubleshooting see **[Deployment Guide](../DEPLOYMENT_GUIDE.md)**.

## Prerequisites

- Node.js >= 20, pnpm >= 8
- Docker & Docker Compose (optional, for local stack)
- GCP account and `gcloud` CLI (for production)

## Local Development

```bash
pnpm install
cp env.example .env.local
pnpm docker:up   # or: pnpm dev
```

## Build

```bash
pnpm build
```

## GCP Deployment

```bash
export GCP_PROJECT_ID=your-project-id
pnpm gcp:deploy                          # all services
pnpm gcp:deploy:service <service-name>    # single service (default region: asia-south1)
```

## Required Environment Variables (Production)

- `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`
- `STRIPE_SECRET_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `GCP_PROJECT_ID`, `VERTEX_AI_LOCATION` (for AI)

See `env.example` and [Deployment Guide – Environment Configuration](../DEPLOYMENT_GUIDE.md#5-environment-configuration).

## Health Checks

- Auth: `GET /health` (4001)
- Order: `GET /health` (4004)
- Product: `GET /health` (4007)
- AI: `GET /health` (4009)
- All backend services expose `GET /health`
