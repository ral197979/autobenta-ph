# Performance Certification

**Document:** PERFORMANCE_CERTIFICATION  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production  
**Auditor:** System audit via code review

---

## Database Indexes

Indexes confirmed present in `backend/prisma/schema.prisma`:

**VehicleListing**
- `status`
- `make`, `model` (composite)
- `city`
- `price`
- `year`
- `mileage`
- `createdAt`
- `sellerId`
- `dealerId`
- `fraudScore`

**Lead**
- `dealerId` + `status` (composite)

**MarketplaceEvent**
- `eventType` + `createdAt` (composite)
- `listingId` + `eventType` (composite)
- `dealerId` + `eventType` (composite)
- `sessionId`
- `createdAt`

**ListingMetrics**
- `listingId` — unique index

**DealerMetrics**
- `dealerId` — unique index

---

## Query Patterns

Prisma `include` directives use batched JOINs, not N+1 sequential queries. Confirmed for:

- Lead fetches with listing and photo includes — single query with JOIN
- Listing fetches with dealer and metrics includes — single query with JOIN

No N+1 patterns were identified in the audited route files.

---

## Known Slow Paths

**1. GET /me/customers — In-Memory Customer Aggregation**

**File:** `backend/src/routes/dealers.js`

The route loads all leads for the authenticated dealer into Node.js memory and groups them by buyer identity using JavaScript. At current scale (expected <1,000 leads per dealer at launch) this is acceptable. At 10,000+ leads, this will produce slow responses and elevated memory usage per request.

**Status:** P2 — Open. Not blocking for launch.  
**Recommended fix:** Replace with a database-side `GROUP BY` query at scale.

**2. GET /admin/dealers — No Pagination**

**File:** `backend/src/routes/admin.js`

The admin dealer list endpoint has no `skip`/`take` pagination. It returns the full result set on every request.

**Status:** P2 — Open. Not a concern until 500+ dealers.  
**Recommended fix:** Add `skip`/`take` with a default page size of 50.

**3. GET /admin/featured — No Pagination**

**File:** `backend/src/routes/featured.js`

The admin featured listings endpoint returns the full result set without pagination.

**Status:** P2 — Open. Not a concern until 500+ featured listings.  
**Recommended fix:** Add `skip`/`take` with a default page size of 50.

---

## Payload Sizes

- Lead list responses include listing data and photos via Prisma `include` — moderate payload size, acceptable for dealer CRM use
- Admin dealer list responses include `_count` aggregates — small overhead per record
- No large BLOB or base64-encoded binary data found in any API response

---

## No N+1 Patterns Found

Prisma `include` uses batched query execution internally. All audited routes that load related records use `include` rather than sequential per-record queries. No explicit loops containing `findUnique` or `findFirst` calls were observed in the audited route files.

---

## Missing Configurations

- **Query timeout:** No global Prisma query timeout is configured. Long-running queries will not be automatically cancelled.
- **Connection pool sizing:** Prisma uses its default connection pool. For production, explicit `connection_limit` in `DATABASE_URL` is recommended based on expected concurrency.

---

## Frontend Bundle

- **Modules:** 1,653
- **Bundle size:** 625 KB (gzip: 164 KB)

The bundle size is large for a marketplace application. Code-splitting by route (React lazy + Suspense) is recommended to reduce initial load time, particularly for admin and dealer portal routes which are not visited by buyers.

---

## Findings

| ID | Finding | Status |
|---|---|---|
| P2-02 | Customer aggregation in-memory — degrades at 10K+ leads | Open |
| P2-03 | No pagination on admin dealer and featured list endpoints | Open |
| — | No query timeout configured | Open |
| — | Frontend bundle large — code-splitting recommended | Open |

---

## Verdict: PASS WITH NOTES

No blocking performance issues at launch scale. All known slow paths are P2 open items that do not affect current expected load. Pagination and database-side aggregation should be implemented before scaling to 500+ dealers.
