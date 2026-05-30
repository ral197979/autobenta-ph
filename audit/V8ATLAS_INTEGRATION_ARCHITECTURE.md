# V8Atlas Integration Architecture

**Document:** V8ATLAS_INTEGRATION_ARCHITECTURE  
**Version:** 1.0  
**Date:** 2026-05-30  
**Status:** Production (adapter built; live connection pending V8Atlas credentials)

---

## Design Principle

**V8Atlas is not embedded in AutoBentaPH.** It is the first external Dealer Management System (DMS) connected to the marketplace via an abstraction layer. AutoBentaPH core code never imports V8Atlas-specific logic directly. All V8Atlas behavior is isolated in `backend/src/services/v8atlas/V8AtlasAdapter.js`.

This separation means:
- Future DMS partners (e.g. CarSales DMS, DealerSocket PH) implement the same provider interfaces and plug in without touching marketplace code
- V8Atlas can be disabled (`V8ATLAS_ENABLED=false`) without any code changes to the marketplace
- Integration bugs are scoped to the adapter, not core marketplace logic

---

## Provider Interface Layer

Located in `backend/src/services/dealerNetwork/`:

| Interface | Purpose |
|---|---|
| `DealerProvider` | Dealer identity sync, tier updates from DMS |
| `InventoryProvider` | Listing push/pull, stock status updates |
| `LeadProvider` | Lead distribution to connected DMS |
| `TrustProvider` | Badge broadcast, verification claim intake |
| `AnalyticsProvider` | Performance data export to DMS |

All providers are abstract base classes. Concrete implementations must implement all methods or throw `NotImplementedError`.

---

## V8Atlas Adapter

`backend/src/services/v8atlas/V8AtlasAdapter.js` implements all 5 interfaces:

```
V8AtlasDealerProvider    → DealerProvider
V8AtlasInventoryProvider → InventoryProvider
V8AtlasLeadProvider      → LeadProvider
V8AtlasTrustProvider     → TrustProvider
V8AtlasAnalyticsProvider → AnalyticsProvider
```

### Activation

```javascript
// backend/src/server.js
import { registerV8AtlasProviders } from './services/v8atlas/V8AtlasAdapter.js';
if (process.env.V8ATLAS_ENABLED === 'true') {
  registerV8AtlasProviders();
}
```

### Outbound Calls

All outbound calls use `fetch()` with:
- Base URL: `process.env.V8ATLAS_BASE_URL`
- Authentication: `Authorization: Bearer ${process.env.V8ATLAS_API_KEY}`
- Content-Type: `application/json`

No V8Atlas SDK dependency — raw HTTP for maximum portability.

---

## Inbound Webhooks

V8Atlas can push events to AutoBentaPH at:

```
POST /api/webhooks/v8atlas/dealer-verified
POST /api/webhooks/v8atlas/inventory-sync
POST /api/webhooks/v8atlas/trust-sync
```

### Signature Verification

Every webhook is verified before processing:

```javascript
function verifyV8AtlasSignature(req, res, next) {
  const signature = req.headers['x-v8atlas-signature'];
  const timestamp = req.headers['x-v8atlas-timestamp'];
  const body = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', process.env.V8ATLAS_WEBHOOK_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  if (signature !== `sha256=${expected}`) return res.status(401).json({ error: 'Invalid signature' });
  next();
}
```

Replay protection: timestamp must be within 5 minutes of server time.

### Webhook Events

| Event | Action |
|---|---|
| `dealer-verified` | Updates dealer `isVerified`, `tier`; triggers trust propagation |
| `inventory-sync` | Upserts listing from V8Atlas inventory payload |
| `trust-sync` | Updates trust badges on listing; propagates to marketplace display |

---

## Data Flow Diagrams

### Inventory Sync (V8Atlas → AutoBentaPH)

```
V8Atlas DMS
  │
  │ POST /api/dealer-network/v1/inventory
  │   { vin, make, model, year, price, photos, dealerId }
  │
AutoBentaPH API
  ├─ authenticate() + verifyDealerAccess()
  ├─ requireFeature('inventory_api')  [enterprise only]
  ├─ canAddListing(plan, currentCount) check
  ├─ upsert VehicleListing by (vin + dealerId)
  └─ return { listingId, marketplaceUrl }
```

### Lead Distribution (AutoBentaPH → V8Atlas)

```
Buyer submits inquiry
  │
AutoBentaPH creates Lead
  │
POST /api/dealer-network/v1/leads?direction=outbound [enterprise]
  │
LeadProvider.distributeLeadToProviders(lead, ['v8atlas'])
  │
V8AtlasLeadProvider.forwardLead(lead)
  ├─ POST V8ATLAS_BASE_URL/api/leads
  └─ on failure: retry queue (in-memory, 3 attempts, exponential backoff)
```

### Trust Sync (V8Atlas → AutoBentaPH)

```
V8Atlas completes vehicle inspection
  │
POST /api/webhooks/v8atlas/trust-sync
  │ { listingId, badges: { ownershipVerified, sellerVerified, ... } }
  │
verifyV8AtlasSignature()
  │
V8AtlasTrustProvider.receiveVerificationClaim()
  ├─ validate badge fields
  ├─ update VehicleListing trust fields inside $transaction
  └─ log audit event
```

---

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `V8ATLAS_ENABLED` | Gates adapter registration (`true`/`false`) | Yes |
| `V8ATLAS_BASE_URL` | V8Atlas API base (e.g. `https://api.v8atlas.ph`) | If enabled |
| `V8ATLAS_API_KEY` | Bearer token for outbound calls | If enabled |
| `V8ATLAS_WEBHOOK_SECRET` | HMAC key for inbound webhook verification | If enabled |

---

## Extensibility

To add a second DMS (e.g. AutoDealerPH):

1. Create `backend/src/services/autodealerph/AutoDealerAdapter.js`
2. Implement the 5 provider interfaces
3. Register via `registerDealerProvider(new AutoDealerDealerProvider())`
4. Add env var `AUTODEALER_ENABLED` and gate registration

Core marketplace code requires zero changes.

---

## Current Status

| Component | Status |
|---|---|
| Provider interfaces | Complete |
| V8Atlas adapter | Built, not yet live |
| Inbound webhook routes | Complete |
| Outbound lead distribution | Complete (with retry queue) |
| Inventory sync endpoint | Complete |
| Trust sync webhook | Complete |
| Live V8Atlas credentials | Pending partner onboarding |
