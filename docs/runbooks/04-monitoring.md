# GrandGold – Monitoring Runbook

## Health Checks

### Aggregate Health (Next.js API)
```
GET /api/health
```
Returns status of auth, order, product, and AI services.
- 200: All healthy
- 503: One or more services degraded/unreachable

### Per-Service Health
- Auth: `GET {AUTH_SERVICE_URL}/health`
- Order: `GET {ORDER_SERVICE_URL}/health`
- Product: `GET {PRODUCT_SERVICE_URL}/health`
- AI: `GET {AI_SERVICE_URL}/health`

## Recommended Monitoring

1. **Uptime** – Ping `/api/health` every 1–5 min (e.g. UptimeRobot, Cloud Monitoring)
2. **Logs** – Cloud Logging / Pino logs for errors and latency
3. **Alerts** – 503 on `/api/health`, high error rate, DB/Redis connection failures
4. **Dashboards** – Request count, latency p95, error rate per service
