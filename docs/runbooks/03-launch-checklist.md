# GrandGold – Launch Checklist

## Pre-Launch

### Environment Variables
- [ ] `DATABASE_URL` – Production PostgreSQL
- [ ] `REDIS_URL` – Production Redis/Memorystore
- [ ] `JWT_SECRET` – Strong random secret
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] `GCP_PROJECT_ID`, `VERTEX_AI_LOCATION` (AI features)
- [ ] `NEXT_PUBLIC_*` – All service URLs for production
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` (optional)
- [ ] `MEILISEARCH_URL`, `MEILISEARCH_MASTER_KEY`

### Infrastructure
- [ ] Cloud SQL / DB provisioned and migrated
- [ ] Redis/Memorystore running
- [ ] Cloud Run services deployed
- [ ] Next.js app deployed (Vercel / Cloud Run / custom)
- [ ] CDN configured for static assets
- [ ] SSL/TLS enabled

### Security
- [ ] CORS origins set to production domain(s)
- [ ] Rate limits configured for production load
- [ ] Secrets in Secret Manager (not env files)
- [ ] Admin routes protected

### Testing
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes
- [ ] Smoke test: login, browse, checkout flow
- [ ] Payment test mode validated

## Go-Live

- [ ] Database backup taken
- [ ] Monitoring/alerting enabled
- [ ] Support contact ready
- [ ] Rollback plan documented
