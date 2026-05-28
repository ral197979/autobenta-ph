# AutoBenta PH — Phase 2 Architecture

## Overview

Phase 2 upgrades the MVP from a simple monolithic API to a **pilot-ready marketplace platform** with:
- Persistent file storage abstraction (local ↔ Cloudflare R2)
- Fraud detection engine (5 modules, rules-based)
- Moderation queue with admin workflow
- Hash-chained tamper-evident audit logs
- Structured logging (pino) with request correlation IDs
- Rate limiting + abuse detection
- AI vision listing draft pipeline (mock → live-ready)
- Dealer CRM analytics + reminders
- PWA support + AI Listing Wizard frontend
- OpenAPI/Swagger documentation

---

## New Backend Services

### Storage Abstraction (`src/services/storage/`)

```
storageProvider.js       — interface, selects provider via STORAGE_PROVIDER env var
localStorageProvider.js  — wraps multer disk storage (dev/Render free tier)
r2StorageProvider.js     — Cloudflare R2 via @aws-sdk/client-s3 (production)
```

**Switch with env var:**
```
STORAGE_PROVIDER=local  # default
STORAGE_PROVIDER=r2     # + R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
```

### Fraud Detection Engine (`src/services/fraud/`)

```
duplicatePhotoDetector.js    — matches storageKey across listings
suspiciousPricingDetector.js — compares price against AI estimate (< 65% → high, 65–80% → medium)
vehicleFraudAnalyzer.js      — no OR/CR, flood/accident not disclosed, minimal description, high mileage for age
sellerRiskScorer.js          — aggregates seller history into SellerRiskProfile (riskScore 0–100)
fraudRulesEngine.js          — orchestrates all 4 detectors, persists FraudFlag records, updates listing.fraudScore
```

**Severity score weights:**
| Severity | Points |
|----------|--------|
| low      | 5      |
| medium   | 15     |
| high     | 30     |
| critical | 50     |

### Audit Logger (`src/services/audit/`)

```
tamperHash.js   — SHA-256 hash chaining (computeHash, verifyChain)
auditLogger.js  — auditLog(), auditFromReq() helpers
```

Every `AuditLog` record stores `prevHash` and `hash`, forming a linked chain. Call `verifyChain(entries)` to detect tampering.

### AI Vision Pipeline (`src/services/aiVision/`)

```
imageVehicleClassifier.js  — detect make/model/year/color/bodyType from image
ocrMileageReader.js        — extract odometer reading via OCR
damageDetector.js          — detect visible damage areas and severity
conditionEstimator.js      — derive condition grade from damage/mileage/age
listingDraftGenerator.js   — orchestrates all 4, returns aiDraftData object
```

All modules run in mock mode by default. Set `AI_MODE=live` to wire real vision API calls.

---

## New Routes

| Route | Auth | Description |
|-------|------|-------------|
| `GET /api/admin/moderation` | admin | Pending listings queue, sorted by fraud score |
| `POST /api/admin/moderation/:listingId` | admin | Take action (approve/reject/flag/request_info/escalate/suspend_seller/restore) |
| `GET /api/admin/moderation/:listingId/history` | admin | Moderation action history |
| `GET /api/admin/fraud` | admin | High-fraud-score listings |
| `POST /api/admin/fraud/:listingId/analyze` | admin | Re-run fraud engine |
| `PATCH /api/admin/fraud/flags/:flagId/resolve` | admin | Resolve a fraud flag |
| `GET /api/admin/fraud/sellers` | admin | High-risk seller profiles |
| `GET /api/dealer/analytics` | dealer/admin | Dashboard metrics + inventory aging |
| `GET /api/dealer/analytics/reminders` | dealer | List reminders |
| `POST /api/dealer/analytics/reminders` | dealer | Create reminder |
| `PATCH /api/dealer/analytics/reminders/:id` | dealer | Update/complete reminder |
| `GET /api/dealer/analytics/activities` | dealer | Recent activity log |
| `GET /api/saved-searches` | auth | List saved searches |
| `POST /api/saved-searches` | auth | Create saved search |
| `PATCH /api/saved-searches/:id` | auth | Update saved search |
| `DELETE /api/saved-searches/:id` | auth | Delete saved search |
| `POST /api/ai-vision/draft` | auth | Generate listing draft from image URLs |
| `GET /api/docs` | public | Swagger UI |
| `GET /api/docs.json` | public | OpenAPI JSON spec |

---

## Server Upgrades (`src/server.js`)

### Structured Logging (pino)
- JSON logs in production/test
- pino-pretty in development only (`NODE_ENV=development`)
- Log level: `debug` (dev) / `info` (prod), override with `LOG_LEVEL`

### Request IDs
Every request gets a UUID (`x-request-id` header, in/out). Available as `req.id` throughout the request lifecycle.

### Rate Limiting
```
/api/auth/*       → 20 requests / 15 min  (authLimiter)
/api/*            → 300 requests / 15 min (apiLimiter)
/api/ai/*         → 50 requests / 15 min  (aiLimiter)
/api/listings/photos → 100 requests / 15 min (uploadLimiter)
Search endpoints  → slow-down after 60 req/15min
```

### Graceful Shutdown
Wrapped in `if (require.main === module)` so tests can import app without binding port.
On `SIGTERM`/`SIGINT`: closes HTTP server gracefully, force-exits after 10s.

### Environment Validation
`DATABASE_URL` and `JWT_SECRET` are required. Missing either → `process.exit(1)` with clear error.

---

## Database Changes (Prisma)

8 new models added in Phase 2:

| Model | Purpose |
|-------|---------|
| `FraudFlag` | Individual fraud signals per listing |
| `SellerRiskProfile` | Aggregated seller risk score (0–100) |
| `ListingModerationAction` | Admin actions audit trail |
| `SavedSearch` | User-saved filter presets |
| `RecentlyViewed` | Per-user listing view history |
| `DealerActivity` | CRM activity log per dealer |
| `DealerReminder` | Task reminders for dealers |
| `AuditHashAnchor` | Checkpoint for audit chain verification |

Key field additions to existing models:
- `User`: `isSuspended`, `suspendReason`, `lastLoginAt`, `loginCount`
- `VehicleListing`: `fraudScore`, `fraudFlags`, `moderationNote`, `listedAt`, `favoriteCount`, `aiDraftData`, `searchVector`
- `VehiclePhoto`: `storageKey`, `provider`, `width`, `height`, `sizeBytes`
- `AuditLog`: `userAgent`, `requestId`, `prevHash`, `hash`

---

## Frontend Additions

### New Pages
| Path | Component | Roles |
|------|-----------|-------|
| `/ai-wizard` | `AIListingWizard` | seller/dealer/admin |
| Admin panel tabs | `ModerationQueue`, `FraudReview`, `SellerRiskDashboard` | admin |
| Dealer panel tabs | `DealerAnalytics`, `DealerReminders` | dealer/admin |

### PWA
- `public/manifest.json` — name, icons, shortcuts
- `public/sw.js` — cache-first static, network-first navigation, skips API routes
- Registered in `main.jsx` (production only)

---

## Environment Variables (Phase 2 additions)

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_PROVIDER` | `local` | `local` or `r2` |
| `R2_ENDPOINT_URL` | — | Cloudflare R2 endpoint |
| `R2_ACCESS_KEY_ID` | — | R2 access key |
| `R2_SECRET_ACCESS_KEY` | — | R2 secret |
| `R2_BUCKET_NAME` | — | R2 bucket name |
| `R2_PUBLIC_URL` | — | Public CDN URL for R2 |
| `LOG_LEVEL` | `debug`/`info` | pino log level override |
