# Provider Architecture Hardening

**Date:** 2026-06-01  
**Status:** Design Specification

---

## Overview

Ryderr's integration layer must be built on a strict provider interface contract. Every external system — V8Atlas, DealerSocket, Tekion, CSV imports, or manual entry — implements the same set of interfaces. No provider-specific logic exists outside of its adapter module.

This document defines those interfaces, the adapter pattern, and the rules for error handling and provider isolation.

---

## Provider Interface Definitions

### InventoryProvider

```typescript
interface InventoryProvider {
  // Pull all active listings for a dealer from the external system
  pullInventory(dealerId: string): Promise<RyderrListing[]>

  // Push an updated listing back to the external system (if supported)
  pushInventoryUpdate(dealerId: string, listing: RyderrListing): Promise<void>

  // Remove a listing from the external system (if supported)
  deleteInventory(dealerId: string, vin: string): Promise<void>
}
```

**Notes:**
- `pullInventory` is the primary method. All adapters must implement it.
- `pushInventoryUpdate` and `deleteInventory` are optional on read-only sources (CSV, manual).
- Return type is always `RyderrListing[]` — the adapter normalizes to Ryderr's schema.

---

### LeadProvider

```typescript
interface LeadProvider {
  // Deliver a buyer lead to the dealer's system
  pushLead(dealerId: string, lead: RyderrLead): Promise<LeadDeliveryResult>

  // Update lead status from dealer's system back to Ryderr
  updateLeadStatus(dealerId: string, leadId: string, status: LeadStatus): Promise<void>
}
```

**Notes:**
- `pushLead` must return `LeadDeliveryResult` with a success/failure flag and external reference ID.
- If `pushLead` fails, the caller retries with exponential backoff. The lead is never dropped.
- `updateLeadStatus` is optional for providers that don't support status callbacks.

---

### DealerProvider

```typescript
interface DealerProvider {
  // Sync dealer profile data from external system to Ryderr
  syncDealer(dealerId: string): Promise<RyderrDealerProfile>

  // Fetch current dealer profile from external system
  getDealerProfile(dealerId: string): Promise<RyderrDealerProfile>
}
```

---

### TrustProvider

```typescript
interface TrustProvider {
  // Sync verification data for a dealer (license, bonding, reviews)
  syncTrust(dealerId: string): Promise<TrustSnapshot>

  // Get current verification status without a full sync
  getVerificationStatus(dealerId: string): Promise<VerificationStatus>
}
```

---

### AnalyticsProvider

```typescript
interface AnalyticsProvider {
  // Push listing performance metrics to external system
  syncAnalytics(dealerId: string, metrics: ListingMetrics[]): Promise<void>

  // Pull performance data from external system (for bidirectional dashboards)
  getPerformanceMetrics(dealerId: string): Promise<PerformanceReport>
}
```

---

## The Adapter Pattern

Each DMS or source type is implemented as a self-contained adapter module:

```
backend/src/integrations/
├── manual/
│   ├── index.js          ← exports ManualAdapter
│   ├── inventory.js      ← implements InventoryProvider
│   └── leads.js          ← implements LeadProvider
├── csv/
│   ├── index.js
│   ├── inventory.js
│   └── parser.js
├── v8atlas/
│   ├── index.js
│   ├── inventory.js
│   ├── leads.js
│   ├── sync.js
│   └── auth.js
└── api/               ← generic webhook/REST adapter
    ├── index.js
    ├── inventory.js
    └── leads.js
```

**Rules:**
1. No adapter imports from another adapter's directory.
2. No V8Atlas-specific code exists outside `backend/src/integrations/v8atlas/`.
3. The core application imports adapters through the provider registry only.
4. Adapters translate external schemas to Ryderr schemas. Ryderr schemas never leak into adapters.

---

## Error Handling: Provider Failure Isolation

If any provider fails, Ryderr continues operating. Provider errors are not propagated to buyers or the marketplace layer.

```
Provider call fails
        │
        ▼
Log error with provider ID, dealer ID, timestamp
        │
        ▼
Return fallback result to caller
  - pullInventory fails  → return cached listings (or empty, log staleness)
  - pushLead fails       → store lead locally, queue for retry
  - syncDealer fails     → retain last known profile, flag as stale
        │
        ▼
Alert via admin dashboard: "Provider X unhealthy for Dealer Y"
```

**Retry policy for lead push:**

| Attempt | Delay |
|---|---|
| 1 | Immediate |
| 2 | 30 seconds |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5+ | 2 hours (up to 48h max) |

After 48 hours without successful delivery, the lead is flagged for manual review and the dealer is notified via Ryderr inbox.

---

## The Manual Adapter: Baseline Contract

The `ManualAdapter` is the zero-dependency baseline. It implements all required interfaces using only Ryderr's own database. No external calls.

- `pullInventory` → reads from `ryderr.listings` where `sourceType = 'MANUAL'`
- `pushLead` → writes to `ryderr.dealer_leads` and triggers in-app notification
- `getDealerProfile` → reads from `ryderr.dealers`

Every other adapter's behavior must be equivalent to the manual adapter from Ryderr's perspective. If a method works for manual, it must work identically for V8Atlas or any future DMS.

---

## Provider Registry

The provider registry maps a dealer's `sourceType` to the correct adapter instance at runtime.

```javascript
// backend/src/integrations/registry.js

const registry = {
  MANUAL:     () => require('./manual'),
  CSV:        () => require('./csv'),
  V8ATLAS:    () => require('./v8atlas'),
  API:        () => require('./api'),
}

function getProvider(sourceType) {
  const factory = registry[sourceType]
  if (!factory) throw new Error(`Unknown sourceType: ${sourceType}`)
  return factory()
}
```

Callers never reference a provider directly:

```javascript
// Correct
const provider = getProvider(dealer.sourceType)
await provider.pushLead(dealer.id, lead)

// Wrong — hard dependency on a specific provider
const v8atlas = require('./v8atlas')
await v8atlas.pushLead(dealer.id, lead)
```

---

## Adding a New Provider

To add DealerSocket (or any future DMS):

1. Create `backend/src/integrations/dealersocket/`
2. Implement `InventoryProvider` and `LeadProvider` interfaces
3. Add `DEALERSOCKET` to the `DealerSourceType` enum
4. Register in `registry.js`: `DEALERSOCKET: () => require('./dealersocket')`
5. Write adapter-level tests with a mocked DealerSocket API
6. Add `DEALERSOCKET` to the admin onboarding flow

No changes to the marketplace layer, lead engine, or any existing adapter.
