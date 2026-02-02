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

```bash
# Build and push web image
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/web --timeout=20m .

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
| Deploy one service | `./infrastructure/gcp/deploy-service.sh <service-name> asia-south1` |
| Deploy web app | `gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/web .` then `gcloud run deploy web ...` |

---

## Summary

1. **GitHub**: Use **Sabuanchuparayil/GrandGold** for development (add remote **sabuj**, push there daily).
2. **Live testing**: Use your **existing GCP** (same project for HOS); `pnpm gcp:deploy` + deploy web, then test.
3. **Production**: Push to **app-hos-uk/GrandGold** (`git push origin main`), then deploy from **HOS GCP** (or same project with production config).

For full deployment details (env vars, secrets, DB, Redis), see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).
