# Super Admin Seed

Create the Super Admin user in the database (run **once** per environment: staging, production).

**Stuck?** Use the **[Step-by-step resolution guide](06-super-admin-seed-step-by-step.md)** — it walks you through local vs production and fixes common errors.

## Prerequisites

- `DATABASE_URL` for the target PostgreSQL instance (Cloud SQL, RDS, or local).
- pnpm and dependencies installed (`pnpm install`).

## Command

From the **repo root** (local dev — default DB):

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/grandgold_dev" pnpm db:seed
```

Or using the database package directly:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/grandgold_dev" pnpm --filter @grandgold/database db:seed
```

**Push schema first (if needed):**

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/grandgold_dev" pnpm --filter @grandgold/database db:push
```

**Do not use placeholders:** Commands must use a real connection string. Using literal `...` or `USER:PASSWORD@HOST:5432/DATABASE` will fail (e.g. `ENOTFOUND ...`).

### Production (GCP Cloud SQL, project: grandmarketplace, region: asia-south1)

**If you get `NOT_FOUND: Secret [projects/.../secrets/DATABASE_URL] not found`:** the secret does not exist yet. Either create it (Option A below) or use a direct connection string (Option B).

---

**Option A — Use Secret Manager (after creating the secret once):**

Create the secret (one-time; use your real PostgreSQL connection string):

```bash
# Create the secret and add the first version (replace with your real connection string)
echo -n "postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_CLOUD_SQL_IP:5432/YOUR_DB_NAME" | \
  gcloud secrets create DATABASE_URL --data-file=- --project=grandmarketplace
```

If the secret already exists and you only need to add a new version:

```bash
echo -n "postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_CLOUD_SQL_IP:5432/YOUR_DB_NAME" | \
  gcloud secrets versions add DATABASE_URL --data-file=- --project=grandmarketplace
```

Then run the seed:

```bash
export DATABASE_URL=$(gcloud secrets versions access latest --secret=DATABASE_URL --project=grandmarketplace) && pnpm db:seed
```

**Option B — Direct connection string (no Secret Manager):**

Use your Cloud SQL instance’s **public IP** (GCP Console → SQL → your instance → Overview → Public IP), and the **database user**, **password**, and **database name** you created for the app.

```bash
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_CLOUD_SQL_PUBLIC_IP:5432/YOUR_DB_NAME" pnpm db:seed
```

Example (replace `myappuser`, `MyS3cr3tP@ss`, `34.87.xxx.xxx`, `grandgold` with your actual DB user, password, instance public IP, and database name):

```bash
DATABASE_URL="postgresql://myappuser:MyS3cr3tP@ss@34.87.xxx.xxx:5432/grandgold" pnpm db:seed
```

**Option C — Cloud SQL Auth Proxy (local machine, proxy must be running):**

If you run the Cloud SQL Proxy locally (e.g. `cloud_sql_proxy -instances=grandmarketplace:asia-south1:YOUR_INSTANCE_NAME=tcp:5432`), use:

```bash
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@127.0.0.1:5432/YOUR_DB_NAME" pnpm db:seed
```

**Push schema in production (once) before seeding:**

```bash
# Option A: from Secret Manager
export DATABASE_URL=$(gcloud secrets versions access latest --secret=DATABASE_URL --project=grandmarketplace)
pnpm --filter @grandgold/database db:push
pnpm db:seed

# Option B: direct URL (same as seed command above)
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_CLOUD_SQL_PUBLIC_IP:5432/YOUR_DB_NAME" pnpm --filter @grandgold/database db:push
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_CLOUD_SQL_PUBLIC_IP:5432/YOUR_DB_NAME" pnpm db:seed
```

**Using a `.env` file (do not commit):**

```bash
# .env
# DATABASE_URL=postgresql://postgres:password@localhost:5432/grandgold_dev

export $(grep -v '^#' .env | xargs) && pnpm db:seed
```

## After seed

- **Email:** `mail@jsabu.com`
- **Password:** `Admin@1234`
- **Role:** `super_admin` (Global Access)

Sign in at `https://<WEB_URL>/admin/login`. Change the password after first login.

If the user already exists, the script prints `Super admin already exists: mail@jsabu.com` and exits without changes.
