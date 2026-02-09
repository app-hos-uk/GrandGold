# Seller Onboarding Email - Quick Reference

## Feature Summary

✅ **Seller Onboarding Emails** - Automated email notifications at 5 critical stages of seller onboarding:

1. **Invitation Email** - When admin invites a seller
2. **Onboarding Started** - When seller starts the process
3. **Documents Uploaded** - When seller uploads required documents
4. **Approval Email** - When admin approves the seller
5. **Rejection Email** - When admin rejects the seller

---

## Current Implementation Status

### Email Flow
```
Seller Onboarding Event
        ↓
EmailService (seller-service)
        ↓
notification-service API
        ↓
Resend (Email Provider)
        ↓
📧 Seller's Inbox
```

### Files Implemented
- ✅ `services/seller-service/src/services/email.service.ts` (100 lines, 5 email templates)
- ✅ `services/seller-service/src/services/onboarding.service.ts` (updated with email triggers)
- ✅ `apps/web/src/app/api/admin/invite-seller/route.ts` (invitation email + HTML template)

### TypeScript Status
- ✅ Seller-service: No TS errors
- ✅ Web app: No TS errors

---

## How It Works

### Stage 1: Seller Invitation
```
Admin Dashboard
    ↓ (Invite Seller button)
Add Seller Modal Form
    ↓ (Fill form + Submit)
POST /api/admin/invite-seller
    ↓ (Create user in auth-service)
Send Email
    ↓
Seller receives invitation with:
- Temporary password
- Onboarding link
- Welcome message
```

### Stage 2: Onboarding Started
```
Seller clicks onboarding link
    ↓
POST /api/sellers/onboarding/start
    ↓
Send Email: "Onboarding Started"
    ↓
Seller sees all 4 steps
```

### Stage 3: Documents Uploaded
```
Seller uploads documents
    ↓
POST /api/sellers/onboarding/documents
    ↓
Send Email: "Documents Received"
    ↓
Confirm next step is bank details
```

### Stage 4: Approval
```
Admin reviews → Approves
    ↓
POST /api/sellers/onboarding/:id/approve
    ↓
Send Email: "🎉 Approved!"
    ↓
Seller gets seller dashboard link
```

### Stage 5: Rejection
```
Admin reviews → Rejects with reason
    ↓
POST /api/sellers/onboarding/:id/reject
    ↓
Send Email: "Why rejected + How to appeal"
    ↓
Seller can reapply
```

---

## Email Providers Supported

### Option 1: **Resend** ✅ (Currently Integrated)
- **Cost:** Free for first 3,000 emails/month
- **Status:** Connected to notification-service
- **Setup:** Need API key in GCP Secret Manager
- **Emails/month:** ~550 (under free tier)

### Option 2: **SendGrid** (Optional, Not Integrated)
- **Cost:** $29.95/month for 40K emails
- **Status:** Can be integrated via GCP Integration Connectors
- **Setup:** Need SendGrid account + API key

### Option 3: **Mailgun** (Optional, Not Integrated)
- **Cost:** Pay-as-you-go based on volume
- **Status:** Can be integrated directly
- **Setup:** Need Mailgun account + API key

### Option 4: **GCP Cloud Pub/Sub** (Optional, Event-Driven)
- **Cost:** ~$0.04 per million events
- **Status:** Not yet integrated (future enhancement)
- **Benefit:** Decoupled, scalable architecture

---

## Setup Instructions

### Step 1: Get Resend API Key
1. Go to https://resend.com
2. Sign up or log in
3. Click "API Keys" in left sidebar
4. Copy your API key (starts with `re_`)

### Step 2: Add to GCP Secret Manager
```bash
# Replace YOUR_API_KEY with actual key
echo -n 'YOUR_API_KEY' | gcloud secrets versions add resend-api-key --data-file=-
```

### Step 3: Update Cloud Run Services
For each service, set the environment variable:

**notification-service:**
```bash
gcloud run services update notification-service \
  --set-env-vars "RESEND_API_KEY=YOUR_API_KEY" \
  --region asia-south1
```

**seller-service:**
```bash
gcloud run services update seller-service \
  --set-env-vars "NOTIFICATION_SERVICE_URL=https://notification-service-xxx.run.app" \
  --region asia-south1
```

**web service:**
```bash
gcloud run services update web \
  --set-env-vars "NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=https://notification-service-xxx.run.app" \
  --region asia-south1
```

### Step 4: Test Email Sending
```bash
# Test invitation email
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

---

## Email Content Highlights

### 1. Invitation Email
- **Header:** Gold gradient with "Welcome to GrandGold Marketplace!"
- **Body:**
  - Personalized greeting
  - Login credentials (temporary password with security note)
  - 4-step onboarding overview
  - CTA button: "Start Onboarding"
  - Support contact info

### 2. Onboarding Started
- **Body:**
  - Confirmation message
  - All 4 steps described
  - Timeline expectation (24-48 hours)
  - Support contact

### 3. Documents Confirmed
- **Body:**
  - List of uploaded documents (✓ checkmarks)
  - Confirmation message
  - Next step: Bank details
  - Support contact

### 4. Approval Email
- **Header:** Green gradient with 🎉 emoji
- **Body:**
  - "Congratulations!" message
  - Seller dashboard link (CTA button)
  - Features available (Add Products, Orders, etc.)
  - Quick start guide
  - Commission structure info

### 5. Rejection Email
- **Header:** Yellow gradient
- **Body:**
  - Clear rejection reason
  - What went wrong (specific issues)
  - How to reapply instructions
  - Appeal process
  - Support contact for appeals

---

## Monitoring & Troubleshooting

### Check Email Logs
```bash
# View notification-service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=notification-service" \
  --limit 50 --format json | grep -i email

# View seller-service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=seller-service" \
  --limit 50 --format json | grep -i email
```

### Test Email Service Directly
```bash
# Call notification-service directly
curl -X POST http://localhost:4004/api/notifications/send/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "body": "<h1>Hello</h1>"
  }'
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Email not sending | Check RESEND_API_KEY in Secret Manager |
| 404 errors | Verify notification-service URL is correct |
| Timeout errors | Check notification-service is running |
| HTML not rendering | Check HTML template in email template functions |
| Emails in spam | Verify sender email is authorized in Resend |

---

## Architecture Decisions

### Why Resend?
- ✅ Already integrated in notification-service
- ✅ Free tier covers our volume
- ✅ Good reliability and documentation
- ✅ No additional infrastructure needed

### Why Send via notification-service?
- ✅ Centralizes email logic
- ✅ Reusable for other services
- ✅ Easy to swap providers later
- ✅ Consistent error handling

### Why Not Cloud Pub/Sub Yet?
- Event volume is low (~550 emails/month)
- Resend handles reliably
- Simpler architecture for now
- Can upgrade later if needed

---

## Future Enhancements

### Phase 2: Advanced Features
- [ ] Email templates stored in database
- [ ] Dynamic content personalization
- [ ] Resend webhook for delivery tracking
- [ ] Bounce handling and email validation
- [ ] Seller email preferences management

### Phase 3: Scalability
- [ ] Cloud Pub/Sub event pipeline
- [ ] Email queuing system
- [ ] Scheduled emails (reminders, follow-ups)
- [ ] Multi-provider failover
- [ ] Email analytics dashboard

### Phase 4: Compliance
- [ ] GDPR unsubscribe links
- [ ] Email preference center
- [ ] Audit logging for all emails
- [ ] Email encryption at rest
- [ ] Retention policies (90 days)

---

## Cost Breakdown

### Monthly Email Volume
```
Invitations:        200 emails
Onboarding starts:  150 emails
Documents:          100 emails
Approvals:           80 emails
Rejections:          20 emails
─────────────────────────────
Total:              550 emails/month
```

### Cost Analysis
- **Resend:** $0 (under 3,000 free emails)
- **Pub/Sub (if used):** ~$0.02
- **Notification-service:** Included in Cloud Run
- **Total:** **$0/month** (free tier)

---

## Support & Documentation

### Related Docs
- `docs/SELLER_ONBOARDING_GUIDE.md` - Full onboarding guide with all 8 email types
- `docs/SELLER_ONBOARDING_EMAIL_IMPLEMENTATION.md` - Implementation details
- `docs/DEV_TO_PRODUCTION_WORKFLOW.md` - Deployment guide

### Key Files
- Email service: `services/seller-service/src/services/email.service.ts`
- Onboarding logic: `services/seller-service/src/services/onboarding.service.ts`
- Invitation API: `apps/web/src/app/api/admin/invite-seller/route.ts`
- Notification API: `services/notification-service/src/routes/notification.ts`

### Testing Checklist
- [ ] Send invitation email via admin dashboard
- [ ] Start onboarding and receive "Onboarding Started" email
- [ ] Upload documents and receive confirmation
- [ ] Approve seller and check approval email
- [ ] Reject seller and check rejection email
- [ ] Verify all emails render correctly in Gmail, Outlook
- [ ] Check links in emails work
- [ ] Verify images load in emails

