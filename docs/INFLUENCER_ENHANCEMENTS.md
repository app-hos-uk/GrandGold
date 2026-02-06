# Influencer Marketing – Implemented & Suggested Enhancements

## Implemented (this round)

### Commission tickbox and selection (creation/edit)

- **Enable commission** – Toggle **"Earn commission on sales"** in the Add/Edit Influencer modal. When **off**, the influencer gets no commission (rate sent as 0). When **on**, rate and commission type are shown.
- **Commission based on** – Replaced the dropdown with **radio-style options** (single selection) so the commission base is chosen explicitly:
  - Total Product Price
  - Making Charge Only
  - Metal Value Only
  - Stone Value Only
- **List view** – For 0% rate the list shows **"No commission"** instead of "0% commission".
- **API** – `createRack` / `updateRack` accept optional `commissionType`; backend can store it when supported.

---

## Suggested enhancements

### Backend (product-service)

1. **Store `commissionType`**  
   Extend `InfluencerRack` in `services/product-service/src/lib/influencer-racks.ts` with `commissionType?: 'total_price' | 'making_charge' | 'metal_value' | 'stone_value'`. Persist in Redis with the rack. Use when calculating commission (e.g. from order line items).

2. **Commission calculation**  
   When recording commission (e.g. order completed via influencer link), compute amount from the chosen base (total price, making charge, metal value, or stone value) and apply `commissionRate`.

3. **Commission summary API**  
   `GET /api/influencers/:slug/commission` currently returns mock/Redis data. Consider:
   - Real aggregation from orders/commission ledger.
   - Filter by date range, status (pending/paid).

### Admin UI

4. **Commission modal – real data**  
   Replace mock data in `CommissionModal` with a call to `influencerApi.getCommission(slug)` and show actual totals, pending, paid, and history.

5. **Bulk actions**  
   Select multiple influencers (checkboxes) for bulk enable/disable commission or bulk rate update.

6. **Product picker**  
   Replace comma-separated product IDs with a searchable product picker (search products, select from list) so admins don’t need to copy IDs.

7. **Validation**  
   When commission is enabled, require rate in 0.1–100 and show an error if 0 or out of range.

### Storefront

8. **Influencer attribution**  
   Ensure referral/session tracks the influencer slug and that completed orders attribute commission to the correct rack.

9. **Public commission disclosure**  
   On the influencer storefront page, optionally show a short line like “X% commission on qualifying sales” if you want transparency.

---

## Files touched

- `apps/web/src/components/admin/influencer-modal.tsx` – Enable commission toggle, commission-type radio options.
- `apps/web/src/app/admin/influencers/page.tsx` – Pass `commissionType`, show “No commission” when rate 0.
- `apps/web/src/lib/api.ts` – `createRack` / `updateRack` body types include `commissionType`.
