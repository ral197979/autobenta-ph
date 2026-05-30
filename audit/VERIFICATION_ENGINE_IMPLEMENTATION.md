# Verification Engine Implementation

**Date:** 2026-05-30  
**Status:** Phase 1–6 Implemented, Phases 7–12 Foundations Laid

---

## What Was Built

### Database (Prisma Migration: `20260530105629_verification_engine`)

**New Enums:**
- `VerificationType` — `seller_identity | dealer_business | ownership | vehicle | transfer_readiness`
- `VerificationStatus` — `pending | under_review | approved | rejected | expired | suspended`
- `DocumentType` — `government_id | selfie | or_cr | deed_of_sale | business_registration | dealer_permit | proof_of_address | insurance_policy | inspection_report | other`

**New Models:**

| Table | Purpose |
|---|---|
| `verification_requests` | Central record per verification attempt |
| `verification_documents` | Documents uploaded per request |
| `verification_reviews` | Immutable reviewer action log |
| `verification_status_history` | Full status transition trail |

**New Fields on Existing Models:**
- `User`: `verificationScore (Int?)`, `verificationExpiry (DateTime?)`
- `VehicleListing`: `readinessScore (Int?)`, `readinessReason (Json?)`, `readinessEvaluatedAt (DateTime?)`

---

### Backend

**New Files:**
- `backend/src/routes/verifications.js` — All verification endpoints
- `backend/src/services/verification/readinessEngine.js` — Score computation logic
- `backend/src/middleware/uploadDocument.js` — Document upload (images + PDF)

**API Endpoints:**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/verifications` | Authenticated | Submit verification request + documents |
| `GET` | `/api/verifications/my` | Authenticated | List own verification requests |
| `GET` | `/api/verifications/listing/:id/readiness-score` | Public | Get/refresh readiness score |
| `GET` | `/api/verifications/admin/queue` | Admin | Paginated verification queue |
| `GET` | `/api/verifications/admin/stats` | Admin | Queue stats (pending/approved/rejected counts) |
| `PATCH` | `/api/verifications/admin/:id/review` | Admin | Review: approve/reject/under_review/suspend |

**Trust Propagation (automatic on approval):**
- `seller_identity` approved → `User.isVerified = true` + all active listings get `sellerVerified = true`
- `dealer_business` approved → `Dealer.isVerified = true`
- `ownership` approved → `VehicleListing.ownershipVerified = true`
- `vehicle` approved → `VehicleListing.vehicleHistoryAvailable = true`
- `transfer_readiness` approved → `transferReady` computed from all prerequisite flags

**Revocation (automatic on rejection/suspension):**
- `seller_identity` revoked → `User.isVerified = false` + all listings lose `sellerVerified`
- `ownership` revoked → `ownershipVerified = false`, `transferReady = false`

---

### Frontend

**New Files:**
- `frontend/src/pages/admin/VerificationQueue.jsx` — Admin review interface
- `frontend/src/components/seller/SellerVerification.jsx` — Seller document upload UI
- `frontend/src/components/home/HowVerificationWorks.jsx` — Homepage explanation section

**Modified Files:**
- `frontend/src/pages/AdminPanel.jsx` — Added "Verifications" tab
- `frontend/src/pages/Dashboard.jsx` — Added "Verification" tab for sellers/dealers
- `frontend/src/components/ReadinessScore.jsx` — Now consumes backend API (`/api/verifications/listing/:id/readiness-score`) with client-side fallback for mock listings
- `frontend/src/pages/Home.jsx` — Added HowVerificationWorks between TrustPlatformSection and TrustSection

---

### Readiness Score V2

**Scoring Criteria (backend-authoritative):**

| Criterion | Points | Source |
|---|---|---|
| Seller identity verified | 20 | `sellerVerified` or `User.isVerified` |
| Ownership verified | 25 | `ownershipVerified` (verification-locked) |
| Vehicle history available | 15 | `vehicleHistoryAvailable` |
| Transfer documents complete | 20 | `hasOrCr && ownershipVerified` |
| Inspection completed | 10 | `InspectionRequest` with `completed` status |
| Financing eligible | 10 | `financingEligible` |
| **Total** | **100** | |

**Bands:** 0–39 = Fair (amber) · 40–69 = Good (blue) · 70–100 = Excellent (green)

Score is computed on `GET /api/verifications/listing/:id/readiness-score`, persisted to `readinessScore`, `readinessReason`, `readinessEvaluatedAt` on the listing record. Recalculated any time score changes.

---

## Security Notes

- Badge fields (`ownershipVerified`, `sellerVerified`, `transferReady`) are **never directly settable by the listing owner** via any API
- Only `PATCH /api/verifications/admin/:id/review` (admin-gated) can trigger trust propagation
- Every trust action generates an `AuditLog` record with SHA-256 chaining
- Document upload limited to 5 files, max 10 MB each, images + PDF only
- One active request per type per user enforced at DB + API level (409 on duplicate)

---

## Known Gaps / Next Steps

| Gap | Priority | Notes |
|---|---|---|
| Email notifications on approval/rejection | Medium | Wire into existing email service |
| Verification expiry job | Medium | Cron to revoke expired badges automatically |
| Document virus scanning | Low | Hook exists via storageProvider |
| Listing-scoped ownership verification UI | Medium | Seller submits per-listing, not yet in Dashboard |
| Bulk admin actions in queue | Low | Single-row review only currently |
| Selfie liveness detection | Low | Manual review for now; add 3rd party API later |
