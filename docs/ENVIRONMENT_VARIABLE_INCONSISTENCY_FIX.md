# Environment Variable Inconsistency - WEB_URL Configuration Issue

## Issue Summary

**Issue:** The seller onboarding service uses `process.env.WEB_URL` while the Next.js web app uses `process.env.NEXT_PUBLIC_WEB_URL`. When `NEXT_PUBLIC_WEB_URL` is configured in deployment, approval emails will fall back to `http://localhost:3000` instead of using the configured domain.

**Severity:** HIGH - Approval emails will contain broken localhost links in production.

**Impact:** 
- Sellers receive approval emails with dashboard links pointing to localhost
- Links are non-functional in production
- Inconsistent URL configuration across services
- Sellers cannot access seller dashboard from approval email

**Status:** ✅ FIXED

---

## Root Cause Analysis

### The Problem

**Web App (Next.js)** - Uses `NEXT_PUBLIC_*` prefix:
```typescript
// apps/web/src/app/api/admin/invite-seller/route.ts (Line 6)
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
```

**Seller Service (Backend)** - Uses unprefixed environment variable:
```typescript
// services/seller-service/src/services/onboarding.service.ts (Line 371)
const dashboardUrl = `${process.env.WEB_URL || 'http://localhost:3000'}/seller`;
```

### Why This Matters

In Next.js, environment variables are scoped:
- **`NEXT_PUBLIC_*`** - Available to browser and server (frontend accessible)
- **Regular variables** - Server-only, not accessible to frontend

The web app correctly uses `NEXT_PUBLIC_WEB_URL` for frontend-accessible URLs.

The seller-service (a backend service) should use the non-prefixed version **IF** it's configured, but currently uses `WEB_URL` which may not be set if only `NEXT_PUBLIC_WEB_URL` is configured.

### Why This Breaks

**Deployment scenario:**
```bash
# In GitHub Actions or Cloud Run
NEXT_PUBLIC_WEB_URL=https://yourdomain.com  # Set for web app
WEB_URL=???  # NOT set for seller-service (different process)
```

**Result:**
- Invitation email (web app): Uses `https://yourdomain.com/seller/onboarding` ✅
- Approval email (seller-service): Uses `http://localhost:3000/seller` ❌

---

## Additional Issues Found

While investigating, I also found similar inconsistencies:

1. **Order Service** - Uses unprefixed `WEB_URL`:
   ```typescript
   // services/order-service/src/lib/notifications.ts (Line 8)
   const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
   ```

2. **Auth Service** - Uses different variable name `FRONTEND_URL`:
   ```typescript
   // services/auth-service/src/routes/oauth.ts
   const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
   ```

**Inconsistency:** Three different variable names for the same thing:
- `NEXT_PUBLIC_WEB_URL` (web app)
- `WEB_URL` (seller-service, order-service)
- `FRONTEND_URL` (auth-service)

---

## Solution Implemented

### Fix 1: Update Seller Service Environment Variable

**File:** `services/seller-service/src/services/onboarding.service.ts`

Change from:
```typescript
const dashboardUrl = `${process.env.WEB_URL || 'http://localhost:3000'}/seller`;
```

To:
```typescript
const dashboardUrl = `${process.env.NEXT_PUBLIC_WEB_URL || process.env.WEB_URL || 'http://localhost:3000'}/seller`;
```

**Rationale:**
- Try `NEXT_PUBLIC_WEB_URL` first (web app's configuration)
- Fall back to `WEB_URL` (if explicitly set for services)
- Fall back to localhost (for local development)

### Fix 2: Update Order Service Environment Variable

**File:** `services/order-service/src/lib/notifications.ts`

Change from:
```typescript
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
```

To:
```typescript
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || process.env.WEB_URL || 'http://localhost:3000';
```

### Fix 3: Update Auth Service Environment Variable

**File:** `services/auth-service/src/routes/oauth.ts`

Change from:
```typescript
const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
```

To:
```typescript
const redirectUrl = new URL(
  process.env.NEXT_PUBLIC_WEB_URL || 
  process.env.FRONTEND_URL || 
  'http://localhost:3000'
);
```

---

## Environment Variable Hierarchy

The fix implements this precedence order:

```
1. NEXT_PUBLIC_WEB_URL      (Primary - set by deployment for web app)
   ↓ (if not set)
2. WEB_URL / FRONTEND_URL    (Secondary - if explicitly set for services)
   ↓ (if not set)
3. http://localhost:3000     (Fallback - for local development)
```

---

## Deployment Configuration

### Recommended: Single Configuration Variable

Set in GitHub Actions / Cloud Run configuration:
```bash
# Set once for entire deployment
NEXT_PUBLIC_WEB_URL=https://yourdomain.com

# All services will automatically pick it up
```

### Or: Multiple Variables (If Needed)

```bash
# For web app
NEXT_PUBLIC_WEB_URL=https://yourdomain.com

# For backend services (if different)
WEB_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com  # For auth-service
```

---

## How to Deploy the Fix

### Step 1: Update Environment Variables in Cloud Run

For each service, set the web URL:

```bash
# Seller service
gcloud run services update seller-service \
  --set-env-vars "NEXT_PUBLIC_WEB_URL=https://yourdomain.com" \
  --region asia-south1

# Order service
gcloud run services update order-service \
  --set-env-vars "NEXT_PUBLIC_WEB_URL=https://yourdomain.com" \
  --region asia-south1

# Auth service
gcloud run services update auth-service \
  --set-env-vars "NEXT_PUBLIC_WEB_URL=https://yourdomain.com" \
  --region asia-south1
```

### Step 2: Update GitHub Actions Workflow

In `.github/workflows/deploy-gcp.yml`:

```yaml
- name: Deploy services
  env:
    NEXT_PUBLIC_WEB_URL: ${{ secrets.PRODUCTION_WEB_URL || 'https://web-${PN}.${REGION}.run.app' }}
```

### Step 3: Test Email Links

After deployment:

1. Invite a seller via admin dashboard
2. Approve the seller onboarding
3. Check the approval email
4. Verify the dashboard link points to the correct domain

---

## Files Changed

### Updated Files
1. ✅ `services/seller-service/src/services/onboarding.service.ts` (Line 371)
   - Updated `dashboardUrl` to check `NEXT_PUBLIC_WEB_URL` first

2. ✅ `services/order-service/src/lib/notifications.ts` (Line 8)
   - Updated `WEB_URL` to check `NEXT_PUBLIC_WEB_URL` first

3. ✅ `services/auth-service/src/routes/oauth.ts` (Lines 109, 167, 216)
   - Updated `redirectUrl` to check `NEXT_PUBLIC_WEB_URL` first

### TypeScript Status
- ✅ All services: No TS errors

---

## Testing the Fix

### Test 1: Local Development
```bash
# With no env vars set, should use localhost
NEXT_PUBLIC_WEB_URL= WEB_URL= pnpm dev

# Emails should contain http://localhost:3000/seller
```

### Test 2: Staging Deployment
```bash
# Set NEXT_PUBLIC_WEB_URL only
export NEXT_PUBLIC_WEB_URL=https://staging.yourdomain.com

# Deploy services
gcloud run services update seller-service \
  --set-env-vars "NEXT_PUBLIC_WEB_URL=https://staging.yourdomain.com"

# Test: Approval email should have https://staging.yourdomain.com/seller
```

### Test 3: Production Deployment
```bash
# Set NEXT_PUBLIC_WEB_URL
export NEXT_PUBLIC_WEB_URL=https://yourdomain.com

# Deploy all services
# Test: All emails should have correct domain
```

### Test Script

```bash
# Function to test URL configuration
test_web_url() {
  local service=$1
  local expected_url=$2
  
  echo "Testing $service..."
  gcloud run services describe $service --region asia-south1 \
    --format='value(spec.template.spec.containers[0].env[?name==NEXT_PUBLIC_WEB_URL].value)' \
    | grep -q "$expected_url" && echo "✅ Correct" || echo "❌ Incorrect"
}

test_web_url "seller-service" "yourdomain.com"
test_web_url "order-service" "yourdomain.com"
test_web_url "auth-service" "yourdomain.com"
```

---

## Comparison: Before vs After

| Scenario | Before | After |
|----------|--------|-------|
| Local dev (no env vars) | `http://localhost:3000` ✅ | `http://localhost:3000` ✅ |
| NEXT_PUBLIC_WEB_URL set | Invitation: correct domain ✅ <br> Approval: localhost ❌ | Invitation: correct domain ✅ <br> Approval: correct domain ✅ |
| Both NEXT_PUBLIC_WEB_URL and WEB_URL set | NEXT_PUBLIC_WEB_URL wins | NEXT_PUBLIC_WEB_URL wins (consistent) ✅ |

---

## Production Checklist

Before deploying to production:

- [ ] Update all services with NEXT_PUBLIC_WEB_URL
- [ ] Test invitation email links
- [ ] Test approval email links
- [ ] Test rejection email links
- [ ] Test OAuth redirect URLs (auth-service)
- [ ] Verify no localhost links in production emails
- [ ] Monitor logs for URL mismatches

---

## Related Issues

This fix also addresses potential issues with:

1. **OAuth Redirects** - Auth service OAuth callbacks now use correct domain
2. **Notification Links** - Order service notification links use correct domain
3. **Email Consistency** - All emails across services use same domain

---

## Future Improvements

1. **Centralized Configuration:** Create a config service that all services reference
2. **Environment Variable Validation:** Validate URLs on startup
3. **Dashboard:** Display configured URLs in admin dashboard
4. **Monitoring:** Alert if localhost URLs detected in production

---

## Summary

| Aspect | Status |
|--------|--------|
| Issue verified | ✅ Confirmed |
| Root cause identified | ✅ Variable name inconsistency |
| Fix implemented | ✅ All 3 services updated |
| TypeScript errors | ✅ None |
| Backward compatible | ✅ Yes (still checks WEB_URL) |
| Deployment ready | ✅ Yes |

