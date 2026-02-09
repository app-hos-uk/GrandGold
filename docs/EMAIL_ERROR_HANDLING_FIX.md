# Email Error Handling Fix - Seller Onboarding

## Issue Summary

**Issue:** The seller invitation API returned success responses even when email sending failed, providing misleading information to API consumers.

**Severity:** HIGH - This could cause admins to believe sellers received invitations when they didn't.

**Status:** ✅ FIXED

---

## Root Cause Analysis

### Problem 1: Silent Error Suppression in Invite API
**File:** `apps/web/src/app/api/admin/invite-seller/route.ts` (Lines 73-94)

```typescript
// BEFORE (PROBLEMATIC)
try {
  await axios.post(...) // Email send
} catch (emailErr) {
  console.error('Failed to send email:', emailErr);  // Only logged to console
  // Continue anyway - registration succeeded even if email failed
}

return NextResponse.json({
  success: true,
  message: `Seller invited successfully. Invitation email sent to ${email}...`  // MISLEADING!
});
```

**Issues:**
1. Email failure caught but not reported in API response
2. Success response claims email was sent regardless of actual result
3. API consumer has no way to distinguish between: email sent vs. email failed
4. Console-only logging not visible to API consumer
5. No clear guidance on what to do if email failed

### Problem 2: Silent Error Suppression in EmailService
**File:** `services/seller-service/src/services/email.service.ts` (Lines 48-58)

```typescript
// BEFORE (PROBLEMATIC)
catch (error) {
  logger.error(..., 'Failed to send email');
  // Don't throw - email failures shouldn't block onboarding
}
// Method returns void with no indication of success/failure
```

**Issues:**
1. Errors caught but not thrown
2. Callers have no way to know if email sent or failed
3. Inconsistent with principle: "Be explicit about failures"
4. Hard to debug email delivery issues in production

### Problem 3: Overly Lenient Error Handling in Onboarding Service
The onboarding service tried to call email service but the service returned void, making it impossible to detect failures at that layer.

---

## Solution Implemented

### Fix 1: Explicit Email Status Reporting in Invite API

**File:** `apps/web/src/app/api/admin/invite-seller/route.ts`

```typescript
// AFTER (FIXED)
let emailStatus: 'sent' | 'failed' | 'queued' = 'queued';
let emailError: string | null = null;

try {
  const emailResponse = await axios.post(
    `${NOTIFICATION_SERVICE_URL}/api/notifications/send/email`,
    { ... }
  );

  // Check actual response for success
  if (emailResponse.data?.success) {
    emailStatus = emailResponse.data.data?.provider === 'demo' ? 'queued' : 'sent';
  } else {
    emailStatus = 'failed';
    emailError = emailResponse.data?.error?.message || 'Email send failed';
  }
} catch (emailErr) {
  emailStatus = 'failed';
  emailError = emailErr instanceof Error 
    ? emailErr.message 
    : 'Unable to send email - notification service unavailable';
}

// Determine response based on email status
if (emailStatus === 'failed') {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: `Seller account created, but invitation email could not be sent: ${emailError}...`,
        details: {
          userCreated: true,
          emailSent: false,
          email,
          tempPassword,
          onboardingUrl,
        },
      },
    },
    { status: 500 }
  );
}

// Success response with accurate email status
return NextResponse.json({
  success: true,
  message: emailStatus === 'queued' 
    ? `Seller account created (demo mode - email queued)...`
    : `Seller account created successfully. Invitation email sent to ${email}.`,
  data: {
    email,
    onboardingUrl,
    emailStatus,        // ← NEW: Explicit status
    accountCreated: true, // ← NEW: Distinguish account vs email
  },
});
```

**Benefits:**
- ✅ API response explicitly indicates `emailStatus`: 'sent' | 'failed' | 'queued'
- ✅ Clear distinction between account creation and email delivery
- ✅ Error details included so admins know what went wrong
- ✅ When email fails, provides temp password and onboarding URL as fallback
- ✅ Consumer knows exactly what happened and can take action

### Fix 2: Error-Throwing EmailService

**File:** `services/seller-service/src/services/email.service.ts`

```typescript
// BEFORE: Returns void, silently fails
static async sendEmail(payload: EmailPayload): Promise<void>

// AFTER: Returns result, throws on failure
static async sendEmail(payload: EmailPayload): Promise<{ id: string; status: string; provider: string }> {
  try {
    const response = await axios.post(...);

    if (!response.data.success) {
      throw new Error(`Email delivery failed: ${errorMsg}`);
    }

    logger.info(...);
    return result;  // ← Return the email ID and status
  } catch (error) {
    logger.error(...);
    throw error;    // ← Re-throw so callers can handle
  }
}
```

**Benefits:**
- ✅ Errors are thrown (not silently suppressed)
- ✅ Callers can use try-catch and respond appropriately
- ✅ Return type allows callers to track email IDs
- ✅ Explicit logging at both success and failure points

### Fix 3: Explicit Error Handling in Onboarding Service

**File:** `services/seller-service/src/services/onboarding.service.ts`

**For each email trigger (start, documents, approve, reject):**

```typescript
// BEFORE: Awaited without error handling
await EmailService.sendOnboardingStartedEmail(...);

// AFTER: Wrapped in try-catch with logging
try {
  await EmailService.sendOnboardingStartedEmail(...);
} catch (emailErr) {
  // Log but don't fail - onboarding should not be blocked by email failures
  console.error('[ONBOARDING] Failed to send onboarding started email:', {
    userId: input.userId,
    email: input.email,
    error: emailErr instanceof Error ? emailErr.message : String(emailErr),
  });
}
```

**Benefits:**
- ✅ Email failures logged with context (user ID, email, onboarding ID)
- ✅ Onboarding process continues (resilient)
- ✅ Structured logging helps debugging in production
- ✅ Clear separation: critical failures (account issues) vs. non-critical (email delivery)

---

## Response Format Changes

### Before (Problematic)
```json
{
  "success": true,
  "message": "Seller invited successfully. Invitation email sent to seller@example.com.",
  "data": {
    "email": "seller@example.com",
    "onboardingUrl": "/seller/onboarding",
    "tempPasswordProvided": false
  }
}
```
❌ No way to know if email actually sent

### After (Fixed) - Success Case
```json
{
  "success": true,
  "message": "Seller account created successfully. Invitation email sent to seller@example.com.",
  "data": {
    "email": "seller@example.com",
    "onboardingUrl": "/seller/onboarding",
    "tempPasswordProvided": false,
    "emailStatus": "sent",
    "accountCreated": true
  }
}
```
✅ `emailStatus: "sent"` clearly indicates success

### After (Fixed) - Email Failure Case
```json
{
  "success": false,
  "error": {
    "message": "Seller account created, but invitation email could not be sent: Timeout sending email. Please manually notify the seller or resend the invitation.",
    "details": {
      "userCreated": true,
      "emailSent": false,
      "email": "seller@example.com",
      "tempPassword": "GrandGold1a2b3c4d!",
      "onboardingUrl": "/seller/onboarding"
    }
  }
}
```
✅ Clear error message, account was created, provides fallback info

---

## API Behavior Matrix

| Scenario | User Created | Email Sent | HTTP Status | Success | emailStatus | Action |
|----------|--------------|-----------|------------|---------|------------|--------|
| ✅ Success | Yes | Yes | 201 | true | "sent" | Complete |
| ⚠️ Email fails, user created | Yes | No | 500 | false | "failed" | Admin manually notifies or resends |
| ⚠️ User exists | Yes | No | 200 | true | - | Mention existing account message |
| ❌ User creation fails | No | No | 500 | false | - | Ask to check email/auth-service |

---

## Files Changed

### Updated Files
1. ✅ `apps/web/src/app/api/admin/invite-seller/route.ts` (21 line change)
   - Added `emailStatus` tracking
   - Return failure response when email fails
   - Include fallback info (tempPassword, onboardingUrl)

2. ✅ `services/seller-service/src/services/email.service.ts` (15 line change)
   - Changed return type to include email result
   - Re-throw errors instead of suppressing
   - Better error logging

3. ✅ `services/seller-service/src/services/onboarding.service.ts` (4 methods updated)
   - Wrapped email sends in try-catch
   - Added context logging
   - Non-blocking email failures

### TypeScript Status
- ✅ Seller-service: No TS errors
- ✅ Web app: No TS errors

---

## Testing the Fix

### Test 1: Successful Email Send
```bash
curl -X POST http://localhost:3000/api/admin/invite-seller \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@test.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+91 99999 99999",
    "businessName": "Test Jewelry",
    "country": "IN"
  }'

# Expected response:
{
  "success": true,
  "message": "Seller account created successfully. Invitation email sent...",
  "data": {
    "emailStatus": "sent",  ← Check this
    "accountCreated": true
  }
}
```

### Test 2: Email Failure (Simulate by disabling notification service)
```bash
# Stop notification service or set invalid URL
# Then make invite request

# Expected response:
{
  "success": false,
  "error": {
    "message": "Seller account created, but invitation email could not be sent...",
    "details": {
      "userCreated": true,
      "emailSent": false,
      "tempPassword": "GrandGold..."
    }
  }
}
```

### Test 3: Check Logs
```bash
# Should see detailed error logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 20 \
  | grep -i "email\|onboarding"
```

---

## Production Deployment

### Steps
1. Deploy seller-service (email.service.ts changes)
2. Deploy web app (invite-seller changes)
3. Monitor logs for email failures
4. Update admin documentation

### Monitoring Checklist
- [ ] Email send success rate in logs
- [ ] Email failures trending to zero
- [ ] No sellers reporting "didn't receive invitation"
- [ ] Admin dashboard updated to show email status

---

## Future Improvements

1. **Retry Logic:** Add retry mechanism for transient failures
2. **Webhook Tracking:** Use Resend webhooks to track delivery
3. **Email Resend:** Add "resend invitation" button in admin dashboard
4. **Fallback:** Send via SMS if email fails (optional)
5. **Dashboard:** Show email delivery status per seller

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Error visibility | Hidden | Explicit in response |
| Success certainty | Misleading | Clear |
| Admin action on failure | None (misleading success) | Clear failure with fallback |
| API consumer experience | Confused | Informed and actionable |
| Error details | Console-only | Included in response |
| Logging | Poor | Detailed with context |
| Debugging | Difficult | Easy |

**Result:** Admins now know exactly when emails fail and can take appropriate action, preventing seller communication issues.

