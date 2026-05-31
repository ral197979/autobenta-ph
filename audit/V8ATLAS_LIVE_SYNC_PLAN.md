# V8Atlas Live Sync Plan

**Document:** V8ATLAS_LIVE_SYNC_PLAN
**Version:** 1.0
**Date:** 2026-05-31
**Status:** Production

---

## What "Live Sync" Means

Live sync is near-real-time bidirectional data flow between AutoBentaPH and the V8Atlas Dealer Management System (DMS). "Near-real-time" means changes in V8Atlas are reflected in AutoBentaPH within seconds via webhooks; changes in AutoBentaPH are pushed to V8Atlas synchronously (on write) with async retry on failure.

This is not a batch ETL process. There is no nightly sync job. Data consistency is maintained through event-driven updates supplemented by a retry queue for failed pushes.

**Direction conventions:**

- **Inbound:** V8Atlas → AutoBentaPH (webhook-driven)
- **Outbound:** AutoBentaPH → V8Atlas (API call on event)

---

## Environment Variables

| Variable               | Required | Description                                           |
|------------------------|----------|-------------------------------------------------------|
| `V8ATLAS_ENABLED`      | Yes      | `true` to activate the adapter; `false` disables all V8Atlas calls |
| `V8ATLAS_BASE_URL`     | Yes      | Base URL for V8Atlas REST API, e.g. `https://api.v8atlas.com` |
| `V8ATLAS_API_KEY`      | Yes      | Bearer token for outbound API requests                |
| `V8ATLAS_WEBHOOK_SECRET` | Yes    | Shared secret for HMAC-SHA256 webhook signature verification |

When `V8ATLAS_ENABLED=false`, `V8AtlasAdapter` methods return empty/null responses without making network calls. This allows full local development and testing without a live V8Atlas instance.

---

## Provider Interface Abstraction

V8Atlas is registered as a named provider behind five interfaces. Business logic calls interface methods; it never references `V8AtlasAdapter` directly.

```typescript
interface DealerProvider    { getDealer(id), syncDealerStatus(id, status) }
interface InventoryProvider { getInventory(dealerId), syncInventory(listing) }
interface LeadProvider      { pushLead(lead), pullLeadUpdates(dealerId) }
interface TrustProvider     { verifyDealer(dealerId), getTrustScore(dealerId) }
interface AnalyticsProvider { getAnalytics(dealerId, range) }
```

`V8AtlasAdapter` implements all five. It is registered in the provider registry as `'v8atlas'` when `V8ATLAS_ENABLED=true`.

---

## Inventory Sync

### Inbound: V8Atlas → AutoBentaPH

V8Atlas sends webhook events when inventory changes in the DMS.

| Webhook event             | AutoBentaPH action                                              |
|---------------------------|-----------------------------------------------------------------|
| `inventory.created`       | Upsert `VehicleListing` (create if new, update if already exists) |
| `inventory.updated`       | Update matching `VehicleListing` by V8Atlas external ID         |
| `inventory.sold`          | Set `VehicleListing.status = 'sold'`, `soldAt = event.timestamp` |
| `inventory.deactivated`   | Set `VehicleListing.isActive = false`                           |

Upsert key: `VehicleListing.externalId = event.payload.v8atlasId`.

### Outbound: AutoBentaPH → V8Atlas

When a dealer marks a listing as sold or deactivates it in AutoBentaPH, `syncInventory(listing)` is called synchronously on the write path.

### Synced fields

| AutoBentaPH field        | V8Atlas field         |
|--------------------------|-----------------------|
| `make`                   | `vehicle.make`        |
| `model`                  | `vehicle.model`       |
| `year`                   | `vehicle.year`        |
| `pricePhp`               | `pricing.askingPrice` |
| `mileage`                | `vehicle.odometer`    |
| `photos[]`               | `media.images`        |
| `trustStatus`            | `verification.status` |
| `readinessScore`         | `condition.score`     |

Fields not in this table are AutoBentaPH-only and are not synced.

---

## Lead Sync

### Outbound: AutoBentaPH → V8Atlas

On `LEAD_CREATED` event, `distributeLeadToProviders()` calls `pushLead(lead)` against the V8Atlas `/v1/leads` endpoint.

```typescript
// Outbound payload
{
  idempotencyKey: lead.id,          // Prevents double-push on retry
  dealerV8Id: dealer.externalId,
  buyerName: lead.buyerName,
  buyerEmail: lead.buyerEmail,
  buyerPhone: lead.buyerPhone,
  listingV8Id: listing.externalId,
  source: "autobentaph",
  status: lead.status
}
```

The `idempotencyKey` is sent in the `Idempotency-Key` request header. V8Atlas returns 200 for duplicate submissions rather than 409, preventing false failures on retry.

### Inbound: V8Atlas → AutoBentaPH

Lead status updates from V8Atlas arrive via webhook (`lead.updated` event) or are polled via `pullLeadUpdates(dealerId)`.

Polling is used as a fallback when webhook delivery fails. Poll interval: every 15 minutes for dealers with V8Atlas sync enabled.

On receiving a `lead.updated` webhook, AutoBentaPH updates `Lead.status` and appends a `lead_updated` `DealerActivity` with `metadata: { source: "v8atlas", v8atlasLeadId }`.

### Retry queue

Failed `pushLead()` calls are enqueued in a retry queue (in-process queue in v1; Redis-backed queue in v2). Retry schedule: 1m, 5m, 15m, 1h, 4h. After 5 failed attempts, the push is marked dead-letter and an admin alert is triggered. The lead continues to exist and function normally in AutoBentaPH regardless of push failure.

---

## Trust Sync

### Outbound: AutoBentaPH → V8Atlas

When an admin approves a dealer's verification in AutoBentaPH, `propagateTrustVerification(dealerId)` calls `TrustProvider.verifyDealer(dealerId)`.

```
POST /v1/trust/verify
{
  "dealerV8Id": dealer.externalId,
  "verifiedAt": now.toISOString(),
  "verificationLevel": dealer.verificationLevel,
  "badgesGranted": ["identity_verified", "ownership_docs", "inspection_passed"]
}
```

### Inbound: V8Atlas → AutoBentaPH

V8Atlas can push trust changes via the `dealer.verified` and `dealer.verification_revoked` webhook events. On receipt:

1. HMAC-SHA256 signature verified against `V8ATLAS_WEBHOOK_SECRET`.
2. `Dealer.isVerified` updated inside a `$transaction` that also logs a `DealerActivity(type=lead_updated, description="Trust status updated via V8Atlas")`.
3. Buyer-facing trust badges recalculated on next listing fetch.

---

## Dealer Status Sync

V8Atlas can grant or revoke dealer verification independently (e.g., if the dealer holds a V8Atlas-issued certification). The `dealer.verified` webhook triggers:

```typescript
await prisma.$transaction([
  prisma.dealer.update({ where: { externalId }, data: { isVerified: true, verifiedAt: event.timestamp } }),
  prisma.dealerActivity.create({ data: { type: 'lead_updated', description: 'Verified via V8Atlas DMS', ... } })
])
```

The `$transaction` ensures the verification state and the audit log are always consistent.

---

## V8AtlasAdapter Method Reference

| Method                    | V8Atlas endpoint                    | Direction  | Notes                                        |
|---------------------------|-------------------------------------|------------|----------------------------------------------|
| `getDealer(id)`           | `GET /v1/dealers/:id`               | Inbound    | Used to validate dealer exists in V8Atlas    |
| `syncDealerStatus(id, s)` | `PATCH /v1/dealers/:id`             | Outbound   | Updates plan/status in DMS                   |
| `getInventory(dealerId)`  | `GET /v1/dealers/:id/inventory`     | Inbound    | Full inventory pull (used for initial sync)  |
| `syncInventory(listing)`  | `PUT /v1/dealers/:id/inventory/:vid`| Outbound   | Push single listing status change            |
| `pushLead(lead)`          | `POST /v1/leads`                    | Outbound   | Idempotency-Key header required              |
| `pullLeadUpdates(dealer)` | `GET /v1/leads?dealerId=&since=`    | Inbound    | Poll fallback; `since` = last poll timestamp |
| `verifyDealer(id)`        | `POST /v1/trust/verify`             | Outbound   | Called on AutoBentaPH admin approval         |
| `getTrustScore(id)`       | `GET /v1/trust/:dealerId`           | Inbound    | Returns V8Atlas trust score and badge list   |
| `getAnalytics(id, range)` | `GET /v1/analytics/:dealerId`       | Inbound    | DMS-side analytics, merged with platform data|

---

## Webhook Ingestion

All inbound V8Atlas webhooks arrive at `POST /api/webhooks/v8atlas`.

**HMAC-SHA256 verification:**

```typescript
const signature = req.headers['x-v8atlas-signature'];
const expectedSig = crypto
  .createHmac('sha256', process.env.V8ATLAS_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');

if (signature !== `sha256=${expectedSig}`) {
  return res.status(401).json({ error: 'Invalid webhook signature' });
}
```

Requests with invalid signatures are rejected with HTTP 401 and logged. No processing occurs.

**Duplicate delivery:** V8Atlas may deliver the same webhook more than once. Each webhook payload includes an `eventId`. AutoBentaPH stores processed event IDs in a `WebhookEvent` table and returns 200 on duplicate without reprocessing.

---

## Failure Handling

| Failure scenario              | Handling                                                         |
|-------------------------------|------------------------------------------------------------------|
| HMAC verification failure     | HTTP 401; event discarded; logged for security audit             |
| V8Atlas API timeout (>10s)    | Outbound call fails; retry queue entry created                   |
| V8Atlas returns 4xx           | No retry (bad request); error logged; admin notified if repeated |
| V8Atlas returns 5xx           | Retry queue with exponential backoff                             |
| Retry queue exhausted         | Dead-letter; admin alert; manual intervention required           |
| `V8ATLAS_ENABLED=false`       | All adapter methods return null/empty; no network calls made     |

---

## Testing Without Live V8Atlas

Set `V8ATLAS_ENABLED=false`. The adapter short-circuits all methods. For integration testing:

1. Set `V8ATLAS_BASE_URL` to a local mock server (e.g., `http://localhost:4010` with an OpenAPI mock).
2. Use a fixed `V8ATLAS_WEBHOOK_SECRET` to sign test webhook payloads.
3. Fire test webhooks via `curl -X POST http://localhost:3000/api/webhooks/v8atlas -H "x-v8atlas-signature: sha256=<computed>" -d @test_payload.json`.

Unit tests mock the adapter at the provider registry level — no HTTP calls are made in test suites.

---

## Adding AutoBentaPH as DMS Provider #2 in V8Atlas

For AutoBentaPH to receive pushes as a first-class DMS (not just a consuming API client), V8Atlas must register AutoBentaPH as a provider. AutoBentaPH must expose the following endpoints for V8Atlas to call:

| Endpoint                               | Purpose                                            |
|----------------------------------------|----------------------------------------------------|
| `GET /api/v1/dealers/:id`              | V8Atlas reads dealer record                        |
| `POST /api/v1/inventory`               | V8Atlas pushes new listing                         |
| `PUT /api/v1/inventory/:id`            | V8Atlas updates existing listing                   |
| `POST /api/v1/leads`                   | V8Atlas delivers a lead to AutoBentaPH             |
| `POST /api/v1/trust/verify`            | V8Atlas signals trust verification                 |

All endpoints authenticate via `Authorization: Bearer <AUTOBENTAPH_V8ATLAS_INBOUND_KEY>`, a secret configured in AutoBentaPH's environment. This key is separate from `V8ATLAS_API_KEY` (which is for outbound calls to V8Atlas).
