# V8Atlas Plugin Architecture

**Date:** 2026-06-01  
**Status:** Integration Specification

---

## V8Atlas's Role in Ryderr

V8Atlas is one dealer customer using one integration adapter. It is not Ryderr's backend, not a partner platform, and not a dependency. V8Atlas happens to operate a DMS product that some dealers on the Ryderr network use. Those dealers get the V8Atlas adapter for their inventory sync and lead routing. Nothing more.

**V8Atlas is equivalent to:** DealerSocket, Tekion, a CSV upload, or a dealer typing a listing by hand. All are source types. All produce `RyderrListing` objects. All receive `RyderrLead` objects. None gets special treatment in Ryderr's core.

---

## File Structure

```
backend/src/integrations/v8atlas/
├── index.js          ← Entry point. Exports V8AtlasAdapter class.
├── inventory.js      ← Implements InventoryProvider interface
├── leads.js          ← Implements LeadProvider interface
├── sync.js           ← Scheduled background sync job
├── auth.js           ← API key storage, rotation, validation
└── webhooks.js       ← Handles inbound webhooks from V8Atlas
```

No file outside this directory imports from `v8atlas/` directly. All access goes through the provider registry.

---

## Module Responsibilities

### `index.js`
Exports a single class that wires together the other modules:

```javascript
const { pullInventory, pushInventoryUpdate, deleteInventory } = require('./inventory')
const { pushLead, updateLeadStatus } = require('./leads')
const { syncDealer, getDealerProfile } = require('./dealer')

class V8AtlasAdapter {
  constructor(dealerId) {
    this.dealerId = dealerId
  }
  // All interface methods delegated to sub-modules
}

module.exports = V8AtlasAdapter
```

---

### `inventory.js`
Implements `InventoryProvider`.

- `pullInventory(dealerId)` — calls V8Atlas `/inventory` API, maps response to `RyderrListing[]`
- `pushInventoryUpdate(dealerId, listing)` — updates a listing in V8Atlas if the dealer has write-back enabled
- `deleteInventory(dealerId, vin)` — marks listing inactive in V8Atlas

**Field mapping (V8Atlas → Ryderr):**

| V8Atlas Field | Ryderr Field | Notes |
|---|---|---|
| `unit_id` | `source_external_id` | V8Atlas's internal ID |
| `vin` | `vin` | Direct map |
| `asking_price` | `price` | Integer cents |
| `vehicle_photos` | `images[]` | Array of URLs |
| `status_code` | `status` | Mapped: `AVAILABLE` → `active`, `SOLD` → `inactive` |
| `updated_at` | `last_synced_at` | ISO timestamp |

---

### `leads.js`
Implements `LeadProvider`.

- `pushLead(dealerId, lead)` — POSTs a structured lead to V8Atlas's lead intake endpoint
- `updateLeadStatus(dealerId, leadId, status)` — receives status updates from V8Atlas (via webhook) and writes back to Ryderr

**Lead push payload:**

```json
{
  "source": "RYDERR",
  "listing_id": "v8atlas_unit_id",
  "buyer_name": "...",
  "buyer_email": "...",
  "buyer_phone": "...",
  "message": "...",
  "ryderr_lead_id": "...",
  "submitted_at": "ISO timestamp"
}
```

---

### `sync.js`
Runs the scheduled background sync for all V8Atlas-connected dealers.

```javascript
// Runs every 30 minutes (configurable per dealer)
async function runSync() {
  const dealers = await getDealersWithSourceType('V8ATLAS')
  for (const dealer of dealers) {
    try {
      const listings = await pullInventory(dealer.id)
      await upsertListings(listings)  // VIN-keyed upsert
    } catch (err) {
      logSyncError(dealer.id, err)
      // Do not throw — continue to next dealer
    }
  }
}
```

Sync failures are logged and surfaced in the dealer's integration dashboard. They do not halt the process or affect other dealers.

---

### `auth.js`
Manages V8Atlas API credentials per dealer.

- Stores API keys encrypted in `dealer_integrations` table
- Provides `getCredentials(dealerId)` — fetches and decrypts key
- Validates key on first connection and on each sync
- Returns structured error if key is expired or revoked, so the dealer integration dashboard shows an actionable status

---

### `webhooks.js`
Handles inbound HTTP webhooks from V8Atlas.

**Registered endpoint:** `POST /api/webhooks/v8atlas`

Supported event types:

| Event | Action |
|---|---|
| `inventory.updated` | Update listing fields in Ryderr |
| `inventory.sold` | Mark listing inactive in Ryderr |
| `inventory.deleted` | Remove listing from marketplace |
| `lead.status_updated` | Update lead status in Ryderr CRM |

All webhook payloads are validated with a shared secret (HMAC). Invalid signatures are rejected with 401.

---

## Sync Strategy

| Method | Trigger | Use Case |
|---|---|---|
| Scheduled pull | Every 30 min (configurable) | Full inventory reconciliation |
| Webhook push | Real-time, event-driven | Pricing changes, sold status, new units |

**Preferred:** Webhooks for speed, scheduled pull for reliability. If V8Atlas stops sending webhooks, the scheduled pull catches any drift within 30 minutes.

---

## Error Handling: V8Atlas API Down

When V8Atlas is unreachable:

1. **Inventory sync fails** → last synced inventory remains live in Ryderr. Listings are not removed. A staleness flag is set after 4 hours of no sync.
2. **Lead push fails** → lead is stored in `ryderr.pending_leads` with status `RETRY_QUEUED`. Retry schedule: 30s → 5m → 30m → 2h. After 48 hours, lead is delivered to the dealer's Ryderr inbox instead.
3. **Buyer experience** → unaffected. Listings remain visible. Inquiry form works. Buyer receives confirmation.

**The buyer never knows V8Atlas is down. Dealers are alerted via integration dashboard.**

---

## Disconnect Behavior

When a dealer disconnects V8Atlas from Ryderr:

1. Sync job stops immediately.
2. All existing listings remain live in Ryderr, with `dealer_source_type` changed to `MANUAL`.
3. Lead routing switches from V8Atlas push to Ryderr dealer inbox.
4. Dealer is notified: "Your V8Atlas connection was disconnected. Your listings are still live. Leads will be delivered to your Ryderr inbox."
5. Dealer can reconnect at any time or migrate to CSV/manual management.

**No listings are deleted on disconnect.** Ryderr does not punish dealers for changing their integration path.

---

## Testing V8Atlas in Isolation

All V8Atlas tests live in `backend/src/integrations/v8atlas/__tests__/`.

- Tests mock the V8Atlas HTTP API using `nock` or equivalent
- Tests do NOT use a live V8Atlas sandbox
- Tests cover: successful sync, API timeout, invalid API key, malformed response, lead push success, lead push failure + retry queue, webhook validation, disconnect flow

To run in isolation:

```bash
npm test -- --testPathPattern=integrations/v8atlas
```

No other integration tests should be affected by V8Atlas test failures.

---

## How a DealerSocket Adapter Would Follow This Pattern

Adding DealerSocket requires zero changes to Ryderr core. The steps:

1. Create `backend/src/integrations/dealersocket/` with the same file structure
2. Implement `InventoryProvider` and `LeadProvider` using DealerSocket's API docs
3. Map DealerSocket's field names to `RyderrListing` schema in `inventory.js`
4. Add `DEALERSOCKET` to `DealerSourceType` enum
5. Register in `registry.js`
6. Add onboarding UI to `/dealer/integrations/dealersocket`

The V8Atlas adapter serves as the reference implementation. DealerSocket, Tekion, or any future DMS follows the identical pattern. The marketplace layer never changes.
