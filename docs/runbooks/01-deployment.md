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

## Web app – API proxy (cart, auth, etc.)

The web app proxies `/api/cart`, `/api/auth`, etc. to backend Cloud Run services. **Backend URLs are baked at build time** via Docker build-args in `infrastructure/gcp/cloudbuild-ci.yaml`. If you add new backend services or change Cloud Run URLs, update the web build step’s `--build-arg` entries and the project number (`484382472654`) if your project changes.

## Cloud Build failures – how to get logs

If deployments fail in Cloud Build:

1. **List recent builds**
   ```bash
   gcloud builds list --region=asia-south1 --project=grandmarketplace --limit=5
   ```

2. **Stream logs for a specific build**
   ```bash
   gcloud builds log <BUILD_ID> --region=asia-south1 --project=grandmarketplace
   ```

3. **Open in Console**
   - [Cloud Build history](https://console.cloud.google.com/cloud-build/builds?project=grandmarketplace) → select build → **Logs** tab.

4. **Common fixes**
   - **Lockfile / install:** Ensure `pnpm-lock.yaml` is committed and that Dockerfiles copy all workspace `package.json` files referenced by the lockfile (e.g. `packages/database` for web).
   - **Out of memory:** Web build sets `NODE_OPTIONS=--max-old-space-size=4096`; increase if needed.
   - **Context size:** `.dockerignore` excludes `node_modules`, `.pnpm-store`, `.git`, `docs`, etc., to keep build context small.
   - **pnpm version:** All service Dockerfiles pin `pnpm@9.15.0` for reproducible installs; lockfile is v9.
