# V8Atlas Integration Certification

**Document:** V8ATLAS_INTEGRATION_CERTIFICATION  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production  
**Auditor:** System audit via code review

---

## Provider Architecture

The V8Atlas integration uses a provider interface pattern. Five interfaces are defined; the `V8AtlasAdapter` class implements all of them. The adapter is registered into the application's provider registry only when `V8ATLAS_ENABLED=true` in the environment. When the flag is false or absent, the adapter is not registered and all V8Atlas code paths are unreachable by normal application flow.

Required environment variables when enabled: `V8ATLAS_BASE_URL`, `V8ATLAS_API_KEY`, `V8ATLAS_WEBHOOK_SECRET`.

---

## Webhook Authentication

**File:** `backend/src/routes/v8atlasWebhooks.js`

All incoming webhooks are authenticated using HMAC-SHA256. The signature is computed over the raw request body using `V8ATLAS_WEBHOOK_SECRET` and compared using `crypto.timingSafeEqual()` — constant-time comparison prevents timing side-channel attacks.

**Production Bypass Fix (P0-01 — RESOLVED)**

The original guard:

```js
if (!process.env.V8ATLAS_WEBHOOK_SECRET) return next();
```

This bypassed all signature verification if the secret was not set. An attacker could forge any webhook event (dealer verification, inventory sync, trust updates). Fix: the handler now returns HTTP 500 in production if the secret is missing. The dev bypass is preserved under `NODE_ENV !== 'production'`.

---

## Implemented Methods

All 11 provider methods are fully implemented in `V8AtlasAdapter`:

| Method | Purpose |
|---|---|
| `getDealerProfile` | Fetch dealer profile from V8Atlas |
| `syncVerificationStatus` | Pull latest verification status from V8Atlas |
| `getBranches` | Retrieve dealer branch locations |
| `syncInventory` | Push full inventory batch to V8Atlas |
| `getInventoryList` | Pull inventory list from V8Atlas |
| `deactivateListing` | Mark a listing inactive in V8Atlas |
| `pushLead` | Send a new lead to V8Atlas |
| `updateLeadStatus` | Update lead status in V8Atlas |
| `pullLeadUpdates` | Pull lead status changes from V8Atlas |
| `propagateTrustVerification` / `getTrustStatus` | Sync trust verification state |
| `getDealerPerformance` / `getMarketplaceStats` | Pull performance and market data |

---

## Webhook Handlers

Three webhook event types are handled:

**`dealer-verified`**
Executed inside a `prisma.$transaction()`. Updates dealer verification status, trust tier, and creates a `VerificationReview` record atomically. If any step fails, the entire transaction rolls back.

**`inventory-sync`**
Processes a batch of listing updates. Each listing is upserted (create or update). Photos are replaced entirely on each sync — the existing photo array is deleted and replaced with the incoming set.

**`trust-sync`**
Propagates trust field updates (trust score, tier, badge metadata) to the dealer record. Fields are applied individually from the incoming payload.

---

## Retry Queue

**File:** `backend/src/routes/credits.js` (LeadProvider)

Failed `pushLead` calls are added to an in-memory retry queue. The queue retries on a backoff interval. This queue is held entirely in Node.js process memory.

**Critical gap:** If the server restarts (deployment, crash, OOM), all queued retries are lost. Leads that failed to sync to V8Atlas during the outage will not be retried after restart.

**Required before V8Atlas live traffic:** Replace in-memory queue with a persistent queue backed by PostgreSQL (`pg-boss` or similar) or Redis. This is listed as a Condition Required Before First Paying Dealer in `00_PRODUCTION_CERTIFICATION.md`.

---

## Error Handling

The internal `v8atlasRequest` helper throws on any non-2xx response from the V8Atlas API. All provider methods wrap their calls in try/catch, log the error with the request ID, and propagate the error to the caller. Webhook handlers return 200 to V8Atlas even on internal processing failures (to prevent V8Atlas from retrying indefinitely), but log the failure.

---

## Isolation

When `V8ATLAS_ENABLED=false`:
- The `V8AtlasAdapter` is not instantiated
- No provider methods are registered
- All V8Atlas route handlers that depend on the adapter will return 503 (service unavailable)
- No outbound HTTP calls to V8Atlas are made

This allows the application to run without V8Atlas credentials in development or in deployments that do not use the integration.

---

## Findings

| ID | Finding | Status |
|---|---|---|
| — | Webhook signature bypass in production when secret unset | RESOLVED (P0-01) |
| — | In-memory retry queue lost on server restart | Open — Required condition |

---

## Verdict: PASS WITH CONDITIONS

All webhook security is correct. All 11 provider methods are implemented. The HMAC verification is production-grade. The blocking condition is the in-memory retry queue: lead sync failures are not durable. A persistent retry queue must be implemented before V8Atlas handles live dealer lead traffic.
