# Deployment Review (Pre-production)

Quick review of changes included in this deployment and how to deploy.

---

## Changes included

### Admin & UX
- **Admin sidebar**: Scrollable nav so all items (including Influencer Marketing) are visible; Sign Out in flex flow.
- **Admin Users**: Add User modal has **Role** selection (moved up in form); role is applied after registration via `setUserRole`.
- **Influencer Marketing**:
  - **Influencer modal** (Add/Edit): New `InfluencerModal` component with slug, name, bio, commission rate, product IDs.
  - **Backend**: product-service list/create/update influencer racks (GET/POST/PUT `/api/influencers`); `listRacks()` in lib.
  - **Web**: `influencerApi.listRacks`, `createRack`, `updateRack`; Add/Edit flows wired on `/admin/influencers` with toasts and list refresh.
- **Admin pages**: Promotions, Marketing (and sub-routes), Shipping, Influencers, Support, Refunds, Reports, etc., plus runbooks for production issues.

### Backend
- **product-service**: Influencer list/create/update routes; search route hardened (empty data on MeiliSearch failure).
- **promotion-service**: Routes return 200 + empty data on failure instead of 500.
- **auth-service**: Redis and error-handler resilience.
- **order-service**: Port fixed to 4004 (was 4003).
- **API client**: `api.put()` added; `InfluencerRack` type and admin influencer methods.

### Config & Ops
- **cloudbuild-web.yaml**: Production backend URLs for KYC, Seller, Fintech, Payment, Promotion, Notification (not auth).
- **Runbooks**: 05–09 (super-admin seed, local vs prod DB, login 500, production 401/404/500).
- **fix-production-web.sh**: Script to rebuild and redeploy web with correct URLs.

---

## Deploy to production

**Prerequisites:** `gcloud` installed and logged in; `GCP_PROJECT_ID` set to your production project (e.g. `grandmarketplace` or `grandgold-prod`).

### 1. Deploy backend services (if not already)

From repo root:

```bash
export GCP_PROJECT_ID=grandmarketplace   # or your production project
pnpm gcp:deploy
```

This deploys: auth, kyc, seller, fintech, order, payment, product, inventory.  
**Note:** `deploy-all.sh` does not include promotion-service or notification-service; add them to the script or deploy manually if the web uses them.

### 2. Deploy the web app

Web must be built with production backend URLs (see `infrastructure/gcp/cloudbuild-web.yaml`):

```bash
export GCP_PROJECT_ID=grandmarketplace   # or your production project
./infrastructure/gcp/deploy-web.sh
```

Or with a specific region:

```bash
./infrastructure/gcp/deploy-web.sh asia-south1
```

### 3. Post-deploy

- **401 on login**: Check production DB seed, `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL` on auth-service. See [runbooks/09-production-401-404-500.md](runbooks/09-production-401-404-500.md).
- **404 on API**: Ensure all backend services are deployed and web was built with `cloudbuild-web.yaml` (correct URLs).
- **Influencer API**: List/create/update go to product-service; ensure product-service is deployed and has Redis if you use custom racks.

---

## Quick reference

| Command | Purpose |
|--------|---------|
| `pnpm gcp:deploy` | Deploy all backend services (multi-region) |
| `./infrastructure/gcp/deploy-web.sh [region]` | Build web with prod URLs and deploy to Cloud Run |
| `./infrastructure/gcp/deploy-service.sh <service> <region>` | Deploy a single service |
| `./infrastructure/gcp/fix-production-web.sh` | Rebuild and redeploy web (correct URLs) |

See [DEV_TO_PRODUCTION_WORKFLOW.md](DEV_TO_PRODUCTION_WORKFLOW.md) and [runbooks/09-production-401-404-500.md](runbooks/09-production-401-404-500.md) for full workflow and troubleshooting.
