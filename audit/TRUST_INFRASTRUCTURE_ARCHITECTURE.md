# Trust Infrastructure Architecture

**Date:** 2026-05-30  
**Project:** AutoBentaPH / Ryderr

---

## Design Principles

1. **Badges are system-enforced, not user-controlled.** No frontend or API call allows a user to set `ownershipVerified`, `sellerVerified`, or `transferReady` directly. These are side-effects of approved verification workflows.

2. **Every trust state has an audit trail.** `VerificationReview` + `VerificationStatusHistory` records are immutable; `AuditLog` SHA-256 chains provide tamper detection.

3. **Scores are backend-computed.** `ReadinessScore` is calculated server-side by `readinessEngine.js` and persisted to the listing. The frontend displays the API result; the client-side fallback is only for mock/demo data.

4. **Trust can be revoked.** Expiry fields + suspension workflow ensure badges don't persist beyond their verified window.

5. **Provider-agnostic.** Vehicle history, inspection, and insurance data flow through abstract provider interfaces — no hardcoding of specific vendors.

---

## Trust State Machine

```
Verification Request States:
  pending → under_review → approved
                         → rejected
                         → suspended
  approved → expired (via expiry job)
  approved → suspended (via admin action)
```

**Propagation contract:**

| Verification Type | On Approval | On Revocation |
|---|---|---|
| `seller_identity` | `User.isVerified = true`, all listings `sellerVerified = true` | `isVerified = false`, all listings `sellerVerified = false` |
| `dealer_business` | `Dealer.isVerified = true` | `Dealer.isVerified = false` |
| `ownership` | `listing.ownershipVerified = true` | `ownershipVerified = false`, `transferReady = false` |
| `vehicle` | `listing.vehicleHistoryAvailable = true` | `vehicleHistoryAvailable = false` |
| `transfer_readiness` | Recomputes `transferReady` from all prerequisites | `transferReady = false` |

---

## Component Architecture

### Backend Layers

```
API Routes (verifications.js)
    ↓
Readiness Engine (readinessEngine.js)
    ↓
Trust Propagation (inline in route, transactional)
    ↓
Prisma ORM
    ↓
PostgreSQL
    ↓
Audit Logger (auditLogger.js + tamperHash.js)
```

### Frontend Layers

```
CarDetail / Browse → TrustBadges (display only)
CarDetail sidebar → ReadinessScore (API-backed, fallback)
CarDetail sidebar → VehicleHistoryCard (seller-disclosed)
Dashboard → SellerVerification (upload + status)
AdminPanel → VerificationQueue (admin review)
Home → HowVerificationWorks (education)
```

### Document Storage

```
uploadDocument middleware (Multer)
    ↓
/uploads/documents/{uuid}.{ext}  [local]
    or
Cloudflare R2 bucket  [production via STORAGE_PROVIDER=r2]
    ↓
VerificationDocument record (url, storageKey, provider, isConfidential: true)
```

Documents are marked `isConfidential: true`. The admin queue displays document links; buyers never see raw document URLs.

---

## Data Model Relationships

```
User
  ├── VerificationRequest[] (one per type, indexed)
  │     ├── VerificationDocument[] (uploaded files)
  │     ├── VerificationReview[] (admin actions)
  │     └── VerificationStatusHistory[] (state transitions)
  └── SellerRiskProfile (fraud risk scoring)

VehicleListing
  ├── VerificationRequest[] (ownership/vehicle/transfer types)
  ├── readinessScore (computed int)
  ├── readinessReason (json criteria breakdown)
  └── readinessEvaluatedAt (last computation timestamp)
```

---

## Vehicle History Provider Architecture (Phase 7)

**File:** `backend/src/services/vehicleHistory/vehicleHistoryProvider.js`

Abstract interface pattern:

```javascript
registerProvider(name, { fetch: async (identifier) => { ... } })
fetchReport(providerName, identifier) → Promise<HistoryReport>
```

Current providers:
- `mock` — deterministic fake data for development

Future provider slots:
- `lto` — LTO ARTS API (when available)
- `carmudi-history` — Third-party PH vehicle history
- `carfax-ph` — If/when market enters PH

The `vehicleHistoryAvailable` flag on listings is set when any provider returns a result for the vehicle's plate/VIN.

---

## Readiness Score Formula (V2)

Backend source: `backend/src/services/verification/readinessEngine.js`

| Criterion | Points | Data Source |
|---|---|---|
| Seller identity verified | 20 | `User.isVerified` or `Dealer.isVerified` |
| Ownership verified | 25 | `VehicleListing.ownershipVerified` (verification-locked) |
| Vehicle history available | 15 | `VehicleListing.vehicleHistoryAvailable` |
| Transfer documents complete | 20 | `hasOrCr && ownershipVerified` |
| Inspection completed | 10 | `InspectionRequest.status === 'completed'` |
| Financing eligible | 10 | `VehicleListing.financingEligible` |

Score is refreshed on every API call to `/api/verifications/listing/:id/readiness-score`. Stale scores (from cached listing data) are replaced. Score + criteria breakdown are persisted to listing for offline display.

---

## API Security Model

**Endpoint security summary:**

| Endpoint | Auth | Notes |
|---|---|---|
| `POST /verifications` | Authenticated | Rate-limited by `apiLimiter` |
| `GET /verifications/my` | Authenticated | User sees own only |
| `GET /verifications/listing/:id/readiness-score` | Public | Read-only, no sensitive data |
| `GET /verifications/admin/queue` | Admin role | Paginated, filterable |
| `GET /verifications/admin/stats` | Admin role | Aggregate counts |
| `PATCH /verifications/admin/:id/review` | Admin role | Wrapped in DB transaction |

**What the API cannot do:**
- Set `ownershipVerified`, `transferReady`, `sellerVerified` directly — these only change via `propagateApproval()` inside the admin review transaction
- Read another user's verification documents — documents are private and accessed via admin queue only
- Submit multiple concurrent requests of the same type — 409 guard at API level

---

## Premium Dealer Program — Architecture Foundation

**Concept:** `Verified Dealer Pro` tier above standard `Verified Dealer`.

**Proposed data model (not yet implemented):**
```prisma
model DealerTier {
  id         String   @id @default(uuid())
  dealerId   String   @unique
  tier       String   @default("standard")  // standard | verified | pro
  benefits   Json?    // { priorityPlacement, leadRouting, analytics, v8atlasSync }
  grantedAt  DateTime @default(now())
  expiresAt  DateTime?
  grantedBy  String?
}
```

**Planned `pro` benefits:**
- `priorityPlacement` — featured position in search results
- `leadRouting` — priority assignment of buyer inquiries
- `advancedAnalytics` — extended metrics, conversion funnel
- `v8atlasSync` — bidirectional inventory sync (see V8Atlas plan)

**Implementation path:** Add `DealerTier` model + admin tier assignment endpoint + search ranking weight modifier.

---

## Future Roadmap

| Phase | Feature | Blocker |
|---|---|---|
| Expiry automation | Cron job to revoke expired verifications | Needs scheduled task runner (Render cron or pg_cron) |
| Email notifications | Notify on approval/rejection | Email service integration |
| Selfie liveness | 3rd-party liveness API | Vendor selection |
| LTO integration | Real ownership verification | LTO API access (currently no public API) |
| Document vault signed URLs | R2 presigned URLs for private docs | STORAGE_PROVIDER=r2 in production |
| V8Atlas sync | Dealer inventory + lead sync | See V8Atlas plan |
