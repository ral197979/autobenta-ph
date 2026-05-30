# V8Atlas Integration Plan

**Date:** 2026-05-30  
**Project:** AutoBentaPH / Ryderr  
**Integration Target:** V8Atlas Dealer Management System

---

## Overview

V8Atlas is the dealer-side platform that manages inventory, leads, pricing, and dealer operations. AutoBentaPH (Ryderr) is the buyer-facing marketplace. The integration creates a bidirectional sync between the two systems, allowing dealers to manage inventory in V8Atlas and have it automatically reflected in AutoBentaPH marketplace listings.

**Architecture principle:** Loosely coupled via API + webhook events. Neither system is dependent on the other's uptime. AutoBentaPH maintains its own canonical listing records; V8Atlas provides sync events and enrichment data.

---

## Integration Surfaces

### 1. Dealer Verification Sync

**Direction:** V8Atlas → AutoBentaPH  
**Trigger:** Dealer completes verification in V8Atlas

**Payload:**
```json
{
  "event": "dealer.verification.completed",
  "dealerId": "v8atlas-dealer-uuid",
  "autobentaDealerId": "autobenta-dealer-uuid",
  "verificationLevel": "verified_pro",
  "verifiedAt": "2026-05-30T00:00:00Z",
  "expiresAt": "2027-05-30T00:00:00Z",
  "documents": ["business_registration", "dealer_permit"]
}
```

**AutoBentaPH handler:**
```javascript
POST /api/webhooks/v8atlas/dealer-verified
→ Find Dealer by autobentaDealerId
→ Create VerificationRequest(type: dealer_business, status: approved)
→ propagateApproval(dealer_business)
→ AuditLog: 'v8atlas_dealer_verification_sync'
```

**Interface contract (`backend/src/services/v8atlas/dealerVerificationSync.js`):**
```javascript
async function syncDealerVerification(payload) → { success, dealerId, verificationRequestId }
async function revokeV8AtlasDealerVerification(dealerId) → { success }
```

---

### 2. Inventory Sync

**Direction:** V8Atlas → AutoBentaPH  
**Trigger:** Dealer publishes or updates a vehicle in V8Atlas

**Payload:**
```json
{
  "event": "inventory.listing.upserted",
  "v8atlasVehicleId": "...",
  "autobentaListingId": "...",
  "data": {
    "make": "Toyota",
    "model": "Vios",
    "year": 2022,
    "price": 750000,
    "mileage": 12000,
    "status": "active",
    "photos": ["https://..."],
    "ownershipVerified": true,
    "orCrVerified": true
  }
}
```

**AutoBentaPH handler:**
```javascript
POST /api/webhooks/v8atlas/inventory-sync
→ Upsert VehicleListing (find by autobentaListingId or create new)
→ If ownershipVerified: create VerificationRequest(ownership, approved) via propagateApproval
→ Sync photos to VehiclePhoto
→ AuditLog: 'v8atlas_inventory_sync'
```

**Interface contract (`backend/src/services/v8atlas/inventorySync.js`):**
```javascript
async function upsertFromV8Atlas(payload) → { listingId, created, trustPropagated }
async function deactivateV8AtlasListing(v8atlasVehicleId) → { success }
async function syncPhotos(listingId, photoUrls) → { added, removed }
```

---

### 3. Lead Sync

**Direction:** AutoBentaPH → V8Atlas  
**Trigger:** Buyer sends inquiry on a dealer listing

**Payload:**
```json
{
  "event": "lead.created",
  "autobentaInquiryId": "...",
  "autobentaDealerId": "...",
  "v8atlasDealerId": "...",
  "listingId": "...",
  "buyer": {
    "name": "Juan dela Cruz",
    "email": "juan@example.com",
    "phone": "+63..."
  },
  "message": "Is this still available?",
  "createdAt": "2026-05-30T00:00:00Z"
}
```

**AutoBentaPH sends to V8Atlas:**
```javascript
POST {V8ATLAS_BASE_URL}/api/webhooks/autobenta/lead-received
→ Signed with HMAC-SHA256 using V8ATLAS_WEBHOOK_SECRET
```

**Interface contract (`backend/src/services/v8atlas/leadSync.js`):**
```javascript
async function pushLeadToV8Atlas(inquiry, dealer) → { success, v8atlasLeadId }
async function updateLeadStatus(autobentaInquiryId, v8atlasStatus) → { success }
```

---

### 4. Trust Badge Sync

**Direction:** Bidirectional  
**Purpose:** Trust state earned on either platform should be reflected on both

**AutoBentaPH → V8Atlas:**
```json
{
  "event": "trust.badge.updated",
  "listingId": "...",
  "badges": {
    "ownershipVerified": true,
    "sellerVerified": true,
    "transferReady": false,
    "readinessScore": 65
  }
}
```

**V8Atlas → AutoBentaPH:**
```json
{
  "event": "trust.verification.approved",
  "verificationType": "ownership",
  "listingId": "...",
  "verifiedBy": "v8atlas-admin",
  "verifiedAt": "..."
}
```

**Interface contract (`backend/src/services/v8atlas/trustSync.js`):**
```javascript
async function pushTrustUpdate(listingId, badges) → { success }
async function receiveV8AtlasTrustVerification(payload) → { verificationRequestId }
```

---

### 5. Readiness Score Sync

**Direction:** AutoBentaPH → V8Atlas  
**Trigger:** Readiness score changes on AutoBentaPH

AutoBentaPH pushes updated readiness score so V8Atlas can display it in dealer dashboards.

```javascript
// On readinessScore update in verifications.js:
if (v8atlasDealerId && scoreChanged) {
  await v8atlasReadinessSync.push(listingId, score);
}
```

---

## Webhook Security

All inbound webhooks from V8Atlas must be verified:

```javascript
// backend/src/middleware/v8atlasWebhook.js
function verifyV8AtlasSignature(req, res, next) {
  const signature = req.headers['x-v8atlas-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.V8ATLAS_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  next();
}
```

All outbound webhooks to V8Atlas include the same HMAC signature in `x-autobenta-signature`.

---

## Environment Variables Required

```bash
V8ATLAS_BASE_URL=https://api.v8atlas.com
V8ATLAS_API_KEY=<dealer-api-key>
V8ATLAS_WEBHOOK_SECRET=<shared-secret>
V8ATLAS_DEALER_SYNC_ENABLED=true
```

---

## Service File Structure (To Be Created)

```
backend/src/services/v8atlas/
  index.js                    — exports all sync functions
  dealerVerificationSync.js   — dealer verification propagation
  inventorySync.js            — vehicle listing upsert/deactivate
  leadSync.js                 — inquiry push to V8Atlas CRM
  trustSync.js                — trust badge bidirectional sync
  readinessSync.js            — readiness score push
  webhookVerifier.js          — HMAC signature verification

backend/src/routes/
  v8atlasWebhooks.js          — POST /api/webhooks/v8atlas/*
```

---

## Data Mapping

### V8Atlas Vehicle → AutoBentaPH VehicleListing

| V8Atlas Field | AutoBentaPH Field | Notes |
|---|---|---|
| `vehicleId` | `metadata.v8atlasVehicleId` | Stored in `aiDraftData` JSON |
| `dealerId` | `dealerId` | Mapped via `Dealer.userId` |
| `make/model/year` | `make/model/year` | Direct |
| `price` | `price` | Decimal conversion |
| `status` | `status` | `active` ↔ `active` |
| `ownershipDocs` | `ownershipVerified` | If docs provided → verification created |
| `photos[]` | `VehiclePhoto[]` | Synced via `syncPhotos()` |

### AutoBentaPH Lead → V8Atlas Lead

| AutoBentaPH Field | V8Atlas Field | Notes |
|---|---|---|
| `Inquiry.buyerId → User.name` | `lead.buyerName` | Resolved via join |
| `Inquiry.message` | `lead.message` | |
| `Inquiry.createdAt` | `lead.receivedAt` | |
| `VehicleListing.id` | `lead.autobentaListingId` | For reverse lookup |

---

## Implementation Checklist

- [ ] Create `backend/src/services/v8atlas/` directory and stub files
- [ ] Create `backend/src/routes/v8atlasWebhooks.js` with signature verification
- [ ] Register webhook route in `server.js`
- [ ] Add V8Atlas env vars to `.env.example`
- [ ] Implement `inventorySync.upsertFromV8Atlas()`
- [ ] Implement `leadSync.pushLeadToV8Atlas()`
- [ ] Wire lead push into `inquiries.js` POST handler (dealer listings only)
- [ ] Implement `trustSync` bidirectional
- [ ] Add `V8ATLAS_DEALER_SYNC_ENABLED` feature flag check before all sync calls
- [ ] Integration test with V8Atlas sandbox environment

---

## Current Status

The integration interfaces are designed and documented. No V8Atlas-specific code has been written yet — all services are stubbed. The AutoBentaPH data model and verification workflow are ready to accept V8Atlas sync payloads without schema changes.

**Coupling strategy:** V8Atlas sync is additive. Every sync operation creates standard AutoBentaPH records (VerificationRequest, VehicleListing, Lead) — the platform functions identically without V8Atlas connected.
