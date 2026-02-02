# GrandGold Platform
## Features and Functions Document

**Document Purpose:** Business and user-facing description of GrandGold capabilities  
**Audience:** Stakeholders, product owners, business analysts, end users  
**Version:** 1.0  
**Date:** February 2026

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Shopping Experience](#2-shopping-experience)
3. [Account and Identity](#3-account-and-identity)
4. [Orders and Payments](#4-orders-and-payments)
5. [Pricing and Fintech](#5-pricing-and-fintech)
6. [Sellers and Marketplace](#6-sellers-and-marketplace)
7. [Admin Operations](#7-admin-operations)
8. [Advanced Experiences](#8-advanced-experiences)
9. [Customer Support and Information](#9-customer-support-and-information)
10. [Compliance and Trust](#10-compliance-and-trust)

---

## 1. Platform Overview

### 1.1 What GrandGold Is

GrandGold is a luxury jewellery marketplace that operates across **India**, **UAE**, and **United Kingdom**. Customers can browse, compare, and purchase gold, silver, and platinum jewellery from multiple sellers through a single platform. The marketplace combines e-commerce with real-time precious metal pricing, identity verification for high-value purchases, and augmented reality try-on experiences.

### 1.2 Multi-Country Experience

| Region | What Customers See |
|--------|--------------------|
| **India** | Indian Rupees (₹), Indian states in address forms, GST tax, Indian payment methods (UPI, Net Banking) |
| **UAE** | UAE Dirhams (AED), Emirates in address forms, VAT, UAE-compliant payment options |
| **United Kingdom** | British Pounds (£), UK regions in address forms, VAT, international card payments |

Customers are automatically directed to the correct regional experience based on their location. They can also manually switch country if they wish to browse or ship to another region.

### 1.3 Seller Anonymity (“Veil”)

While browsing, customers see products as “GrandGold Certified” without knowing which seller offers them. Seller identity is revealed only when the customer proceeds to payment. This keeps the focus on product quality and trust in the platform rather than seller comparison during browsing.

---

## 2. Shopping Experience

### 2.1 Product Discovery

| Feature | Description |
|---------|-------------|
| **Product Catalog** | Browse jewellery by categories: Necklaces, Earrings, Rings, Bracelets, and more. |
| **Collections** | Curated sets such as Traditional Bridal, Contemporary Minimalist, or Middle Eastern Ornate. |
| **Search** | Keyword search with typo tolerance and partial matches. |
| **Filters** | Narrow by category, price range, metal type (14K, 18K, 22K, 24K), stone type, and other attributes. |
| **Product Comparison** | Compare up to four products side by side. |
| **Recently Viewed** | Quick access to recently browsed items. |
| **Wishlist** | Save favourites to a wishlist and move them to cart later. |

### 2.2 Product Details

| Feature | Description |
|---------|-------------|
| **High-Resolution Images** | Multiple views and angles for each product. |
| **360° Videos** | Rotate and inspect products in 360 degrees. |
| **Specifications** | Metal, purity, weight, stone details, dimensions, and hallmark status. |
| **Dynamic or Fixed Pricing** | Prices may update with gold rates or stay fixed per product. |
| **Reviews and Ratings** | Customer reviews and star ratings. |
| **Q&A** | Product questions and answers; mark answers as helpful. |
| **Visual Badges** | Indication when dynamic pricing applies or AR Try-On is available. |
| **Bundle Offers** | Product bundles with discounts. |

### 2.3 Shopping Cart

| Feature | Description |
|---------|-------------|
| **Add to Cart** | Add items with quantity selection. |
| **Update Quantities** | Increase or decrease quantities in the cart. |
| **Remove Items** | Remove items from the cart. |
| **Save for Later** | Move items out of the cart but keep them saved for later. |
| **Cart Persistence** | Cart contents are retained across visits and devices. |
| **Cart Summary** | Live subtotal, tax, shipping, and total. |
| **Cart Count Badge** | Visible item count in the header. |
| **Guest Cart Merge** | When a guest signs in, their cart is merged with their account cart. |
| **Mini Cart** | Quick preview of cart contents without leaving the page. |
| **Abandoned Cart Recovery** | Reminders for carts left without purchase. |

### 2.4 Checkout

| Feature | Description |
|---------|-------------|
| **Multi-Step Checkout** | Step 1: Shipping address; Step 2: Payment; Step 3: Confirmation. |
| **Address Form** | Full name, phone, address lines, city, state/region, postal code. |
| **Country-Specific Regions** | Indian states, UAE Emirates, or UK regions in the address form. |
| **Billing Address** | Option to use same as shipping or enter a different billing address. |
| **Order Notes** | Space for special instructions or gift messages. |
| **Order Summary** | Item list, subtotal, shipping, tax, and total before payment. |
| **Express Checkout** | Faster flow for returning customers. |
| **Gift Wrapping** | Optional gift wrapping and message. |
| **Scheduled Delivery** | Choose preferred delivery date where available. |
| **Insurance Option** | Transit insurance for high-value orders. |

---

## 3. Account and Identity

### 3.1 Registration and Login

| Feature | Description |
|---------|-------------|
| **Account Creation** | Register with email, password, name, phone, and country. |
| **Social Login** | Sign in with Google, Facebook, or Apple. |
| **Two-Factor Authentication (MFA)** | Optional extra security via one-time codes. |
| **Password Recovery** | Reset forgotten passwords via email. |
| **Session Management** | Stay signed in across sessions with secure token handling. |

### 3.2 Profile Management

| Feature | Description |
|---------|-------------|
| **View Profile** | See name, email, phone, and country. |
| **Edit Profile** | Update name, phone, and other personal details. |
| **Address Book** | Save multiple shipping and billing addresses. |
| **Notification Preferences** | Choose how and when to receive emails and push notifications. |
| **Payment Methods** | Save cards for faster future checkout. |
| **Account Settings** | Control privacy and communication preferences. |

### 3.3 Identity Verification (KYC)

GrandGold uses a tiered verification process for higher-value purchases and regulatory compliance:

| Tier | When It Applies | What Is Required |
|------|-----------------|------------------|
| **Tier 1** | General jewellery purchases | Email and phone verification, basic address. |
| **Tier 2** | Bullion or higher-value jewellery | Government-issued ID (passport, national ID, driving licence), address proof, and sometimes a selfie. |
| **Tier 3** | Highest-value transactions | Extended documentation and review. |

Verification status and transaction limits are shown in the account. Document uploads are reviewed; automated checks may be used where supported.

---

## 4. Orders and Payments

### 4.1 Order Lifecycle

| Stage | Meaning |
|-------|---------|
| **Pending** | Order placed; awaiting confirmation. |
| **Confirmed** | Order accepted. |
| **Processing** | Order is being prepared. |
| **Shipped** | Order dispatched; tracking available. |
| **Delivered** | Order received. |
| **Cancelled** | Order cancelled before delivery. |

### 4.2 Order Management (Customer)

| Feature | Description |
|---------|-------------|
| **Order History** | List of past and current orders. |
| **Order Details** | Full order summary, items, addresses, payment, and status. |
| **Shipment Tracking** | Tracking number and carrier link when available. |
| **Reorder** | One-click reorder of previous purchases. |
| **Return Requests** | Initiate returns for eligible items. |
| **Digital Receipts** | Download or view order invoices. |
| **Order Modifications** | Change or cancel before processing (where allowed). |

### 4.3 Payment Methods

| Region | Payment Options |
|--------|-----------------|
| **India** | Credit/debit cards, UPI (GPay, PhonePe, Paytm, BHIM), Net Banking, Cash on Delivery |
| **UAE** | Credit/debit cards, saved cards |
| **UK** | Credit/debit cards, saved cards |

### 4.4 Payment Features

| Feature | Description |
|---------|-------------|
| **Secure Checkout** | Encrypted payment handling. |
| **Saved Cards** | Store cards for faster future checkout. |
| **EMI / BNPL** | Installment or Buy Now Pay Later where available. |
| **Split Payments** | Pay with multiple methods (e.g. card + wallet). |
| **Price Lock** | Gold price locked for a short period at checkout. |
| **Refunds** | Refund handling for returns and cancellations. |

### 4.5 Shipping and Delivery

| Feature | Description |
|---------|-------------|
| **Shipping Quotes** | See shipping cost before finalising order. |
| **Delivery Estimates** | Estimated delivery dates. |
| **Free Shipping** | Applied when order value exceeds a threshold. |
| **International Shipping** | Cross-border shipping with import duty estimation. |
| **Return Shipping Labels** | Labels for eligible returns. |
| **Location Validation** | Check if delivery is available to the given address. |

---

## 5. Pricing and Fintech

### 5.1 Live Metal Pricing

| Feature | Description |
|---------|-------------|
| **Live Gold Price** | Real-time gold price (e.g. 24K) shown in the header. |
| **Price Ticker** | Gold, silver, and platinum prices with recent change indicators. |
| **Multi-Metal Support** | Prices for gold, silver, and platinum. |
| **Currency Conversion** | Prices displayed in local currency (INR, AED, GBP). |
| **Price Updates** | Prices refresh regularly without reloading the page. |

### 5.2 Price Calculation

| Component | Description |
|-----------|-------------|
| **Spot Price** | Base metal price from market. |
| **Making Charge** | Labour and craftsmanship. |
| **Stone Cost** | Cost of stones (if any). |
| **Tax** | GST (India), VAT (UAE/UK) as applicable. |
| **Dynamic or Fixed** | Some products use live pricing; others have fixed prices. |

### 5.3 Price Alerts

| Feature | Description |
|---------|-------------|
| **Create Alerts** | Set target price (above or below) for gold, silver, or platinum. |
| **Manage Alerts** | View, edit, or delete alerts. |
| **Notifications** | Alerts when price reaches the target. |
| **Price History** | Historical price charts. |

---

## 6. Sellers and Marketplace

### 6.1 Seller Onboarding

| Model | Description |
|-------|-------------|
| **Automated Onboarding** | Digital workflow: upload documents, complete forms, sign agreement. |
| **Manual (White Glove) Onboarding** | Admin-assisted onboarding for high-value or complex sellers. |

### 6.2 Seller Verification

| Step | Description |
|------|-------------|
| **Business Documents** | Trade licence, VAT/GST certificate, gold dealer permits. |
| **Country-Specific Forms** | GST (India), TRN (UAE), or equivalent as required. |
| **Bank Details** | Settlement account for payouts. |
| **Digital Agreement** | Electronic signing of the GrandGold seller agreement. |
| **Background Checks** | Automated and manual checks where applicable. |

### 6.3 Seller Tools

| Feature | Description |
|---------|-------------|
| **Product Listing** | Add products with photos, descriptions, specifications, and pricing. |
| **Bulk Upload** | Upload many products at once via spreadsheet. |
| **Inventory Sync** | Sync with existing business systems where integrated. |
| **Performance Dashboard** | Sales, views, and other key metrics. |
| **Rating System** | View and respond to customer ratings. |
| **Support Ticketing** | Manage support tickets with customers and platform. |
| **Notifications** | Alerts for new orders, stock, settlements, and reviews. |
| **Payout Tracking** | View settlement status and payouts. |

### 6.4 Product Ingestion

| Method | Best For | Description |
|--------|----------|-------------|
| **Manual Wizard** | Boutique designers | Step-by-step product creation with optional AI-assisted descriptions. |
| **Bulk Matrix** | Wholesalers | Spreadsheet upload for many SKUs with validation. |
| **System Integration** | Enterprises | Live sync with existing inventory or ERP systems. |

---

## 7. Admin Operations

### 7.1 Admin Dashboard

| Feature | Description |
|---------|-------------|
| **Overview** | Revenue, orders, users, and product counts. |
| **User Management** | List, view, and manage customer and seller accounts. |
| **Order Management** | View and manage all orders. |
| **Product Management** | Approve, edit, or remove products. |
| **Seller Management** | Manage seller accounts and onboarding. |
| **Reports** | Sales, product, and user reports. |
| **Settings** | Platform configuration and preferences. |
| **Recent Activity** | Latest orders and actions. |
| **Top Sellers** | Seller performance summary. |

### 7.2 Admin Capabilities

| Function | Description |
|----------|-------------|
| **Invite Sellers** | Send invitations with onboarding instructions. |
| **KYC Review** | Review and approve or reject verification requests. |
| **Configuration** | Payment gateway and platform settings. |
| **Audit Trail** | Track admin actions for accountability. |
| **Bulk Operations** | Bulk updates for products, orders, or users. |

---

## 8. Advanced Experiences

### 8.1 Augmented Reality (AR) Try-On

| Feature | Description |
|---------|-------------|
| **Browser-Based AR** | Try on jewellery in the browser without a separate app. |
| **Necklace Try-On** | Virtual necklace placement using face and neck detection. |
| **Earring Try-On** | Virtual earring placement using ear detection. |
| **Camera Permission** | Request camera access with a clear permission flow. |
| **AR Screenshot** | Capture and save AR try-on images. |
| **3D Model Viewer** | Rotate and zoom 3D product models on web and mobile. |
| **Native AR (Mobile)** | On supported devices, use device-native AR (e.g. Android Scene Viewer, iOS Quick Look). |
| **Product Selection in AR** | Switch between products within the AR view. |

### 8.2 AI Customer Support

| Feature | Description |
|---------|-------------|
| **Chat Widget** | Floating chat for questions and support. |
| **Conversation History** | View past chats. |
| **Smart Responses** | Answers about products, pricing, orders, returns, and policies. |
| **Proactive Chat** | Chat offered at relevant moments (e.g. hesitation or cart abandonment). |
| **Escalation** | Handoff to human agents when needed. |
| **Multi-Language** | Support in multiple languages (e.g. English, Hindi, Arabic). |

### 8.3 Visual Search and Recommendations

| Feature | Description |
|---------|-------------|
| **Visual Search** | Upload a photo to find similar products. |
| **“Customers Also Bought”** | Product recommendations based on behaviour. |
| **Personalised Homepage** | Curated products based on browsing and purchase history. |
| **Style Matching** | “Complete the look” suggestions. |
| **Trending Products** | Popular items on the platform. |

### 8.4 Video Consultation

| Feature | Description |
|---------|-------------|
| **Book Appointments** | Schedule video calls with jewellery experts. |
| **In-Browser Video** | Video calls in the browser without a separate app. |
| **Screen Sharing** | Share product details during the call. |
| **Recording** | Record calls with consent for review. |
| **Time Zone Handling** | Correct scheduling across time zones. |
| **Reminders** | Email reminders before appointments. |

### 8.5 Click & Collect

| Feature | Description |
|---------|-------------|
| **Store Locator** | Find participating stores on a map. |
| **Pickup Scheduling** | Choose store, date, and time slot. |
| **Ready Notification** | Notification when order is ready for pickup. |
| **Pickup Reminders** | Reminders for scheduled pickups. |

### 8.6 Influencer Platform

| Feature | Description |
|---------|-------------|
| **Curated Storefronts** | Custom storefronts for influencers. |
| **Curated Racks** | Select products to showcase. |
| **Performance Dashboard** | Clicks, conversions, and earnings. |
| **Commission Tracking** | View and manage commissions. |
| **Payout System** | Receive payouts for referred sales. |
| **Affiliate Links** | Track sales via unique links. |

---

## 9. Customer Support and Information

### 9.1 Help and Policy Pages

| Page | Purpose |
|------|---------|
| **Help Center** | General help and how-to guides. |
| **Shipping Info** | Shipping methods, timelines, and costs. |
| **Returns** | Return policy, eligibility, and process. |
| **Contact Us** | Contact options and form. |
| **FAQ** | Frequently asked questions. |
| **Privacy Policy** | How personal data is used and protected. |
| **Terms of Service** | Terms and conditions of use. |
| **Cookie Policy** | Use of cookies and similar technologies. |

### 9.2 Communications

| Channel | Description |
|---------|-------------|
| **Email** | Order confirmations, shipping updates, promotions (opt-in). |
| **Push Notifications** | Browser and mobile push for key updates (opt-in). |
| **In-App Notifications** | Notifications within the platform. |
| **SMS** | Optional SMS for important alerts. |
| **WhatsApp** | Optional WhatsApp updates (opt-in). |

---

## 10. Compliance and Trust

### 10.1 Regulatory Compliance

| Area | Description |
|------|-------------|
| **KYC** | Tiered identity verification for higher-value purchases. |
| **AML Screening** | Checks to support anti-money laundering rules. |
| **Document Verification** | Automated and manual review of IDs and proofs. |
| **Transaction Limits** | Limits based on verification tier and country. |

### 10.2 Tax Compliance

| Feature | Description |
|---------|-------------|
| **Dynamic Tax Rules** | Country and category-specific tax rules. |
| **GST (India)** | Indian GST calculation and invoicing. |
| **VAT (UAE/UK)** | UAE and UK VAT handling. |
| **Import Duty** | Estimation for cross-border orders. |
| **Invoice Generation** | Tax-compliant invoices. |

### 10.3 Finance and Settlements (Sellers)

| Feature | Description |
|---------|-------------|
| **Transparent Ledger** | Breakdown of sale amount, commission, fees, tax, and net payout. |
| **Settlement Status** | Track stages: Escrow → Cleared → Disbursed. |
| **Fee Breakdown** | Platform commission, payment fees, and shipping surcharges. |
| **Commission Structure** | Clear commission rules by category or seller tier. |

### 10.4 Security and Privacy

| Feature | Description |
|---------|-------------|
| **Secure Login** | Strong authentication and optional MFA. |
| **Data Protection** | Personal and payment data handled according to regulations. |
| **Secure Payments** | Payment data not stored; use of certified payment providers. |

---

## Summary

GrandGold offers a full-featured luxury jewellery marketplace across India, UAE, and UK, including:

- **Shopping:** Browse, search, compare, wishlist, cart, and checkout with local payment and shipping options.
- **Accounts:** Registration, login, profile, addresses, saved payment methods, and tiered identity verification.
- **Orders:** Order history, tracking, returns, reorders, and digital receipts.
- **Pricing:** Live metal prices, price alerts, and dynamic or fixed product pricing.
- **Sellers:** Onboarding, product listing, performance tools, ratings, support, and payouts.
- **Admin:** Dashboard, user and order management, KYC review, and platform configuration.
- **Advanced:** AR try-on, AI support, visual search, video consultation, click & collect, and influencer features.
- **Trust:** KYC, AML, tax compliance, transparent settlements, and secure payments.

---

**Document End**
