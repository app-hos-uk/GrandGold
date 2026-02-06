# Remaining Production-Readiness Items

> Last updated: Feb 2026

This document tracks items that require deeper refactoring, backend service deployment, or product decisions before the platform is fully production-ready.

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ | Fixed / Completed |
| 🔧 | Partially fixed (interim solution in place) |
| ⏳ | Pending — needs backend service or product decision |

---

## 1. Product Catalog — API Integration

**Status:** 🔧 Partially fixed

**What was done:**
- Product detail page (`/product/[id]`) now uses the shared `lib/product-data.ts` instead of its own duplicate hardcoded catalog.
- Collections page also uses `lib/product-data.ts` as the single source of truth.
- All product data edits (name, price, purity, stock) are now in ONE file.

**What remains (for production):**
- [ ] Replace `MOCK_PRODUCTS` reads with `fetch('/api/products/:id')` calls to the product-service.
- [ ] The product-service backend (`services/product-service`) is fully built with endpoints:
  - `GET /api/products/:id` — single product
  - `GET /api/search?q=&country=&category=&priceMin=&priceMax=&purity=` — full search
  - `GET /api/products` — list products
- [ ] Once product-service is deployed and populated with real catalog data, update:
  - `apps/web/src/app/[country]/product/[id]/page.tsx`
  - `apps/web/src/app/[country]/collections/page.tsx`
  - `apps/web/src/app/[country]/category/[slug]/page.tsx`
  - `apps/web/src/components/home/trending-products.tsx`
- [ ] Product images are currently placeholder Sparkle icons — need real product photography or CDN URLs.

**Effort:** Medium (1-2 days once product-service is deployed with data)

---

## 2. Orders — Real Order History

**Status:** ✅ Fixed

**What was done:**
- Orders page now calls `GET /api/orders` (authenticated, proxied to order-service).
- Graceful fallback: shows "Sign in" CTA if 401, empty "Start Shopping" state if no orders.
- Loading spinner while fetching.
- Removed all hardcoded fake order data.

**What remains:**
- [ ] Ensure order-service is deployed and accessible in production (rewrite in `next.config.js` already configured).
- [x] Order detail page (`/account/orders/[id]`) wired to `GET /api/orders/:id` with full UI (progress timeline, tracking, price breakdown, shipping address, activity log).
- [x] "Track Order" shows tracking number with copy button and external tracking link when available.
- [x] "Download Invoice" button calls `GET /api/orders/:id/invoice` with auth header and downloads PDF.

**Effort:** Low (backend exists, just frontend wiring)

---

## 3. Live Gold Rates on Homepage

**Status:** ✅ Fixed

**What was done:**
- Homepage gold ticker now fetches from `/api/rates/metals` (same endpoint the header uses).
- Shows correct country-specific rates (INR/AED/GBP) instead of hardcoded INR values.
- Hero floating badge also uses live rate.
- 22K and 18K rates calculated from 24K using standard purity ratios.
- Fallback to reasonable defaults if API is unavailable.

**What remains:**
- [x] Created shared `GoldRateContext` React context — single API call shared between header and homepage (and any future component).
- [x] **Manual Metal Pricing Management:**
  - New admin page `/admin/pricing` for Super Admin and Country Admins.
  - Per-country pricing mode selector: **Manual** or **API** for each country (IN, AE, UK).
  - Manual 24K/22K/18K gold rate entry per country with auto-calculation (22K = 91.6%, 18K = 75% of 24K).
  - API rate adjustment % per country (e.g., +2% for local market markup).
  - Global API toggle to disable all external fetches.
  - Configurable API fetch schedule (UAE timezone) with add/remove/enable/disable per slot.
  - Fetch window configuration (5-30 minutes).
  - Live rates preview card showing what customers currently see.
  - New API `/api/admin/pricing` (GET/POST) with shared in-memory pricing store.
  - `/api/rates/metals` now respects manual pricing mode — serves manual rates when configured.
  - Admin nav sidebar includes "Metal Pricing" link for both super_admin and country_admin.
  - Admin dashboard shows live gold rate card with pricing mode indicator.
  - Settings → Integrations tab links to full pricing management page.
- [ ] Add daily % change indicator (requires storing previous day's rate in the rates API).

**Effort:** Low

---

## 4. Search — End-to-End Functional

**Status:** ✅ Fixed

**What was done:**
- Enhanced search modal in header with autocomplete, fuzzy matching, "did you mean" corrections, recent searches, and category browsing.
- Collections page reads `?search=` URL parameter and filters products accordingly.
- Fuzzy search with Levenshtein distance corrects misspellings (e.g., "neklace" → "necklace").
- "Did you mean" banner shown on collections page for corrected queries.
- Inline search bar on collections page for refining queries.

**What remains:**
- [ ] Wire to product-service search API (`GET /api/search?q=...`) for real backend search with MeiliSearch.
- [ ] Add search analytics (track popular queries, zero-result queries).
- [ ] Implement search result ranking/scoring on the backend.

**Effort:** Low-Medium (backend search already exists, just needs frontend integration)

---

## 5. Forgot Password — Full Reset Flow

**Status:** ✅ Fixed

**What was done:**
- Complete forgot password flow with two steps:
  1. **Request reset:** User enters email → calls `POST /api/auth/password/reset` → shows "check your email" confirmation.
  2. **Confirm reset:** User clicks email link → `/forgot-password?token=xxx` → enters new password → calls `POST /api/auth/password/reset/confirm`.
- Proper validation (min 8 chars, password match).
- Error handling for expired tokens with CTA to request new link.
- Show/hide password toggles.
- Loading states and success confirmations.

**What remains:**
- [ ] Ensure auth-service email sending is configured in production (SMTP/SendGrid/SES).
- [ ] The reset email template needs to include the correct frontend URL with token.
- [ ] Rate limiting on the password reset endpoint (prevent abuse).

**Effort:** Low (backend logic exists, just needs email delivery config)

---

## 6. AI Chatbot — Navigation & Intelligence

**Status:** ✅ Enhanced (latest session)

**What was done:**
- AI chat responses now include clickable **navigation action buttons** (View Product, Browse Category, Go to Account, etc.).
- Buttons navigate the user directly to the relevant page and close the chat panel.
- Product cards include `slug` for cleaner URLs.
- Context-aware navigation: KYC queries → "Go to KYC Settings", AR queries → "Try AR Now", etc.

**What remains:**
- [ ] Integrate with a real LLM API (OpenAI/Claude/Gemini) for natural language understanding instead of regex-based intent detection.
- [ ] Add conversation memory across sessions (currently relies on localStorage).
- [ ] Implement order tracking through the chatbot ("Where is my order GG-2024-001?").
- [ ] Add multilingual support (Hindi, Arabic for UAE).

**Effort:** Medium-High (LLM integration is significant)

---

## 7. Additional Items Not Yet Addressed

### Product Images
- All product pages show Sparkles icon placeholders instead of real product photos.
- **Action:** Upload product images to GCS bucket and update image URLs in product-service.

### Payment Integration
- Stripe and Razorpay API clients exist in `lib/api.ts` but the checkout flow needs end-to-end testing with real/test credentials.
- **Action:** Configure test API keys in `.env` and run through complete purchase flow.

### Email Notifications
- Transactional emails (order confirmation, shipping updates, password reset) require SMTP configuration.
- The notification-service exists but needs email template setup and delivery provider config.
- **Action:** Configure SendGrid/SES and set up email templates.

### Click & Collect
- Endpoint exists at `/api/click-collect/stores` but store locations need to be populated.
- **Action:** Add real store data to the database.

### Seller Dashboard — Real Data
- ~~Seller layout fetches profile via `authApi.getMe()` but product/order/revenue data on the seller dashboard is still mocked.~~
- [x] Seller dashboard now fetches real profile and order data from APIs. Greeting uses actual seller name.
- [x] Recent orders table and stats load dynamically with loading states and empty states.
- **Action:** Wire revenue analytics once seller-service analytics endpoint is deployed.

### Mobile Responsiveness
- Most pages are responsive but some modals/filters may need testing on small screens.
- **Action:** QA pass on mobile (iPhone SE, Android) for all pages.

### SEO & Meta Tags
- ~~Pages use basic titles.~~ Dynamic `document.title` added to all major pages (homepage, collections, product, orders, account).
- Root layout already has full Open Graph, Twitter Cards, and robots metadata.
- [x] Product pages now inject JSON-LD structured data (Product schema with aggregateRating, offers, material, weight).
- **Action:** Consider converting key pages to server components for SSR-rendered `<meta>` tags (currently client-side).

### Performance
- No image optimization (lazy loading, responsive srcset) since using placeholder icons.
- Bundle size analysis not done yet.
- **Action:** Run `next build --analyze` and optimize as needed once real images are in place.

### Security
- CSRF protection is in place via SameSite cookies.
- Rate limiting on auth endpoints should be verified in production.
- Content Security Policy headers could be tightened.
- **Action:** Security audit before public launch.

---

## Priority Order for Production Launch

1. **P0 (Launch blockers):**
   - Deploy all backend services to Cloud Run
   - Configure email delivery (password reset, order confirmations)
   - Add real product catalog with images
   - Payment gateway test credentials → live credentials

2. **P1 (First week post-launch):**
   - Wire product pages to product-service API
   - Wire collections/search to backend search API
   - Order tracking integration
   - Seller dashboard real data

3. **P2 (First month):**
   - LLM-powered AI chatbot
   - Search analytics
   - SEO optimization
   - Performance optimization
   - Mobile QA pass
