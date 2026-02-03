# Management Review & Full Functionality Testing

This document describes the **deployment region**, **access URLs**, and a **full functionality testing checklist** for management review of The Grand Gold application.

---

## 1. Deployment Region

| Item | Value |
|------|--------|
| **Primary region** | `asia-south1` (Mumbai) |
| **GCP project** | `grandmarketplace` (Project #484382472654) |
| **Platform** | Google Cloud Run (serverless containers) |

All services (web, auth-service, product-service, order-service) are deployed in **asia-south1** for low latency in India and nearby markets (IN, AE, UK).

---

## 2. Access URLs (Post-Deploy)

After a successful Cloud Build deploy, obtain the live URLs from GCP Console or CLI:

```bash
# List Cloud Run services and URLs (run from project root)
gcloud run services list --region=asia-south1 --project=grandmarketplace --format="table(SERVICE,URL)"
```

| Service | Typical URL pattern | Use |
|---------|---------------------|-----|
| **Web (storefront + admin)** | `https://web-xxxxx-as.a.run.app` | Main app: storefront + admin panel |
| **Auth service** | `https://auth-service-xxxxx-as.a.run.app` | Login, register, JWT |
| **Product service** | `https://product-service-xxxxx-as.a.run.app` | Catalog, search |
| **Order service** | `https://order-service-xxxxx-as.a.run.app` | Cart, checkout, orders |

- **Storefront (customers):** `https://<WEB_URL>/in`, `/ae`, `/uk`
- **Admin panel:** `https://<WEB_URL>/admin` (requires admin login)
- **Admin login:** `https://<WEB_URL>/admin/login` (Super Admin / Country Admin only)
- **Seller dashboard:** `https://<WEB_URL>/seller` (requires seller login)
- **Seller login:** `https://<WEB_URL>/seller/login`
- **Customer login:** `https://<WEB_URL>/in/login` (or `/ae/login`, `/uk/login`)
- **Customer register:** `https://<WEB_URL>/in/register` (or `/ae/register`, `/uk/register`)

### Super Admin (first-time setup)

The **Super Admin** is the application owner with **global access** to all countries (IN, AE, UK). They are NOT restricted to any single country and can:

- View and manage data across **all countries**
- Create and assign **Country Admins** for specific countries
- Access all admin features without geographic limits
- Manage users, orders, products, KYC, refunds, seller onboarding globally

To create the Super Admin user in the database (run once, e.g. after first deploy):

```bash
# Set your production or staging DATABASE_URL, then:
DATABASE_URL="postgresql://..." pnpm db:seed
```

**Super Admin credentials (after seed):**

| Field | Value |
|-------|--------|
| Email | `mail@jsabu.com` |
| Password | `Admin@1234` |
| Role | `super_admin` (Global Access) |

Use these to sign in at `/admin/login`. The header will show **"Global Access"** badge and role as **"Super Admin (Global)"**.

### Country Admins

The Super Admin can assign Country Admins from the Users page:

1. Go to `/admin/users`
2. Find a user (or create one via storefront registration first)
3. Click **"Set country admin"** button (visible only to Super Admin)
4. Enter the country code (IN, AE, or UK)
5. The user now becomes a Country Admin scoped to that country

Country Admins only see data for their assigned country.

---

## 3. Full Functionality Testing Checklist

Use this checklist for management review and end-to-end testing.

### 3.1 Storefront (Customer)

| # | Area | Test | Pass |
|---|------|------|------|
| 1 | Home | Load `/in`, `/ae`, `/uk` — hero, collections, gold ticker, footer tagline | |
| 2 | Navigation | Header: Shop, AR Try-On, Consultation, Cart, Account, country selector | |
| 3 | Collections | Browse `/in/collections`, filters, product cards | |
| 4 | Product detail | Open a product, price, add to cart, wishlist | |
| 5 | Cart | Add items, update qty, remove, proceed to checkout | |
| 6 | Checkout | Guest/registered flow, address, payment placeholder, place order | |
| 7 | Account | Register, login, profile, orders, addresses, settings | |
| 8 | Contact | `/in/contact` — Kozhikode address, +91 9567455916, Info@thegrandgold.com | |
| 9 | Footer | Tagline: "Timeless Beauty. Inspired Craftsmanship. Perpetual Value." | |
| 10 | Theme | Gold (#C9A227), cream, burgundy accents, Cormorant/Playfair headings | |

### 3.2 Admin Panel

| # | Area | Test | Pass |
|---|------|------|------|
| 1 | Access | `/admin` redirects to login if not authenticated | |
| 2 | Login | Admin user can log in and reach dashboard | |
| 3 | Dashboard | Stats (revenue, orders, users, products), quick actions, recent orders | |
| 4 | Users | List, search, role change, KYC column, pagination | |
| 5 | Orders | List, status filter, date range, order detail drawer, status update | |
| 6 | Products | List, status/low stock badges, thumbnails, pagination | |
| 7 | Sellers | List, approve/reject, country filter | |
| 8 | KYC | Pending list, tier/country filter, approve/reject with confirm | |
| 9 | Refunds | Pending list, link to order, approve/reject | |
| 10 | Onboarding | Pending seller applications, country filter, approve/reject | |
| 11 | Reports | Revenue chart, category breakdown, country breakdown | |
| 12 | Settings | Super Admin only; country admin assignment if implemented | |
| 13 | Theme | Dark sidebar (#0F0F0F), gold gradient active nav, cream content area | |

### 3.3 Seller Dashboard

| # | Area | Test | Pass |
|---|------|------|------|
| 1 | Access | `/seller` requires seller (or admin) login | |
| 2 | Dashboard | Overview, orders, inventory summary | |
| 3 | Products/Inventory | Add/edit products, stock, images | |
| 4 | Orders | List, status, fulfill | |
| 5 | Payouts | Payout history or placeholder | |
| 6 | Settings | Profile, business details | |

### 3.4 Auth & Cross-Country

| # | Area | Test | Pass |
|---|------|------|------|
| 1 | Register | New user in IN/AE/UK, email verification if enabled | |
| 2 | Login | Email + password, JWT stored, redirect to intended page | |
| 3 | Logout | Session cleared, redirect to storefront | |
| 4 | Country switch | Change country in header; URLs and content update (e.g. /in → /ae) | |

### 3.5 Responsive & Accessibility

| # | Area | Test | Pass |
|---|------|------|------|
| 1 | Mobile | Storefront and admin usable on 375px width | |
| 2 | Tablet | Layout adapts (e.g. 768px) | |
| 3 | Keyboard | Tab order, focus visible, no trap | |
| 4 | Screen reader | Critical labels and headings announced | |

---

## 4. Running a Manual Deploy (Staging/Review)

To deploy the latest code for management review:

```bash
# From repo root, ensure main is up to date
git checkout main
git pull origin main

# Trigger Cloud Build (grandmarketplace project, asia-south1)
gcloud builds triggers run grandgold-deploy \
  --region=asia-south1 \
  --project=grandmarketplace \
  --branch=main
```

Monitor build: [Cloud Build Console](https://console.cloud.google.com/cloud-build/builds?project=grandmarketplace).

After success, use **Section 2** to get the live Web URL and share it with reviewers along with this checklist.

---

## 5. Brand & Theme Verification

- **Tagline:** "Timeless Beauty. Inspired Craftsmanship. Perpetual Value." (footer and brand moments).
- **Primary gold:** `#C9A227`.
- **Contact (India):** +91 9567455916, Info@thegrandgold.com, Kozhikode address as in footer/contact page.
- **Admin:** Near-black sidebar (`#0F0F0F`), gold gradient for active nav, cream content background.

---

*Last updated: with theme implementation and asia-south1 as the single full-fledged region for management review and testing.*
