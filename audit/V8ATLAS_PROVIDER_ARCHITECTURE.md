# V8Atlas Provider Architecture

**Document:** V8ATLAS_PROVIDER_ARCHITECTURE  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production

---

## Design Principle: Interface-First Integration

AutoBentaPH never depends on V8Atlas directly. All integration code operates through five provider interfaces. V8Atlas is one implementation of those interfaces.

This means:
- Adding a second DMS provider requires implementing the same interfaces — no platform code changes
- Disabling V8Atlas (`V8ATLAS_ENABLED=false`) removes all integration code from execution paths without conditional branches scattered across the codebase
- Integration failures are isolated to the adapter layer and cannot corrupt core platform state

```
Platform code → Provider Interface → V8AtlasAdapter → V8Atlas API
                                  ↗
                    (future) OtherDMSAdapter → Other DMS API
```

---

## Five Provider Interfaces

### 1. DealerProvider

Manages dealer record synchronization between AutoBentaPH and external DMS.

| Method | Signature | Purpose |
|---|---|---|
| `syncDealer` | `(dealer: DealerProfile) => Promise<ExternalDealerRef>` | Push dealer record to DMS, return external ID |
| `fetchDealer` | `(externalId: string) => Promise<ExternalDealerData>` | Pull dealer data from DMS by external ID |
| `updateDealer` | `(externalId: string, delta: Partial<DealerData>) => Promise<void>` | Push profile updates to DMS |
| `onDealerVerified` | `(dealer: DealerProfile) => Promise<void>` | Notify DMS when dealer is verified |

### 2. InventoryProvider

Manages vehicle listing synchronization.

| Method | Signature | Purpose |
|---|---|---|
| `syncListing` | `(listing: VehicleListing) => Promise<ExternalListingRef>` | Push listing to DMS |
| `fetchListing` | `(externalId: string) => Promise<ExternalListingData>` | Pull listing from DMS |
| `updateListing` | `(externalId: string, delta: Partial<ListingData>) => Promise<void>` | Push listing update |
| `deactivateListing` | `(externalId: string) => Promise<void>` | Signal listing sold/removed |
| `bulkSync` | `(dealerId: string) => Promise<SyncResult>` | Full inventory reconciliation for a dealer |

### 3. LeadProvider

Manages lead distribution to external systems and tracks outcomes.

| Method | Signature | Purpose |
|---|---|---|
| `distributeLead` | `(lead: Lead, dealer: DealerProfile) => Promise<ExternalLeadRef>` | Push lead to DMS |
| `updateLeadStatus` | `(externalId: string, status: LeadStatus) => Promise<void>` | Sync CRM status updates to DMS |
| `onLeadConverted` | `(lead: Lead) => Promise<void>` | Notify DMS on sale conversion |
| `distributeLeadToProviders` | `(lead: Lead) => Promise<void>` | Fan out to all registered providers with retry queue |

### 4. TrustProvider

Maps AutoBentaPH trust signals to external DMS trust fields.

| Method | Signature | Purpose |
|---|---|---|
| `pushTrustSignals` | `(dealer: DealerProfile, signals: TrustSignals) => Promise<void>` | Push verification state to DMS |
| `fetchTrustSignals` | `(externalId: string) => Promise<TrustSignals>` | Pull trust fields from DMS |
| `onVerificationChange` | `(dealer: DealerProfile, isVerified: boolean) => Promise<void>` | Notify DMS on verification change |

**Trust field mapping (V8Atlas → AutoBentaPH):**

| V8Atlas Field | AutoBentaPH Field | Notes |
|---|---|---|
| `ownershipVerified` | `ownershipVerified` | Direct map |
| `transferReady` | `transferReady` | Direct map |
| `dealerCertified` | `isVerified` | V8Atlas certified = AutoBentaPH verified |
| `inspectionScore` | `inspectionPassed` | Score > threshold → boolean |
| `financingEligible` | `financingAvailable` | Direct map |

### 5. AnalyticsProvider

Pushes platform event data to external analytics pipelines.

| Method | Signature | Purpose |
|---|---|---|
| `trackEvent` | `(event: AnalyticsEvent) => Promise<void>` | Push event to DMS analytics |
| `fetchDealerMetrics` | `(dealerId: string, period: string) => Promise<DealerMetrics>` | Pull performance data from DMS |
| `syncConversionData` | `(dealerId: string) => Promise<void>` | Reconcile conversion metrics |

---

## V8AtlasAdapter

The V8AtlasAdapter is the single class that implements all five provider interfaces for the V8Atlas DMS.

```js
class V8AtlasAdapter implements
  DealerProvider,
  InventoryProvider,
  LeadProvider,
  TrustProvider,
  AnalyticsProvider {

  constructor(private config: V8AtlasConfig) {}

  // --- DealerProvider ---
  async syncDealer(dealer) { /* POST /v8atlas/api/dealers */ }
  async fetchDealer(externalId) { /* GET /v8atlas/api/dealers/:id */ }
  // ...

  // --- InventoryProvider ---
  async syncListing(listing) { /* POST /v8atlas/api/inventory */ }
  // ...

  // --- LeadProvider ---
  async distributeLead(lead, dealer) { /* POST /v8atlas/api/leads */ }
  async distributeLeadToProviders(lead) {
    // Fan out to all registered providers
    // On failure: enqueue to retry queue with exponential backoff
  }
  // ...

  // --- TrustProvider ---
  async pushTrustSignals(dealer, signals) {
    // Runs inside Prisma $transaction to ensure atomicity
  }
  // ...

  // --- AnalyticsProvider ---
  async trackEvent(event) { /* POST /v8atlas/api/analytics/events */ }
  // ...
}
```

---

## Adapter Registration

The adapter is registered during server startup when `V8ATLAS_ENABLED=true`.

```js
// server.js
import { registerV8AtlasProviders } from './integrations/v8atlas/register'

if (process.env.V8ATLAS_ENABLED === 'true') {
  registerV8AtlasProviders()
}
```

```js
// integrations/v8atlas/register.js
import { V8AtlasAdapter } from './V8AtlasAdapter'
import { ProviderRegistry } from '../../providers/ProviderRegistry'

export function registerV8AtlasProviders() {
  const adapter = new V8AtlasAdapter({
    baseUrl: process.env.V8ATLAS_BASE_URL,
    apiKey: process.env.V8ATLAS_API_KEY,
    webhookSecret: process.env.V8ATLAS_WEBHOOK_SECRET
  })

  ProviderRegistry.register('dealer', adapter)
  ProviderRegistry.register('inventory', adapter)
  ProviderRegistry.register('lead', adapter)
  ProviderRegistry.register('trust', adapter)
  ProviderRegistry.register('analytics', adapter)
}
```

The `ProviderRegistry` is a simple key-value store. Platform code calls `ProviderRegistry.get('lead')` and receives whatever adapter is registered — it never imports V8Atlas directly.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `V8ATLAS_ENABLED` | Yes | `'true'` to activate all V8Atlas integration code. Any other value disables it. |
| `V8ATLAS_BASE_URL` | When enabled | Base URL of the V8Atlas API (e.g., `https://api.v8atlas.com/v1`) |
| `V8ATLAS_API_KEY` | When enabled | API key for authenticating outbound calls to V8Atlas |
| `V8ATLAS_WEBHOOK_SECRET` | When enabled | HMAC-SHA256 signing secret for verifying inbound webhooks from V8Atlas |

When `V8ATLAS_ENABLED` is not `'true'`, the ProviderRegistry has no registered providers. Any platform code that calls `ProviderRegistry.get(...)` returns null and skips the integration step gracefully.

---

## Webhook Ingestion

V8Atlas pushes events to AutoBentaPH via webhooks. All inbound webhooks hit a single endpoint.

**Endpoint:** `POST /api/webhooks/v8atlas`

**Verification (HMAC-SHA256):**

```js
function verifyWebhookSignature(req) {
  const signature = req.headers['x-v8atlas-signature']
  const payload = JSON.stringify(req.body)
  const expected = crypto
    .createHmac('sha256', process.env.V8ATLAS_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  if (signature !== `sha256=${expected}`) {
    throw new Error('Invalid webhook signature')
  }
}
```

Webhooks that fail signature verification are rejected with HTTP 401. No processing occurs.

**Handled Event Types:**

| Event | Trigger | Handler Action |
|---|---|---|
| `inventory.created` | New vehicle added in V8Atlas DMS | Upsert listing via InventoryProvider |
| `inventory.updated` | Listing modified in DMS | Update listing fields |
| `inventory.deactivated` | Vehicle sold or removed in DMS | Mark listing inactive |
| `lead.created` | New lead in DMS | Create Lead record, route to dealer CRM |
| `lead.converted` | Lead marked won in DMS | Update Lead status, trigger analytics event |
| `dealer.verified` | Dealer certified in DMS | Set isVerified=true, propagate trust signals |

---

## Isolation: Running Without V8Atlas

When `V8ATLAS_ENABLED=false`:

- `registerV8AtlasProviders()` is never called
- `ProviderRegistry` has no entries
- `/api/webhooks/v8atlas` returns 503 (disabled)
- All provider calls in platform code check `ProviderRegistry.get(...)` and return early if null
- No V8Atlas environment variables are required
- Platform operates with full functionality for non-enterprise dealers

This isolation means the integration can be enabled per environment (enabled in production for enterprise dealers, disabled in staging/dev).

---

## Lead Distribution with Retry Queue

`distributeLeadToProviders()` handles fan-out across all registered lead providers and manages failures.

```
distributeLeadToProviders(lead):
  1. Get all registered LeadProviders from ProviderRegistry
  2. For each provider:
     a. Call distributeLead(lead, dealer)
     b. On success: log ExternalLeadRef
     c. On failure:
        - Log error
        - Enqueue to RetryQueue { leadId, providerId, attempt: 1, nextRetry: +5min }
  
RetryQueue worker:
  - Polls every minute
  - Retries up to 5 times with exponential backoff (5min, 15min, 30min, 1hr, 2hr)
  - On final failure: mark lead as sync_failed, alert admin
```

---

## Trust Propagation via Prisma $transaction

When V8Atlas signals dealer verification (`dealer.verified` webhook), trust updates run inside a Prisma transaction to guarantee consistency:

```js
await prisma.$transaction(async (tx) => {
  // 1. Update dealer isVerified
  await tx.dealerProfile.update({
    where: { id: dealer.id },
    data: { isVerified: true }
  })

  // 2. Update all active listings for this dealer
  await tx.vehicleListing.updateMany({
    where: { dealerId: dealer.id, status: 'active' },
    data: {
      sellerVerified: true,
      ownershipVerified: signals.ownershipVerified,
      transferReady: signals.transferReady
    }
  })

  // 3. Log trust event
  await tx.trustEvent.create({
    data: { dealerId: dealer.id, type: 'dealer_verified', source: 'v8atlas' }
  })
})
```

If any step fails, the entire transaction rolls back. Partial trust states are not possible.

---

## Adding a New DMS Provider

To add a second DMS (e.g., a competing inventory platform):

1. Create a new adapter class that implements the 5 provider interfaces
2. Create a `registerNewDMSProviders()` function following the same pattern as `registerV8AtlasProviders()`
3. Add environment variable gating (e.g., `NEWDMS_ENABLED`)
4. Call the register function in `server.js` when enabled
5. No platform code changes required

The ProviderRegistry supports multiple providers per interface type — `distributeLeadToProviders()` will fan out to all registered lead providers automatically.
