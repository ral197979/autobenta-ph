# V8Atlas Analytics Integration Plan

**Document:** V8ATLAS_ANALYTICS_INTEGRATION_PLAN  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production

---

## Overview

V8Atlas is an external DMS (Dealer Management System) partner that pushes inventory into AutoBentaPH via webhook. This document defines how analytics events, trust signals, and performance metrics flow between V8Atlas and the AutoBentaPH analytics platform.

---

## Integration Architecture

```
V8Atlas DMS
    │
    │  HTTPS Webhook (HMAC-SHA256 signed)
    ▼
POST /api/v8atlas/webhook
    │
    ├─ INVENTORY_SYNC → upsert VehicleListing + propagate trust signals
    ├─ LEAD_CONVERTED → increment DealerMetrics.convertedLeads
    └─ DEALER_STATUS   → update Dealer.isVerified + tier
    │
    ▼
MarketplaceEvent (analytics pipeline)
ListingMetrics (denormalized counters)
DealerMetrics  (denormalized counters)
```

---

## Event Mapping: V8Atlas → MarketplaceEvent

When V8Atlas pushes an event, the webhook handler creates the corresponding `MarketplaceEvent` record so AutoBentaPH analytics captures the conversion regardless of where it originated.

| V8Atlas Event | MarketplaceEvent type | Counter updated |
|---|---|---|
| `inventory.created` | `LISTING_VIEW` (synthetic baseline) | `ListingMetrics.viewCount` |
| `lead.created` | `LEAD_CREATED` | `DealerMetrics.totalLeads` |
| `lead.converted` | `LEAD_CONVERTED` | `DealerMetrics.convertedLeads` |
| `dealer.verified` | _(no event, direct DB update)_ | `Dealer.isVerified = true` |
| `inventory.updated` | _(no event, listing upsert only)_ | — |

---

## Trust Signal Propagation

V8Atlas inventory pushes include trust fields that map directly to AutoBentaPH's verification model:

```javascript
// V8Atlas payload → AutoBentaPH fields
{
  "v8_ownership_verified": true   → ownershipVerified: true
  "v8_transfer_ready": true       → transferReady: true
  "v8_financing_eligible": true   → financingEligible: true
  "v8_vehicle_history": "url"     → vehicleHistoryAvailable: true
}
```

Trust fields set via V8Atlas sync are **admin-authority** (not self-claimed). They carry the same weight as admin-set trust badges in the trust impact measurement (`sellerVerified`, `ownershipVerified`, etc.).

All trust propagation runs inside a Prisma `$transaction` to ensure consistency between the listing record and any dependent state.

---

## Dealer Scorecard Impact

V8Atlas dealers benefit from the standard dealer scorecard formula:

```
score = verified(25) + tier(5/15/20) + winRate(30) + responseTime(10)
```

The `LEAD_CONVERTED` V8Atlas webhook increments `DealerMetrics.convertedLeads`, which directly improves the dealer's win rate component. V8Atlas dealers that respond via DMS integration will have accurate `avgResponseTimeMs` once the response-time tracking is wired to V8Atlas status updates.

**Minimum score for V8Atlas partner matching: B (60+)**  
This ensures sync only flows to committed, responsive dealer partners.

---

## Analytics Isolation (Feature Flag)

V8Atlas integration is gated behind the `V8ATLAS_ENABLED` environment variable:

```javascript
// backend/src/routes/v8atlas.js
if (!process.env.V8ATLAS_ENABLED) {
  return res.status(503).json({ error: 'V8Atlas integration not enabled' });
}
```

When disabled, no V8Atlas events enter the analytics pipeline. All analytics queries continue to function normally against AutoBentaPH-native events.

---

## Trust Impact: V8Atlas vs Native Listings

The trust impact API (`GET /api/analytics/trust-impact`) measures inquiry uplift per badge. V8Atlas listings will naturally accumulate trust badges faster than native listings. This creates an identifiable cohort for comparison:

```
V8Atlas listing (ownershipVerified=true, transferReady=true)
  ↓
Higher trust badge density
  ↓
Expected higher inquiry rate (measurable via uplift API)
```

This quantifies the V8Atlas integration's business value: V8Atlas listings that carry verified trust signals should show measurably higher conversion than equivalent non-V8Atlas listings.

---

## Analytics API Endpoints Available to V8Atlas

V8Atlas dealers have access to the standard dealer analytics suite via the dealer JWT:

| Endpoint | Description |
|---|---|
| `GET /dealer/analytics` | Overview: listings, leads, win rate, inventory aging |
| `GET /dealer/analytics/scorecard` | 0–100 score + A/B/C/D rank + breakdown |
| `GET /api/analytics/listing/:id/performance` | Per-listing performance score |
| `GET /api/analytics/exports/dealer/:id` | CSV export of dealer performance data |

No V8Atlas-specific endpoints exist. V8Atlas dealers are first-class platform participants.

---

## Data Quality Controls

### Webhook Verification
All inbound V8Atlas webhooks are verified with SHA-256 HMAC before processing:

```javascript
const sig = req.headers['x-v8atlas-signature'];
const expected = crypto
  .createHmac('sha256', process.env.V8ATLAS_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');
if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

Unverified webhooks are rejected before any analytics are recorded.

### Idempotency
The `MarketplaceEvent` table uses an `idempotencyKey` unique constraint. V8Atlas webhook retries will not double-count events. The key format: `v8atlas_{eventType}_{externalId}`.

### Low-N Confidence
Analytics responses flag signals with fewer than 100 listings in a comparison group as low-confidence. V8Atlas inventory, while growing, may initially fall into low-N territory for some trust signals.

---

## Reporting Cadence

| Report | Frequency | Audience |
|---|---|---|
| V8Atlas listing trust density | Weekly | AutoBentaPH + V8Atlas partner |
| V8Atlas dealer scorecard delta | Monthly | Dealer account managers |
| V8Atlas vs native conversion uplift | Quarterly | Business leadership |
| Integration health (webhook success rate) | Real-time | Ops / engineering |

---

## Phase Roadmap

| Phase | Capability | Status |
|---|---|---|
| Phase 1 | Webhook ingestion + trust propagation | Production |
| Phase 2 | LEAD_CONVERTED → DealerMetrics counter | Production |
| Phase 3 | V8Atlas cohort in trust impact analysis | Planned |
| Phase 4 | Response time via DMS status updates | Planned |
| Phase 5 | SALE_RECORDED from V8Atlas payment events | Future |
