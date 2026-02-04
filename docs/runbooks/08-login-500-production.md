# Login 500 (Internal Server Error) in Production

When `POST /api/auth/login` returns **500 Internal Server Error** on the deployed web app (e.g. `https://web-xxx.run.app`), use this runbook to find and fix the cause.

**If you already see "Redis not configured ... Using in-memory stub" in auth-service logs but login still returns 500:** the failure is almost certainly the **database**. Auth-service needs **`DATABASE_URL`** set on Cloud Run (e.g. from Secret Manager). Go to **Step 3** and follow 3b (set DATABASE_URL from Secret Manager, then redeploy and seed production DB).

---

## What’s happening

1. The browser sends login to the **web** service: `POST https://web-xxx.run.app/api/auth/login`.
2. Next.js **rewrites** that request to the **auth-service** URL (set at build time via `NEXT_PUBLIC_AUTH_SERVICE_URL`).
3. If the auth-service responds with 500, or the web app cannot reach the auth-service, the user sees a 500.

So the 500 can come from:

- **A.** Web app cannot reach auth-service (wrong/missing URL or network).
- **B.** Auth-service returns 500 (e.g. database, Redis, or an uncaught error).

---

## Step 1: Confirm the web app is pointing at auth-service

The web app’s API rewrites are **baked at build time**. If the web image was built **without** `NEXT_PUBLIC_AUTH_SERVICE_URL`, rewrites go to `http://localhost:4001`, which fails inside the container and can surface as 500.

- **If you use Cloud Build** (`infrastructure/gcp/cloudbuild-ci.yaml`): the web build step already passes `NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-service-484382472654.asia-south1.run.app` (and similar for other services). Redeploy via that pipeline so the web image is built with the correct URLs.
- **If you build the web image manually**: pass the same build-args, e.g.  
  `--build-arg NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-service-XXXXXXXX.asia-south1.run.app`

To double-check that the web can reach auth, open (or call):

- `https://web-xxx.run.app/api/health`  
  (if your health route calls auth-service) and see if the auth check succeeds or fails.

---

## Step 2: Check auth-service logs (find the real error)

The auth-service now logs **full error message and stack** for 500s. Use that to see the root cause.

**GCP (Cloud Run):**

```bash
# Replace region/project if different
gcloud run services logs read auth-service --region=asia-south1 --project=grandmarketplace --limit=100
```

**Look for:**

- **`Unexpected error`** – next to it you should see `message` and `stack` (e.g. DB connection, SSL, Redis).
- **Database:** `connect ETIMEDOUT`, `ENOTFOUND`, `unable to verify the first certificate` → see Step 3.
- **Redis:** connection errors → see Step 4.
- **Other:** use the stack trace to see which line threw.

---

## Step 3: If the error is database-related (or 500 with no Redis errors)

**Most common cause of login 500:** auth-service has **no `DATABASE_URL`** in Cloud Run, so it falls back to `localhost` and every DB call fails.

### 3a. Check if DATABASE_URL is set

```bash
gcloud run services describe auth-service --region=asia-south1 --project=grandmarketplace --format="yaml(spec.template.spec.containers[0].env)"
```

- If you **don’t see** `DATABASE_URL` (or a secret ref for it), set it as below.
- If you see **"Redis not configured"** but still get **POST 500**, the failure is almost certainly the database.

### 3b. Set DATABASE_URL from Secret Manager

1. **Create the secret** (one-time) if you don’t have it yet. Put your Cloud SQL URL in a file or echo it (never commit it):

   ```bash
   # Example: create secret from your Cloud SQL URL
   echo -n "postgresql://USER:PASSWORD@/grandgold?host=/cloudsql/PROJECT:REGION:INSTANCE" | \
     gcloud secrets create grandgold-database-url --data-file=- --project=grandmarketplace
   ```

   Or use the **public IP** form if you’re not using Unix socket:

   ```bash
   echo -n "postgresql://USER:PASSWORD@YOUR_CLOUD_SQL_PUBLIC_IP:5432/grandgold" | \
     gcloud secrets create grandgold-database-url --data-file=- --project=grandmarketplace
   ```

2. **Redeploy auth-service** and pass the secret as `DATABASE_URL`:

   ```bash
   export GCP_PROJECT_ID=grandmarketplace
   gcloud run deploy auth-service \
     --image gcr.io/grandmarketplace/auth-service \
     --platform managed \
     --region asia-south1 \
     --allow-unauthenticated \
     --set-secrets=DATABASE_URL=grandgold-database-url:latest \
     --set-env-vars="NODE_ENV=production" \
     --project=$GCP_PROJECT_ID
   ```

   If your secret has a **different name** (e.g. `DATABASE_URL`), use it:

   `--set-secrets=DATABASE_URL=DATABASE_URL:latest`

3. **Optional:** If you see SSL errors in logs, add:

   `--set-env-vars="NODE_ENV=production,DATABASE_SSL_NO_VERIFY=1"`

4. **Seed the production DB** (so the Super Admin exists in the DB auth-service uses):

   ```bash
   export DATABASE_URL=$(gcloud secrets versions access latest --secret=grandgold-database-url --project=grandmarketplace)
   pnpm db:seed
   ```

Then try logging in again.

### 3c. Other database issues

- **Connection timeout / ENOTFOUND**  
  Cloud Run → Cloud SQL: ensure the Cloud SQL instance allows connections (VPC connector or authorized networks, depending on your setup).

- **`unable to verify the first certificate`**  
  Set on auth-service: env var `DATABASE_SSL_NO_VERIFY=1` (see 3b step 3).

Redeploy auth-service after changing env vars or secrets.

---

## Step 4: If the error is Redis-related

Login only uses Redis when the user has **MFA enabled**. If the user does **not** have MFA (e.g. Super Admin), Redis is not required for login.

- If the log shows Redis connection errors and the user has MFA: fix Redis (e.g. set `REDIS_URL` and ensure the service is reachable from Cloud Run).
- If the user does not have MFA and you still see Redis in the stack: the error might be in another path (e.g. session or token). Use the logged stack to find the exact line.

---

## Step 5: Verify auth-service health

Call the auth-service directly (replace with your URL):

```bash
curl -s https://auth-service-XXXXXXXX.asia-south1.run.app/health
```

Expected: `{"status":"healthy","service":"auth-service",...}`  

If this fails or times out, the problem is with the auth-service (or its DB/Redis), not the web build.

---

## Step 6: Test login against auth-service directly

To confirm auth-service login works without the web proxy:

```bash
curl -s -X POST https://auth-service-XXXXXXXX.asia-south1.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mail@jsabu.com","password":"Admin@1234"}'
```

- If this returns **200** and tokens: auth-service is fine; the 500 is likely from the web app (e.g. rewrite URL or proxy). Re-check Step 1 and that the web was built with the correct `NEXT_PUBLIC_AUTH_SERVICE_URL`.
- If this returns **500**: use Step 2 again and fix the error shown in the auth-service logs (DB, Redis, or code).

---

## Checklist

| Check | Command / action |
|-------|-------------------|
| Web built with auth URL | Build web with `NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-service-xxx.run.app` |
| Auth-service logs | `gcloud run services logs read auth-service --region=asia-south1 --project=grandmarketplace --limit=100` |
| DB SSL issue | Set `DATABASE_SSL_NO_VERIFY=1` on auth-service (Cloud Run env). |
| Auth health | `curl https://auth-service-xxx.run.app/health` |
| Login direct | `curl -X POST .../api/auth/login -d '{"email":"...","password":"..."}'` |
| DB not set | Auth-service needs **DATABASE_URL** (e.g. from Secret Manager). Cloud Run → auth-service → Edit → Variables & Secrets → add or mount secret. |
| Redis optional | If you see Redis ECONNREFUSED in logs, redeploy auth-service so the "Redis optional" code is live; login works without Redis. |

After fixing the underlying cause (URL, DB, Redis, or code), redeploy the affected service and retry login.

---

## Redeploy auth + web (copy-paste safe)

If you see **"zsh: missing end of string"** or **"zsh: number expected"** when pasting multi-line blocks, run one command at a time from the project root:

```bash
cd /Users/sabuj/Desktop/GG
export GCP_PROJECT_ID=grandmarketplace
```

```bash
gcloud builds submit --config=./infrastructure/gcp/cloudbuild-service.yaml --substitutions=_SERVICE_NAME=auth-service --timeout=20m .
```

```bash
gcloud run deploy auth-service --image gcr.io/grandmarketplace/auth-service --platform managed --region asia-south1 --allow-unauthenticated --quiet
```

```bash
./infrastructure/gcp/deploy-web.sh asia-south1
```

Run each block separately (or one command per paste) to avoid zsh parse errors.
