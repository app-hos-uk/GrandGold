# Deployment Monitoring Status Report

**Generated:** February 9, 2026  
**Commit Deployed:** c7a3863 — *fix: email error handling, environment variable consistency & password variable bug*

---

## Overall Status: ✅ DEPLOYMENT SUCCESSFUL

The latest push to `main` has been fully deployed to GCP Cloud Run. All workflows completed successfully and services are healthy.

---

## 1. GitHub Actions Workflow

| Field | Value |
|-------|--------|
| **Run ID** | 21823281083 |
| **Workflow** | Deploy to GCP Cloud Run |
| **Trigger** | push to `main` |
| **Conclusion** | **success** ✅ |
| **Status** | completed |
| **Started** | 2026-02-09T11:29:30Z |
| **Completed** | 2026-02-09T11:34:56Z |
| **Duration** | **5m 26s** |

**Title:** fix: email error handling, environment variable consistency & passwor…

**Jobs executed (all success):**
- ✅ Detect changes
- ✅ Deploy Web App
- ✅ Deploy auth-service
- ✅ Deploy order-service
- ✅ Deploy payment-service
- ✅ Deploy seller-service
- ✅ Deploy product-service
- ✅ Deploy notification-service
- ✅ Deploy ai-service
- ✅ Deploy promotion-service
- ✅ Deployment Summary

**View run:** https://github.com/app-hos-uk/GrandGold/actions/runs/21823281083

---

## 2. GCP Cloud Run Services

**Project:** grandmarketplace  
**Region:** asia-south1  

All 13 services are **Ready** (status: True):

| Service | URL | Status |
|---------|-----|--------|
| web | https://web-484382472654.asia-south1.run.app | ✅ True |
| seller-service | https://seller-service-484382472654.asia-south1.run.app | ✅ True |
| auth-service | https://auth-service-484382472654.asia-south1.run.app | ✅ True |
| order-service | https://order-service-484382472654.asia-south1.run.app | ✅ True |
| notification-service | https://notification-service-484382472654.asia-south1.run.app | ✅ True |
| product-service | https://product-service-484382472654.asia-south1.run.app | ✅ True |
| payment-service | https://payment-service-484382472654.asia-south1.run.app | ✅ True |
| ai-service | https://ai-service-484382472654.asia-south1.run.app | ✅ True |
| promotion-service | https://promotion-service-484382472654.asia-south1.run.app | ✅ True |
| fintech-service | https://fintech-service-484382472654.asia-south1.run.app | ✅ True |
| inventory-service | https://inventory-service-484382472654.asia-south1.run.app | ✅ True |
| kyc-service | https://kyc-service-484382472654.asia-south1.run.app | ✅ True |
| meilisearch | https://meilisearch-484382472654.asia-south1.run.app | ✅ True |

**Latest ready revisions (affected by this deploy):**
- **web:** web-00038-ddm
- **seller-service:** seller-service-00026-224
- **auth-service:** auth-service-00062-nln
- **order-service:** order-service-00032-jvb

*Last modifier for these services: github-deploy@grandmarketplace.iam.gserviceaccount.com*

---

## 3. Health Checks

| Endpoint | HTTP Status | Result |
|----------|-------------|--------|
| Web app (root) | 307 (redirect) | ✅ OK |
| seller-service/health | 200 | ✅ OK |
| auth-service/health | 200 | ✅ OK |
| order-service/health | 200 | ✅ OK |

All checked backends respond with 200 on `/health`. Web returns 307 (redirect to app), which is expected.

---

## 4. What Was Deployed

**Code changes (this deploy):**
- Email error handling in invite-seller API and seller-service
- Environment variable precedence (NEXT_PUBLIC_WEB_URL) in seller-service, order-service, auth-service
- Password variable fix in invite-seller error response
- New `email.service.ts` and onboarding email triggers in seller-service

**Services updated by this workflow:**
- **web** — Next.js app (invite-seller route, env usage)
- **seller-service** — Email service, onboarding emails, env var fix
- **auth-service** — OAuth redirect URL env var fix
- **order-service** — Notification URL env var fix
- Plus other services that were rebuilt as part of the full deploy

---

## 5. Quick Commands for Ongoing Monitoring

**List Cloud Run services:**
```bash
gcloud run services list --region=asia-south1
```

**Describe a service (revision, URL):**
```bash
gcloud run services describe seller-service --region=asia-south1 --format="yaml(status.latestReadyRevisionName,status.url)"
```

**Recent workflow runs:**
```bash
gh run list --repo app-hos-uk/GrandGold --limit 5
```

**View a specific run:**
```bash
gh run view 21823281083 --repo app-hos-uk/GrandGold
```

**Health check (example):**
```bash
curl -s -o /dev/null -w "%{http_code}" https://seller-service-484382472654.asia-south1.run.app/health
```

**Recent logs (example):**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=seller-service" \
  --limit 20 --format="table(timestamp,textPayload)" --freshness=1h
```

---

## 6. Summary

| Check | Result |
|-------|--------|
| GitHub Actions workflow | ✅ success (5m 26s) |
| All deploy jobs | ✅ completed |
| Cloud Run services | ✅ 13/13 Ready |
| Health checks (sampled) | ✅ 200 OK |
| Latest commit deployed | ✅ c7a3863 |

**Deployment is complete and healthy.** Email error handling, env var consistency, and password variable fixes are live on GCP Cloud Run.
