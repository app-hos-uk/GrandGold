# Super Admin Seed — Step-by-Step Resolution

Use this guide to get the Super Admin user created without getting stuck.

---

## Step 1: Choose where your database is

Pick one:

| Situation | Path |
|-----------|------|
| I want to test locally first / I have PostgreSQL on my machine | **Path A — Local** (below) |
| I have (or will create) a Cloud SQL instance in GCP project `grandmarketplace` | **Path B — Production** (below) |

---

## Path A — Local PostgreSQL (fastest way to proceed)

Use this if you have PostgreSQL installed locally or in Docker, or want to test the seed without production.

### A1. Start PostgreSQL

- **If you use Homebrew:** `brew services start postgresql@14` (or your version).
- **If you use Docker:**  
  `docker run -d --name grandgold-pg -e POSTGRES_PASSWORD=password -e POSTGRES_DB=grandgold_dev -p 5432:5432 postgres:15`
- **If Postgres is already running:** skip to A2.

### A2. Create the database (if it doesn’t exist)

```bash
# If your local user is postgres and no password:
createdb grandgold_dev

# Or via psql (password might be empty or 'password' depending on your setup):
psql -U postgres -h localhost -c "CREATE DATABASE grandgold_dev;"
```

### A3. Push schema and run seed

From the **repo root** (`/Users/sabuj/Desktop/GG`):

```bash
# Push schema (tables)
DATABASE_URL="postgresql://postgres:password@localhost:5432/grandgold_dev" pnpm --filter @grandgold/database db:push
```

If that works, run the seed:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/grandgold_dev" pnpm db:seed
```

- If your local Postgres user or password is different, change `postgres` and `password` in the URL.
- If you see “role postgres does not exist”, use your Mac username in the URL: `postgresql://YOUR_MAC_USERNAME@localhost:5432/grandgold_dev` (e.g. `sabuj`).

### A4. Verify

You should see: **Super Admin created successfully** (or “Super admin already exists”).  
Then sign in at your **admin login** URL with:

- **Email:** `mail@jsabu.com`  
- **Password:** `Admin@1234`

---

## Path B — Production (GCP Cloud SQL in grandmarketplace)

Use this when you want the Super Admin in the same database your deployed app uses.

### B1. Check if Cloud SQL exists

```bash
gcloud sql instances list --project=grandmarketplace
```

- **If you see an instance** (e.g. `grandgold-db` or similar): note its name and go to B2.
- **If the list is empty:** you need to create an instance first (B1b).

#### B1b. Create Cloud SQL (if you have no instance)

From the repo:

```bash
cd /Users/sabuj/Desktop/GG
GCP_PROJECT_ID=grandmarketplace ./infrastructure/gcp/setup-database.sh
```

The script creates instance, database, user, and stores a connection URL in Secret Manager as **`grandgold-db-url`** (that URL is for Cloud Run; for seeding from your machine you’ll use the instance’s public IP — see B2).

### B2. Get connection details

You need: **instance public IP**, **database name**, **user**, **password**.

**Option 1 — Public IP and password from GCP Console**

1. Open [Cloud SQL](https://console.cloud.google.com/sql?project=grandmarketplace).
2. Click your instance → **Overview** → note **Public IP address**.
3. For password: if you ran `setup-database.sh`, the password is in Secret Manager:
   ```bash
   gcloud secrets versions access latest --secret=grandgold-db-password --project=grandmarketplace
   ```
4. Database name is usually `grandgold`; user is often `postgres`.

**Option 2 — Build the URL from what you know**

Format:

```text
postgresql://USER:PASSWORD@PUBLIC_IP:5432/DATABASE_NAME
```

Example (replace with your real values):

```text
postgresql://postgres:THE_PASSWORD_FROM_SECRET@34.87.xxx.xxx:5432/grandgold
```

### B3. Run schema push and seed

From the **repo root**, set `DATABASE_URL` to the URL you built above and run:

```bash
# Replace the URL with YOUR actual URL from B2
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_INSTANCE_PUBLIC_IP:5432/grandgold"

# Push schema (once)
pnpm --filter @grandgold/database db:push

# Create Super Admin
pnpm db:seed
```

If you prefer a one-liner without exporting:

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_INSTANCE_PUBLIC_IP:5432/grandgold" pnpm --filter @grandgold/database db:push
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_INSTANCE_PUBLIC_IP:5432/grandgold" pnpm db:seed
```

### B4. (Optional) Store URL in Secret Manager as DATABASE_URL

So you can use the same “production” command later:

```bash
# Create secret DATABASE_URL with your real URL (one-time)
echo -n "postgresql://postgres:YOUR_PASSWORD@YOUR_INSTANCE_PUBLIC_IP:5432/grandgold" | \
  gcloud secrets create DATABASE_URL --data-file=- --project=grandmarketplace
```

Then next time:

```bash
export DATABASE_URL=$(gcloud secrets versions access latest --secret=DATABASE_URL --project=grandmarketplace) && pnpm db:seed
```

---

## Quick reference

| Goal | Command (replace placeholders if needed) |
|------|----------------------------------------|
| **Local: push schema** | `DATABASE_URL="postgresql://postgres:password@localhost:5432/grandgold_dev" pnpm --filter @grandgold/database db:push` |
| **Local: seed** | `DATABASE_URL="postgresql://postgres:password@localhost:5432/grandgold_dev" pnpm db:seed` |
| **Production: seed** | `DATABASE_URL="postgresql://postgres:PASSWORD@PUBLIC_IP:5432/grandgold" pnpm db:seed` |
| **Super Admin login** | Email: `mail@jsabu.com` / Password: `Admin@1234` |

---

## Common errors

| Error | What to do |
|-------|------------|
| `NOT_FOUND: Secret DATABASE_URL` | Secret doesn’t exist. Use Path B and set `DATABASE_URL` directly (B3), or create the secret (B4). |
| `role "postgres" does not exist` | Homebrew Postgres on Mac uses your **Mac username** as the DB user. Use `postgresql://YOUR_MAC_USERNAME@localhost:5432/grandgold_dev` (often no password). Example: `postgresql://sabuj@localhost:5432/grandgold_dev`. |
| `getaddrinfo ENOTFOUND ...` or `ENOTFOUND HOST` | You used a placeholder (e.g. `...` or `HOST`) in the URL. Use a real host (e.g. `localhost` or your Cloud SQL public IP). |
| `connection refused` (local) | Start PostgreSQL (A1) and ensure port 5432 is open. |
| `connection refused` (Cloud SQL) | Enable public IP for the instance and allow your IP in Cloud SQL’s authorized networks (or use Cloud SQL Auth Proxy). |

If you tell me whether you’re on **Path A (local)** or **Path B (production)** and the exact error message, the next step can be narrowed down precisely.
