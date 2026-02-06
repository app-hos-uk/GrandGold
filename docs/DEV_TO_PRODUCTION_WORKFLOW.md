# GrandGold: Dev (Sabuanchuparayil) → Live Testing (Same GCP) → Production (HOS)

This guide walks you through: developing on **Sabuanchuparayil** GitHub, doing **live testing** on the **same GCP** you created for HOS, then **deploying to HOS** for production.

---

## Your current setup

| Item | Value |
|------|--------|
| **Dev GitHub repo** | https://github.com/Sabuanchuparayil/GrandMarketPlace |
| **GCP Project ID** | `grandmarketplace` |
| **GCP Project number** | 484382472654 |
| **Production repo (HOS)** | https://github.com/app-hos-uk/GrandGold |

---

## Overview

| Phase | GitHub | GCP | Purpose |
|-------|--------|-----|---------|
| **Development** | Sabuanchuparayil/GrandMarketPlace | — | Code, commits, branches |
| **Live testing** | Same repo | `grandmarketplace` | Deploy & test on Cloud Run |
| **Production** | app-hos-uk/GrandGold | HOS GCP account | Final production deploy |

---

## Install and run new services (CLI)

From the repo root (`~/Desktop/GG` or your project path):

### 1. Install dependencies (including promotion & notification services)

```bash
pnpm install --no-frozen-lockfile
```

Use `--no-frozen-lockfile` when the lockfile is out of date (e.g. after adding new services).

### 2. Build the new services

```bash
pnpm build:promotion
pnpm build:notification
```

### 3. Run in development (watch mode)

**Promotion service** (port **4010**):

```bash
pnpm dev:promotion
```

**Notification service** (port **4011**):

```bash
pnpm dev:notification
```

Run each in a separate terminal, or run in the background.

**Expected behavior:** After you see `Promotion service started on port 4010` (or the same for the notification service), the terminal will show **no further output** unless you change code (watch mode) or hit the service. That is normal—the process is running. To confirm, run `curl http://localhost:4010/health` in another terminal.

**If a command seems stuck (e.g. build or install):**
- **Builds** (`pnpm build:promotion`, `pnpm build:notification`) usually finish in under a minute. If there’s no output for 2–3 minutes, press `Ctrl+C` and run again so you see any TypeScript or compile errors.
- **Install** (`pnpm install`) can take several minutes on first run; let it run. If it hangs with no output for 10+ minutes, check your network or try `pnpm install --no-frozen-lockfile 2>&1` to capture all output.

### 4. Run built services (production mode)

After `pnpm build:promotion` and `pnpm build:notification`, run **one command per terminal** (do not paste comments after the command—the shell will pass them as arguments and break the script):

**Terminal 1** (promotion, port 4010):

```bash
pnpm start:promotion
```

**Terminal 2** (notification, port 4011):

```bash
pnpm start:notification
```

You should see one line per terminal (`Promotion service started on port 4010` / `Notification service started on port 4011`). The terminal will then show no further output and stay “busy”—that means the process is running. Do not close those terminals while you need the services. To verify, open a **third** terminal and run the health checks below.

### 5. Health checks

```bash
curl http://localhost:4010/health
curl http://localhost:4011/health
```

### 6. Run the web app (and order service for cart)

The web app proxies several backend services. If you only run the web app, you may see **`ECONNREFUSED`** for `/api/cart/session` because the **order service** (port **4004**) is not running. To fix:

**Start the order service** in another terminal (cart, checkout, orders):

```bash
pnpm dev:order
```

Or after building: `pnpm start:order`. Then (re)load the site at http://localhost:3000. For full storefront (auth, products, cart, etc.) you may need more services (auth 4001, product 4007, etc.); run `pnpm dev` from the repo root to start all apps and services, or start only the ones you need.

### 8. Web app proxy

Ensure `apps/web` has rewrites for the new services (already in `next.config.js`):

- `/api/promotions/*` → promotion service (default `http://localhost:4010`)
- `/api/notify/*` → notification service (default `http://localhost:4011`)

Set in `.env.local` if using different hosts/ports:

```bash
NEXT_PUBLIC_PROMOTION_SERVICE_URL=http://localhost:4010
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:4011
```

### 9. Port already in use (EADDRINUSE)

If you see `Error: listen EADDRINUSE: address already in use :::4010` (or 4011), a previous run is still using the port. Free both ports in one go:

```bash
kill $(lsof -t -i :4010 -i :4011) 2>/dev/null; echo "Ports 4010 and 4011 freed."
```

Then run **only** (no text after the command):

```bash
pnpm start:promotion
```

and in another terminal:

```bash
pnpm start:notification
```

---

## Phase 1: Use Sabuanchuparayil GitHub for Development

### Option A: Create a new repo under your account (recommended)

1. **Create repo on GitHub**
   - Go to **https://github.com/new**
   - Log in as **Sabuanchuparayil**
   - Repository name: **GrandGold**
   - Owner: **Sabuanchuparayil**
   - Leave it **empty** (no README, no .gitignore)
   - Create repository

2. **Add it as a remote and push your code**
   ```bash
   cd ~/Desktop/GG
   git remote add sabuj https://github.com/Sabuanchuparayil/GrandGold.git
   git push -u sabuj main
   ```

3. **Use Sabuanchuparayil as your main dev remote**
   - Day-to-day: push to **sabuj** (Sabuanchuparayil)
   - When ready for HOS: push to **origin** (app-hos-uk)
   ```bash
   git push sabuj main          # push to your dev repo
   git push origin main         # push to HOS when ready for production
   ```

### Option B: Keep app-hos-uk as origin, add Sabuanchuparayil as dev

If you prefer to keep **origin** = app-hos-uk and only use your account for a copy:

1. Create **Sabuanchuparayil/GrandGold** (empty repo) on GitHub.
2. Add and push:
   ```bash
   cd ~/Desktop/GG
   git remote add sabuj https://github.com/Sabuanchuparayil/GrandGold.git
   git push sabuj main
   ```
3. For daily work you can push to **sabuj**; **origin** stays for HOS production.

---

## Phase 2: Use the Same GCP for Live Testing

You use the **same GCP project** you created for HOS as your **testing/staging** environment.

### 2.1 Set your GCP project

```bash
# Replace with your actual GCP Project ID (the one you created for HOS)
export GCP_PROJECT_ID=your-gcp-project-id
gcloud config set project $GCP_PROJECT_ID
gcloud auth login
```

### 2.2 Enable required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable redis.googleapis.com
```

### 2.3 (Optional) Database & Redis for testing

- **Cloud SQL**: Run `./infrastructure/gcp/setup-database.sh` if you need a real DB for testing.
- **Memorystore Redis**: Run `./infrastructure/gcp/setup-redis.sh` if you need Redis.
- For **quick live testing**, you can deploy services first and add DB/Redis when needed.

### 2.4 Deploy to GCP (live testing)

From your project root:

```bash
cd ~/Desktop/GG
export GCP_PROJECT_ID=your-gcp-project-id
pnpm gcp:deploy
```

This builds and deploys auth, seller, fintech, order, payment services to Cloud Run in the regions defined in `infrastructure/gcp/deploy-all.sh`.

### 2.5 Deploy the web app (for full live test)

The web app **rewrites** `/api/*` to backend services. Those URLs are **baked in at build time**. So you must build the web with the correct backend URLs (e.g. use `infrastructure/gcp/cloudbuild-web.yaml`), and deploy all backend services first. Otherwise production will show **401** (auth), **404** (wrong or missing backend), or **500** (backend error). See [runbooks/09-production-401-404-500.md](runbooks/09-production-401-404-500.md).

```bash
# Build web with production backend URLs (recommended)
gcloud builds submit --config=./infrastructure/gcp/cloudbuild-web.yaml --timeout=20m .

# Or build and push web image only (uses default localhost URLs if no build-args!)
# gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/web --timeout=20m .

# Deploy to Cloud Run (pick one region, e.g. asia-south1)
gcloud run deploy web \
  --image gcr.io/$GCP_PROJECT_ID/web \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --set-env-vars "NODE_ENV=production"
```

### 2.6 Get URLs and test

- **Cloud Run** → select each service → copy **URL**.
- **Web**: Cloud Run → **web** → URL (e.g. `https://web-xxx.run.app`).
- Test: open web URL, log in, browse, checkout (use test Stripe/Razorpay keys if needed).

### 2.6b Point local web app at deployed auth-service

To run the web app **locally** (e.g. `pnpm dev` in `apps/web`) but have it use the **deployed** auth-service on Cloud Run, set the auth URL in `apps/web/.env.local`:

- **New file:** run from repo root:
  ```bash
  echo 'NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-service-484382472654.asia-south1.run.app' > apps/web/.env.local
  ```
- **Existing file:** open `apps/web/.env.local` and set or change:
  `NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-service-484382472654.asia-south1.run.app`

Restart the Next.js dev server after changing so rewrites pick it up.

### 2.7 Set DATABASE_URL and JWT_SECRET on auth-service (Cloud Run)

Auth-service needs a database and JWT secret for login to work. Use **Secret Manager** (recommended) or plain env vars.

**Important:** Run each command below in your terminal **one at a time** (copy-paste one block, press Enter, then the next). Pasting the whole section at once can cause `zsh: permission denied` or `zsh: command not found: #` from comment lines.

**Option A — Secret Manager (recommended)**

1. **Create the JWT secret** (one-time; use a strong random value):

   ```bash
   # Generate a random secret (e.g. 32 bytes hex)
   openssl rand -hex 32
   # Create the secret (paste the value from above, or use your own)
   echo -n "YOUR_JWT_SECRET_VALUE" | gcloud secrets create JWT_SECRET --data-file=- --project=grandmarketplace
   ```

   If the secret already exists, add a new version:

   ```bash
   echo -n "YOUR_JWT_SECRET_VALUE" | gcloud secrets versions add JWT_SECRET --data-file=- --project=grandmarketplace
   ```

2. **Database URL**: If you ran `./infrastructure/gcp/setup-database.sh`, the secret **grandgold-db-url** already exists. If not, create it with your PostgreSQL connection string (e.g. Cloud SQL):

   ```bash
   echo -n "postgresql://USER:PASSWORD@/DB_NAME?host=/cloudsql/PROJECT:REGION:INSTANCE" | gcloud secrets create grandgold-db-url --data-file=- --project=grandmarketplace
   ```

3. **Grant Cloud Run access** to the secrets (replace `grandmarketplace` and region if different). Run these **one at a time**:

   ```bash
   export GCP_PROJECT_ID=grandmarketplace
   ```
   ```bash
   PROJECT_NUMBER=$(gcloud projects describe $GCP_PROJECT_ID --format='value(projectNumber)')
   SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
   gcloud secrets add-iam-policy-binding JWT_SECRET --member="serviceAccount:${SA}" --role="roles/secretmanager.secretAccessor" --project=$GCP_PROJECT_ID
   ```
   ```bash
   gcloud secrets add-iam-policy-binding grandgold-db-url --member="serviceAccount:${SA}" --role="roles/secretmanager.secretAccessor" --project=$GCP_PROJECT_ID
   ```

4. **Update auth-service** to use the secrets (no image rebuild; new revision only). Run this **only after** the secret `grandgold-db-url` exists and IAM is granted (step 3), otherwise the deploy will fail with "Permission denied on secret":

   ```bash
   gcloud run services update auth-service \
     --region asia-south1 \
     --project grandmarketplace \
     --set-secrets="DATABASE_URL=grandgold-db-url:latest,JWT_SECRET=JWT_SECRET:latest"
   ```

   If you use Cloud SQL with a Unix socket, also set the connection name (get it from Cloud SQL → instance → Connection name):

   ```bash
   gcloud run services update auth-service \
     --region asia-south1 \
     --project grandmarketplace \
     --set-secrets="DATABASE_URL=grandgold-db-url:latest,JWT_SECRET=JWT_SECRET:latest" \
     --set-env-vars="CLOUD_SQL_CONNECTION_NAME=grandmarketplace:asia-south1:YOUR_INSTANCE_NAME"
   ```

**If deployment already failed** (e.g. "Permission denied on secret grandgold-db-url" or "Secret grandgold-db-url not found"): the secret must exist and IAM must be granted before updating auth-service. To get auth-service back to a working revision using only JWT_SECRET, run:

```bash
gcloud run services update auth-service --region asia-south1 --project grandmarketplace --set-secrets="JWT_SECRET=JWT_SECRET:latest"
```

Then create the DB secret (see "Full sequence with setup-database.sh" below), grant IAM for `grandgold-db-url`, and run the update again with both secrets.

**Full sequence with setup-database.sh** (creates Cloud SQL + secret `grandgold-db-url`). Run from repo root, **one command at a time**:

```bash
export GCP_PROJECT_ID=grandmarketplace
```
```bash
bash infrastructure/gcp/setup-database.sh
```
(If you get "permission denied", run: `chmod +x infrastructure/gcp/setup-database.sh` then `./infrastructure/gcp/setup-database.sh`.)

```bash
PROJECT_NUMBER=$(gcloud projects describe grandmarketplace --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
```
```bash
gcloud secrets add-iam-policy-binding grandgold-db-url --member="serviceAccount:${SA}" --role="roles/secretmanager.secretAccessor" --project=grandmarketplace
```
```bash
gcloud run services update auth-service --region asia-south1 --project grandmarketplace --set-secrets="DATABASE_URL=grandgold-db-url:latest,JWT_SECRET=JWT_SECRET:latest"
```

**Option B — Env vars (quick test only; avoid in production)**

```bash
export GCP_PROJECT_ID=grandmarketplace
export JWT_SECRET="your-strong-random-jwt-secret"
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
# Optional for Cloud SQL socket:
# export CLOUD_SQL_CONNECTION_NAME="project:region:instance"
./infrastructure/gcp/deploy-service.sh auth-service
```

**Option C — Future deploys using Secret Manager**

When you run the deploy script, you can pass secret names so new revisions get the secrets automatically:

```bash
export GCP_PROJECT_ID=grandmarketplace
export DATABASE_SECRET_NAME=grandgold-db-url
export JWT_SECRET_NAME=JWT_SECRET
./infrastructure/gcp/deploy-service.sh auth-service
```

---

## Phase 3: Live Testing Checklist

1. **Health checks**
   - `curl https://auth-service-xxx.run.app/health`
   - Same for order, product, payment (replace URLs).

2. **Web app**
   - Open web URL, switch country (IN / AE / UK).
   - Register / log in, view products, add to cart, checkout (test mode).

3. **Payments**
   - Use Stripe/Razorpay **test** keys in env; complete a test payment.

4. **Fix and re-deploy**
   - Change code → `git add .` → `git commit -m "Fix ..."` → `git push sabuj main`
   - Re-deploy:
     ```bash
     export GCP_PROJECT_ID=your-gcp-project-id
     pnpm gcp:deploy
     # or single service: ./infrastructure/gcp/deploy-service.sh auth-service asia-south1
     ```

---

## Phase 4: Deploy to HOS Account for Production

When live testing is done and you are ready for **HOS production**:

### 4.1 Code in HOS GitHub

Push your tested code to app-hos-uk:

```bash
cd ~/Desktop/GG
git push origin main
```

(If you use **sabuj** for daily work, merge to `main` first, then `git push origin main`.)

### 4.2 HOS GCP project

- **If HOS has a separate GCP project** (e.g. HOS org/production project):
  - Someone with access to that project sets `GCP_PROJECT_ID` to the **HOS production** project ID.
  - Run the same enable-APIs and deploy steps (Phase 2) against that project.
- **If you keep using the same GCP project** for production:
  - Use the same project; ensure production env vars (real Stripe/Razorpay, production DB, etc.) are set in Cloud Run (or Secret Manager).

### 4.3 Deploy production

On the machine/CI that has access to **HOS GCP**:

```bash
export GCP_PROJECT_ID=hos-production-project-id
gcloud config set project $GCP_PROJECT_ID
gcloud auth login
# Enable APIs if not already done (see Phase 2.2)
pnpm gcp:deploy
# Deploy web (see Phase 2.5)
```

### 4.4 Production config

- Use **production** secrets: Stripe/Razorpay live keys, production `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, etc.
- Set env vars via Cloud Run **Edit & deploy new revision** or **Secret Manager** (see main [Deployment Guide](./DEPLOYMENT_GUIDE.md)).

---

## Quick reference

| Task | Command |
|------|--------|
| Push to your dev repo (Sabuanchuparayil) | `git push sabuj main` |
| Push to HOS repo (production) | `git push origin main` |
| Deploy all services (live test / same GCP) | `GCP_PROJECT_ID=xxx pnpm gcp:deploy` |
| Deploy one service | `GCP_PROJECT_ID=xxx ./infrastructure/gcp/deploy-service.sh <service-name> asia-south1` |
| Set auth-service DATABASE_URL + JWT_SECRET | See [2.7 Set DATABASE_URL and JWT_SECRET](#27-set-database_url-and-jwt_secret-on-auth-service-cloud-run) |
| Deploy web app | `gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/web .` then `gcloud run deploy web ...` |

---

## Summary

1. **GitHub**: Use **Sabuanchuparayil/GrandGold** for development (add remote **sabuj**, push there daily).
2. **Live testing**: Use your **existing GCP** (same project for HOS); `pnpm gcp:deploy` + deploy web, then test.
3. **Production**: Push to **app-hos-uk/GrandGold** (`git push origin main`), then deploy from **HOS GCP** (or same project with production config).

For full deployment details (env vars, secrets, DB, Redis), see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).
