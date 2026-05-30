# Ownership Transfer Implementation Plan
**Project:** AutoBentaPH  
**Date:** 2026-05-30  
**Status:** Phase 1 Complete · Phases 2–6 Foundation Laid

---

## Summary

This document tracks the implementation of the Ownership Transfer Center and the broader vehicle transaction platform upgrade. The goal is to close the trust gap between the end of the inspection/messaging lifecycle and the point where money and keys actually change hands.

---

## Phase 1 — Ownership Transfer Center ✅ Complete

### Route
`/ownership-transfer`

### Files Created
| File | Purpose |
|------|---------|
| `frontend/src/pages/OwnershipTransfer.jsx` | Main page — hero, sticky nav, all sections |
| `frontend/src/components/transfer/TransferChecklist.jsx` | 9-step interactive checklist with localStorage progress |
| `frontend/src/components/transfer/TransferDocuments.jsx` | Required docs by party (Seller / Buyer / Vehicle) |
| `frontend/src/components/transfer/TransferCostEstimator.jsx` | Fee calculator: vehicle type × region × sale type |
| `frontend/src/components/transfer/TransferTimeline.jsx` | 4-phase visual timeline (Day 1 → Day 7–14) |
| `frontend/src/components/transfer/TransferFAQ.jsx` | 8-question accordion FAQ |

### Page Sections
1. **Hero** — dark ink background, yellow accent CTA, LTO-compliance badge
2. **Checklist** — 9 steps, checkbox toggle, progress bar (0–100%), localStorage persistence keyed by listing ID when available
3. **Documents** — 3-column cards: Seller, Buyer, Vehicle requirements
4. **Cost Estimator** — Vehicle type (motorcycle/car/truck), region (Metro Manila/Luzon/Visayas/Mindanao), sale type, HPG toggle. Live breakdown with categorised line items (Government / Services / Insurance)
5. **Timeline** — Day 1 (Documents), Day 2 (Testing & Insurance), Day 3–7 (LTO Processing), Day 7–14 (Ownership Confirmed)
6. **FAQ** — 8 questions covering timing, OR/CR loss, open deeds, HPG, financed vehicles, fee allocation, payment safety, OR vs CR distinction

### Navigation Integration
- **Navbar:** Added "Transfer guide" link replacing "How it works"
- **CarDetail sidebar:** Added "Ready to complete the transfer?" CTA card below action buttons
- **Footer:** Full 4-column footer with Buy / Transfer / Sell / Company link groups
- **Inspection completion flow:** Transfer CTA visible from CarDetail action panel

---

## Phase 2 — Listing Trust System ✅ Foundation Complete

### Database Schema Changes
Migration: `20260530102428_add_trust_fields_to_listings`

Fields added to `vehicle_listings` table:
| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `ownership_verified` | Boolean | false | Ownership document verified by team |
| `transfer_ready` | Boolean | false | All transfer docs confirmed present |
| `vehicle_history_available` | Boolean | false | Full history report attached |
| `seller_verified` | Boolean | false | Seller identity verified |
| `price_score` | Int? | null | AI price score 0–100 |
| `financing_eligible` | Boolean | false | Eligible for bank financing |

### Frontend Components
| File | Purpose |
|------|---------|
| `frontend/src/components/TrustBadges.jsx` | Renders trust indicator badges from listing fields |

### Trust Badge Set
- Verified Ownership (blue)
- Ready For Transfer (emerald)
- Inspection Ready (purple)
- Financing Eligible (orange)
- Price Verified (teal) — shown when `priceScore >= 70`
- History Available (indigo)

### Backward Compatibility
All new fields have defaults — no existing records broken. Migration is additive only.

---

## Phase 3 — Transfer Readiness Score ✅ Foundation Complete

### Files Created
| File | Purpose |
|------|---------|
| `frontend/src/components/ReadinessScore.jsx` | 0–100 score with colour scale and line-item breakdown |

### Scoring Algorithm (client-side)
| Criterion | Points |
|-----------|--------|
| Ownership verified | +20 |
| OR/CR available | +20 |
| Seller identity verified | +15 |
| Insurance / financing eligible | +15 |
| Inspection completed | +15 |
| No ownership discrepancies | +15 |
| **Total possible** | **100** |

### Colour Scale
- 0–29: Red — Needs attention
- 30–54: Amber — Fair
- 55–79: Blue — Good
- 80–100: Emerald — Excellent

### Display Modes
- `compact` prop: circular mini-gauge + label (for listing cards)
- Default: full card with bar + line items (for detail pages)

---

## Phase 4 — Vehicle History Foundation ✅ Architecture Complete

### Files Created
| File | Purpose |
|------|---------|
| `backend/src/services/vehicleHistory/vehicleHistoryProvider.js` | Provider abstraction interface |
| `backend/src/services/vehicleHistory/mockProvider.js` | Mock provider for development |
| `frontend/src/components/VehicleHistoryCard.jsx` | History card (seller-disclosed data + future report slot) |

### Provider Interface
```js
registerProvider('name', { fetch: async (identifier) => VehicleHistoryReport })
```
`VehicleHistoryReport` shape: provider, plateNumber, chassisNumber, ownerCount, registrationHistory[], incidents[], ownershipHistory[], hasLien, lienholder, fetchedAt

### Future Integrations (slot in here)
- LTO data provider API (when officially available)
- Insurance claim databases
- Third-party PH vehicle history vendors (CarCheck, etc.)

---

## Phase 5 — Insurance Marketplace Foundation ✅ Complete

### Route
`/insurance`

### File Created
`frontend/src/pages/Insurance.jsx`

### Content
- CTPL coverage card (required by law badge, covers/not-covered lists, ₱350–₱800/yr estimate)
- Comprehensive coverage card (full protection, 1.5–3% of vehicle value estimate)
- Financing-Required insurance card
- Provider directory (Malayan, OONA, BPI/MS, Philippine Charter)
- "Coming soon" integration notice with links to Transfer Guide and Browse

### Provider Abstraction
Page is structured to slot in live quote API calls per provider when integrations are signed. No vendor logic is hardcoded.

---

## Phase 6 — Safe Transaction Center ✅ Complete

### Route
`/safe-buying`

### File Created
`frontend/src/pages/SafeBuying.jsx`

### Content
- **Buyer verification checklist** (6 cards): Physical inspection, OR/CR verification, identity confirmation, pre-purchase inspection, staged payment, notarized deed
- **Fraud pattern guide** (5 patterns): Too-good pricing, advance payment, OR/CR mismatch, open deed of sale, undisclosed lien
- **Payment safety** (6 tips): Bank transfer audit trail, receipt requirements, e-wallet limits, dealer account verification, escrow guidance
- **Seller verification explanation**: How AutoBenta verifies dealers (DTI/SEC, LTO accreditation, fraud checks, moderation)
- Links to verified dealers, transfer guide, inspections

---

## Homepage Updates ✅ Complete

### TrustPlatformSection
File: `frontend/src/components/home/TrustPlatformSection.jsx`

Added between HowItWorks and the existing TrustSection in `Home.jsx`.

Headline: "More than listings. A safer way to buy."

6 feature cards with hover lift + learn-more arrow:
1. Ownership Transfer Center → `/ownership-transfer`
2. Vehicle Inspection → `/inspections`
3. Financing Assistance → `/financing`
4. Verified Sellers → `/cars?sellerType=dealer`
5. Vehicle History Reports → `/cars` (Coming Soon badge)
6. Insurance Marketplace → `/insurance`

---

## Build Validation

```
npm run build (frontend)
✓ 1632 modules transformed
✓ 0 errors, 0 warnings
Built in 1.17s

prisma migrate dev
✓ Migration 20260530102428_add_trust_fields_to_listings applied
✓ Prisma Client regenerated
```

---

## Follow-up Work

| Item | Priority | Notes |
|------|----------|-------|
| Persist checklist progress to user account (not just localStorage) | Medium | Backend route needed: `POST /transfer-checklist/:listingId` |
| Wire `ownershipVerified` / `transferReady` flags to admin moderation UI | High | Moderators need a UI toggle to set these per listing |
| Add ReadinessScore to CarDetail sidebar | Medium | Component built, needs integration into CarDetail.jsx |
| Add TrustBadges to CarCard and ListingCard | Medium | Components built, need wiring to listing data |
| Build live insurance quote integration | Low | Awaiting partner API agreements |
| Build LTO vehicle history integration | Low | Awaiting LTO data access |
| Add `/transfer-checklist` API endpoint | Medium | So authenticated users keep progress across devices |
