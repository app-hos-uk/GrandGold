# GrandGold – Incident Response Runbook

## Common Issues

### Service Unhealthy

1. Check logs: `docker logs <container>` or Cloud Logging
2. Verify env vars and DB/Redis connectivity
3. Restart: `docker restart <container>` or Cloud Run revision

### Database Connection Failed

1. Verify `DATABASE_URL` and network
2. Run migrations: `pnpm db:migrate`
3. Check Cloud SQL proxy if using GCP

### Redis Connection Failed

1. Verify `REDIS_URL`
2. Check Memorystore connectivity (VPC, firewall)
3. Fallback: some features degrade gracefully (e.g. notifications in-memory)

### Payment Failures

1. Check Stripe dashboard for decline reasons
2. Verify `STRIPE_SECRET_KEY` and webhook secret
3. Review payment-service logs

### High Latency

1. Check Cloud Run scaling and cold starts
2. Enable CDN for static assets
3. Review Meilisearch index size for product search
