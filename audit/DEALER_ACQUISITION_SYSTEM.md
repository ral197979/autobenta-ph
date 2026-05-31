# DEALER_ACQUISITION_SYSTEM.md
# AutoBentaPH — Dealer Acquisition System Architecture
# Status: Production-Ready | Last Updated: 2026-05-31
# Sprint: Founding Dealer Acquisition Sprint

---

## 1. Purpose

This document describes the architecture of the dealer acquisition system introduced in the Founding Dealer Acquisition Sprint. The system tracks the complete path from initial prospect discovery through to a paying dealer account, provides pipeline visibility for the founding team, and captures competitor intelligence to support sales conversations.

**Business objective:** Enable manual, high-touch acquisition of the first 5 paying dealers with full pipeline visibility at each stage.

**Design principle:** Built for 200 prospects max at founding stage. No pagination, no complex search infrastructure. Simple, observable, fast to operate manually.

---

## 2. New Models Added

### 2.1 `DealerProspect`

**Purpose:** Central record for each potential dealer being tracked through the acquisition pipeline.

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `dealershipName` | String | Required |
| `contactName` | String | Required |
| `contactEmail` | String | Optional (may not be known at discovery) |
| `contactPhone` | String | Optional |
| `stage` | Enum | 8-stage pipeline (see below) |
| `source` | Enum | `DEMO_BOOKING`, `MANUAL`, `REFERRAL`, `INBOUND` |
| `monthlyVolume` | Int | Estimated units/month (from demo form or call) |
| `currentTools` | String | What they use today (Messenger, Philkotse, etc.) |
| `notes` | Text | Free-form sales notes |
| `assignedTo` | String | Admin user handling this prospect |
| `demoBookingId` | FK | Links to `DemoBooking` if prospect came from booking form |
| `createdAt` | DateTime | — |
| `updatedAt` | DateTime | — |

**Pipeline stages (8-stage enum):**

| Stage | Description | Trigger |
|---|---|---|
| `DISCOVERED` | Identified, not yet contacted | Manual add or inbound lead |
| `CONTACTED` | First outreach sent | Admin action |
| `DEMO_SCHEDULED` | Demo booked | DemoBooking created |
| `DEMO_COMPLETED` | Demo held, notes recorded | Admin action post-call |
| `PROPOSAL_SENT` | ROI report and offer sent | Admin action |
| `NEGOTIATING` | Active back-and-forth | Admin action |
| `CLOSED_WON` | Signed up, paying dealer | Auto-trigger on Dealer creation |
| `CLOSED_LOST` | Not moving forward | Admin action + loss reason |

**Capacity note:** System is designed to hold up to 200 `DealerProspect` records without performance degradation. Index on `stage` and `createdAt` only.

---

### 2.2 `ProspectActivity`

**Purpose:** Immutable activity log for each prospect — one entry per meaningful state change or sales action.

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `prospectId` | FK | Required — links to `DealerProspect` |
| `type` | Enum | Activity type (see below) |
| `description` | String | Human-readable summary |
| `performedBy` | String | Admin user or `"system"` |
| `metadata` | JSON | Optional context (previous stage, next stage, etc.) |
| `createdAt` | DateTime | Immutable — never updated |

**Activity types:**

| Type | Created by |
|---|---|
| `STAGE_CHANGED` | Auto-created on prospect stage update |
| `NOTE_ADDED` | Admin manually logs a call or email |
| `DEMO_BOOKED` | Auto-created when DemoBooking links to prospect |
| `DEMO_COMPLETED` | Admin action post-demo |
| `PROPOSAL_SENT` | Admin action |
| `CONTACT_ATTEMPTED` | Admin logs failed contact attempt |
| `DEAL_CLOSED` | Auto-created on CLOSED_WON transition |

**Auto-creation rule:** Any `stage` update on `DealerProspect` automatically creates a `ProspectActivity` entry of type `STAGE_CHANGED` with `metadata: { from: prevStage, to: newStage }`. This is enforced in the service layer, not a DB trigger.

---

### 2.3 `DemoBooking`

**Purpose:** Records inbound demo bookings from the public `/book-demo` form. Creates or links to a `DealerProspect` automatically.

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Submitted in form |
| `dealershipName` | String | Submitted in form |
| `email` | String | Submitted in form |
| `phone` | String | Submitted in form |
| `monthlyVolume` | String | Form field 5 (range enum) |
| `currentTools` | String | Form field 6 |
| `demoType` | Enum | One of 4 types (FULL, CRM, ANALYTICS, V8ATLAS) |
| `preferredDate` | DateTime | Dealer-selected slot |
| `status` | Enum | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` |
| `prospectId` | FK | Nullable — set by auto-prospect logic |
| `confirmedAt` | DateTime | Set when booking confirmed |
| `completedAt` | DateTime | Set post-demo |
| `notes` | Text | Post-demo notes from sales team |
| `createdAt` | DateTime | — |

**Auto-prospect creation logic:**
1. On `POST /api/book-demo`, system checks for existing `DealerProspect` by `email` OR `phone`
2. If found: link `DemoBooking.prospectId` to existing prospect; update prospect `stage` to `DEMO_SCHEDULED`
3. If not found: create new `DealerProspect` with `source: DEMO_BOOKING`, `stage: DEMO_SCHEDULED`
4. In both cases: create `ProspectActivity` entry of type `DEMO_BOOKED`

This flow ensures that demo bookings always result in a tracked prospect, with no manual step required from the sales team.

---

### 2.4 `CompetitorProfile`

**Purpose:** Structured competitor intelligence database to support sales positioning and objection handling.

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Competitor name (e.g. "Philkotse", "Carmudi") |
| `category` | Enum | `LISTING_SITE`, `CRM`, `DMS`, `MARKETPLACE`, `SOCIAL` |
| `website` | String | — |
| `pricingNotes` | Text | Known pricing (public or gathered from sales calls) |
| `strengths` | Text[] | Array of strength strings |
| `weaknesses` | Text[] | Array of weakness strings |
| `battlecard` | Text | Full sales battlecard narrative |
| `dealerOverlapEstimate` | Int | Estimated % of our prospects also using this competitor |
| `lastUpdated` | DateTime | Manual update tracking |
| `updatedBy` | String | Admin who last updated |

**Usage:** Surfaced in the admin pipeline view alongside prospect records. When a prospect's `currentTools` field matches a known competitor, the admin UI can surface the relevant battlecard inline.

---

## 3. API Surface

All endpoints are in the Express backend. Admin endpoints require `Authorization: Bearer <token>` with `role: "admin"` on the decoded JWT.

### 3.1 `GET /api/admin/prospects`

**Auth:** Admin required

**Query parameters:**
- `stage` (optional): filter by pipeline stage
- `source` (optional): filter by acquisition source
- `assignedTo` (optional): filter by assigned admin user

**Response:** Array of `DealerProspect` objects with most-recent `ProspectActivity` count and last activity date.

**No pagination:** Returns all records up to 200. If prospect count exceeds 200, this endpoint should be revisited.

---

### 3.2 `POST /api/admin/prospects`

**Auth:** Admin required

**Body:** `{ dealershipName, contactName, contactEmail, contactPhone, stage, source, monthlyVolume, currentTools, notes, assignedTo }`

**Response:** Created `DealerProspect` with auto-created `ProspectActivity` of type `STAGE_CHANGED` (initial stage).

---

### 3.3 `PATCH /api/admin/prospects/:id`

**Auth:** Admin required

**Body:** Any subset of `DealerProspect` fields

**Side effect:** If `stage` is updated, auto-creates `ProspectActivity` entry.

---

### 3.4 `POST /api/book-demo` (PUBLIC)

**Auth:** None — public endpoint, no authentication required

**Body:** `{ name, dealershipName, email, phone, monthlyVolume, currentTools, demoType, preferredDate }`

**Behavior:**
1. Create `DemoBooking` record
2. Auto-create or link `DealerProspect` (see Section 2.3)
3. Return `{ bookingId, confirmedAt, message: "Demo booked successfully" }`

**Rate limiting:** Apply rate limit of 10 requests/hour per IP to prevent spam. No CAPTCHA required at founding stage — monitor manually.

**Validation:** All 8 form fields are required. `email` must be valid format. `phone` accepts `09XXXXXXXXX` or `+639XXXXXXXXX` format. `preferredDate` must be future date within 30 days, Mon–Sat, 9 AM–6 PM PHT.

---

### 3.5 `GET /api/admin/growth`

**Auth:** Admin required

**Purpose:** Aggregates all acquisition and pipeline metrics for the Growth Dashboard at `/admin/growth`.

**Response shape (abbreviated):**
```json
{
  "prospects": {
    "total": 47,
    "byStage": {
      "DISCOVERED": 12,
      "CONTACTED": 8,
      "DEMO_SCHEDULED": 5,
      "DEMO_COMPLETED": 9,
      "PROPOSAL_SENT": 6,
      "NEGOTIATING": 3,
      "CLOSED_WON": 2,
      "CLOSED_LOST": 2
    }
  },
  "demoBookings": {
    "total": 18,
    "pending": 3,
    "confirmed": 8,
    "completed": 6,
    "cancelled": 1
  },
  "foundingSpotsClaimed": 2,
  "foundingSpotsRemaining": 3,
  "conversionRates": {
    "demoToProposal": "55.6%",
    "proposalToClose": "33.3%",
    "overallDemoToClose": "11.1%"
  },
  "avgDaysToClose": 8.5
}
```

**Calculation notes:**
- `foundingSpotsClaimed`: count of `Dealer` records with `plan = "FOUNDING"` or equivalent flag
- Conversion rates derived from `ProspectActivity` timestamps per stage transition
- `avgDaysToClose`: mean of (`CLOSED_WON` activity timestamp − `DISCOVERED` activity timestamp) for all won prospects

---

### 3.6 `GET /api/admin/competitors`

**Auth:** Admin required

**Response:** All `CompetitorProfile` records, sorted by `dealerOverlapEstimate` descending.

---

### 3.7 `POST /api/admin/competitors`

**Auth:** Admin required

**Body:** All `CompetitorProfile` fields except `id`, `createdAt`

**Response:** Created `CompetitorProfile`

---

### 3.8 `PATCH /api/admin/competitors/:id`

**Auth:** Admin required

**Body:** Any updatable `CompetitorProfile` fields

**Side effect:** Updates `lastUpdated` and `updatedBy` automatically.

---

## 4. Data Flows

### 4.1 Demo Booking → Prospect Auto-Creation

```
Buyer visits /book-demo
  → submits form (8 fields)
  → POST /api/book-demo (public, no auth)
  → Server validates input
  → Creates DemoBooking record
  → Checks for existing DealerProspect by email/phone
    → Found: link booking, update stage to DEMO_SCHEDULED
    → Not found: create DealerProspect (source: DEMO_BOOKING, stage: DEMO_SCHEDULED)
  → Creates ProspectActivity (type: DEMO_BOOKED)
  → Returns booking confirmation
  → [Background] Send confirmation email + SMS to dealer
  → [Background] Notify assigned admin via internal alert
```

### 4.2 Stage Change → Activity Log

```
Admin calls PATCH /api/admin/prospects/:id with { stage: "PROPOSAL_SENT" }
  → Service layer detects stage change (prev: "DEMO_COMPLETED", next: "PROPOSAL_SENT")
  → Updates DealerProspect.stage
  → Creates ProspectActivity {
      prospectId: <id>,
      type: "STAGE_CHANGED",
      description: "Stage changed from DEMO_COMPLETED to PROPOSAL_SENT",
      performedBy: <admin user>,
      metadata: { from: "DEMO_COMPLETED", to: "PROPOSAL_SENT" }
    }
  → Returns updated prospect
```

### 4.3 Prospect → Growth Dashboard

```
Admin visits /admin/growth
  → GET /api/admin/growth
  → Server queries DealerProspect (grouped by stage)
  → Server queries DemoBooking (grouped by status)
  → Server queries Dealer (count with founding plan)
  → Calculates conversion rates from ProspectActivity timestamps
  → Returns aggregated growth object
  → Dashboard renders pipeline funnel chart + metrics cards
```

---

## 5. Security

| Endpoint | Authentication | Authorization |
|---|---|---|
| `GET /api/admin/prospects` | JWT Bearer required | `role: "admin"` |
| `POST /api/admin/prospects` | JWT Bearer required | `role: "admin"` |
| `PATCH /api/admin/prospects/:id` | JWT Bearer required | `role: "admin"` |
| `POST /api/book-demo` | **None — public** | No auth check |
| `GET /api/admin/growth` | JWT Bearer required | `role: "admin"` |
| `GET /api/admin/competitors` | JWT Bearer required | `role: "admin"` |
| `POST /api/admin/competitors` | JWT Bearer required | `role: "admin"` |
| `PATCH /api/admin/competitors/:id` | JWT Bearer required | `role: "admin"` |

**Public endpoint protection for `/api/book-demo`:**
- Rate limit: 10 requests/hour/IP (enforced via `express-rate-limit`)
- Input validation: all fields validated before DB write
- No PII logged in server access logs (phone, email masked in log output)
- `DemoBooking` records are soft-deletable but not publicly readable

**Prospect data isolation:**
- `DealerProspect` records are only accessible to admin users
- No prospect data is exposed through dealer-facing APIs
- Prospect phone/email are never returned in public endpoints

---

## 6. Capacity and Scalability Notes

The system is designed for the founding stage: up to 200 `DealerProspect` records and up to 20 `DemoBooking` records per week.

**No pagination** is implemented on `/api/admin/prospects` or `/api/admin/growth` at this stage. This is intentional — full dataset visibility is more useful than paginated views when manually managing 5–50 prospects.

**Scale trigger:** When prospect count reaches 100, add pagination to `/api/admin/prospects` and an indexed search field. The data model supports this without schema changes.

**Indexes (current):**
- `DealerProspect.stage` — for stage-filtered queries in growth endpoint
- `DealerProspect.email` + `DealerProspect.phone` — for demo booking deduplication lookup
- `ProspectActivity.prospectId` — for activity timeline queries
- `DemoBooking.prospectId` — for booking-prospect join

---

## 7. Related Files

- Schema: `/backend/prisma/schema.prisma` — `DealerProspect`, `ProspectActivity`, `DemoBooking`, `CompetitorProfile` models
- Routes: `/backend/src/routes/prospects.js`, `/backend/src/routes/bookDemo.js`, `/backend/src/routes/growth.js`, `/backend/src/routes/competitors.js`
- Frontend: `/frontend/src/pages/admin/FoundingDealers.jsx`, `/frontend/src/pages/admin/Growth.jsx`
- Marketing: `/marketing/DEMO_BOOKING_PAGE_COPY.md` — copy spec for `/book-demo` form
