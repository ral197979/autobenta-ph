# Tenant Isolation Certification

**Document:** TENANT_ISOLATION_CERTIFICATION  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production  
**Auditor:** System audit via code review

---

## Isolation Model

Dealer identity is always derived from the authenticated JWT `userId`, never from a client-supplied request parameter. The flow is:

1. `authenticate` middleware validates JWT and performs a live DB lookup on `User`
2. Dealer routes resolve the `Dealer` record using `userId` from the verified token: `prisma.dealer.findUnique({ where: { userId: req.user.id } })`
3. All subsequent DB queries scope to `dealer.id` from that resolved record

This means a dealer cannot escalate to another tenant's data by supplying a different ID in the URL or request body — the server-side `dealer.id` always wins.

---

## Test Matrix

| Resource | Isolation Method | Code Location | Result |
|---|---|---|---|
| Listings | `where: { dealerId: dealer.id }` on all list/create/update | `backend/src/routes/dealers.js` | PASS |
| Leads | `prisma.lead.findFirst({ where: { id: leadId, dealerId: dealer.id } })` | `backend/src/routes/dealers.js` | PASS |
| Invoices | `prisma.invoice.findFirst({ where: { id: invoiceId, dealerId: dealer.id } })` | `backend/src/routes/billing.js` | PASS |
| Credits | `where: { dealerId: dealer.id }` on `LeadCredit` and `CreditTransaction` reads | `backend/src/routes/credits.js` | PASS |
| Featured Listings | `prisma.vehicleListing.findFirst({ where: { id: listingId, dealerId: dealer.id } })` before feature creation | `backend/src/routes/featured.js` | PASS |
| Analytics Export | Explicit ownership check: `if (dealer.id !== dealerId) return res.status(403)` | `backend/src/routes/analytics.js` | PASS |
| Activities | `where: { dealerId: dealer.id }` on activity read and create | `backend/src/routes/dealers.js` | PASS |
| Customers | `where: { dealerId: dealer.id }` on lead aggregation query | `backend/src/routes/dealers.js` | PASS |
| Scorecard | `where: { dealerId: dealer.id }` on DealerMetrics lookup | `backend/src/routes/dealers.js` | PASS |
| Reminders | `where: { dealerId: dealer.id }` on DealerReminder read/write | `backend/src/routes/dealers.js` | PASS |

---

## Cross-Tenant Attack Scenarios

**Scenario 1: IDOR on Listing**

Dealer A sends `GET /api/dealer/listings/LISTING_ID_BELONGING_TO_DEALER_B`.

Result: The route resolves Dealer A's `dealer.id` from the JWT. The Prisma query includes `where: { id: listingId, dealerId: dealer.id }`. Since Dealer B owns that listing, `dealer.id` does not match — Prisma returns `null`. The route returns 404. Dealer A receives no information about Dealer B's listing.

**Scenario 2: IDOR on Lead**

Dealer A sends `PATCH /api/dealer/leads/LEAD_ID_BELONGING_TO_DEALER_B`.

Result: `prisma.lead.findFirst({ where: { id: leadId, dealerId: dealer.id } })` returns `null`. The route returns 404. Dealer A cannot read or modify Dealer B's lead.

**Scenario 3: IDOR on Invoice**

Dealer A sends `GET /api/dealer/billing/invoices/INVOICE_ID_BELONGING_TO_DEALER_B`.

Result: `prisma.invoice.findFirst({ where: { id: invoiceId, dealerId: dealer.id } })` returns `null`. The route returns 404.

**Scenario 4: Analytics Export with Explicit dealerId**

Dealer A sends `GET /api/analytics/export?dealerId=DEALER_B_ID`.

Result: The explicit check `if (dealer.id !== dealerId) return res.status(403)` fires before any data is returned. Dealer A receives 403.

**Scenario 5: Feature a Listing Owned by Dealer B**

Dealer A sends `POST /api/featured` with `listingId` belonging to Dealer B.

Result: `prisma.vehicleListing.findFirst({ where: { id: listingId, dealerId: dealer.id } })` returns `null`. The route returns 404 before creating any featured entry.

---

## Admin Bypass

Admin users intentionally have cross-tenant read access. Admin routes in `backend/src/routes/admin.js` use `router.use(authenticate, requireRole('admin'))` at the router level and do not scope queries to a single `dealerId`. This is by design — admins need to manage all dealers. Admin access requires the `admin` role in the JWT, which is only assigned via a separate admin provisioning flow, not through normal user registration.

---

## Verdict: PASS

All ten dealer-scoped resource types are isolated by `dealer.id` derived from the verified JWT. No client-supplied tenant identifier is trusted for access control. Cross-tenant read, write, and export attacks were analyzed and are blocked at the query layer.
