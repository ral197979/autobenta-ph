# Marketplace Analytics Architecture

**Document:** MARKETPLACE_ANALYTICS_ARCHITECTURE  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production

---

## Purpose

AutoBentaPH has a full trust and transaction feature set but no measurement layer. Without measurement, scaling decisions (dealer growth, V8Atlas integration, feature investment) are made without evidence. This analytics platform answers the questions that matter before we scale:

- Which trust features increase conversion?
- Which dealers perform best?
- Which funnel steps lose users?
- Which features generate revenue?

---

## Architecture Overview

```
Browser / Mobile
  │
  │  trackEvent('LISTING_VIEW', { listingId, sessionId, ... })
  │  fire-and-forget, never blocks UI
  │
POST /api/analytics/events
  │
  ├── Idempotency check (idempotencyKey @unique)
  ├── Write MarketplaceEvent row
  ├── Increment ListingMetrics / DealerMetrics counter
  └── Recalculate performanceScore
  
GET /api/analytics/marketplace    (admin)
GET /api/analytics/funnel         (admin)
GET /api/analytics/trust-impact   (admin)
GET /api/analytics/search-trends  (admin)
GET /analytics/listing/:id/performance  (owner or admin)
GET /analytics/exports/dealer/:id       (admin or dealer)

GET /dealer/analytics/scorecard   (dealer / admin)
```

---

## Data Models

### MarketplaceEvent
The raw event log. Every meaningful user action writes one row.

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| eventType | EventType enum | 18 types (see below) |
| userId | String? | Set if authenticated |
| sessionId | String | Browser session ID from sessionStorage |
| listingId | String? | |
| dealerId | String? | |
| source | String? | organic/google/facebook/direct/referral/dealer_campaign/marketplace_search |
| device | String? | mobile/tablet/desktop |
| referrer | String? | document.referrer |
| meta | Json? | Flexible — search query, filter state, etc. |
| idempotencyKey | String? @unique | Prevents duplicate events |
| createdAt | DateTime | Indexed |

### ListingMetrics
Denormalized counters per listing. Updated on every relevant event. Avoids counting queries on hot paths.

| Field | Notes |
|---|---|
| viewCount | Incremented on LISTING_VIEW |
| saveCount | LISTING_SAVE |
| shareCount | LISTING_SHARE |
| inquiryCount | SELLER_CONTACT + LEAD_CREATED |
| financingCount | FINANCING_REQUEST |
| inspectionCount | INSPECTION_REQUEST |
| performanceScore | 0–100, recalculated on every increment |

### DealerMetrics
Denormalized dealer performance counters.

### AnalyticsSnapshot
Daily marketplace health snapshot. Written by a cron job (architecture ready; scheduler not yet wired).

### ConversionFunnel
Periodic funnel snapshots for trend analysis.

---

## Event Types

| Event | Trigger |
|---|---|
| LISTING_VIEW | CarDetail page load |
| LISTING_SAVE | Favorite button click |
| LISTING_SHARE | Share action |
| SELLER_CONTACT | Inquiry form submit |
| FINANCING_REQUEST | Financing form submit |
| INSPECTION_REQUEST | Inspection booking |
| TRANSFER_CHECKLIST_STARTED | Checklist opened |
| TRANSFER_CHECKLIST_COMPLETED | All checklist items checked |
| VEHICLE_HISTORY_VIEWED | Vehicle history card expanded |
| SAFE_BUYING_VIEWED | Safe buying page load |
| VERIFICATION_VIEWED | Verification page/tab opened |
| LEAD_CREATED | Lead record created (server-side) |
| LEAD_CONVERTED | Lead status → closed_won |
| DEALER_PAGE_VIEW | Dealer profile page load |
| SEARCH_PERFORMED | Search query after 1s debounce |
| FILTER_APPLIED | Browse filter change |
| SALE_RECORDED | Reserved — future sale attribution |

---

## Frontend Tracking Layer

`frontend/src/utils/analytics.js` provides `trackEvent(eventType, payload)`:

- Generates a stable `sessionId` in `sessionStorage` (survives page navigation, cleared on tab close)
- Detects `device` from `window.innerWidth`
- Infers `source` from UTM params → referrer → direct
- Uses `fetch()` directly (not the app's Axios client) so network errors never propagate to React
- All errors are silently swallowed — analytics must never break the user experience

Idempotency: `LISTING_VIEW` events include `idempotencyKey: view_${listingId}_${sessionId}` — a user can refresh the page without double-counting views.

---

## Query APIs

### GET /api/analytics/marketplace
Marketplace health dashboard. Counts from live DB, not snapshots (latency acceptable at admin-only scale).

### GET /api/analytics/funnel
30-day conversion funnel from MarketplaceEvent counts per stage. Computes drop-off % between adjacent stages.

### GET /api/analytics/trust-impact
Compares ListingMetrics.inquiryCount for listings WITH vs WITHOUT each trust badge. Computes uplift %. This directly answers "which trust features increase conversion?"

### GET /api/analytics/search-trends
Aggregates SEARCH_PERFORMED events → top queries, makes, models, zero-result count. Feeds inventory strategy decisions.

### GET /analytics/listing/:id/performance
Per-listing performance breakdown. Visible to listing owner or admin.

### GET /analytics/exports/dealer/:id
CSV export of dealer lead list (admin or that dealer).

---

## Data Quality

### Idempotency
Events with `idempotencyKey` use Prisma upsert — the same key can be sent multiple times without creating duplicate rows. Key format per event type:
- LISTING_VIEW: `view_{listingId}_{sessionId}`
- SELLER_CONTACT: `contact_{listingId}_{sessionId}`
- SEARCH_PERFORMED: not deduplicated (intent is to count each search)

### Bot / Spam Prevention
- Server-side rate limiting via existing `apiLimiter` middleware applies to `/api/analytics/events`
- `sessionId` is client-generated (not authenticated) — susceptible to spoofing, but acceptable for aggregated analytics
- Future: add `Sec-Fetch-Site` header check; reject events from non-browser origins

### Missing Sessions
Sessions are initialized lazily on first `trackEvent` call. If a user navigates directly to a deep link with no prior interaction, `sessionId` is created on that first event — attribution starts from that point.

---

## Indexing Strategy

```sql
-- Hot query paths
CREATE INDEX idx_me_type_date ON marketplace_events(event_type, created_at);
CREATE INDEX idx_me_listing_type ON marketplace_events(listing_id, event_type);
CREATE INDEX idx_me_dealer_type ON marketplace_events(dealer_id, event_type);
CREATE INDEX idx_me_session ON marketplace_events(session_id);
CREATE INDEX idx_me_date ON marketplace_events(created_at);
```

These indexes are defined in Prisma schema via `@@index` directives and created by the migration.

---

## Scaling Notes

Current architecture is appropriate for up to ~1M events/month. Beyond that:

1. **Event ingestion**: Move from synchronous DB write to a queue (BullMQ + Redis) with async consumer
2. **Aggregation**: Replace live COUNT queries with pre-computed AnalyticsSnapshot rows (daily cron)
3. **Search trends**: Move to a dedicated search analytics store (ElasticSearch or ClickHouse)
4. **Export**: Move CSV generation to background job with presigned URL delivery

None of these changes require altering the client-side `trackEvent` interface.
