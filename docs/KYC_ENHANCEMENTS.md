# KYC Area – Enhancements (Influencers & All Users)

## Implemented

### 1. Influencer KYC collection and visibility

- **Admin KYC page** now has a dedicated **"Influencer KYC"** section at the top:
  - Lists all users with role **Influencer** and their KYC status (Not started / Pending / Verified / Rejected) and tier.
  - Copy explains that influencers must complete Tier 2 KYC before receiving commissions.
  - "View user" links to the Users page for each influencer.
- Influencers are required to complete the same KYC flow as other users (Tier 1 → Tier 2); admins review and approve in the same queue.

### 2. KYC area enhancements for all users

- **Role column and filter**
  - Pending applications table shows **User** (name + email), **Role** (badge: influencer / seller / customer), **Tier**, **Country**, **Submitted**, **Status**, **Actions**.
  - **Role filter** dropdown: All roles, Influencer, Seller, Customer so admins can focus on e.g. influencer KYC.
- **User details on pending list**
  - Pending list is enriched with user data (name, email, role) by calling the auth service with the list of applicant user IDs (`getUsersByIds`).
- **Database and auth API**
  - `listUsers` in `@grandgold/database` now accepts optional **`ids: string[]`** to return only those users.
  - Auth service `GET /api/user/admin/list` accepts **`ids`** query param (comma-separated) and passes it to `listUsers`.
- **Admin API**
  - `adminApi.getUsersByIds(ids)` for fetching user details by ID.
  - `adminApi.getUserKyc(userId)` returns one user’s KYC or `null` if 404 (used for influencer KYC status).
- **Approve/Reject**
  - Approve/reject payloads send `tier` as `'tier1'` or `'tier2'` so the KYC service receives the correct type.

### 3. Influencer creation and KYC

- **Influencer modal** (Add/Edit) includes a note: *"Influencer KYC: Users with the Influencer role must complete Tier 2 KYC before they can receive commissions. Review submissions in Admin → KYC."* with a link to the KYC page.

---

## Suggested next steps

1. **Link influencer rack to user**
   - Add optional `userId` to influencer racks (product-service / API) so a rack is tied to a user account. Then:
   - Show “Linked user” and their KYC status on the influencer card in Admin → Influencers.
   - Require KYC verified before enabling commission payouts for that rack.

2. **Block commission payouts until KYC verified**
   - When recording or paying influencer commission, check the linked user’s KYC status (or role-based KYC) and block payout if Tier 2 is not verified.

3. **User-facing KYC flow**
   - Ensure customers/sellers/influencers have a clear path to submit KYC (e.g. Account → Verification) with Tier 1 and Tier 2 steps, document upload, and status.

4. **KYC status in user list**
   - In Admin → Users, show a KYC column (e.g. Not started / Pending / Verified) and a quick link to the KYC detail or pending queue.

5. **Bulk status endpoint**
   - Add `GET /api/kyc/admin/status-bulk?userIds=id1,id2` to avoid N+1 when loading influencer KYC status (single call instead of one per influencer).

6. **Document viewer**
   - In Admin KYC, add “View” for each application to see uploaded documents (front + back, selfie, address proof) before approving/rejecting.

---

## Files changed

- `packages/database/src/queries/users.ts` – `ListUsersOptions.ids`, `inArray` filter in `listUsers`.
- `services/auth-service/src/routes/user.ts` – support `ids` query param on `GET /api/user/admin/list`.
- `apps/web/src/lib/api.ts` – `getUsers` ids param, `getUsersByIds`, `getUserKyc`, approve/reject body tier as string.
- `apps/web/src/app/admin/kyc/page.tsx` – Influencer KYC section, role filter, user enrichment, table columns.
- `apps/web/src/components/admin/influencer-modal.tsx` – KYC requirement note and link to Admin → KYC.
- `docs/KYC_ENHANCEMENTS.md` – this doc.
