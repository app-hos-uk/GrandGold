# GrandGold Enterprise Marketplace Platform
## Implementation Plan v2.0

**Vision:** "Bloomberg of Gold Retail" - A multi-national, regulated commerce engine merging luxury jewelry retail with fintech trading platform.

**Overview:** Enterprise-grade multi-tenant marketplace with microservices architecture, real-time metal pricing, regulatory compliance (KYC/AML), WebAR virtual try-on, automated cross-border logistics, and comprehensive third-party integrations. Supports India, UAE, and UK operations with country-specific compliance and taxation.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Core Features](#core-features)
4. [GCP Deployment Strategy](#gcp-deployment-strategy)
5. [Development Phases](#development-phases)
6. [Security & Compliance](#security--compliance)
7. [Cost Estimates](#cost-estimates)
8. [Next Steps](#next-steps)

---

## Architecture Overview

### GCP Cloud Run Microservices Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         Cloud Load Balancer + Cloud CDN + Cloud Armor       │
│              Country Routing: /in, /ae, /uk                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐  ┌─────────▼─────────┐  ┌─────▼──────┐
│   Auth       │  │   User Service    │  │  Product   │
│   Service    │  │   (Multi-tenant)  │  │  Service   │
└──────────────┘  └───────────────────┘  └────────────┘
        │                   │                   │
┌───────▼──────┐  ┌─────────▼─────────┐  ┌─────▼──────┐
│   Order      │  │   Payment         │  │  Inventory │
│   Service    │  │   Service         │  │  Service   │
└──────────────┘  └───────────────────┘  └────────────┘
        │                   │                   │
┌───────▼──────┐  ┌─────────▼─────────┐  ┌─────▼──────┐
│   Shipping   │  │   Notification    │  │  Analytics │
│   Service    │  │   Service         │  │  Service   │
└──────────────┘  └───────────────────┘  └────────────┘
        │                   │                   │
┌───────▼──────┐  ┌─────────▼─────────┐  ┌─────▼──────┐
│   Admin      │  │   Integration     │  │  AR/VR     │
│   Service    │  │   Service         │  │  Service   │
└──────────────┘  └───────────────────┘  └────────────┘
        │                   │                   │
┌───────▼──────┐  ┌─────────▼─────────┐  ┌─────▼──────┐
│   Influencer │  │   AI/ML           │  │  Tax       │
│   Service    │  │   Service         │  │  Service   │
└──────────────┘  └───────────────────┘  └────────────┘
        │                   │                   │
┌───────▼──────┐  ┌─────────▼─────────┐  ┌─────▼──────┐
│   Fintech   │  │   Regulatory      │  │  Price     │
│   & Bullion │  │   Compliance      │  │  Lock      │
│   Service   │  │   Service         │  │  Service   │
└──────────────┘  └───────────────────┘  └────────────┘
        │                   │                   │
┌───────▼──────┐  ┌─────────▼─────────┐  ┌─────▼──────┐
│   Video      │  │   Visual Search   │  │  Document │
│   Service    │  │   Service          │  │  Verify   │
│   (WebRTC)   │  │   (AI/ML)          │  │  Service  │
└──────────────┘  └───────────────────┘  └────────────┘
        │                   │                   │
┌───────▼──────┐  ┌─────────▼─────────┐  ┌─────▼──────┐
│   Geofence   │  │   Finance Ledger  │  │  Logistics│
│   Service    │  │   Service         │  │  Auto     │
│              │  │   (Double-entry) │  │  Service  │
└──────────────┘  └───────────────────┘  └────────────┘
```

---

## Technology Stack

### Backend Framework
- **Node.js with TypeScript (NestJS)** for microservices
  - Enterprise-grade, excellent for microservices
  - Strong TypeScript support
  - Built-in dependency injection
- **Alternative:** Go (Golang) for high-performance services, Python (FastAPI) for AI/ML services

### Frontend Framework
- **Next.js 14+ (App Router)** with TypeScript + PWA
  - Server-side rendering, excellent SEO
  - API routes, middleware for country routing
  - Progressive Web Application with service workers
- **UI Library:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand or Redux Toolkit
- **Real-time:** WebSocket client for live pricing feeds

### Database Strategy (GCP Managed)

| Component | GCP Service | Configuration |
|-----------|-------------|---------------|
| **Primary Database** | Cloud SQL (PostgreSQL 15) | PostGIS extension, schema-per-tenant, auto-backups, HA failover |
| **Cache/Sessions** | Memorystore (Redis 7.0) | Standard tier, sessions, rate limiting, price locks |
| **Search Engine** | Meilisearch | Cloud or self-hosted on Cloud Run (simple, fast, typo-tolerant) |
| **Time-series** | Cloud SQL + TimescaleDB or BigQuery | Live metal pricing history, analytics |
| **File Storage** | Cloud Storage | 3D models (GLB), KYC documents, product images |

### Message Queue
- **Pub/Sub** (GCP native) or RabbitMQ for async processing and event-driven architecture

### Container Platform
- **Docker + GCP Cloud Run** (serverless containers)
  - Zero server management
  - Auto-scaling from 0 to 1000+ instances
  - Pay only for active requests

### Deployment Platform: Google Cloud Platform (GCP)

**GCP Regions:**
- `asia-south1` (Mumbai) - India
- `europe-west2` (London) - UK
- `me-central1` (Doha) - Nearest to UAE

**GCP Services Mapping:**

| Component | GCP Service | Purpose |
|-----------|-------------|---------|
| Microservices | Cloud Run | Serverless containers |
| Database | Cloud SQL (PostgreSQL) | Primary data store |
| Cache/Sessions | Memorystore (Redis) | Price locks, sessions |
| File Storage | Cloud Storage | 3D models, images, docs |
| Search | Meilisearch | Product search (simple, fast) |
| CDN | Cloud CDN | Global asset delivery |
| DDoS Protection | Cloud Armor | Security |
| Monitoring | Cloud Monitoring | Observability |
| Logging | Cloud Logging | Centralized logs |
| CI/CD | Cloud Build | Automated deployments |
| Secrets | Secret Manager | API keys, credentials |
| AI/ML | Vertex AI | Visual search |
| OCR | Document AI | KYC verification |

**Why GCP Cloud Run:**
- Zero server management (minimal DevOps overhead)
- Auto-scaling to zero (cost-effective)
- Multi-region deployment with one command
- Built-in load balancing
- PCI DSS, SOC2, ISO 27001 compliance certified
- gcloud CLI for Cursor terminal integration

---

## Core Features

### 1. Multi-Country Routing & Restrictions

**Implementation:**
- Next.js middleware for country detection and routing
- Country-specific paths: `thegrandgold.com/in`, `/ae`, `/uk`
- IP-based geolocation with manual override
- Address validation service for country verification
- Country-specific product catalogs and pricing

**Files:**
- `middleware.ts` - Country routing logic
- `lib/country-detection.ts` - Geolocation service
- `services/country-restriction-service.ts` - Business logic

### 2. Multi-Tenancy Architecture

**Strategy:** Schema-per-tenant with shared database
- Each seller gets isolated schema
- Global admin can access all schemas
- Country admin can access country-specific schemas
- Tenant switching middleware

**Files:**
- `lib/tenant-context.ts` - Tenant isolation
- `database/migrations/tenant-schema.sql` - Schema template
- `services/tenant-service.ts` - Tenant management

### 3. RBAC & Admin Dashboards

**Roles:**
- Super Admin (global access)
- Country Admin (India/UAE/UK specific)
- Seller Admin (tenant-specific)
- Influencer (limited access)
- Freelance Consultant (limited access)

**Implementation:**
- JWT-based authentication with role claims
- Permission-based access control (PBAC)
- Dynamic route protection
- API-level authorization

**Files:**
- `services/auth-service.ts` - Authentication
- `services/rbac-service.ts` - Role management
- `components/admin/super-admin-dashboard.tsx`
- `components/admin/country-admin-dashboard.tsx`

### 4. Advanced Product Listing Engine (Tri-Mode Ingestion)

**Method A: "White Glove" Manual Wizard**
- For: Boutique designers with unique, high-value pieces
- AI-Assisted Description Generator (Vertex AI)
- Merchant uploads photo, system auto-generates luxury description
- Saves hours of copywriting time
- Ensures consistent "Luxury Voice" across platform

**Method B: High-Volume Bulk Matrix**
- For: Wholesalers and large distributors
- Intelligent CSV/Excel Mapper
- Upload 5,000 SKUs at once
- Auto-validates critical fields (Weight, Purity, Hallmark status)
- Rejects rows with errors before they go live
- Launch new collection in minutes, not days

**Method C: Real-Time ERP Bridge**
- For: Enterprise Retailers
- Direct API integration with legacy ERPs (SAP, Microsoft Dynamics, Logic ERP, Tally)
- Live Inventory Sync
- If necklace sold in physical store, instantly removed from GrandGold app
- Prevents "Out of Stock" order cancellations
- Real-time bidirectional sync

**Files:**
- `services/product-service.ts` - Product CRUD
- `services/product-ingestion-service.ts` - Tri-mode ingestion orchestration
- `services/manual-wizard-service.ts` - Method A
- `services/bulk-upload-service.ts` - Method B (CSV/Excel)
- `services/ai-description-service.ts` - AI description generator (Vertex AI)
- `services/erp-sync-service.ts` - Method C (ERP integration)

### 5. Seller Onboarding (Automated + Manual Models)

**Model A: Automated Onboarding (Zero-Friction Gateway)**
- Stage 1 - Corporate Verification:
  - Upload Trade Licenses, VAT Certificates, Gold Dealer Permits
  - Automated background checks via third-party APIs
  - Country-specific document requirements (GST for India, TRN for UAE)
  - OCR-based document verification (Document AI)
- Stage 2 - Financial Binding:
  - IBAN/Bank details verification
  - Bank account validation API integration
  - Settlement account setup
- Stage 3 - Agreement Execution:
  - Digital signing via DocuSign integration
  - GrandGold Merchant Agreement
  - Automated approval workflow

**Model B: Manual Onboarding (White-Glove Service)**
- Admin-assisted onboarding for high-value merchants
- Manual document review and verification
- Custom agreement negotiation
- Personalized setup assistance
- Manual approval workflow with admin dashboard

**Files:**
- `services/seller-onboarding-service.ts` - Onboarding orchestration
- `services/automated-onboarding-service.ts` - Automated workflow
- `services/manual-onboarding-service.ts` - Manual workflow
- `services/document-verification-service.ts` - Document OCR & validation (Document AI)
- `services/background-check-service.ts` - AML/KYC checks
- `integrations/docusign/` - DocuSign integration

### 6. Order Management & Seller Anonymity ("Veil Logic")

**Flow:**
1. Customer browses products (seller hidden - "GrandGold Certified" interface)
2. Adds to cart
3. Reaches payment page → Seller details revealed
4. Order placed with seller assignment

**Implementation - "Veil Logic":**
- Product aggregation without seller info
- Middleware layer to strip seller metadata from API responses in real-time
- Prevention of "inspect element" leakage
- Response sanitization to remove seller IDs, names, locations from frontend
- Seller assignment at checkout
- Order routing to appropriate seller

**Files:**
- `services/order-service.ts` - Order processing
- `services/checkout-service.ts` - Checkout flow
- `middleware/seller-anonymity.ts` - Response sanitization
- `services/veil-service.ts` - Seller metadata stripping

### 7. Payment Integration

**Gateways:**
- Razorpay (India)
- Stripe (UK, UAE)
- PayPal (International)
- Country-specific gateways

**Implementation:**
- Payment gateway abstraction layer
- Multi-currency support
- Secure payment processing
- Webhook handling

**Files:**
- `services/payment-service.ts` - Payment abstraction
- `integrations/payment-gateways/razorpay.ts`
- `integrations/payment-gateways/stripe.ts`
- `services/webhook-service.ts`

### 8. Fintech & Bullion Engine ("Golden Hour" Live Pricing)

**Real-Time WebSocket Feeds:**
- Live connection to international metal exchanges (XAU/USD)
- WebSocket infrastructure for real-time price updates
- Price updates every 60 seconds without page refresh
- Live pricing ticker on web portal

**Dynamic Margin Calculation:**
- Input: Spot Gold Price + Currency Exchange Rate + Making Charge + Tax
- Output: Retail price that updates every 60 seconds
- Real-time margin calculation engine
- Currency conversion service

**Price Lock Hedging Mechanism:**
- Cart Locking Protocol: When user enters Checkout, system "freezes" gold price for exactly 5 minutes
- High-speed caching layer (Memorystore Redis) to hold state
- If user fails to pay in 5 minutes, system forces price refresh
- Protects merchant from market volatility
- Price lock service with timer management

**Files:**
- `services/fintech-service.ts` - Fintech orchestration
- `services/live-pricing-service.ts` - WebSocket price feeds
- `services/margin-calculation-service.ts` - Dynamic margin engine
- `services/price-lock-service.ts` - 5-minute price freeze
- `services/currency-exchange-service.ts` - Real-time FX rates
- `integrations/metal-exchanges/` - Exchange API connectors
- `components/homepage/live-pricing-ticker.tsx` - Live ticker UI

### 9. WebAR Virtual Try-On (No-App Augmented Reality)

**Technology:**
- WebXR API for browser-based AR (no app download required)
- Three.js for 3D rendering
- MediaPipe or TensorFlow.js for face tracking
- 8th Wall or AR.js for AR capabilities
- 3D model storage (GLB format - optimized for jewelry)

**Implementation:**
- Product 3D model upload (GLB format)
- Browser-based computer vision for face detection
- Face tracking for earlobes and necklines
- Virtual placement of earrings and necklaces
- High-fidelity 3D models allowing 360-degree inspection
- Diamond clarity and gold texture visualization
- Mobile and desktop support

**Files:**
- `services/ar-vr-service.ts` - AR/VR logic
- `services/face-tracking-service.ts` - Face detection & tracking
- `components/product/ar-viewer.tsx` - WebAR viewer
- `components/product/virtual-tryon.tsx` - Try-on component
- `lib/webxr-utils.ts` - WebXR utilities

### 10. Geo-Spatial Inventory Filtering

**Features:**
- Show nearby sellers first
- IP-derived country code detection
- Filter millions of SKUs in milliseconds (Meilisearch)
- Country-specific shipping rules enforcement
- User in London never sees products that cannot be legally shipped to UK
- Distance calculation
- Location-based filtering

**Implementation:**
- Geospatial queries (PostGIS extension in Cloud SQL)
- Customer location detection (IP geolocation + manual override)
- Seller location storage with geospatial indexing
- Distance-based sorting
- Shipping rules engine per country
- High-performance search with Meilisearch
- Real-time inventory filtering

**Performance Requirements:**
- Filter millions of SKUs in milliseconds
- Sub-second response times
- Optimized geospatial queries

**Files:**
- `services/location-service.ts` - Geospatial logic
- `services/search-service.ts` - Enhanced search (Meilisearch)
- `services/shipping-rules-service.ts` - Country shipping rules
- `lib/geospatial-utils.ts` - PostGIS utilities

### 11. AI-Driven Discovery & Customer Support

**Visual Search AI (Vertex AI):**
- Users upload photo of jewelry (e.g., from wedding)
- Vertex AI Vision finds closest match in inventory
- Computer vision for image matching
- Similarity search engine
- Multi-angle product matching
- Zero ML infrastructure management

**Smart Filtering:**
- AI understands jewelry taxonomy:
  - "22K", "Polki", "Uncut Diamond", "Temple Jewellery"
  - Indian and Arab market-specific terms
  - Natural language product queries

**Customer Support:**
- Vertex AI Generative AI or Claude integration
- RAG (Retrieval Augmented Generation) for product knowledge
- Multi-language support
- Chat interface
- Escalation to human agents

**GCP AI Services Used:**

| Feature | GCP Service |
|---------|-------------|
| Visual Search | Vertex AI Vision |
| Document OCR | Document AI |
| Chat AI | Vertex AI Generative |
| Translation | Cloud Translation |

**Files:**
- `services/ai-support-service.ts` - AI chat logic
- `services/visual-search-service.ts` - Vertex AI Vision integration
- `services/rag-service.ts` - Knowledge base
- `services/smart-filter-service.ts` - Taxonomy-aware filtering
- `integrations/gcp/vertex-ai.ts` - Vertex AI client
- `integrations/gcp/document-ai.ts` - Document AI client

### 12. Regulatory Compliance Service (KYC/AML)

**Strict Regulatory Adherence:**
- Embedded into user experience
- Compliance with Gold Trading laws across UK, UAE, India
- AML (Anti-Money Laundering) checks
- Tax compliance across all countries

**Tiered KYC (Know Your Customer):**
- **Tier 1 (Jewelry < $5k):**
  - Basic Email/Phone verification
  - Address verification
- **Tier 2 (Bullion/High Value):**
  - Mandatory upload of Government ID (Passport/Emirates ID/Aadhaar)
  - Document AI OCR to auto-verify documents before allowing purchase
  - Document verification service
  - Value-based KYC triggers

**Automated Background Checks:**
- Reduces "Bad Actor" risk (money laundering) to near zero
- Integration with compliance databases
- Real-time risk assessment

**Files:**
- `services/regulatory-compliance-service.ts` - Compliance orchestration
- `services/aml-service.ts` - Anti-Money Laundering checks
- `services/background-check-service.ts` - Automated checks
- `services/kyc-service.ts` - Tiered KYC logic
- `services/document-verification-service.ts` - OCR document verification (Document AI)

### 13. Click & Collect & Video Consultations

**Click & Collect:**
- Store location selection
- Inventory reservation
- Pickup scheduling
- Notification system

**On-Demand Video Consultations:**
- Complex scheduling system with time zone conversions
- User in UK booking slot with Seller in Dubai
- Secure in-browser video call facility (WebRTC)
- Seller revealed during video call
- Customer sees live product on mannequin before committing $10,000+
- Appointment engine with calendar integration
- Reminder system

**Files:**
- `services/booking-service.ts` - Booking management
- `services/click-collect-service.ts` - Store pickup
- `services/video-consultation-service.ts` - WebRTC video calls
- `services/timezone-service.ts` - Time zone conversion

### 14. Multi-Location Inventory & Stock Pools

**Stock Pool Separation:**
- **Pool A: Physical Stock** - Available for Same-Day Delivery
- **Pool B: Virtual Stock** - Dropshipping / Made-to-Order
- Per-product stock pool assignment
- Pool-based availability calculation

**Global Visibility Toggle:**
- Merchants decide per-product: "Show this only in UAE" vs "Show this Globally"
- Country-specific inventory visibility
- Multi-location inventory tracking

**Files:**
- `services/inventory-service.ts` - Stock management
- `services/stock-pool-service.ts` - Pool A/B management
- `services/visibility-service.ts` - Global/country visibility

### 15. Dynamic Tax Engine & Invoicing

**Dynamic Tax Rule Builder (No-Code):**
- Admins configure complex tax rules without coding
- Visual rule builder UI
- Conditional tax logic:
  - "If Product Category = 'Gold Bars' AND Destination = 'UAE', Tax = 0%"
  - "If Product Category = 'Gold Necklace' AND Destination = 'UAE', Tax = 5%"
  - "If Destination = 'India', Tax = 3% GST"
- Rule engine for tax calculation
- Country-specific tax rules

**Country-Specific:**
- GST (India)
- VAT (UK, UAE)
- Tax calculation engine
- Invoice generation
- Export/Import invoice generation for cross-border

**Files:**
- `services/tax-service.ts` - Tax calculation
- `services/tax-rule-engine.ts` - Dynamic rule engine
- `services/invoice-service.ts` - Invoice generation
- `components/admin/tax-rule-builder.tsx` - Visual rule builder

### 16. Transparent Finance Ledger (Double-Entry Bookkeeping)

**Granular Ledger System:**
- Double-entry bookkeeping for every single order
- Detailed breakdown visible to sellers:
  ```
  (+) Gross Sale Amount
  (-) Platform Commission (Dynamic %)
  (-) Payment Gateway Fees
  (-) International Shipping Surcharge
  (-) Government Taxes (VAT/GST) collected at source
  (=) Net Settlement Amount
  ```

**Settlement Lifecycle:**
- Visual tracking: Escrow → Cleared → Disbursed to Bank
- Status updates at each stage
- Automated settlement processing

**Files:**
- `services/finance-service.ts` - Financial logic
- `services/ledger-service.ts` - Double-entry bookkeeping
- `services/settlement-service.ts` - Settlement lifecycle
- `components/seller/ledger-view.tsx` - Transparent ledger

### 17. Automated Cross-Border Dropshipping

**Logic Example:** If UK user buys from UAE seller:
- System generates UAE Export Invoice automatically
- System generates UK Import Declaration automatically
- System books DHL Express pickup automatically
- System calculates and withholds Import Duty from customer's payment
- End-to-end automation

**Files:**
- `services/cross-border-service.ts` - Dropshipping orchestration
- `services/export-import-docs-service.ts` - Document generation
- `services/logistics-auto-booking-service.ts` - Automated booking
- `services/import-duty-service.ts` - Duty calculation

### 18. Influencer Marketing Platform (Grand Ambassador Hub)

**White-Label Storefronts:**
- Dynamic Microsites: Influencers get branded URL (e.g., thegrandgold.com/influencer/sarah)
- Curated Racks: Influencers can "drag and drop" products from master catalog into personal store
- Custom branding per influencer

**Real-Time Commission Analytics:**
- Performance Dashboards: Live graphs of clicks, conversions, accrued commissions
- Payout Wallets: Automated generation of commission invoices
- Enhanced tracking and reporting

**Files:**
- `services/influencer-service.ts` - Enhanced influencer management
- `services/influencer-storefront-service.ts` - White-label storefronts
- `services/curated-rack-service.ts` - Product curation
- `services/commission-analytics-service.ts` - Real-time analytics

---

## GCP Deployment Strategy

### GCP Project Structure
- `grandgold-dev` - Development environment
- `grandgold-staging` - Staging environment
- `grandgold-prod` - Production environment

### Multi-Region Configuration

| Region | Location | Purpose |
|--------|----------|---------|
| `asia-south1` | Mumbai | India customers & sellers |
| `europe-west2` | London | UK customers & sellers |
| `me-central1` | Doha | UAE customers (nearest) |

### Environment Setup
- **Development:** Local Docker Compose + Cloud SQL Proxy
- **Staging:** GCP Cloud Run (staging project)
- **Production:** GCP Cloud Run (multi-region)

### gcloud CLI Deployment (Cursor Integration)

**Initial Setup:**
```bash
# Install gcloud CLI
brew install google-cloud-sdk

# Authenticate
gcloud auth login
gcloud config set project grandgold-prod

# Configure Docker for GCP
gcloud auth configure-docker
```

**Deploy Single Service:**
```bash
# Build and deploy auth-service to India region
gcloud builds submit --tag gcr.io/grandgold-prod/auth-service ./services/auth-service
gcloud run deploy auth-service \
  --image gcr.io/grandgold-prod/auth-service \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

**Deploy All Services Script (deploy-all.sh):**
```bash
#!/bin/bash
SERVICES=("auth-service" "product-service" "order-service" "payment-service" "fintech-service")
REGIONS=("asia-south1" "europe-west2" "me-central1")

for service in "${SERVICES[@]}"; do
  gcloud builds submit --tag gcr.io/grandgold-prod/$service ./services/$service
  for region in "${REGIONS[@]}"; do
    gcloud run deploy $service --image gcr.io/grandgold-prod/$service --region $region --quiet
  done
done
```

**Cloud Build CI/CD (cloudbuild.yaml):**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/${_SERVICE}', './services/${_SERVICE}']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/${_SERVICE}']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args: ['run', 'deploy', '${_SERVICE}', '--image', 'gcr.io/$PROJECT_ID/${_SERVICE}', '--region', '${_REGION}', '--platform', 'managed']
substitutions:
  _SERVICE: auth-service
  _REGION: asia-south1
```

**Cursor Terminal Aliases (~/.zshrc):**
```bash
# GrandGold deployment aliases
alias gg-deploy="./infrastructure/gcp/deploy-service.sh"
alias gg-deploy-all="./infrastructure/gcp/deploy-all.sh"
alias gg-logs="gcloud run logs read"
alias gg-status="gcloud run services list"
alias gg-scale="gcloud run services update"
```

### Load Balancing & High Availability (GCP Managed)

**GCP Load Balancing (Fully Managed - Zero Configuration):**
- **Cloud Load Balancer:**
  - Global HTTP(S) load balancing (automatic)
  - Geographic routing to nearest region
  - SSL/TLS termination
  - Health checks built-in
  
- **Cloud Run Auto-scaling:**
  - Automatic scaling from 0 to 1000+ instances
  - No HPA configuration needed
  - Pay only for active requests
  - Cold start optimization with min instances

- **Cloud SQL High Availability:**
  - Automatic failover (regional HA)
  - Read replicas for read-heavy operations
  - Connection pooling built-in
  - Automated backups and point-in-time recovery

- **Memorystore (Redis) HA:**
  - Standard tier with automatic failover
  - Multi-zone replication
  - No cluster management needed

**Minimal Management Required:**

| Traditional | GCP Managed Alternative |
|-------------|------------------------|
| Kubernetes HPA | Cloud Run auto-scaling (automatic) |
| Nginx/HAProxy | Cloud Load Balancer (automatic) |
| PgBouncer | Cloud SQL connection pooling |
| Redis Cluster | Memorystore HA tier |
| Prometheus/Grafana | Cloud Monitoring (built-in) |
| Elasticsearch | Meilisearch (simpler setup) |

### Scalability for New Countries

**Country Configuration System:**
- **Country Registry:** Centralized configuration for all countries
- **Country Metadata:**
  - Country code, currency, timezone
  - Tax rules, compliance requirements
  - Payment gateways, shipping providers
  - Legal document requirements
  - Language and localization settings

**Dynamic Country Addition:**
- **Configuration-Driven Approach:**
  - No code changes required for new countries
  - Country config stored in database/configuration files
  - Admin UI for country management
  - Automated country onboarding workflow

**New Country Onboarding Process:**
1. **Configuration Setup:** Add country to registry, configure currency, timezone, tax rules
2. **Infrastructure Setup:** Deploy country-specific routing, configure DNS, set up database schema
3. **Integration Setup:** Integrate country-specific payment gateways, shipping providers
4. **Testing & Validation:** Country-specific test scenarios, compliance validation

**Files:**
- `services/country-registry-service.ts` - Country configuration management
- `services/country-onboarding-service.ts` - Automated country setup
- `components/admin/country-management.tsx` - Country admin UI
- `config/countries/` - Country configuration files

---

## Project Structure

```
grandgold-marketplace/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── admin/                  # Admin dashboard
│   ├── seller/                 # Seller portal
│   └── influencer/             # Influencer portal
├── services/                   # Microservices
│   ├── auth-service/
│   ├── product-service/
│   ├── order-service/
│   ├── payment-service/
│   ├── inventory-service/
│   ├── shipping-service/
│   ├── admin-service/
│   ├── influencer-service/
│   ├── integration-service/
│   ├── ar-vr-service/
│   ├── ai-support-service/
│   ├── tax-service/
│   ├── fintech-service/        # Live pricing & bullion
│   ├── price-lock-service/     # Price hedging
│   ├── regulatory-compliance-service/  # KYC/AML
│   ├── document-verification-service/  # OCR KYC
│   ├── geofencing-service/     # Safe zones (delivery only)
│   ├── video-consultation-service/  # WebRTC
│   ├── visual-search-service/  # AI image search
│   ├── finance-ledger-service/  # Double-entry
│   ├── cross-border-service/   # Automated dropshipping
│   └── seller-onboarding-service/  # Automated + Manual
├── shared/                     # Shared libraries
│   ├── types/
│   ├── utils/
│   └── constants/
├── infrastructure/             # Infrastructure as Code
│   ├── docker/                 # Dockerfiles for all services
│   ├── gcp/                    # GCP deployment scripts
│   │   ├── deploy-service.sh   # Single service deploy
│   │   ├── deploy-all.sh       # All services deploy
│   │   ├── cloudbuild.yaml     # CI/CD pipeline
│   │   ├── setup-database.sh   # Cloud SQL setup
│   │   └── setup-redis.sh      # Memorystore setup
│   └── terraform/              # Optional IaC
├── integrations/               # Third-party integrations
│   ├── payment-gateways/
│   ├── erp/
│   ├── logistics/
│   └── crms/
└── docs/                       # Documentation
```

---

## Security & Compliance

### Authentication & Authorization
- JWT with refresh tokens
- Multi-factor authentication (MFA) - Mandatory Mobile OTP
- OAuth2/OIDC support
- Rate limiting

### Data Security
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- PII data masking
- PCI DSS compliance for payments

### API Security
- API key management
- OAuth2 for third-party access
- Request signing
- CORS configuration
- Response sanitization (prevent seller metadata leakage)

### Application Security
- Input validation & sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens
- Security headers
- Metadata stripping middleware

### Regulatory Security
- KYC/AML compliance
- Document verification (Document AI)
- Background checks
- Audit logging for regulators

**Files:**
- `middleware/security.ts` - Security middleware
- `middleware/seller-anonymity.ts` - Response sanitization
- `lib/encryption.ts` - Encryption utilities
- `services/audit-service.ts` - Audit logging
- `services/compliance-audit-service.ts` - Regulatory audit logs

---

## Development Phases

### Phase 1: Foundation & Regulatory Compliance (Weeks 1-4)
- Project setup and architecture
- Authentication & authorization with mandatory MFA
- Multi-tenancy implementation
- Regulatory Compliance Service (KYC/AML)
- Tiered KYC system with OCR verification (Document AI)
- Country routing with geolocation
- PWA configuration
- GCP infrastructure setup

### Phase 2: Core Marketplace & Fintech (Weeks 5-8)
- Seller onboarding (Automated + Manual models)
- Fintech & Bullion Engine (live pricing)
- Price lock mechanism
- Order management with seller anonymity (Veil Logic)
- Payment integration
- Basic admin dashboards
- Geo-spatial inventory filtering (Meilisearch)

### Phase 3: Product Management & Logistics (Weeks 9-12)
- Tri-mode product ingestion (Manual/Bulk/ERP)
- Stock pool management
- Automated cross-border dropshipping
- Dynamic tax engine
- Transparent finance ledger
- Location-based services with geofencing

### Phase 4: Advanced Features (Weeks 13-16)
- WebAR virtual try-on with face tracking
- Visual search AI (Vertex AI)
- AI customer support with smart filtering
- Video consultation service (WebRTC)
- Enhanced influencer platform

### Phase 5: Polish & Optimization (Weeks 17-20)
- Performance optimization (millions of SKUs in milliseconds)
- Security hardening (response sanitization, metadata stripping)
- UI/UX refinement
- Comprehensive testing
- Load testing and scalability
- Regulatory compliance audit

---

## Cost Estimates

### GCP Cost Estimate (Monthly)

| Service | Configuration | Estimated Cost |
|---------|---------------|----------------|
| Cloud Run (15 services x 3 regions) | 2 vCPU, 2GB RAM each | $200-400 |
| Cloud SQL (PostgreSQL) | db-custom-4-16384, HA | $150-250 |
| Memorystore (Redis) | Standard tier, 5GB | $100-150 |
| Cloud Storage | 500GB + CDN egress | $50-100 |
| Cloud Build | 120 build-minutes/day | $50-100 |
| Cloud CDN | 1TB egress/month | $50-80 |
| Cloud Armor | Standard tier | $25-50 |
| Cloud Monitoring | Standard usage | $0-50 |
| Document AI | 1000 pages/month | $50-100 |
| Vertex AI | Visual search queries | $100-200 |
| Meilisearch | Cloud or self-hosted | $50-100 |
| **Total Estimate** | | **$825-1,580/month** |

**Notes:**
- Cloud Run scales to zero when not in use
- Prices vary based on traffic and usage
- Free tier credits available for first year ($300)
- Consider committed use discounts for production

---

## Key Decisions & Confirmations

### Confirmed Technology Choices

| Requirement | Technology | Status |
|-------------|------------|--------|
| Microservices | Cloud Run | Confirmed |
| Database | Cloud SQL (PostgreSQL 15) | Confirmed |
| Cache/Sessions | Memorystore (Redis 7.0) | Confirmed |
| File Storage | Cloud Storage | Confirmed |
| CDN | Cloud CDN | Confirmed |
| DDoS Protection | Cloud Armor | Confirmed |
| Monitoring | Cloud Monitoring | Confirmed |
| Logging | Cloud Logging | Confirmed |
| CI/CD | Cloud Build | Confirmed |
| Secrets | Secret Manager | Confirmed |
| Visual Search | Vertex AI | Confirmed |
| Document OCR | Document AI | Confirmed |
| Search | Meilisearch (Cloud or self-hosted) | Confirmed |

### Decisions Needed

1. **Brand Colors & Theme:** Research thegrandgold.com for exact color palette
2. **3D Model Format:** Standardize on GLB format for WebAR (confirmed)
3. **Metal Pricing Source:** Identify specific API providers (XAU/USD exchanges)
4. **ERP Integration Priority:** Which ERPs to integrate first? (SAP, Microsoft Dynamics, Logic ERP, Tally)
5. **Payment Gateway Priority:** Confirm country-specific gateways (Razorpay for India, Stripe for UK/UAE)
6. **Database Scaling:** Schema-per-tenant vs. shared schema approach
7. **WebSocket Infrastructure:** Cloud Run supports WebSocket natively
8. **Face Tracking Library:** MediaPipe (recommended - works well with GCP)
9. **Video Service:** WebRTC with Twilio or Agora (Cloud Run supports WebSocket)
10. **Compliance Databases:** Identify AML/KYC data providers for background checks
11. **Metal Exchange APIs:** Specific exchange APIs for live pricing (London Bullion Market, COMEX, etc.)

---

## Strategic Vision Alignment

This platform is **"Bloomberg of Gold Retail"** - merging:
- High-touch luxury jewelry service
- High-frequency fintech trading technology
- Strict regulatory compliance (KYC/AML)
- Multi-national operations (UK, UAE, India)

**Complexity Matrix:**
- **Regulatory Complexity:** 3 different tax regimes and gold laws simultaneously
- **Financial Complexity:** Real-time price hedging and split-ledger settlements
- **Logistical Complexity:** Automating international dropshipping and secure armored transport
- **Privacy Complexity:** Masking seller data while ensuring order transparency
- **Integration Complexity:** Bridging legacy ERPs with modern Cloud APIs for inventory sync

---

## Next Steps

1. **GCP Setup:**
   - Create GCP project (`grandgold-prod`)
   - Install gcloud CLI and authenticate
   - Configure Cloud Build for CI/CD
   - Set up Cloud SQL (PostgreSQL) and Memorystore (Redis)

2. **Project Setup:**
   - Research GrandGold website for branding guidelines and color palette
   - Set up monorepo structure (Turborepo or Nx)
   - Configure Dockerfiles for all services

3. **Core Services:**
   - Initialize auth-service with MFA
   - Set up regulatory compliance service (KYC/AML)
   - Configure Cloud Run deployments for each service

4. **Deployment Scripts:**
   - Create gcloud CLI deployment scripts for Cursor
   - Set up cloudbuild.yaml for automated CI/CD
   - Configure multi-region deployment (Mumbai, London, Doha)

5. **Integrations:**
   - Set up Document AI for KYC OCR
   - Configure Vertex AI for visual search
   - Integrate metal exchange APIs for live pricing
   - Configure Meilisearch for product search

6. **Testing & Launch:**
   - Configure Cloud Monitoring and alerting
   - Set up staging environment
   - Run load tests and compliance audit

---

## Cursor Terminal Quick Start

```bash
# 1. Install gcloud CLI
brew install google-cloud-sdk

# 2. Authenticate
gcloud auth login
gcloud config set project grandgold-prod

# 3. Clone and setup
git clone <repo>
cd grandgold-marketplace

# 4. Deploy first service
./infrastructure/gcp/deploy-service.sh auth-service asia-south1

# 5. Check status
gcloud run services list
```

---

**Document Version:** 2.0  
**Last Updated:** February 2025  
**Platform:** GCP Cloud Run  
**Search Engine:** Meilisearch  
**Status:** Ready for Implementation
