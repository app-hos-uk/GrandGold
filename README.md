# GrandGold Enterprise Marketplace

A multi-national, enterprise-grade luxury jewelry marketplace platform built with microservices architecture.

## Overview

GrandGold is the "Bloomberg of Gold Retail" - merging luxury jewelry retail with fintech trading platform capabilities. The platform operates across India, UAE, and UK with country-specific routing, compliance, and features.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) with PWA support
- **Backend:** Node.js with TypeScript (Express/NestJS)
- **Database:** PostgreSQL (Cloud SQL) with Drizzle ORM
- **Cache:** Redis (Memorystore)
- **Search:** Meilisearch
- **Cloud:** Google Cloud Platform (Cloud Run)
- **CMS:** Strapi (Headless)

## Project Structure

```
grandgold-marketplace/
├── apps/
│   ├── web/                    # Next.js frontend (PWA)
│   ├── admin/                  # Admin dashboard (coming soon)
│   └── seller/                 # Seller portal (coming soon)
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utilities
│   └── database/               # Drizzle ORM schemas
├── services/
│   ├── auth-service/           # Authentication & authorization
│   ├── seller-service/         # Seller onboarding & management
│   ├── fintech-service/        # Live pricing & price lock
│   ├── order-service/          # Order processing
│   └── payment-service/        # Payment integration
├── infrastructure/
│   ├── docker/                 # Docker configurations
│   └── gcp/                    # GCP deployment scripts
└── docs/                       # Documentation
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- gcloud CLI (for GCP deployment)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository>
   cd grandgold-marketplace
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start local services (PostgreSQL, Redis, Meilisearch):**
   ```bash
   docker-compose up -d postgres redis meilisearch
   ```

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Start development servers:**
   ```bash
   npm run dev
   ```

   This starts:
   - Frontend: http://localhost:3000
   - Auth Service: http://localhost:4001
   - Other services on their respective ports

### Available Scripts

```bash
# Development
npm run dev                 # Start all services in dev mode
npm run build              # Build all packages and services
npm run lint               # Lint all code
npm run test               # Run tests

# Database
npm run db:migrate         # Run database migrations
npm run db:seed            # Seed database with sample data
npm run db:studio          # Open Drizzle Studio

# Docker
npm run docker:build       # Build all Docker images
npm run docker:up          # Start all containers
npm run docker:down        # Stop all containers

# GCP Deployment
npm run gcp:deploy         # Deploy all services
```

## Features

### Phase 1 (Foundation) ✅
- [x] Monorepo structure with Turborepo
- [x] Shared packages (types, utils, database)
- [x] Authentication service with JWT, MFA
- [x] OAuth integration (Google, Facebook, Apple)
- [x] Country routing (/in, /ae, /uk)
- [x] Next.js frontend with PWA
- [x] GCP deployment scripts
- [x] KYC/AML service with tiered verification
- [x] Multi-tenancy implementation (schema-per-tenant)

### Phase 2 (Core Marketplace) ✅
- [x] Seller onboarding (automated + manual with DocuSign)
- [x] Fintech engine with live pricing (WebSocket)
- [x] Price lock mechanism (5-minute freeze)
- [x] Order management with Veil Logic (seller anonymity)
- [x] Payment integration (Stripe, Razorpay, UPI, EMI)

### Phase 3 (E-Commerce)
- [ ] Product catalog with collections
- [ ] Shopping cart with persistence
- [ ] Multi-step checkout
- [ ] Inventory management
- [ ] Tax engine

### Phase 4 (AR, AI)
- [ ] WebAR virtual try-on
- [ ] AI customer support
- [ ] Visual search
- [ ] Video consultations
- [ ] Influencer platform

### Phase 5 (Launch)
- [ ] Notifications (Email, WhatsApp, Push)
- [ ] Analytics dashboard
- [ ] Security hardening
- [ ] Performance optimization

## Country Routes

The platform uses country-specific routes:
- **India:** https://thegrandgold.com/in
- **UAE:** https://thegrandgold.com/ae
- **UK:** https://thegrandgold.com/uk

Automatic geolocation detection redirects users to their country.

## API Endpoints

### Auth Service (port 4001)
```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
POST /api/auth/login/mfa    - MFA verification
POST /api/auth/refresh      - Refresh tokens
POST /api/auth/logout       - Logout
GET  /api/user/me           - Get current user
POST /api/mfa/setup         - Setup MFA
GET  /api/auth/oauth/google - Google OAuth
```

### Seller Service (port 4002)
```
POST /api/sellers/onboarding/start     - Start seller onboarding
GET  /api/sellers/onboarding/status    - Get onboarding status
POST /api/sellers/onboarding/documents - Upload documents
POST /api/sellers/products             - Create product
GET  /api/sellers/me/dashboard         - Seller dashboard
GET  /api/sellers/settlements          - Get settlements
```

### Fintech Service (port 4003)
```
GET  /api/fintech/price/live           - Get live gold prices
POST /api/fintech/price-lock/create    - Create price lock
GET  /api/fintech/price-lock/:id       - Get price lock status
POST /api/fintech/price-alert          - Create price alert
WS   /ws                                - WebSocket for real-time prices
```

### Order Service (port 4004)
```
GET  /api/cart                         - Get cart
POST /api/cart/items                   - Add to cart
POST /api/checkout/initiate            - Start checkout
POST /api/checkout/:id/confirm         - Confirm order
GET  /api/orders                       - Get orders
GET  /api/tracking/:orderId            - Track order
```

### Payment Service (port 4005)
```
POST /api/payments/create              - Create payment
POST /api/payments/stripe/create-intent - Create Stripe payment
POST /api/payments/razorpay/create-order - Create Razorpay order
GET  /api/payments/emi-options         - Get EMI options
POST /api/payments/refunds/request     - Request refund
```

### KYC Service (port 4006)
```
GET  /api/kyc/status                   - Get KYC status
POST /api/kyc/tier1/submit             - Submit Tier 1 KYC
POST /api/kyc/tier2/submit             - Submit Tier 2 KYC
POST /api/kyc/documents                - Upload KYC documents
GET  /api/kyc/limits                   - Get transaction limits
POST /api/kyc/verification/phone/send  - Send phone OTP
POST /api/kyc/aml/transaction-check    - AML transaction check
```

## GCP Deployment

### Initial Setup

1. **Install gcloud CLI:**
   ```bash
   brew install google-cloud-sdk
   ```

2. **Authenticate:**
   ```bash
   gcloud auth login
   gcloud config set project grandgold-prod
   ```

3. **Set up database:**
   ```bash
   ./infrastructure/gcp/setup-database.sh
   ```

4. **Set up Redis:**
   ```bash
   ./infrastructure/gcp/setup-redis.sh
   ```

5. **Deploy services:**
   ```bash
   ./infrastructure/gcp/deploy-all.sh
   ```

### CI/CD with Cloud Build

Push to main branch triggers automatic deployment via Cloud Build.

## Environment Variables

See `env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `METALS_DEV_API_KEY` - Gold pricing API key
- `STRIPE_SECRET_KEY` - Stripe payment key
- `RAZORPAY_KEY_ID` - Razorpay payment key

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Proprietary - All rights reserved.
