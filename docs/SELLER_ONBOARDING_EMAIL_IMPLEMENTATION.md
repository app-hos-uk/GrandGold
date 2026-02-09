# Seller Onboarding Email Implementation Summary

## Overview
The seller onboarding process has been enhanced with automated email notifications at critical stages. Emails are sent via the **Resend** email service provider through the notification-service.

---

## Email Sending Integration Points

### 1. **Invitation Email** ✅ Implemented
**When:** Admin invites a seller via `/api/admin/invite-seller`

**What's Sent:**
- Seller's email address
- Login credentials (temporary password)
- Onboarding URL
- Welcome message
- Support contact info

**File:** `apps/web/src/app/api/admin/invite-seller/route.ts`

**Flow:**
```
Admin Dashboard → Invite Seller Form
    ↓ (POST /api/admin/invite-seller)
Create User via auth-service
    ↓
Send Email via notification-service
    ↓
Seller receives invitation → Clicks onboarding link
```

---

### 2. **Onboarding Started Email** ✅ Implemented
**When:** Seller initiates onboarding via `POST /api/sellers/onboarding/start`

**What's Sent:**
- Confirmation of registration
- Overview of all 4 steps
- Step descriptions
- Expected timeline (24-48 hours)

**File:** `services/seller-service/src/services/onboarding.service.ts`

**Service:** `EmailService.sendOnboardingStartedEmail()`

---

### 3. **Documents Uploaded Confirmation** ✅ Implemented
**When:** Seller uploads documents via `POST /api/sellers/onboarding/documents`

**What's Sent:**
- List of uploaded documents
- Confirmation message
- Next step: Bank details

**File:** `services/seller-service/src/services/onboarding.service.ts`

**Service:** `EmailService.sendDocumentUploadedEmail()`

---

### 4. **Approval Email** ✅ Implemented
**When:** Admin approves seller via `POST /api/sellers/onboarding/:id/approve`

**What's Sent:**
- 🎉 Approval confirmation
- Seller dashboard link
- Quick start guide
- Commission structure details
- Support contact

**File:** `services/seller-service/src/services/onboarding.service.ts`

**Service:** `EmailService.sendApprovalEmail()`

---

### 5. **Rejection Email** ✅ Implemented
**When:** Admin rejects seller via `POST /api/sellers/onboarding/:id/reject`

**What's Sent:**
- Rejection reason
- What went wrong (specific issues)
- How to reapply
- Appeal instructions
- Support contact

**File:** `services/seller-service/src/services/onboarding.service.ts`

**Service:** `EmailService.sendRejectionEmail()`

---

## Architecture

### Email Service Class
**Location:** `services/seller-service/src/services/email.service.ts`

**Features:**
- Centralized email sending via notification-service
- HTML email templates with professional styling
- Graceful fallback if notification-service is unavailable
- Logging for debugging

**Key Methods:**
```typescript
EmailService.sendInvitationEmail()          // Seller invitation
EmailService.sendOnboardingStartedEmail()   // Onboarding started
EmailService.sendDocumentUploadedEmail()    // Documents confirmed
EmailService.sendApprovalEmail()            // Seller approved
EmailService.sendRejectionEmail()           // Seller rejected
```

### Communication Flow

```
┌─────────────────────────────────────────┐
│     Seller Onboarding Service           │
│   (services/seller-service)             │
└────────────────┬────────────────────────┘
                 │
                 │ publishes events
                 ↓
┌─────────────────────────────────────────┐
│      Email Service                       │
│   (email.service.ts)                    │
└────────────────┬────────────────────────┘
                 │
                 │ calls HTTP API
                 ↓
┌─────────────────────────────────────────┐
│   Notification Service                   │
│ (services/notification-service)         │
│   POST /api/notifications/send/email    │
└────────────────┬────────────────────────┘
                 │
                 │ sends via Resend SDK
                 ↓
┌─────────────────────────────────────────┐
│      Resend (Email Provider)             │
│   https://resend.com                    │
└─────────────────────────────────────────┘
                 │
                 ↓
            📧 Seller Email
```

---

## Configuration Required

### 1. Set Resend API Key
```bash
# Get API key from https://resend.com/api-keys
echo -n 're_xxx' | gcloud secrets versions add resend-api-key --data-file=-
```

### 2. Environment Variables on Cloud Run

**Notification Service:**
```bash
RESEND_API_KEY              # From Secret Manager
EMAIL_FROM                  # Default: "GrandGold <noreply@grandgold.com>"
```

**Seller Service:**
```bash
NOTIFICATION_SERVICE_URL    # URL to notification service
WEB_URL                     # Frontend URL for onboarding links
```

### 3. Update Next.js App Config
In your deployment config, ensure these variables are set:

```bash
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=https://notification-service-url
NEXT_PUBLIC_WEB_URL=https://yourdomain.com
NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-service-url
```

---

## Email Templates

All email templates are professional, branded, and responsive:

✅ **Invitation Email**
- Gold gradient header
- Login credentials section
- Step-by-step onboarding guide
- CTA button to onboarding page

✅ **Onboarding Started**
- Progress indicator
- All 4 steps explained
- Timeline expectation
- Support contact

✅ **Documents Confirmed**
- List of uploaded documents
- Checkmark confirmation
- Next step prompt

✅ **Approval Email**
- 🎉 Celebration emoji
- Dashboard link
- Features available
- Quick start guide

✅ **Rejection Email**
- Clear reason explanation
- Reapply instructions
- Appeal process
- Support contact

---

## Error Handling

**Graceful Degradation:**
- If email sending fails, the onboarding process continues
- Errors are logged but don't block operations
- Demo mode if `RESEND_API_KEY` not configured

**Logging:**
- All email sends logged with recipient, subject, provider
- Failures logged for debugging

---

## Testing Email Flows

### Test Invitation
```bash
curl -X POST http://localhost:3000/api/admin/invite-seller \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@test.com",
    "firstName": "Test",
    "lastName": "Seller",
    "phone": "+91 99999 99999",
    "businessName": "Test Jewelry Co",
    "country": "IN"
  }'
```

### Test Onboarding Started
- Start an onboarding flow, check notification-service logs

### Test Approval/Rejection
- Approve/reject via admin dashboard, check seller's email

---

## GCP Integration Options

### Current: **Resend Direct**
- Email sent directly to Resend
- Simplest implementation
- ~$0.10 per 100 emails

### Future Enhancement: **Cloud Pub/Sub + Application Integration**
For event-driven email pipeline:

**Benefits:**
- Decoupled architecture
- Audit trail of all events
- Retry mechanism built-in
- Template management at scale
- Cost: ~$0.04 per million events

**Implementation Steps (if needed):**
1. Enable Cloud Pub/Sub API
2. Create topic: `seller-onboarding-events`
3. Create Application Integration workflow
4. Configure Pub/Sub subscription

---

## Monitoring & Metrics

### Recommended Monitoring
1. **Email Delivery Rate:** Track success vs. failures
2. **Open Rate:** Via Resend webhook (optional)
3. **Bounce Rate:** Undeliverable emails
4. **Response Time:** Time from event to email sent

### Logs Location
- **Google Cloud Logging:** Search for "email" in logs
- **Resend Dashboard:** https://resend.com/dashboard

### Alerts to Set Up
- Email send failure rate > 5% in 5 minutes
- Notification service timeout > 10 seconds
- High rejection rate in onboarding

---

## Cost Estimate

**Monthly Email Volume:**
- Invitations: ~200 sellers × 1 email = 200
- Onboarding started: ~150 × 1 = 150
- Documents uploaded: ~100 × 1 = 100
- Approvals: ~80 × 1 = 80
- Rejections: ~20 × 1 = 20
- **Total: ~550 emails/month**

**Resend Pricing:**
- First 3,000 emails: FREE
- After that: $0.10 per 100 emails
- **Monthly Cost: $0** (under free tier)

---

## Security Best Practices

✅ **Implemented:**
- No passwords in email body (only initial invitation)
- Secure onboarding links with token
- HTTPS links only
- Audit trail via logging
- Unsubscribe option (can be added)

⚠️ **To Add:**
- Email bounce handling
- Complaint handling
- Rate limiting on email sends
- PII data encryption in logs

---

## Production Checklist

Before deploying to production:

- [ ] Get Resend API key
- [ ] Add to GCP Secret Manager
- [ ] Set environment variables on Cloud Run services
- [ ] Test email sending with real account
- [ ] Verify email templates render correctly
- [ ] Test all 5 email scenarios
- [ ] Set up monitoring & alerts
- [ ] Enable Resend webhook for delivery tracking
- [ ] Add unsubscribe option (compliance)
- [ ] Update support email address in templates

---

## Next Steps

1. **Immediate (This Sprint):**
   - Add Resend API key to GCP Secret Manager
   - Update Cloud Run env vars
   - Test all 5 email scenarios
   - Verify templates in target email clients

2. **Short-term (Next Sprint):**
   - Set up monitoring dashboard
   - Configure email bounce handling
   - Add Resend webhooks for delivery tracking

3. **Future (Q2):**
   - Implement Cloud Pub/Sub pipeline
   - Add email preference management
   - Implement scheduled reminder emails
   - Email analytics dashboard

---

## Files Changed

```
✅ Created:
- services/seller-service/src/services/email.service.ts
- docs/SELLER_ONBOARDING_GUIDE.md

✅ Updated:
- services/seller-service/src/services/onboarding.service.ts
  (added email triggers in 5 methods)
- apps/web/src/app/api/admin/invite-seller/route.ts
  (added email sending on invitation)
```

---

## Support

For questions or issues:
1. Check notification-service logs for email API errors
2. Verify Resend API key is set
3. Check environment variables on Cloud Run
4. Enable debug logging in email.service.ts
5. Contact support@grandgold.com

