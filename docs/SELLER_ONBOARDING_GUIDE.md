# Seller Onboarding Process & Email Integration Guide

## Table of Contents
1. [Current Seller Onboarding Flow](#current-seller-onboarding-flow)
2. [Email Sending Options](#email-sending-options)
3. [GCP Native Solutions](#gcp-native-solutions)
4. [Recommended Implementation](#recommended-implementation)
5. [Configuration & Setup](#configuration--setup)
6. [Integration Points](#integration-points)

---

## Current Seller Onboarding Flow

### Phase 1: Seller Invitation (Admin → Prospective Seller)
**Endpoint:** `POST /api/admin/invite-seller` (Next.js API route)

**Current Flow:**
1. Admin creates seller invitation via **Admin Dashboard** (`/admin/sellers`)
2. System creates user account via auth-service
3. Temporary password is generated
4. **Status:** Email NOT yet sent (currently returns message to UI only)

**Data Required:**
- Email (required)
- First Name, Last Name (required)
- Phone (required)
- Business Name (required)
- Country (IN/AE/UK)
- Temporary Password (optional - auto-generated)

**Response:**
```json
{
  "success": true,
  "message": "Seller invited successfully. They can login...",
  "data": {
    "email": "seller@example.com",
    "onboardingUrl": "/seller/onboarding",
    "tempPasswordProvided": false
  }
}
```

---

### Phase 2: Seller Onboarding Journey (Seller Self-Service)
**Endpoint:** `POST /api/sellers/onboarding/start` (seller-service)

**Multi-Step Process:**
1. **Step 1: Business Info** (`/api/sellers/onboarding/start`)
   - Business name, type (individual/company/partnership)
   - Registration number, Tax ID
   - Business address
   - Onboarding type: automated or manual

2. **Step 2: Document Upload** (`POST /api/sellers/onboarding/documents`)
   - Trade License (PDF/image)
   - VAT Certificate (PDF/image)
   - Gold Dealer Permit (PDF/image)

3. **Step 3: Bank Details** (`POST /api/sellers/onboarding/bank-details`)
   - Account name, number
   - Bank name, branch code
   - SWIFT code, IBAN

4. **Step 4: Sign Agreement** (`POST /api/sellers/onboarding/agreement/sign`)
   - DocuSign integration (mock)
   - Returns signing URL

5. **Submit for Review** (`POST /api/sellers/onboarding/submit`)
   - Validates all steps completed
   - Changes status to `in_review`

### Phase 3: Admin Review & Approval
**Endpoints:**
- `GET /api/sellers/onboarding/pending` (list pending onboardings)
- `POST /api/sellers/onboarding/:id/approve` (approve)
- `POST /api/sellers/onboarding/:id/reject` (reject with reason)

**Current Storage:** In-memory store (needs database migration for production)

---

## Email Sending Options

### Option 1: **Resend** (Current Implementation)
**Status:** ✅ Already integrated in notification-service

**Characteristics:**
- Third-party email service provider
- Good documentation and support
- Reliable delivery
- Pricing: Based on emails sent

**Current Implementation:**
```typescript
// services/notification-service/src/routes/notification.ts
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Send email
await resend.emails.send({
  from: 'GrandGold <noreply@grandgold.com>',
  to: payload.to,
  subject: payload.subject,
  html: payload.body,
});
```

**Setup:**
1. Create Resend account at https://resend.com
2. Get API key from https://resend.com/api-keys
3. Store in GCP Secret Manager:
   ```bash
   echo -n 're_xxx' | gcloud secrets versions add resend-api-key --data-file=-
   ```

**Costs:** $0.10 per 100 emails (varies by region)

---

### Option 2: **SendGrid** (Third-party)
**Status:** ❌ Not currently integrated

**Characteristics:**
- Enterprise-grade email service
- Advanced analytics and templates
- Reputation management
- Pricing: Flexible pricing tiers

**GCP Integration:**
GCP offers SendGrid Integration Connector through Application Integration.

**Setup:**
1. Create SendGrid account at https://sendgrid.com
2. Get API key
3. Use GCP Integration Connectors or direct API

**Implementation Example:**
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: 'seller@example.com',
  from: 'noreply@grandgold.com',
  subject: 'Seller Onboarding Started',
  html: emailTemplate,
});
```

---

### Option 3: **Mailgun** (Third-party)
**Status:** ❌ Not currently integrated

**Characteristics:**
- Developer-friendly
- Good email validation
- Powerful API
- Competitive pricing

**Setup:**
1. Create Mailgun account
2. Get API key
3. Configure SMTP or REST API

**Implementation Example:**
```typescript
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(FormData);
const client = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY });

await client.messages.create('sandbox.mailgun.org', {
  from: 'noreply@grandgold.com',
  to: 'seller@example.com',
  subject: 'Seller Onboarding Started',
  html: emailTemplate,
});
```

---

## GCP Native Solutions

### Option 4: **Cloud Pub/Sub + Application Integration** (GCP Native)
**Status:** ⚠️ Needs implementation

**Characteristics:**
- 100% GCP native solution
- Serverless event-driven architecture
- Built-in data transformation
- Usage-based pricing (~$0.04 per million requests)

**Architecture:**
```
Onboarding Service
    ↓ (publish event)
Cloud Pub/Sub Topic
    ↓ (trigger)
Application Integration
    ↓ (transform & send)
Email Provider (Resend/SendGrid)
```

**Flow:**
1. When seller onboarding status changes, publish message to Pub/Sub topic
2. Application Integration subscribes to topic
3. Transforms message (fetch seller details, render template)
4. Sends email via Resend/SendGrid API

**Benefits:**
- Decoupled architecture
- Scalable and reliable
- Event audit trail
- Retry mechanism built-in
- No additional external service dependency beyond email provider

**Implementation Steps:**
1. Enable APIs: `Cloud Pub/Sub API` and `Application Integration API`
2. Create Pub/Sub topic: `seller-onboarding-events`
3. Create Application Integration workflow
4. Configure topic subscriptions

---

### Option 5: **Cloud Tasks + Cloud Functions** (GCP Native Alternative)
**Status:** ⚠️ Alternative approach

**Characteristics:**
- Task queue approach
- Perfect for delayed/scheduled emails
- Better for rate-limited services

**Use Cases:**
- Send reminder emails at specific times
- Batch email processing
- Rate-limited delivery

---

### Option 6: **Firebase Email** (GCP Native)
**Status:** ❌ Not available (Firebase only supports Firestore)

---

## Recommended Implementation

### **Primary Recommendation: Resend + GCP Pub/Sub (Hybrid)**

**Why This Approach:**
1. ✅ Resend already integrated and working
2. ✅ Decoupled architecture with Pub/Sub
3. ✅ Scalable for future notifications
4. ✅ Minimal cost
5. ✅ Easy to implement

**Alternative (Budget-conscious): Just Resend**
- If real-time emails are acceptable
- Simpler architecture
- Fewer moving parts

**Enterprise Option: SendGrid + Pub/Sub**
- For advanced analytics needed
- Template management at provider level
- Better for large-scale operations

---

## Configuration & Setup

### Step 1: Enable Required APIs
```bash
gcloud services enable pubsub.googleapis.com
gcloud services enable workflowexecutions.googleapis.com
gcloud services enable integrations.googleapis.com
```

### Step 2: Create Pub/Sub Topic
```bash
gcloud pubsub topics create seller-onboarding-events \
  --message-retention-duration=7d
```

### Step 3: Create Subscription
```bash
gcloud pubsub subscriptions create seller-onboarding-sub \
  --topic=seller-onboarding-events \
  --push-endpoint=https://YOUR_NOTIFICATION_SERVICE_URL/api/notifications/webhooks/pubsub \
  --push-auth-service-account=YOUR_SERVICE_ACCOUNT@PROJECT.iam.gserviceaccount.com
```

### Step 4: Update Seller Onboarding Service

In `services/seller-service/src/services/onboarding.service.ts`:

```typescript
import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
});

async approveOnboarding(onboardingId: string, adminUserId: string) {
  // ... existing logic ...
  
  // Publish event
  const topic = pubsub.topic('seller-onboarding-events');
  await topic.publish(
    Buffer.from(
      JSON.stringify({
        eventType: 'seller.onboarding.approved',
        onboardingId,
        sellerId: onboarding.sellerId,
        email: onboarding.email,
        businessName: onboarding.businessName,
        timestamp: new Date().toISOString(),
      })
    )
  );
  
  return { sellerId: onboarding.sellerId };
}
```

### Step 5: Add Pub/Sub Handler to Notification Service

In `services/notification-service/src/routes/notification.ts`:

```typescript
router.post('/webhooks/pubsub', async (req: Request, res: Response) => {
  try {
    const envelope = req.body;
    const payload = Buffer.from(envelope.message.data, 'base64').toString('utf8');
    const event = JSON.parse(payload);

    switch (event.eventType) {
      case 'seller.onboarding.approved':
        await sendSellerApprovalEmail(event.email, event.businessName);
        break;
      case 'seller.onboarding.rejected':
        await sendSellerRejectionEmail(event.email, event.reason);
        break;
      // ... other events
    }

    // Acknowledge message
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## Integration Points

### 1. **Invitation Email** (Admin invites seller)
- **Trigger:** `POST /api/admin/invite-seller` → success
- **Recipients:** Seller email
- **Content:**
  - Login credentials (temp password)
  - Onboarding URL: `https://yourdomain.com/seller/onboarding?token={uuid}`
  - Welcome message
  - Support contact info

### 2. **Onboarding Started Email** (Seller begins process)
- **Trigger:** `POST /api/sellers/onboarding/start` → success
- **Recipients:** Seller email
- **Content:**
  - Confirmation of registration
  - Next steps overview
  - Expected timeline
  - Document checklist

### 3. **Document Upload Confirmation**
- **Trigger:** `POST /api/sellers/onboarding/documents` → success
- **Recipients:** Seller email
- **Content:**
  - Confirmation of documents received
  - List of uploaded documents
  - Next step (bank details)

### 4. **Bank Details Confirmation**
- **Trigger:** `POST /api/sellers/onboarding/bank-details` → success
- **Recipients:** Seller email
- **Content:**
  - Bank details received
  - Details summary (masked account number)
  - Next step (agreement signing)

### 5. **Agreement Signed Confirmation**
- **Trigger:** DocuSign callback or manual submission
- **Recipients:** Seller email
- **Content:**
  - Agreement receipt
  - Submission confirmation
  - Timeline for admin review

### 6. **Ready for Review Notification** (Admin)
- **Trigger:** `POST /api/sellers/onboarding/submit` → status = in_review
- **Recipients:** Admin email
- **Content:**
  - New seller application received
  - Seller details summary
  - Link to admin review dashboard
  - Required documents checklist

### 7. **Onboarding Approved Email** (Seller)
- **Trigger:** `POST /api/sellers/onboarding/:id/approve` → success
- **Recipients:** Seller email
- **Content:**
  - 🎉 Approval confirmation
  - Seller dashboard link
  - Quick start guide
  - Commission structure details
  - Support contact

### 8. **Onboarding Rejected Email** (Seller)
- **Trigger:** `POST /api/sellers/onboarding/:id/reject` → success
- **Recipients:** Seller email
- **Content:**
  - Rejection reason
  - What went wrong (specific issues)
  - How to reapply
  - Support contact for appeals

---

## Implementation Roadmap

### Phase 1: Quick Win (Week 1)
- [ ] Add email sending to existing Resend integration
- [ ] Implement emails for invitation and approval
- [ ] Test with QA team

### Phase 2: Pub/Sub Integration (Week 2-3)
- [ ] Set up Cloud Pub/Sub infrastructure
- [ ] Migrate email triggers to event-driven
- [ ] Implement all 8 email types

### Phase 3: Advanced Features (Week 4+)
- [ ] Email templates with dynamic content
- [ ] Scheduled reminder emails
- [ ] Email preference management
- [ ] Analytics and metrics

---

## Cost Analysis

### Resend Only
- Invitation: ~500/month × $0.001 = $0.50
- Status updates: ~5000/month × $0.001 = $5
- **Total:** ~$6/month (first 3000 free)

### Resend + Pub/Sub
- Pub/Sub: ~5000 messages × $0.04/million = $0.02
- Resend: Same as above
- **Total:** ~$6/month

### SendGrid
- Monthly plans start at $29.95 for 40K emails
- Better for scale (>100K emails/month)

---

## Security Considerations

1. **Email Validation**
   - Verify email addresses before sending
   - Bounce handling and cleanup

2. **Sensitive Data**
   - Never send passwords in plain text (only initial invitation)
   - Mask account numbers in confirmations
   - Use secure links with expiration

3. **Rate Limiting**
   - Prevent email flooding
   - Maximum 5 emails per seller per day
   - Exponential backoff for retries

4. **Audit Trail**
   - Log all emails sent
   - Store in Cloud Logging
   - Retain for 90 days

5. **Compliance**
   - Include unsubscribe options
   - Honor email preferences
   - GDPR compliant templates

---

## Next Steps

1. **Choose Implementation:** Decide between Resend-only vs Resend+Pub/Sub
2. **Get Resend API Key:** Add to GCP Secret Manager
3. **Implement Email Templates:** Create HTML templates for each email type
4. **Test Workflow:** Test each email trigger
5. **Deploy:** Roll out to staging, then production
6. **Monitor:** Track delivery rates and bounces

