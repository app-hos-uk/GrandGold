# Local vs production database

## Are they the same?

**No.** The database you seeded locally is **not** the same as the one production uses (unless you explicitly configured production to use your Mac, which is not recommended).

| Where | Database used |
|-------|----------------|
| **Local seed** (e.g. `DATABASE_URL="postgresql://sabuj@localhost:5432/grandgold_dev" pnpm db:seed`) | PostgreSQL on your Mac (`localhost:5432`, database `grandgold_dev`). |
| **Production** (Cloud Run: auth-service, order-service, etc.) | Whatever `DATABASE_URL` is set on each service (environment variables or Secret Manager). Usually **Cloud SQL** in GCP, or **not set** (then the code falls back to `localhost`, which has no database in the container). |

So the **Super Admin** you created with the local seed exists **only in your local database**. Production does not see it unless you seed the production database too.

---

## Check what database production is using

Run:

```bash
gcloud run services describe auth-service --region=asia-south1 --project=grandmarketplace --format="yaml(spec.template.spec.containers[0].env)"
```

- If you see **`DATABASE_URL`** with a value or **`valueFrom.secretKeyRef`** (e.g. secret `grandgold-database-url`), production is using that database (the URL is in the secret).
- If **`DATABASE_URL` is missing** or points to `localhost`, production is not using a real database.

---

## Use Super Admin in production

Production auth-service (and other services) may get `DATABASE_URL` from Secret Manager. The secret name can be **`grandgold-database-url`** (not necessarily `DATABASE_URL`). To seed the **same** database that production uses:

1. Get the production URL from the secret and run the seed:
   ```bash
   export DATABASE_URL=$(gcloud secrets versions access latest --secret=grandgold-database-url --project=grandmarketplace)
   pnpm --filter @grandgold/database db:push
   pnpm db:seed
   ```
2. Log in at your production admin URL with `mail@jsabu.com` / `Admin@1234`.

If your secret has a different name (e.g. `DATABASE_URL` or `grandgold-db-url`), use that name in the `gcloud secrets versions access` command.

---

## Production login not working

If you see an error when logging in at the **production** admin URL (e.g. "Invalid email or password" or a 500 error), try this order:

### 1. Seed the production database (most common)

The Super Admin exists only in the DB you seeded. Production uses the DB from secret **`grandgold-database-url`**. Seed that DB:

```bash
export DATABASE_URL=$(gcloud secrets versions access latest --secret=grandgold-database-url --project=grandmarketplace)
pnpm --filter @grandgold/database db:push
pnpm db:seed
```

Then try logging in again with **mail@jsabu.com** / **Admin@1234**.

### 2. Check the login request in the browser

Open DevTools (F12) → **Network** tab → try login again → click the **login** (or **auth/login**) request:

- **Status 401** → Wrong credentials or user not in DB (do step 1).
- **Status 500** → Backend error: check auth-service logs (step 3).
- **Status 0 / CORS / failed** → Request not reaching auth; check web app URL and rewrites.

### 3. Check auth-service logs (for 500 or "Something went wrong")

```bash
gcloud run services logs read auth-service --region=asia-south1 --project=grandmarketplace --limit=50
```

Look for database connection errors, JWT errors, or stack traces. Fix the cause (e.g. DATABASE_URL in the secret, or Cloud SQL connectivity).

---

## ETIMEDOUT / CONNECT_TIMEOUT to Cloud SQL from your Mac

If you see **`connect ETIMEDOUT 34.x.x.x:5432`** or **`CONNECT_TIMEOUT`** when running `db:push` or `db:seed` with the production `DATABASE_URL`, your **Mac’s IP is not allowed** to connect to Cloud SQL. Cloud SQL only accepts connections from **authorized networks** (and from Cloud Run when using the Cloud SQL connection).

### Fix: Add your IP to Cloud SQL authorized networks

1. **Get your current public IP** (e.g. [whatismyip.com](https://whatismyip.com) or run `curl -s ifconfig.me`).

2. **Get your Cloud SQL instance name** (if you’re not sure):
   ```bash
   gcloud sql instances list --project=grandmarketplace
   ```
   Example name: `grandgold-db`.

3. **Add your IP in GCP Console (recommended – adds without removing existing entries):**
   - Open [Cloud SQL](https://console.cloud.google.com/sql?project=grandmarketplace).
   - Click your instance → **Connections** → **Networking**.
   - Under **Authorized networks**, click **Add network**.
   - **Name:** e.g. `my-mac`.
   - **Network:** your IP in CIDR form, e.g. `203.0.113.50/32` (use `/32` for a single IP).
   - Save.

4. **Or use gcloud (replaces the whole list – use only if you’re sure):**
   ```bash
   # List current authorized networks (optional)
   gcloud sql instances describe INSTANCE_NAME --project=grandmarketplace --format="get(settings.ipConfiguration.authorizedNetworks)"

   # Add your IP (use YOUR_PUBLIC_IP/32 and your instance name)
   gcloud sql instances patch INSTANCE_NAME --project=grandmarketplace --authorized-networks=YOUR_PUBLIC_IP/32
   ```
   To **keep existing** networks and add yours, include all existing CIDRs plus your new one in `--authorized-networks=...` (comma-separated).

5. Wait a minute, then run again:
   ```bash
   export DATABASE_URL=$(gcloud secrets versions access latest --secret=grandgold-database-url --project=grandmarketplace)
   pnpm --filter @grandgold/database db:push
   pnpm db:seed
   ```

**Note:** Cloud Run reaches Cloud SQL via the Cloud SQL connection (private path), so it does not need your IP. Only your **local machine** needs to be in authorized networks to run `db:push` / `db:seed` from your Mac.
