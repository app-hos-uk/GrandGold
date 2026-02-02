# GrandGold Enterprise Marketplace Platform
## Complete Implementation Plan v3.0

**Vision:** "Bloomberg of Gold Retail" - A multi-national, regulated commerce engine merging luxury jewelry retail with fintech trading platform.

**Overview:** Enterprise-grade multi-tenant marketplace with microservices architecture, real-time metal pricing, regulatory compliance (KYC/AML), WebAR virtual try-on, automated cross-border logistics, Strapi CMS integration, and comprehensive third-party integrations. Supports India, UAE, and UK operations with country-specific compliance and taxation.

**Status:** 100% Feature Coverage - All functional requirements included

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Core Features (Complete)](#core-features-complete)
4. [E-Commerce Features (Detailed)](#e-commerce-features-detailed)
5. [AR Features (Enhanced)](#ar-features-enhanced)
6. [CMS Integration (Strapi)](#cms-integration-strapi)
7. [GCP Deployment Strategy](#gcp-deployment-strategy)
8. [Development Phases](#development-phases)
9. [Security & Compliance](#security--compliance)
10. [Testing Strategy](#testing-strategy)
11. [Cost Estimates](#cost-estimates)
12. [Next Steps](#next-steps)

---

## Architecture Overview

### GCP Cloud Run Microservices Architecture with Strapi CMS

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
        │
┌───────▼──────┐
│   Strapi CMS │  ← Headless CMS for content management
│   Service    │
└──────────────┘
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
- **Image Optimization:** Next.js Image component with lazy loading
- **Carousel:** Swiper.js or Embla Carousel for smooth scrolling

### CMS Platform
- **Strapi (Headless CMS)** - Self-hosted on Cloud Run
  - Schema-driven content management
  - RESTful and GraphQL APIs
  - Media library management
  - Role-based content access
  - Embedded at root route (/)
  - Content types: Products, Collections, Homepage, Users, Orders

### Database Strategy (GCP Managed)

| Component | GCP Service | Configuration |
|-----------|-------------|---------------|
| **Primary Database** | Cloud SQL (PostgreSQL 15) | PostGIS extension, schema-per-tenant, auto-backups, HA failover |
| **Cache/Sessions** | Memorystore (Redis 7.0) | Standard tier, sessions, rate limiting, price locks |
| **Search Engine** | Meilisearch | Cloud or self-hosted on Cloud Run (simple, fast, typo-tolerant) |
| **Time-series** | Cloud SQL + TimescaleDB or BigQuery | Live metal pricing history, analytics |
| **File Storage** | Cloud Storage | 3D models (GLB), KYC documents, product images, 360° videos |
| **CMS Database** | Cloud SQL (PostgreSQL) | Strapi content and media metadata |

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
| CMS | Cloud Run (Strapi) | Headless content management |
| Database | Cloud SQL (PostgreSQL) | Primary data store |
| Cache/Sessions | Memorystore (Redis) | Price locks, sessions |
| File Storage | Cloud Storage | 3D models, images, docs, videos |
| Search | Meilisearch | Product search (simple, fast) |
| CDN | Cloud CDN | Global asset delivery |
| DDoS Protection | Cloud Armor | Security |
| Monitoring | Cloud Monitoring | Observability |
| Logging | Cloud Logging | Centralized logs |
| CI/CD | Cloud Build | Automated deployments |
| Secrets | Secret Manager | API keys, credentials |
| AI/ML | Vertex AI | Visual search |
| OCR | Document AI | KYC verification |
| Email | Resend API | Transactional emails |

**Why GCP Cloud Run:**
- Zero server management (minimal DevOps overhead)
- Auto-scaling to zero (cost-effective)
- Multi-region deployment with one command
- Built-in load balancing
- PCI DSS, SOC2, ISO 27001 compliance certified
- gcloud CLI for Cursor terminal integration

---

## Core Features (Complete)

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

### 3. RBAC & Admin Dashboards (Enhanced)

**Roles:**
- Super Admin (global access)
- Country Admin (India/UAE/UK specific)
- Manager (Products, users, analytics)
- Staff (Order handling, support)
- Seller Admin (tenant-specific)
- Influencer (limited access)
- Freelance Consultant (limited access)
- Customer (Browse, purchase, profile)

**Role Capabilities:**

| Role | Capabilities |
|------|-------------|
| Customer | Browse, purchase, profile management |
| Staff | Order handling, customer support |
| Manager | Products, users, analytics management |
| Admin | Full system control |

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
- `components/admin/manager-dashboard.tsx`
- `components/admin/staff-dashboard.tsx`

---

## E-Commerce Features (Detailed)

### 4. Product Catalog (Complete)

**Product Display Requirements:**
- Product name
- High-resolution images (multiple angles)
- Detailed description
- Technical specifications:
  - Metal type
  - Purity
  - Weight
  - Stone details
- Pricing (dynamic or fixed)
- Visual indicators:
  - Dynamic pricing badge
  - AR Try-On enabled badge

**Product Categories:**
- Necklaces
- Earrings
- Rings
- Bracelets
- Bangles
- Pendants
- Men's Jewelry

**Collection Pages:**
- Traditional Indian Bridal
- Contemporary Minimalist
- Middle Eastern Ornate
- Custom collections via Strapi CMS

**Search Functionality:**
- Keyword-based search
- Partial matches
- Typo tolerance (Meilisearch built-in)
- Category filtering
- Price range filtering
- Metal type filtering
- Purity filtering
- Stone type filtering

**Rich Media Support:**
- 360° product videos
- Multiple angle images
- 3D model viewer (Google Model Viewer)
- AR Try-On preview

**SEO & Performance:**
- SEO-friendly URLs and metadata
- Lazy loading of images (Next.js Image component)
- CDN-backed image delivery (Cloud CDN)

**Files:**
- `services/product-service.ts` - Product CRUD
- `services/collection-service.ts` - Collection management
- `services/search-service.ts` - Enhanced search (Meilisearch)
- `components/product/product-card.tsx` - Product display
- `components/product/product-detail.tsx` - Product detail page
- `components/product/collection-page.tsx` - Collection pages
- `components/product/image-gallery.tsx` - Multiple angle images
- `components/product/video-viewer.tsx` - 360° video player
- `components/product/dynamic-pricing-badge.tsx` - Pricing indicator
- `components/product/ar-badge.tsx` - AR Try-On indicator
- `components/search/search-filters.tsx` - Advanced filters

### 5. Shopping Cart (Complete)

**Functional Requirements:**
- Add products to cart
- Remove products from cart
- Update quantities (increment/decrement)
- Cart persistence:
  - localStorage for browser sessions
  - Server-side cart sync for logged-in users
  - Persists across page refresh
  - Persists across browser restarts (localStorage)
- Real-time cart totals:
  - Product subtotal
  - VAT (calculated dynamically)
  - Grand total
- Cart icon with live item count
- Cart drawer/modal UI

**Edge Conditions:**
- Gold price change notification while items in cart
- Stock availability revalidation before payment
- Price lock mechanism (5-minute freeze at checkout)

**Files:**
- `services/cart-service.ts` - Cart management
- `services/cart-persistence-service.ts` - localStorage sync
- `components/cart/cart-icon.tsx` - Cart icon with count
- `components/cart/cart-drawer.tsx` - Cart UI
- `components/cart/cart-item.tsx` - Cart item component
- `components/cart/quantity-selector.tsx` - Quantity controls
- `lib/cart-storage.ts` - localStorage utilities

### 6. Checkout Process (Complete)

**Multi-Step Checkout:**
1. **Shipping Address:**
   - Shipping address form with validation
   - Address autocomplete (Google Places API)
   - Map picker for precise delivery location
   - Geofencing validation (safe zone checking)
2. **Payment Method:**
   - Stripe integration (mandatory for UK)
   - Razorpay (India)
   - PayPal (International)
   - Payment gateway abstraction for future gateways
3. **Order Review:**
   - Item list with images
   - Price breakdown:
     - Product subtotal
     - VAT (20% for UK, country-specific)
     - Shipping cost
     - Total payable
   - Order notes field (customer comments)
   - Billing address:
     - Billing address form
     - "Same as Shipping" checkbox option

**Compliance:**
- VAT calculation according to UK regulations (and country-specific)
- Payment data never stored on platform servers (PCI DSS)
- Secure payment processing

**Files:**
- `services/checkout-service.ts` - Checkout orchestration
- `components/checkout/shipping-step.tsx` - Shipping address
- `components/checkout/payment-step.tsx` - Payment method
- `components/checkout/review-step.tsx` - Order review
- `components/checkout/billing-address.tsx` - Billing address
- `components/checkout/order-notes.tsx` - Order notes field
- `components/checkout/price-breakdown.tsx` - Price summary

### 7. Order Management (Customer-Facing)

**Functional Requirements:**
- Order creation and storage upon successful checkout
- Order confirmation page:
  - Order number
  - Order summary
  - Estimated delivery date
  - Payment confirmation
  - Next steps information
- Order history:
  - List of all customer orders
  - Filter by status
  - Sort by date
- Individual order details:
  - Order items with images
  - Order status timeline
  - Payment status
  - Shipping information
  - Tracking number (when available)
  - Invoice download

**Order Status Lifecycle:**
- Pending
- Confirmed
- Processing
- Shipped
- Delivered
- Cancelled

**Payment Status Lifecycle:**
- Pending
- Processing
- Paid
- Failed
- Refunded

**Shipment Tracking:**
- Tracking number display when available
- Integration with shipping providers
- Real-time tracking updates

**Notifications:**
- Email notifications (mandatory):
  - Order confirmation
  - Status updates
  - Shipping notifications
- WhatsApp notifications (opt-in):
  - Order confirmation
  - Status updates
  - Delivery notifications

**Files:**
- `services/order-service.ts` - Order processing
- `components/orders/order-confirmation.tsx` - Confirmation page
- `components/orders/order-history.tsx` - Order list
- `components/orders/order-detail.tsx` - Order details view
- `components/orders/order-status-timeline.tsx` - Status visualization
- `components/orders/tracking-info.tsx` - Shipment tracking

---

## AR Features (Enhanced)

### 8. 2D AR Try-On (Complete)

**Functional Requirements:**
- Browser-based AR (no app install required)
- Real-time face tracking using MediaPipe FaceMesh
- Supported items:
  - Necklaces
  - Earrings
- Camera permission:
  - Request camera permission with clear UI
  - Handle permission denial gracefully
  - Show fallback UI when camera unavailable
- Live preview updates in real-time
- Platform support:
  - Modern mobile browsers
  - Desktop browsers with camera
  - Graceful degradation on unsupported devices

**Files:**
- `services/ar-vr-service.ts` - AR/VR logic
- `services/face-tracking-service.ts` - MediaPipe FaceMesh integration
- `components/product/ar-tryon.tsx` - AR Try-On component
- `components/product/camera-permission.tsx` - Permission request UI
- `components/product/ar-fallback.tsx` - Fallback UI
- `lib/mediapipe-utils.ts` - MediaPipe utilities

### 9. 3D AR Model Viewer (Complete)

**Functional Requirements:**
- 3D models rendered using Google Model Viewer
- User interactions:
  - Rotate (touch/mouse drag)
  - Zoom (pinch/scroll)
  - Pan
- Platform support:
  - Android: Scene Viewer integration
  - iOS: Quick Look integration
  - Web: Google Model Viewer
- WebXR compatibility for AR viewing

**Files:**
- `components/product/model-viewer.tsx` - Google Model Viewer component
- `components/product/scene-viewer.tsx` - Android Scene Viewer
- `components/product/quick-look.tsx` - iOS Quick Look
- `lib/model-viewer-utils.ts` - Model viewer utilities

### 10. AR Placement UI (Complete)

**Functional Requirements:**
- Product selection within AR interface:
  - Product carousel in AR mode
  - Quick product switcher
- Category filtering inside AR mode:
  - Filter by category (Necklaces, Earrings)
  - Filter by collection
- Real-time positioning and overlay alignment:
  - Automatic face detection and alignment
  - Real-time jewelry placement
- Manual adjustment controls:
  - Position adjustment sliders
  - Scale adjustment
  - Rotation adjustment

**Files:**
- `components/product/ar-placement-ui.tsx` - AR placement interface
- `components/product/ar-product-selector.tsx` - Product carousel in AR
- `components/product/ar-category-filter.tsx` - Category filtering
- `components/product/ar-adjustment-controls.tsx` - Manual adjustment

---

## Dynamic Pricing System (Enhanced)

### 11. Gold Price Integration (Complete)

**Functional Requirements:**
- Fetch live gold prices from Metals.Dev API (or alternative)
- Price formula: (Gold Price × Weight × Purity) + Stone Value + Labor Cost
- Product pricing models:
  - Fixed pricing
  - Dynamic pricing
- Mandatory product pricing fields:
  - `gold_weight` (in grams)
  - `purity` (22K, 18K, etc.)
  - `stones` (stone details and value)
  - `labor_cost` (making charges)
  - `pricing_model` (fixed/dynamic)

**Files:**
- `services/fintech-service.ts` - Fintech orchestration
- `services/live-pricing-service.ts` - Metals.Dev API integration
- `services/margin-calculation-service.ts` - Price formula engine
- `integrations/metal-exchanges/metals-dev.ts` - Metals.Dev connector

### 12. Price Updates & Resilience (Complete)

**Functional Requirements:**
- Scheduled updates:
  - 08:00 AM UK time (daily morning update)
  - 05:00 PM UK time (daily evening update)
  - Automatic price recalculation for all dynamic products
- Caching strategy:
  - 1-hour in-memory cache (Memorystore Redis)
  - 12-hour file cache (Cloud Storage)
- API failure handling:
  - Fallback to last known price
  - Fallback to base price if no cache available
  - Alert system for pricing service failures
- Monitoring endpoint:
  - `/api/pricing/health` - Pricing engine health check
  - Exposes pricing service status
  - Last successful update timestamp
  - Cache status

**Files:**
- `services/price-update-scheduler.ts` - Scheduled price updates
- `services/price-cache-service.ts` - Multi-layer caching
- `services/pricing-health-service.ts` - Health monitoring
- `components/admin/pricing-monitor.tsx` - Pricing dashboard

---

## AI Customer Support (Enhanced)

### 13. Chat Interface (Complete)

**Functional Requirements:**
- Floating chat widget (bottom-right corner)
- Mobile responsive design
- Persistent conversation history:
  - Stored in database for logged-in users
  - localStorage for guest users
  - Sync across devices for authenticated users
- Context-aware responses:
  - RAG system provides product context
  - Conversation context maintained
  - Multi-turn conversation support
- Query categorization:
  - Product inquiries
  - Pricing questions
  - Order status
  - General support
  - Escalation to human agents

**Files:**
- `services/ai-support-service.ts` - AI chat logic
- `services/chat-history-service.ts` - Conversation persistence
- `services/query-categorization-service.ts` - Query classification
- `components/chat/chat-widget.tsx` - Floating chat widget
- `components/chat/chat-interface.tsx` - Chat UI
- `components/chat/message-bubble.tsx` - Message display

### 14. Knowledge Base Coverage (Complete)

**AI Training Data:**
- Product categories and collections
- Materials and gemstones:
  - Gold types (22K, 18K, etc.)
  - Gemstone types and properties
  - Metal properties
- Pricing logic explanations:
  - How dynamic pricing works
  - Price formula breakdown
  - Making charges explanation
- Services:
  - AR Try-On functionality
  - Custom orders process
  - Click & Collect
  - Video consultations
- Policies:
  - Returns policy
  - Shipping policy
  - Warranty information
  - Refund process
- Jewelry care instructions:
  - Cleaning methods
  - Storage recommendations
  - Maintenance tips
- FAQs:
  - Common customer questions
  - Troubleshooting guides

**Files:**
- `services/rag-service.ts` - Knowledge base with RAG
- `services/knowledge-base-service.ts` - Knowledge management
- `data/knowledge-base/` - Knowledge base content
  - `products.md` - Product information
  - `materials.md` - Materials and gemstones
  - `pricing.md` - Pricing explanations
  - `services.md` - Service descriptions
  - `policies.md` - Policies and terms
  - `care-instructions.md` - Jewelry care
  - `faqs.md` - Frequently asked questions

---

## User Management (Complete)

### 15. User Accounts (Complete)

**Functional Requirements:**
- User registration and login
- Profile management:
  - Personal information
  - Contact details
  - Preferences
  - Profile picture
- Address book:
  - Multiple shipping addresses
  - Default address selection
  - Address validation
- WhatsApp number storage:
  - Explicit consent checkbox required
  - Consent tracking and audit
  - Opt-out functionality
- GDPR features:
  - Data export (download user data)
  - Account deletion (right to be forgotten)
  - Data portability
  - Consent management

**Files:**
- `services/user-service.ts` - User management
- `services/profile-service.ts` - Profile management
- `services/address-service.ts` - Address book
- `services/gdpr-service.ts` - GDPR compliance
- `components/user/profile-form.tsx` - Profile management UI
- `components/user/address-book.tsx` - Address management
- `components/user/gdpr-settings.tsx` - GDPR controls
- `components/user/whatsapp-consent.tsx` - Consent checkbox

### 16. Authentication Methods (Complete)

**Supported Methods:**
- Email & password (standard)
- Google OAuth
- Facebook OAuth
- Apple Sign-In
- Phone number (OTP-based)

**Implementation:**
- OAuth2/OIDC providers
- Social login integration
- Account linking (multiple auth methods per user)

**Files:**
- `services/auth-service.ts` - Authentication orchestration
- `integrations/oauth/google.ts` - Google OAuth
- `integrations/oauth/facebook.ts` - Facebook OAuth
- `integrations/oauth/apple.ts` - Apple Sign-In
- `components/auth/social-login.tsx` - Social login buttons

---

## Admin Dashboard (Complete)

### 17. Dashboard Overview (Complete)

**Dashboard Widgets:**
- Total products (with trend)
- Total orders (with trend)
- Total users (with trend)
- Total revenue (with trend)
- Pending order alerts:
  - Count of pending orders
  - High-value pending orders
  - Orders requiring attention
- Recent orders table:
  - Last 10 orders
  - Order number, customer, amount, status
  - Quick actions (view, update status)

**Files:**
- `components/admin/dashboard-overview.tsx` - Main dashboard
- `components/admin/metrics-widget.tsx` - Metrics display
- `components/admin/pending-orders-alert.tsx` - Alerts
- `components/admin/recent-orders-table.tsx` - Recent orders

### 18. Admin Modules (Complete)

**Products Module:**
- CRUD operations (Create, Read, Update, Delete)
- Image uploads (multiple angles)
- Category management
- Collection management
- Bulk operations
- Product import/export

**Orders Module:**
- View and filter orders
- Status updates
- Payment status updates
- Tracking number entry
- Order notes (admin notes)
- Order export

**Users Module:**
- View users
- Role management
- Activity tracking
- User search and filters
- User export

**Analytics Module:**
- Sales analytics
- Revenue analytics
- Product performance
- User behavior analytics
- Custom reports
- Data visualization

**Pricing Module:**
- Gold price monitoring
- Price update scheduling
- Pricing rule configuration
- Price history
- Pricing alerts

**Marketing Module:**
- Email campaigns:
  - Campaign creation
  - Template management
  - Audience segmentation
  - Send scheduling
  - Performance analytics
- WhatsApp campaigns:
  - Campaign creation
  - Message templates
  - Audience targeting
  - Send scheduling
  - Delivery tracking
- Customer segmentation
- Performance analytics

**Settings Module:**
- Environment variables management
- API key management
- Theme customization:
  - Brand colors
  - Layout customization
  - Logo upload
- System configuration

**Files:**
- `components/admin/products/` - Product management
- `components/admin/orders/` - Order management
- `components/admin/users/` - User management
- `components/admin/analytics/` - Analytics dashboards
- `components/admin/pricing/` - Pricing management
- `components/admin/marketing/` - Marketing campaigns
- `components/admin/settings/` - Settings management

---

## CMS Integration (Strapi)

### 19. Strapi Headless CMS (Complete)

**Integration Details:**
- Strapi deployed on Cloud Run
- Embedded at root route (/)
- Schema-driven content management
- RESTful and GraphQL APIs
- Media asset management (integrated with Cloud Storage)

**Content Types:**
1. **Products:**
   - Product metadata
   - Descriptions
   - SEO fields
   - Related products
2. **Collections:**
   - Collection pages
   - Curated product lists
   - Collection descriptions
   - SEO metadata
3. **Homepage:**
   - Hero sections
   - Featured products
   - Banner content
   - Call-to-action sections
4. **Users:**
   - User profiles (public data)
   - User-generated content
5. **Orders:**
   - Order metadata (for admin)
   - Order notes

**Strapi Configuration:**
- Content-Type Builder for schema definition
- Media Library for asset management
- Role-based content access
- API token management
- Webhook support for content updates

**Files:**
- `services/cms-service.ts` - Strapi API client
- `integrations/strapi/` - Strapi integration
  - `strapi-client.ts` - API client
  - `content-types.ts` - Type definitions
- `components/cms/content-renderer.tsx` - Content display
- `infrastructure/gcp/strapi/` - Strapi deployment
  - `Dockerfile` - Strapi container
  - `strapi-config.js` - Strapi configuration

---

## Notifications & Communications (Complete)

### 20. Email Notifications (Complete)

**Email Service: Resend API Integration**

**Email Types:**
- Order confirmations
- Order status updates
- Shipping notifications
- Payment confirmations
- Marketing emails

**Implementation:**
- Resend API for transactional emails
- Email templates
- Email queue management
- Delivery tracking
- Bounce handling

**Files:**
- `services/email-service.ts` - Email orchestration
- `integrations/resend/` - Resend API integration
- `templates/emails/` - Email templates
  - `order-confirmation.html`
  - `order-status-update.html`
  - `shipping-notification.html`
  - `marketing-campaign.html`

### 21. WhatsApp Notifications (Complete)

**WhatsApp Business API Integration**

**WhatsApp Message Types:**
- Order confirmations
- Order status updates
- Delivery notifications
- Marketing messages

**Implementation:**
- WhatsApp Business API integration
- Message templates (pre-approved)
- Opt-in/opt-out management
- Delivery status tracking
- Read receipts

**Files:**
- `services/whatsapp-service.ts` - WhatsApp orchestration
- `integrations/whatsapp-business/` - WhatsApp Business API
- `services/whatsapp-optin-service.ts` - Opt-in management
- `templates/whatsapp/` - Message templates

---

## Mobile Responsiveness (Complete)

### 22. Mobile-First Design (Complete)

**Functional Requirements:**
- Mobile-first layout (responsive design)
- Touch-optimized UI:
  - Large touch targets (min 44x44px)
  - Swipe gestures
  - Touch-friendly forms
- Responsive navigation:
  - Mobile hamburger menu
  - Bottom navigation (mobile)
  - Sticky header
- Mobile-friendly checkout:
  - Simplified checkout flow
  - Mobile payment options
  - Touch-optimized forms
- Smooth carousel scrolling:
  - Swiper.js or Embla Carousel
  - Touch swipe support
  - Smooth animations
- Optimized image loading:
  - Lazy loading
  - Responsive images
  - WebP format support
  - CDN delivery

**Files:**
- `components/layout/mobile-nav.tsx` - Mobile navigation
- `components/layout/touch-optimized.tsx` - Touch utilities
- `components/product/carousel.tsx` - Product carousel
- `lib/image-optimization.ts` - Image optimization utilities

---

## Testing Strategy (Complete)

### 23. Comprehensive Testing

**Testing Levels:**
1. **Unit Testing:**
   - Jest for JavaScript/TypeScript
   - Test coverage > 80%
   - Service layer testing
   - Utility function testing

2. **Integration Testing:**
   - API endpoint testing
   - Database integration tests
   - Third-party integration tests
   - Microservice communication tests

3. **End-to-End Testing:**
   - Playwright or Cypress
   - Critical user flows
   - Cross-browser testing
   - Mobile device testing

4. **Performance Testing:**
   - Load testing (millions of SKUs)
   - Stress testing
   - Response time validation (< 3 seconds)
   - Database query optimization

5. **Security Testing:**
   - Penetration testing
   - Vulnerability scanning
   - OWASP Top 10 compliance
   - Payment security testing

**Files:**
- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - End-to-end tests
- `tests/performance/` - Performance tests
- `tests/security/` - Security tests
- `jest.config.js` - Jest configuration
- `playwright.config.ts` - Playwright configuration

### 24. Documentation Standards

**Code Documentation:**
- JSDoc comments for all functions
- TypeScript type definitions
- API documentation (OpenAPI/Swagger)
- Architecture decision records (ADRs)
- README files for each service

**Files:**
- `docs/api/` - API documentation
- `docs/architecture/` - Architecture docs
- `docs/adr/` - Architecture decision records

---

## Project Structure (Updated)

```
grandgold-marketplace/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── admin/                  # Admin dashboard
│   ├── seller/                 # Seller portal
│   ├── influencer/             # Influencer portal
│   └── cms/                    # Strapi CMS
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
│   ├── seller-onboarding-service/  # Automated + Manual
│   ├── cart-service/          # Shopping cart
│   ├── collection-service/    # Collection pages
│   ├── notification-service/  # Email/WhatsApp
│   └── cms-service/           # Strapi integration
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
│   │   ├── setup-redis.sh      # Memorystore setup
│   │   └── setup-strapi.sh     # Strapi CMS setup
│   └── terraform/              # Optional IaC
├── integrations/               # Third-party integrations
│   ├── payment-gateways/
│   │   ├── stripe.ts
│   │   ├── razorpay.ts
│   │   └── paypal.ts
│   ├── oauth/
│   │   ├── google.ts
│   │   ├── facebook.ts
│   │   └── apple.ts
│   ├── erp/
│   ├── logistics/
│   ├── crms/
│   ├── resend/                 # Email service
│   ├── whatsapp-business/     # WhatsApp API
│   └── metals-dev/             # Gold pricing API
├── templates/                  # Email/WhatsApp templates
│   ├── emails/
│   └── whatsapp/
└── docs/                       # Documentation
```

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

**Deploy Strapi CMS:**
```bash
# Deploy Strapi CMS
gcloud builds submit --tag gcr.io/grandgold-prod/strapi-cms ./apps/cms
gcloud run deploy strapi-cms \
  --image gcr.io/grandgold-prod/strapi-cms \
  --platform managed \
  --region asia-south1 \
  --set-env-vars="DATABASE_CLIENT=postgres,DATABASE_HOST=cloud-sql-proxy"
```

**Deploy All Services Script (deploy-all.sh):**
```bash
#!/bin/bash
SERVICES=("auth-service" "product-service" "order-service" "payment-service" "fintech-service" "cart-service" "cms-service" "strapi-cms")
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
alias gg-cms="./infrastructure/gcp/deploy-strapi.sh"
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

## Security & Compliance

### Authentication & Authorization
- JWT with refresh tokens
- Multi-factor authentication (MFA) - Mandatory Mobile OTP
- OAuth2/OIDC support (Google, Facebook, Apple)
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
- GDPR compliance (data export, deletion)

**Files:**
- `middleware/security.ts` - Security middleware
- `middleware/seller-anonymity.ts` - Response sanitization
- `lib/encryption.ts` - Encryption utilities
- `services/audit-service.ts` - Audit logging
- `services/compliance-audit-service.ts` - Regulatory audit logs
- `services/gdpr-service.ts` - GDPR compliance

---

## Development Phases

### Phase 1: Foundation & Regulatory Compliance (Weeks 1-4)
- Project setup and architecture
- Authentication & authorization with mandatory MFA
- OAuth integrations (Google, Facebook, Apple)
- Multi-tenancy implementation
- Regulatory Compliance Service (KYC/AML)
- Tiered KYC system with OCR verification (Document AI)
- Country routing with geolocation
- PWA configuration
- GCP infrastructure setup
- Strapi CMS setup

### Phase 2: Core Marketplace & Fintech (Weeks 5-8)
- Seller onboarding (Automated + Manual models)
- Fintech & Bullion Engine (live pricing with Metals.Dev)
- Price lock mechanism
- Scheduled price updates (08:00 AM, 05:00 PM UK time)
- Order management with seller anonymity (Veil Logic)
- Shopping cart with localStorage persistence
- Payment integration (Stripe, Razorpay)
- Basic admin dashboards
- Geo-spatial inventory filtering (Meilisearch)

### Phase 3: Product Management & E-Commerce (Weeks 9-12)
- Tri-mode product ingestion (Manual/Bulk/ERP)
- Product catalog with collections
- Collection pages (Traditional Indian Bridal, etc.)
- 360° product videos
- Stock pool management
- Automated cross-border dropshipping
- Dynamic tax engine
- Transparent finance ledger
- Location-based services with geofencing
- Checkout process (multi-step with billing address)
- Order notes field

### Phase 4: AR, AI & Advanced Features (Weeks 13-16)
- WebAR virtual try-on with face tracking (MediaPipe)
- 3D AR Model Viewer (Google Model Viewer)
- AR Placement UI with category filtering
- Visual search AI (Vertex AI)
- AI customer support with complete knowledge base
- Video consultation service (WebRTC)
- Enhanced influencer platform
- Customer order management UI
- Order confirmation pages

### Phase 5: CMS, Notifications & Polish (Weeks 17-20)
- Strapi CMS content management
- Resend API email integration
- WhatsApp Business API integration
- Marketing campaign management
- Mobile responsiveness optimization
- Touch-optimized UI
- Carousel components
- Image lazy loading
- Performance optimization (millions of SKUs in milliseconds)
- Security hardening
- Comprehensive testing
- Load testing and scalability
- Regulatory compliance audit

---

## Cost Estimates

### GCP Cost Estimate (Monthly)

| Service | Configuration | Estimated Cost |
|---------|---------------|----------------|
| Cloud Run (18 services x 3 regions) | 2 vCPU, 2GB RAM each | $240-480 |
| Cloud Run (Strapi CMS) | 2 vCPU, 2GB RAM | $20-40 |
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
| Resend API | 10,000 emails/month | $20-50 |
| WhatsApp Business API | Per message pricing | $50-150 |
| **Total Estimate** | | **$965-1,900/month** |

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
| CMS | Strapi (Headless) | Confirmed |
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
| Email Service | Resend API | Confirmed |
| WhatsApp | WhatsApp Business API | Confirmed |
| Gold Pricing | Metals.Dev API | Confirmed |
| Face Tracking | MediaPipe FaceMesh | Confirmed |
| 3D Viewer | Google Model Viewer | Confirmed |
| OAuth Providers | Google, Facebook, Apple | Confirmed |

### Decisions Needed

1. **Brand Colors & Theme:** Research thegrandgold.com for exact color palette
2. **ERP Integration Priority:** Which ERPs to integrate first? (SAP, Microsoft Dynamics, Logic ERP, Tally)
3. **Payment Gateway Priority:** Confirm country-specific gateways (Razorpay for India, Stripe for UK/UAE)
4. **Database Scaling:** Schema-per-tenant vs. shared schema approach
5. **Compliance Databases:** Identify AML/KYC data providers for background checks

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
   - Set up Strapi CMS

3. **Core Services:**
   - Initialize auth-service with MFA and OAuth
   - Set up regulatory compliance service (KYC/AML)
   - Configure Cloud Run deployments for each service
   - Deploy Strapi CMS

4. **Deployment Scripts:**
   - Create gcloud CLI deployment scripts for Cursor
   - Set up cloudbuild.yaml for automated CI/CD
   - Configure multi-region deployment (Mumbai, London, Doha)
   - Set up Strapi deployment script

5. **Integrations:**
   - Set up Document AI for KYC OCR
   - Configure Vertex AI for visual search
   - Integrate Metals.Dev API for live pricing
   - Configure Meilisearch for product search
   - Set up Resend API for emails
   - Integrate WhatsApp Business API
   - Set up OAuth providers (Google, Facebook, Apple)

6. **Testing & Launch:**
   - Configure Cloud Monitoring and alerting
   - Set up staging environment
   - Run comprehensive tests (unit, integration, e2e)
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

# 5. Deploy Strapi CMS
./infrastructure/gcp/deploy-strapi.sh asia-south1

# 6. Check status
gcloud run services list
```

---

## Feature Coverage Summary

### ✅ Fully Implemented (100%)
- Product Catalog (with collections, 360° videos)
- Shopping Cart (with localStorage persistence)
- Checkout Process (multi-step with billing address)
- Order Management (customer-facing)
- AR Features (2D Try-On, 3D Viewer, Placement UI)
- Dynamic Pricing (with scheduled updates)
- AI Customer Support (complete knowledge base)
- User Management (with OAuth, GDPR)
- Admin Dashboard (all modules)
- CMS (Strapi integration)
- Notifications (Email via Resend, WhatsApp)
- Mobile Responsiveness (touch-optimized)

### Total Features: 24 Core Modules
### Total Coverage: 100% of Functional Requirements

---

**Document Version:** 3.0  
**Last Updated:** February 2025  
**Platform:** GCP Cloud Run  
**Search Engine:** Meilisearch  
**CMS:** Strapi (Headless)  
**Status:** Complete - Ready for Implementation  
**Feature Coverage:** 100%
