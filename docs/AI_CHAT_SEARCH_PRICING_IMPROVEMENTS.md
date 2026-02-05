# AI Chat, Search & Real-Time Pricing – Review & Improvement Plan

This document reviews the current AI chat (repeating replies), search (keyword suggestions), and country-specific real-time pricing, with concrete improvement steps and suggested APIs.

---

## 1. AI Chat – Repeating Replies

### Why replies repeat

- **Rule-based responses**: The web AI chat (`apps/web/src/app/api/ai/chat/route.ts`) uses `generateResponse()` with:
  - **Intent detection** via `detectIntent(message)` (keyword matching).
  - **Single response per intent**: Each intent (pricing, shipping, returns, KYC, etc.) maps to one fixed string in `KNOWLEDGE_BASE`. Same question type → same answer every time.
  - **Limited variation**: Only greetings use 3 random options; thanks and all knowledge-base answers are single strings.
- **Conversation history underused**: `history` is passed to the API but not used to:
  - Vary wording (“I already mentioned shipping – here’s a bit more detail…”).
  - Avoid repeating the same block of text when the user asks a similar question again.
- **Fallback path**: If the app used the ai-service (Vertex/Gemini), the mock fallback in `vertex.service.ts` is also one response per keyword; and the Vertex system prompt doesn’t instruct the model to vary phrasing or avoid repetition.

### Recommended improvements

1. **Add multiple phrasings per intent (quick win)**  
   In `apps/web/src/app/api/ai/chat/route.ts`:
   - Replace each single `KNOWLEDGE_BASE` string with an array of 2–3 equivalent answers.
   - Pick randomly:  
     `responses.push(KNOWLEDGE_BASE[intent][Math.floor(Math.random() * KNOWLEDGE_BASE[intent].length)]);`
   - Reduces repetition without changing architecture.

2. **Use conversation history to avoid repetition**
   - Before returning a knowledge-base answer, check the last N assistant messages (e.g. last 4).
   - If the same intent was already answered (e.g. same `intent` key or similar content), either:
     - Return a shorter “As I mentioned, …” variant, or
     - Return a different phrasing from the multi-phrasing array above.
   - Pass a short summary to the generator: e.g. “User already received full answer about shipping” so the reply can acknowledge it.

3. **Prefer LLM (Vertex) with a better system prompt**
   - Route chat through the ai-service when `GCP_PROJECT_ID` is set (or add a Next.js API route that proxies to the ai-service).
   - In `services/ai-service/src/services/vertex.service.ts`, update the system prompt to include:
     - “Vary your wording; do not repeat the same phrasing if the user asks something similar again.”
     - “If you already explained something in this conversation, briefly acknowledge and add only new details or a short recap.”
   - Keep sending the last 6–10 messages as you do now so the model has context.

4. **Optional: response deduplication**
   - Before appending a new assistant message, compare it (e.g. normalized text or embedding similarity) to the previous assistant message.
   - If too similar, either regenerate with “give a shorter/different formulation” or skip adding a duplicate.

5. **Chat widget**
   - Ensure the widget always sends `history` (last 10 messages) to the API. Your current code already does `messages.slice(-10)` – keep it and consider increasing to 12–15 if you rely more on the LLM.

**Files to change**

- `apps/web/src/app/api/ai/chat/route.ts`: multi-phrasing per intent, history-aware logic, optional proxy to ai-service.
- `services/ai-service/src/services/vertex.service.ts`: system prompt updates to reduce repetition and use conversation context.

---

## 2. Search – Keyword Suggestions Based on Available Data

### Current behavior

- **Header search** (`apps/web/src/components/layout/header.tsx`): The search modal shows hardcoded “Popular searches” (`Gold necklace`, `Diamond ring`, `Bridal set`, `22K gold`). The search input has no `onSubmit`/`onChange` that calls the product search API or navigates to results.
- **Product search**: The product-service uses **Meilisearch** (`services/product-service/src/services/product.service.ts`) with `productIndex.search(query, { filter, limit, offset })`. There is no dedicated “suggest” or “autocomplete” endpoint that returns keywords derived from the index.
- **AI chat** uses `lib/product-data.ts` (mock) `searchProducts()` for recommendations, not the live Meilisearch-backed API.

### Recommended improvements: suggest keywords from available data

1. **Add a search suggestions endpoint (product-service)**  
   Use Meilisearch to derive suggestions from actual data:
   - **Option A – Search-as-you-type**: Add a route, e.g. `GET /api/search/suggest?q=neu&country=IN&limit=10`. Call `productIndex.search(q, { limit: 10, filter: country, attributesToRetrieve: ['name', 'category', 'tags'] })`. Return:
     - **Suggested phrases**: Top product names, categories, and tags (deduplicated) so the UI can show “Suggestions: Necklaces, Diamond necklace, …”.
   - **Option B – Meilisearch multi-search**: One request with two searches: (1) suggestions (e.g. limit 5, attributesToRetrieve: ['name','category','tags']), (2) full product search. Parse and return both.
   - **Option C – Facets**: If you have Meilisearch faceting configured on `category` or `tags`, run a search with `facets: ['category','tags']` and use the top facet values as suggested keywords.
   - Prefer **Option A** for simplicity: same `searchProducts` logic, different limit and attributes; then in the response shape, return `{ suggestions: string[], products: [...] }` or a dedicated `suggest` endpoint that only returns `suggestions`.

2. **Implement suggestion source from index**
   - **Categories**: From Meilisearch config or a small static list that matches your index (e.g. Necklaces, Earrings, Rings, Bracelets, Pendants).
   - **Product names and tags**: From the hits of the suggestion search above (e.g. first 5–10 hits: collect `name`, `category`, `tags`, normalize and deduplicate, return as a list of suggested keywords).
   - Optional: maintain a **trending/popular** list (e.g. from analytics or a curated list) and merge with Meilisearch-driven suggestions.

3. **Wire the header search UI**
   - **onChange**: On input change (debounced, e.g. 200–300 ms), call `GET /api/search/suggest?q=...&country=...` and show a dropdown of suggested keywords (and optionally top 3–5 products).
   - **onSubmit** / **Enter**: Navigate to a search results page, e.g. `/${country}/search?q=...`, or open the same modal with results below (call `GET /api/search?q=...&country=...` and display results).
   - **“Popular searches”**: Replace hardcoded buttons with:
     - Either the first call to suggest with empty or a generic query (e.g. “gold”) returning top categories/terms, or
     - A dedicated `GET /api/search/popular?country=IN` that returns top categories + top product names/tags from the index (e.g. via a broad search or facets).
   - Make “Popular searches” and suggestion chips clickable to set the query and run search (same as typing and submitting).

4. **Country and filters**
   - Pass `country` from the header (e.g. from `country` prop or cookie) into both suggest and search API calls so suggestions and results are scoped to the same index/filters as the main search.

**Files to change**

- `services/product-service/src/routes/search.ts`: Add `GET /suggest` (and optionally `GET /popular`) that use `productService.searchProducts` or a new `getSearchSuggestions(query, country, limit)`.
- `services/product-service/src/services/product.service.ts`: Add `getSearchSuggestions(query, country, limit)` that runs Meilisearch with small limit and returns list of suggested strings (from names, categories, tags).
- `apps/web/src/components/layout/header.tsx`: Add state for `query`, `suggestions`, `results`; debounced fetch for suggestions; submit to `/${country}/search?q=...` or in-modal results; replace hardcoded “Popular searches” with API-driven or facet-based keywords.
- Optional: Add `apps/web/src/app/[country]/search/page.tsx` if you don’t have a search results page yet (use existing `/api/search`).

---

## 3. Real-Time Pricing by Country

### Current behavior

- **Header**: Static “Live Gold” and `goldRate` per country in `countryConfig` (e.g. `goldRate: '6,150'` for India). Not updated in real time.
- **Products**: Product-service stores a single `price` per product (no per-country or per-currency field). No conversion or live metal-price integration.

### Suggested APIs for real-time, country-specific pricing

All of these support multiple currencies and are suitable for “price by country”:

| API | Best for | Notes |
|-----|-----------|--------|
| **MetalpriceAPI** | Gold/silver/platinum in 150+ currencies | Real-time and historical; free tier; EU server option. [metalpriceapi.com](https://metalpriceapi.com/) |
| **Metals-API** | Multi-metal + 170+ currencies | LBMA fixings, multiple sources. [metals-api.com](https://api.metals-api.com/) |
| **Metals.Dev** | Enterprise-grade, low latency | ~60s delay on free tier; 170+ currencies; LBMA, LME, MCX, IBJA. [metals.dev](https://www.metals.dev/) |

**Recommendation**: Start with **MetalpriceAPI** or **Metals.Dev** (both have free tiers and clear docs). Use one API for:
- **Live metal rates** (e.g. XAU per gram in INR, AED, GBP) for the header “Live Gold” strip and for any “gold rate” content.
- **Currency conversion** if you store base prices in one currency (e.g. INR) and need to show AED/GBP by country.

### Integration approach

1. **Backend service (recommended)**
   - Create a small **pricing-service** (or a module in an existing service) that:
     - Calls the chosen API (e.g. MetalpriceAPI) on a schedule (e.g. every 1–5 minutes) or on-demand with short caching (e.g. 60s).
     - Caches in Redis: keys like `gold_rate:INR`, `gold_rate:AED`, `gold_rate:GBP`, and optionally `fx:INR:AED`, `fx:INR:GBP`.
   - Expose internal endpoints, e.g.:
     - `GET /rates/metals?currency=INR` (or `?country=IN`) → current gold/silver/platinum in that currency.
     - `GET /rates/convert?from=INR&to=AED&amount=1000` if you need FX for product prices.
   - Keep API key only on the server (env var), never in the frontend.

2. **Frontend**
   - **Header “Live Gold”**: Call your backend `GET /rates/metals?currency=...` (map country → currency: IN→INR, AE→AED, UK→GBP). Update every 1–2 minutes (e.g. `setInterval` or refetch on focus). Show rate and optional “▲ x%” from your backend if you store previous rate.
   - **Product prices**: Two options:
     - **A – Store one base price (e.g. INR)**  
       Backend converts to AED/GBP using cached FX or metal API before returning product to the client. Product-service (or API gateway) calls the pricing-service and attaches `priceInLocalCurrency` (or replaces `price`) per request based on `country`.
     - **B – Store per-country prices**  
       Sellers set prices per country; no real-time conversion. You can still show “Live gold rate” in header from the same API.

3. **Configuration**
   - Env vars: e.g. `METALPRICEAPI_KEY` or `METALS_DEV_API_KEY`, `PRICING_CACHE_TTL_SECONDS=60`.
   - Map country code to currency (IN→INR, AE→AED, UK→GBP) in one place (e.g. config or types).

**Implemented (Super Admin configuration + live header)**

- **Admin config API** (`apps/web/src/app/api/admin/config/route.ts`): Extended to store `integrations.metalPricing` (provider, apiKey, baseUrl). GET returns only `apiKeyConfigured` (no secret).
- **Super Admin UI** (`apps/web/src/app/admin/settings/page.tsx`): New **API Integrations** tab (Settings → Integrations). Card **Live Metal Pricing** with Configure/Update credentials; modal for provider (MetalpriceAPI / Metals.Dev), API Key, optional Base URL, Test connection, Save. Only Super Admins see Settings.
- **Rates API** (`apps/web/src/app/api/rates/metals/route.ts`): `GET /api/rates/metals` reads credentials from the same config file, calls the chosen provider, caches response 1 minute, returns `{ gold: { INR, AED, GBP }, updatedAt }`. Returns 503 if not configured.
- **Header** (`apps/web/src/components/layout/header.tsx`): Fetches `/api/rates/metals` and shows live 24K gold/g for the current country when configured; otherwise falls back to static rate.

**Files to add/change (optional)**

- New: `services/pricing-service` (or `modules/pricing` in product-service): fetch from MetalpriceAPI/Metals.Dev, cache in Redis, expose `GET /rates/metals`, optionally `GET /rates/convert`.
- `apps/web`: config/country → currency mapping; header component calls your backend for “Live Gold” and displays it with a short refresh interval.
- Product-service (if you do conversion): when returning product by country, call pricing-service to convert `price` to local currency and add or replace the price field.

---

## Summary

| Area | Issue | Main fix |
|------|--------|----------|
| **AI chat** | Repeating replies | Multiple phrasings per intent; use history to shorten/vary when repeating; improve Vertex system prompt; optional deduplication. |
| **Search** | No suggestions from data; search not wired | Add `/api/search/suggest` (and optionally `/popular`) using Meilisearch; wire header search (debounced suggest + submit to results); replace hardcoded “Popular searches” with API/facets. |
| **Pricing** | Static rates; no country-specific real-time | Integrate MetalpriceAPI or Metals.Dev in a backend pricing module; cache rates; expose `/rates/metals` (and FX if needed); header and product prices use this by country/currency. |

Implementing the AI chat and search changes can be done inside the existing codebase; real-time pricing will need a small new service or module and env configuration for the chosen API key.
