# Fraud Prevention Plan

**Date:** 2026-05-30  
**Project:** AutoBentaPH / Ryderr

---

## Existing Fraud Infrastructure (Already Built)

The following fraud detection systems are live in the codebase:

### Fraud Detection Services (`backend/src/services/fraud/`)

| Service | Purpose |
|---|---|
| `fraudRulesEngine.js` | Orchestrator — runs all checks, aggregates score |
| `vehicleFraudAnalyzer.js` | Per-listing fraud signal detection |
| `suspiciousPricingDetector.js` | Price anomaly detection vs. market average |
| `duplicatePhotoDetector.js` | Detects reused photos across multiple listings |
| `sellerRiskScorer.js` | Calculates seller risk profile (0–100) |

### Fraud Data Models

| Model | Purpose |
|---|---|
| `FraudFlag` | Per-listing fraud signal record (type, severity, metadata) |
| `SellerRiskProfile` | Aggregate risk score per seller (riskScore 0–100, riskLevel low/medium/high/critical) |
| `ListingModerationAction` | Admin moderation decisions with full history |

### Admin UI

- `FraudReview.jsx` — Review queue for fraud flags
- `SellerRiskDashboard.jsx` — Seller risk profiles dashboard
- Both accessible under `/admin` → "Fraud" and "Seller Risk" tabs

---

## Risk Engine Design

### Seller Risk Score (0–100)

Computed by `sellerRiskScorer.js`:

| Signal | Weight | Threshold |
|---|---|---|
| Flagged listings / total listings | High | >20% |
| Rapid listing creation | High | >5 listings in 24h |
| Duplicate photo history | High | Any confirmed duplicate |
| Suspicious edits | Medium | >3 description edits in 24h |
| Multiple accounts detected | Critical | Same phone/ID across accounts |
| Price anomaly flags | Medium | >2 listings flagged |

**Risk levels:** 0–24 = Low · 25–49 = Medium · 50–74 = High · 75–100 = Critical

Critical sellers are flagged for immediate admin review. High-risk sellers are placed in a shadow review queue (listings require manual approval).

### Listing Fraud Score (0–100)

Computed by `vehicleFraudAnalyzer.js` + `suspiciousPricingDetector.js`:

| Signal | Severity | Points |
|---|---|---|
| Price >40% below market average | High | 35 |
| Duplicate photos detected | High | 30 |
| Suspicious keyword patterns | Medium | 20 |
| Plate ending mismatch (if provided) | Medium | 15 |
| Photos sourced from other listings | Critical | 40 |
| Multiple active listings for same plate | High | 30 |
| New seller with high-value listing | Low | 10 |

---

## Phase 10 Expansion — Additional Detections

The following detection patterns are planned as the platform scales:

### Duplicate Identity Detection

**Problem:** Same person creates multiple accounts to bypass seller reputation or verification state.

**Detection signals:**
- Same phone number across accounts
- Same government ID document hash (requires OCR or manual comparison)
- Same device fingerprint (future: browser fingerprint capture at registration)
- Same IP + same email domain pattern

**Action:** Merge alert sent to admin; secondary account flagged for review.

**Implementation:** New `DuplicateAccountFlag` model + background job comparing `User.phone` at registration.

### Document Authenticity

**Problem:** Sellers upload fake OR/CR documents.

**Planned checks:**
1. LTO plate number format validation (regex)
2. OR number format validation (LTO-issued OR numbers follow a known pattern)
3. Cross-reference OR/CR year vs. vehicle year (CR year should not precede listing year)
4. Name consistency check: `VehicleListing` description name vs. uploaded CR owner name (manual + future OCR)

### Price Manipulation Detection

**Problem:** Sellers cycle prices to appear competitive.

**Detection:** Track price history per listing. Flag if:
- Price drops >30% in <48 hours (possible bait listing)
- Price increases >50% after inquiry surge (possible artificial scarcity)
- Price pattern matches known scam templates (e.g. "quick sale" at 60% market)

**Implementation:** Add `ListingPriceHistory` table; update on every `PATCH /listings/:id`.

---

## Audit Trail

Every trust-related action generates an `AuditLog` record:

```javascript
auditLog({
  userId,        // actor
  action,        // e.g. 'verification_approved', 'fraud_flag_resolved'
  entityType,    // 'verification_request' | 'listing' | 'user' | 'fraud_flag'
  entityId,      // record UUID
  details,       // JSON — additional context
  ipAddress,     // for geo/device tracking
  userAgent,
  requestId,
})
```

The `AuditLog` table uses SHA-256 chaining (`prevHash → hash`) for tamper evidence. The `AuditHashAnchor` table stores periodic chain anchors.

**Verification-specific audit events:**
- `verification_submitted` — User submits docs
- `verification_under_review` — Admin starts review
- `verification_approved` — Admin approves
- `verification_rejected` — Admin rejects with reason
- `verification_suspended` — Admin suspends badge
- `trust_flag_propagated` — Badge applied to listing/user
- `trust_flag_revoked` — Badge removed

---

## What Cannot Happen (System Guarantees)

- **No frontend-controlled trust states.** No API endpoint accepts `ownershipVerified: true` from a listing POST/PATCH. The field is only written by the verification approval flow.

- **No direct badge manipulation.** Admin cannot directly toggle `sellerVerified` or `ownershipVerified` in the admin panel — they must go through the verification review workflow.

- **No anonymous verification submissions.** `POST /api/verifications` requires `authenticate` middleware. Unauthenticated requests return 401.

- **No duplicate active requests.** A user cannot submit two `seller_identity` requests simultaneously — the API returns 409 if one is pending/under_review.

- **Audit logs are append-only.** No `UPDATE` or `DELETE` on `audit_logs` table. Prisma schema has no `update` or `delete` methods exposed for this model.

---

## Known Gaps

| Gap | Severity | Mitigation |
|---|---|---|
| No selfie liveness check | Medium | Manual review required for all selfie submissions |
| No OCR on documents | Medium | Admin manually reads OR/CR numbers |
| No IP geo-blocking | Low | Can add via Cloudflare at network layer |
| No device fingerprinting | Low | Future: fingerprint at registration |
| No automated duplicate phone check at registration | Medium | Can add query in auth.js register handler |
| Fraud score not recalculated on listing edit | Medium | Currently run on listing create only; add on PATCH |

---

## Recommended Immediate Actions

1. **Add phone deduplication at registration** — 2-line query in `auth.js` register endpoint
2. **Wire fraud score recalculation to listing PATCH** — ensure edits don't escape fraud detection
3. **Add expiry cron for verification badges** — scheduled job to revoke `expiresAt < now()` records
4. **Rate limit verification submissions** — currently only global `apiLimiter` applies; add a per-user daily limit
