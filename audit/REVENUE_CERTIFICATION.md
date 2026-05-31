# Revenue Platform Certification

**Document:** REVENUE_CERTIFICATION  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production  
**Auditor:** System audit via code review

---

## Revenue Models

AutoBentaPH operates four revenue streams:

1. **Subscriptions** — dealers pay a recurring plan fee (tracked in `DealerSubscription` model, plan tiers enforced via `requireFeature` middleware)
2. **Featured Listings** — dealers pay to boost listings across homepage, search, and sponsored slots (tracked in `FeaturedListing` model)
3. **Lead Credits** — dealers purchase credit packages to unlock buyer lead contact details (tracked in `LeadCredit`, `CreditPackage`, `CreditTransaction` models)
4. **Billing** — invoices generated for all paid events, with full status lifecycle

---

## Invoice Model

**Fields:** `id`, `dealerId`, `invoiceNumber`, `amount`, `currency`, `status`, `dueDate`, `paidAt`, `items` (JSON), `notes`, `createdAt`, `updatedAt`

**Status Lifecycle:**

```
pending → paid
pending → failed
paid    → refunded
any     → void
```

Status transitions are controlled via `PATCH /admin/invoices/:id` (admin only) and the dealer-facing payment flow.

---

## Invoice Number Format and Collision Risk

**Format:** `INV-${Date.now()}-${dealerId.slice(0,6).toUpperCase()}`

**File:** `backend/src/routes/billing.js`

**Collision Risk (P2-04):** Two concurrent admin invoice creations for the same dealer within the same millisecond would produce identical invoice numbers. The `invoiceNumber` field has a `@unique` constraint in the schema, so the second write would throw a Prisma unique constraint error rather than silently creating a duplicate. The probability is very low but not zero.

**Recommendation:** Replace `Date.now()` with a UUID suffix: `INV-${dealerId.slice(0,6).toUpperCase()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`

---

## Credit System

**Models:** `LeadCredit` (balance per dealer), `CreditPackage` (purchasable packages), `CreditTransaction` (audit trail of each credit event)

**Atomic Award Fix (P1-03 — RESOLVED)**

Original code in `backend/src/routes/credits.js` performed two sequential DB calls:

```js
await leadCredit.upsert(...)      // update balance
await creditTransaction.create(...) // record transaction
```

A server crash between these two calls would leave the balance updated but no transaction record — balance and audit trail could diverge. Fix: both calls are now wrapped in a single `prisma.$transaction()`, ensuring atomicity.

---

## Featured Listings

**featureType Validation Fix (P1-04 — RESOLVED)**

`backend/src/routes/featured.js` previously accepted any string for `featureType`. Fix: validated against `['homepage', 'search_boost', 'featured_dealer', 'sponsored']`.

**Additional validations confirmed:**
- `endAt` must be a future date — validated before creation
- Listing ownership confirmed via `prisma.vehicleListing.findFirst({ where: { id: listingId, dealerId: dealer.id } })` before any featured entry is created

---

## MRR Calculation

Source: `backend/src/routes/analytics.js`

- **MRR** = sum of `amount` for all invoices with `status: 'paid'` in the current month
- **ARPU** = MRR / count of active paid dealers
- **mrrGrowth** = (currentMRR - previousMRR) / previousMRR × 100

---

## Plan Entitlements

The `requireFeature` middleware enforces plan-gated features. A `PLAN_FEATURES` matrix maps each plan tier to its allowed features. Route handlers call `requireFeature('feature_name')` which checks the dealer's active subscription plan against the matrix. Dealers on insufficient plans receive 403 before the route handler executes.

---

## Findings

| ID | Finding | Status |
|---|---|---|
| P1-03 | Credit award non-atomic — balance and transaction record could diverge on crash | RESOLVED |
| P1-04 | `featureType` not validated — arbitrary strings accepted | RESOLVED |
| P2-04 | Invoice number uses `Date.now()` — possible unique constraint collision under concurrent load | Open |

---

## Verdict: PASS WITH NOTES

All P1 revenue findings are resolved. The credit system is now atomic. Featured listing validation is enforced. P2-04 (invoice number collision) is low-probability and will cause a DB error rather than a silent data issue, but a UUID suffix is recommended before high billing volume.
