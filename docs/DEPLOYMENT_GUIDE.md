# GrandGold Marketplace – Deployment Guide

This guide covers how to deploy the GrandGold Enterprise Marketplace in local, staging, and production environments.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [First-time setup: Git and GCP](#2-first-time-setup-git-and-gcp)
3. [Local Development](#3-local-development)
4. [Docker Deployment](#4-docker-deployment)
5. [Production (GCP) Deployment](#5-production-gcp-deployment)
6. [Environment Configuration](#6-environment-configuration)
7. [Health Checks & Verification](#7-health-checks--verification)
8. [Rollback & Troubleshooting](#8-rollback--troubleshooting)

---

## 1. Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20 | Runtime for all services |
| pnpm | ≥ 8 | Package manager (monorepo) |
| Docker | Latest | Container builds and local stack |
| Docker Compose | v2+ | Multi-container local environment |
| Google Cloud SDK (`gcloud`) | Latest | GCP deployment (production only) |

### Install pnpm

```bash
npm install -g pnpm
```

### Install Google Cloud SDK (for production)

- **macOS:** `brew install google-cloud-sdk`
- **Linux:** See [Google Cloud SDK install](https://cloud.google.com/sdk/docs/install)
- **Windows:** Use the installer from the same link.

After install:

1. **Add `gcloud` to your PATH** (if not already). Add to `~/.zshrc`:
   ```bash
   source "/opt/homebrew/share/google-cloud-sdk/path.zsh.inc"
   source "/opt/homebrew/share/google-cloud-sdk/completion.zsh.inc"
   ```
   Then run `source ~/.zshrc` or open a new terminal.

2. **Fix Python warning (macOS Homebrew):** If you see "Python 3.9.x is no longer supported", point gcloud to Python 3.10+:
   ```bash
   export CLOUDSDK_PYTHON=$(which python3)   # or: /opt/homebrew/bin/python3.13
   ```
   Add this line to `~/.zshrc` so it persists.

3. **Authenticate** (after you have a GCP project):
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

---

## 2. First-time setup: Git and GCP

Do this once before deploying to GCP.

### Step 1: Create a Git repository

If the project is not yet in Git:

```bash
cd /path/to/GG   # your project root
git init
git add .
git commit -m "Initial commit: GrandGold Marketplace"
```

Create a remote (GitHub, GitLab, or Bitbucket), then:

```bash
git remote add origin https://github.com/YOUR_ORG/grandgold.git
git branch -M main
git push -u origin main
```

### Step 2: Create a GCP project

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown (top left) → **New Project**.
3. Enter a name (e.g. `grandgold-prod` or `grandgold-dev`).
4. Note the **Project ID** (e.g. `grandgold-prod-12345`). You will use this as `GCP_PROJECT_ID`.

### Step 3: Enable billing

- In the console: **Billing** → link a billing account to the new project.
- Cloud Run and Cloud SQL require a billing account (free tier still applies).

### Step 4: Install and configure gcloud (you have this)

```bash
# Login (opens browser)
gcloud auth login

# Set default project
gcloud config set project YOUR_PROJECT_ID

# Optional: set default region
gcloud config set run/region asia-south1
```

### Step 5: Enable required APIs

From your project root (or any directory):

```bash
export GCP_PROJECT_ID=your-project-id   # use your actual Project ID

gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable redis.googleapis.com
```

### Step 6: Connect Git to Cloud Build (optional, for CI/CD)

1. In the console: **Cloud Build** → **Triggers** → **Connect repository**.
2. Choose your Git provider (GitHub, etc.) and authorize.
3. Select the repo and branch (e.g. `main`).
4. Create a trigger that uses `infrastructure/gcp/cloudbuild.yaml` on push.

After this, you can deploy manually with `pnpm gcp:deploy` or use the trigger for automatic deploys.

---

## 3. Local Development

### Clone and Install

```bash
git clone <repository-url>
cd GG  # or your project directory
pnpm install
```

### Environment Setup

1. Copy the example environment file:

   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and set at least:
   - `DATABASE_URL` (if using local Postgres)
   - `REDIS_URL` (if using local Redis)
   - `JWT_SECRET` (any strong secret for local use)

### Option A: Run with Docker (recommended for full stack)

Start infrastructure and all services:

```bash
pnpm docker:up
```

This starts:

- **PostgreSQL** (port 5432)
- **Redis** (port 6379)
- **Meilisearch** (port 7700)
- **Auth Service** (4001)
- **Seller Service** (4002)
- **Fintech Service** (4003)
- **Order Service** (4004)
- **Payment Service** (4005)
- **KYC Service** (4006)
- **Product Service** (4007)
- **Inventory Service** (4008)
- **AI Service** (4009)
- **CMS (Strapi)** (1337)
- **Web (Next.js)** (3000)

Stop everything:

```bash
pnpm docker:down
```

### Option B: Run services individually

1. Start infrastructure only (Postgres, Redis, Meilisearch):

   ```bash
   docker-compose up -d postgres redis meilisearch
   ```

2. From the repo root, run all apps and services:

   ```bash
   pnpm dev
   ```

3. Or run a single app/service:

   ```bash
   pnpm dev --filter=@grandgold/web
   pnpm dev --filter=@grandgold/auth-service
   ```

### Build (local)

```bash
pnpm build
```

### Run tests

```bash
pnpm test
```

---

## 3. Docker Deployment

### Build All Images

From the repository root:

```bash
pnpm docker:build
# or
docker-compose build
```

### Run Full Stack

```bash
pnpm docker:up
# or
docker-compose up -d
```

### Service Ports (Docker)

| Service | Port | Health |
|---------|------|--------|
| Web (Next.js) | 3000 | http://localhost:3000 |
| Auth | 4001 | GET /health |
| Seller | 4002 | GET /health |
| Fintech | 4003 | GET /health |
| Order | 4004 | GET /health |
| Payment | 4005 | GET /health |
| KYC | 4006 | GET /health |
| Product | 4007 | GET /health |
| Inventory | 4008 | GET /health |
| AI | 4009 | GET /health |
| CMS (Strapi) | 1337 | http://localhost:1337/admin |
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |
| Meilisearch | 7700 | http://localhost:7700/health |

### Production-like Docker (env file)

For staging or production-like runs with Docker:

1. Create `.env.production` from `env.example` and set production values.
2. Run:

   ```bash
   docker-compose --env-file .env.production up -d
   ```

Ensure secrets (e.g. `JWT_SECRET`, `STRIPE_SECRET_KEY`, `DATABASE_URL`) are not committed.

---

## 5. Production (GCP) Deployment

GrandGold is set up to run on **Google Cloud Platform** using **Cloud Run** for services and the web app, with **Cloud SQL** (PostgreSQL) and **Memorystore** (Redis) as needed.

### 5.1 One-time GCP setup

#### Enable APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable redis.googleapis.com
```

#### Database (Cloud SQL PostgreSQL)

From the repo:

```bash
./infrastructure/gcp/setup-database.sh
```

This creates a Cloud SQL instance, database, and user. Note the connection name and set `DATABASE_URL` in Secret Manager or Cloud Run env.

#### Redis (Memorystore)

```bash
./infrastructure/gcp/setup-redis.sh
```

Use the Redis host in `REDIS_URL` for your services.

### 5.2 Deploy all backend services

From the repository root:

```bash
export GCP_PROJECT_ID=your-gcp-project-id
pnpm gcp:deploy
```

This script:

1. Builds Docker images for: `auth-service`, `seller-service`, `fintech-service`, `order-service`, `payment-service`
2. Pushes them to `gcr.io/<GCP_PROJECT_ID>/<service-name>`
3. Deploys each service to **Cloud Run** in:
   - `asia-south1` (India)
   - `europe-west2` (UK)
   - `me-central1` (UAE)

### 5.3 Deploy a single service

```bash
./infrastructure/gcp/deploy-service.sh <service-name> [region]
```

Examples:

```bash
./infrastructure/gcp/deploy-service.sh auth-service asia-south1
./infrastructure/gcp/deploy-service.sh payment-service europe-west2
```

Default region is `asia-south1` if omitted.

### 5.4 CI/CD with Cloud Build

The repo includes `infrastructure/gcp/cloudbuild.yaml` for automated builds and deploys (e.g. on push to `main`).

1. Connect your repository in **Cloud Build** (Triggers).
2. Create a trigger that runs on push to `main` (or your release branch).
3. Use the provided `cloudbuild.yaml` as the build configuration.

The pipeline:

- Builds shared packages (`@grandgold/types`, `utils`, `database`)
- Builds and pushes: `auth-service`, `seller-service`, `fintech-service`, `web`
- Deploys `auth-service` and `web` to Cloud Run in `asia-south1`

Extend `cloudbuild.yaml` to deploy more services or regions as needed.

### 5.5 Web app (Next.js) on Cloud Run

The Next.js app uses a standalone output and runs on Cloud Run.

1. Build and push the image (e.g. via Cloud Build or manually):

   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/web .
   ```

   Use the context and Dockerfile that build the web app (e.g. `apps/web/Dockerfile` from repo root).

2. Deploy to Cloud Run:

   ```bash
   gcloud run deploy web \
     --image gcr.io/YOUR_PROJECT_ID/web \
     --region asia-south1 \
     --platform managed \
     --allow-unauthenticated \
     --memory 1Gi \
     --set-env-vars "NODE_ENV=production"
   ```

Set `NEXT_PUBLIC_*` and other env vars via `--set-env-vars` or Secret Manager.

### 5.6 Passing secrets and config to Cloud Run

Use **Secret Manager** for sensitive values:

```bash
# Create secret
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-

# Grant Cloud Run access and reference in deploy
gcloud run deploy auth-service \
  --image gcr.io/PROJECT_ID/auth-service \
  --region asia-south1 \
  --set-secrets="JWT_SECRET=JWT_SECRET:latest"
```

Repeat for `DATABASE_URL`, `REDIS_URL`, `STRIPE_SECRET_KEY`, etc.

---

## 6. Environment Configuration

### Required variables (production)

| Variable | Used by | Description |
|----------|---------|-------------|
| `NODE_ENV` | All | `production` |
| `DATABASE_URL` | Auth, Seller, Fintech, Order, Payment, KYC | PostgreSQL connection string |
| `REDIS_URL` | All backend services | Redis connection string |
| `JWT_SECRET` | Auth service | Strong random secret for JWT signing |
| `STRIPE_SECRET_KEY` | Payment service | Stripe API secret (UK/international) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Payment service | Razorpay (India) |
| `GCP_PROJECT_ID` | AI service, KYC | GCP project ID |
| `VERTEX_AI_LOCATION` | AI service | e.g. `us-central1` |

### Optional but recommended

| Variable | Purpose |
|----------|---------|
| `STRIPE_WEBHOOK_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Payment webhook verification |
| `RESEND_API_KEY` | Transactional email |
| `TWILIO_*` | SMS/OTP |
| `SENTRY_DSN` | Error monitoring |
| `MEILISEARCH_URL`, `MEILISEARCH_MASTER_KEY` | Product search (if not default) |

Full reference: see `env.example` in the repository root.

### Multi-country

- `DEFAULT_COUNTRY`, `SUPPORTED_COUNTRIES` (e.g. `IN,AE,UK`)
- Country-specific currency and tax: `INDIA_*`, `UAE_*`, `UK_*` in `env.example`

---

## 7. Health Checks & Verification

### Service health endpoints

Each backend service exposes:

```http
GET /health
```

Expected: `200 OK` (and optionally a JSON body with status).

### Quick checks after deploy

```bash
# Auth (replace URL with your Cloud Run or local URL)
curl -s https://auth-service-xxx.run.app/health

# Web
curl -s -o /dev/null -w "%{http_code}" https://your-web-url.run.app
```

### Post-deploy checklist

- [ ] All Cloud Run services show “Serving” in the console.
- [ ] Web app loads and redirects by country if applicable.
- [ ] Login/register works (Auth + DB).
- [ ] Product listing/search works (Product + Meilisearch if used).
- [ ] Checkout or payment test (Payment + Stripe/Razorpay config).
- [ ] No critical errors in Cloud Run or application logs.

---

## 8. Rollback & Troubleshooting

### Rollback on Cloud Run

1. **Console:** Cloud Run → your service → “Revisions” → select previous revision → “Manage traffic” → send 100% to that revision.
2. **CLI:**

   ```bash
   gcloud run services update-traffic auth-service \
     --region asia-south1 \
     --to-revisions=REVISION_NAME=100
   ```

### Common issues

| Issue | What to check |
|-------|----------------|
| 502/503 on Cloud Run | Logs for crashes, timeout, or OOM; increase memory/cpu or fix startup code. |
| DB connection errors | `DATABASE_URL`, Cloud SQL auth (e.g. IAM or private IP), VPC connector if needed. |
| Redis connection errors | `REDIS_URL`, VPC/Redis instance reachable from Cloud Run. |
| Payment failures | Stripe/Razorpay keys and webhook URLs; logs in payment service. |
| Build fails in Docker | Node version in Dockerfile (e.g. 20); `pnpm install` and workspace build order. |

### Logs

- **Cloud Run:** Logging → Logs Explorer, filter by resource type “Cloud Run”.
- **Local:** Logs go to stdout; with Docker use `docker-compose logs -f auth-service` (or the relevant service).

### Getting help

- Runbooks: `docs/runbooks/01-deployment.md`, `02-incident-response.md`, `03-launch-checklist.md`, `04-monitoring.md`
- API docs: `docs/api/openapi.yaml` (and Swagger UI if configured)

---

**Document version:** 1.0  
**Last updated:** 2025  
**Maintained by:** GrandGold Engineering
