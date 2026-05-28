# AutoBenta PH — Fraud Detection System

## Overview

The fraud detection engine runs automatically on every new listing submission and can be re-triggered by admins. It produces `FraudFlag` records with severity levels, updates the listing's `fraudScore` (0–100), and maintains a `SellerRiskProfile` for each seller.

---

## How It Works

```
POST /api/listings
  └─► analyzeListingWithAI()        ← existing AI analysis
  └─► runFraudRulesEngine(listingId)
        ├─► detectSuspiciousPricing()   ← price vs AI estimate
        ├─► detectDuplicatePhotos()     ← storageKey matching across listings
        ├─► analyzeVehicleFraudSignals() ← document/disclosure checks
        └─► updateSellerRiskProfile()   ← aggregate seller history
```

Results are stored in:
- `FraudFlag` records (one per signal)
- `VehicleListing.fraudScore` (sum of severity weights, capped at 100)
- `VehicleListing.fraudFlags` (JSON snapshot for quick reads)
- `SellerRiskProfile` (per seller, recalculated on each listing)

---

## Fraud Flags

### `price_too_low` (High — 30 pts)
**Condition:** Listed price < 65% of AI price estimate  
**Description:** Price significantly below market value — common in advance-fee scams.

### `price_low` (Medium — 15 pts)
**Condition:** Listed price 65–80% of AI price estimate  
**Description:** Below-market but not extreme. May be a motivated seller or undisclosed issues.

### `no_or_cr` (High — 30 pts)
**Condition:** `hasOrCr = false`  
**Description:** No Official Receipt or Certificate of Registration. LTO title transfer will be problematic.

### `flood_undisclosed` (High — 30 pts)
**Condition:** `hasFlood = true` AND `floodNotes` is empty or < 10 characters  
**Description:** Seller admits flood history but provides no details.

### `accident_undisclosed` (Medium — 15 pts)
**Condition:** `hasAccident = true` AND `accidentNotes` is empty or < 10 characters  
**Description:** Accident history not adequately disclosed.

### `minimal_description` (Low — 5 pts)
**Condition:** `description` < 30 characters  
**Description:** Very little information. Legitimate sellers typically describe the car in detail.

### `high_mileage_for_age` (Medium — 15 pts)
**Condition:** Car is < 5 years old AND mileage > (age × 40,000 km)  
**Description:** Unusually high mileage for the vehicle's age.

### `duplicate_photos` (High — 30 pts)
**Condition:** Photo `storageKey` appears in another listing  
**Description:** Photos reused across listings — common in scam duplicates.

---

## Fraud Score Calculation

```
fraudScore = sum(SEVERITY_SCORES[flag.severity] for unresolved flags)
           = min(total, 100)
```

| Score Range | Risk Level |
|-------------|------------|
| 0–24        | Low        |
| 25–49       | Medium     |
| 50–74       | High       |
| 75–100      | Critical   |

---

## Seller Risk Profile

Maintained in `SellerRiskProfile` table. Updated each time the fraud engine runs.

**Score factors:**
- Each flagged listing: +10 pts (capped at 40)
- Rapid listing creation (>5 in 24h): +20 pts
- Duplicate photo history: +25 pts
- Flag ratio > 50%: +15 pts
- Total: capped at 100

**Risk levels:** `low` / `medium` / `high` / `critical`  
Thresholds: ≥70 critical, ≥50 high, ≥25 medium.

---

## Admin Workflow

### Moderation Queue (`GET /api/admin/moderation`)
Lists all `pending` listings sorted by fraud score descending. Admin can:
- **Approve** → status: `active`
- **Reject** → status: `rejected`
- **Flag** → status: `flagged`
- **Request Info** → status unchanged, note recorded
- **Escalate** → status unchanged, escalation recorded
- **Suspend Seller** → `user.isSuspended = true`
- **Restore** → status: `pending`

### Fraud Review (`GET /api/admin/fraud`)
Lists all listings with `fraudScore >= minScore` (default 25). Admin can:
- **Re-analyze** → re-runs the full fraud engine
- **Resolve flag** → marks individual `FraudFlag.isResolved = true`, recalculates score

### Seller Risk Dashboard (`GET /api/admin/fraud/sellers`)
Lists `SellerRiskProfile` records by risk level. Admin can suspend/restore sellers.

---

## Re-running the Engine

```bash
POST /api/admin/fraud/:listingId/analyze
Authorization: Bearer <admin-token>
```

Useful after:
- A seller uploads new photos
- Admin manually edits listing details
- New fraud patterns are added to the engine

---

## Adding New Fraud Rules

1. Create a detector in `backend/src/services/fraud/`
2. Return an array of flag-shaped objects: `{ flagType, severity, title, description, metadata }`
3. Import and call it in `fraudRulesEngine.js` alongside the existing detectors

Flag severity must be one of: `low` | `medium` | `high` | `critical`
