# Environment Variable Fix - Summary

## Issues Fixed

### Issue 1: Seller Service - Approval Email URL
**File:** `services/seller-service/src/services/onboarding.service.ts` (Line 371)

**Before:**
```typescript
const dashboardUrl = `${process.env.WEB_URL || 'http://localhost:3000'}/seller`;
```

**After:**
```typescript
const dashboardUrl = `${process.env.NEXT_PUBLIC_WEB_URL || process.env.WEB_URL || 'http://localhost:3000'}/seller`;
```

**Impact:** Approval emails will now use the correct configured domain instead of localhost.

---

### Issue 2: Order Service - Notification URLs
**File:** `services/order-service/src/lib/notifications.ts` (Line 8)

**Before:**
```typescript
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
```

**After:**
```typescript
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || process.env.WEB_URL || 'http://localhost:3000';
```

**Impact:** Order notifications (abandoned cart, etc.) will now use the correct configured domain.

---

### Issue 3: Auth Service - OAuth Redirects (3 locations)
**File:** `services/auth-service/src/routes/oauth.ts` (Lines 109, 167, 216)

**Before:**
```typescript
const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
```

**After:**
```typescript
const redirectUrl = new URL(process.env.NEXT_PUBLIC_WEB_URL || process.env.FRONTEND_URL || 'http://localhost:3000');
```

**Impact:** OAuth callback redirects (Google, Facebook) will now use the correct configured domain.

---

## Root Cause

The application had an environment variable naming inconsistency:
- **Next.js web app** used `NEXT_PUBLIC_WEB_URL` (prefixed for client access)
- **Backend services** used unprefixed variables (`WEB_URL`, `FRONTEND_URL`)

When only `NEXT_PUBLIC_WEB_URL` was configured in deployment, backend services would fall back to localhost, causing broken links in emails and OAuth redirects.

---

## Configuration Hierarchy

All fixed locations now follow this precedence:

```
1. NEXT_PUBLIC_WEB_URL      ← Primary (configured for web app)
   ↓ (if not set)
2. WEB_URL / FRONTEND_URL    ← Secondary (for services if needed)
   ↓ (if not set)
3. http://localhost:3000     ← Default (local development)
```

---

## Benefits

| Scenario | Before | After |
|----------|--------|-------|
| Local dev | ✅ Works (localhost) | ✅ Works (localhost) |
| NEXT_PUBLIC_WEB_URL set | ❌ Broken links (localhost) | ✅ Correct links |
| Both variables set | ✅ Works | ✅ Works (priority clear) |

---

## Deployment

### Set Environment Variable
```bash
# Single configuration for entire deployment
gcloud run services update seller-service \
  --set-env-vars "NEXT_PUBLIC_WEB_URL=https://yourdomain.com" \
  --region asia-south1

gcloud run services update order-service \
  --set-env-vars "NEXT_PUBLIC_WEB_URL=https://yourdomain.com" \
  --region asia-south1

gcloud run services update auth-service \
  --set-env-vars "NEXT_PUBLIC_WEB_URL=https://yourdomain.com" \
  --region asia-south1
```

Or in GitHub Actions:
```yaml
env:
  NEXT_PUBLIC_WEB_URL: ${{ secrets.PRODUCTION_WEB_URL || 'https://yourdomain.com' }}
```

---

## Testing

### Test Email Links
1. Invite seller via admin dashboard
2. Approve seller onboarding
3. Check approval email - dashboard link should have correct domain ✅

### Test OAuth
1. Click "Login with Google" or "Login with Facebook"
2. After authentication, redirect URL should point to correct domain ✅

---

## Files Changed

- ✅ `services/seller-service/src/services/onboarding.service.ts`
- ✅ `services/order-service/src/lib/notifications.ts`
- ✅ `services/auth-service/src/routes/oauth.ts`

**TypeScript Status:** ✅ All services compile without errors

---

## Backward Compatibility

✅ **Fully backward compatible** - Still checks `WEB_URL` and `FRONTEND_URL` as fallbacks, so existing deployments continue to work.

