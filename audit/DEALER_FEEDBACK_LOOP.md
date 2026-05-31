# DEALER_FEEDBACK_LOOP.md
# AutoBentaPH — Product Feedback System Architecture
# Status: Production-Ready | Last Updated: 2026-05-31
# Sprint: Founding Dealer Acquisition Sprint

---

## 1. Purpose

This document describes the architecture of the product feedback system. The system replaces roadmap guessing with real dealer data: structured feature requests, category ratings, and longitudinal NPS scores that feed directly into sprint planning.

**Business objective:** By the time the 5 founding dealers have been active for 30 days, the product team has ranked, validated, and prioritized the next sprint's feature list — derived entirely from dealer behavior and explicit requests, not internal assumptions.

**Design principle:** Frequency is signal. One dealer requesting a feature is a data point. Three dealers requesting the same feature is a mandate.

---

## 2. Models

### 2.1 `FeatureRequest`

**Purpose:** Captures individual feature requests from dealers. The same logical request submitted by multiple dealers increments a shared `frequency` counter rather than creating duplicate records.

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `title` | String | Short feature name |
| `description` | Text | What the dealer wants and why |
| `requestedBy` | FK (DealerId) | The dealer who submitted this specific request |
| `linkedRequestId` | FK (self) | Points to canonical request if this is a duplicate |
| `frequency` | Int | Count of unique dealers who have requested this (default 1) |
| `priority` | Enum | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` — set by admin |
| `status` | Enum | `SUBMITTED`, `UNDER_REVIEW`, `PLANNED`, `IN_PROGRESS`, `SHIPPED`, `DECLINED` |
| `revenueImpact` | Float | Estimated MRR impact if built (₱/month) |
| `expectedMrrSum` | Float | Sum of `requestedBy` dealer MRR × frequency (auto-calculated) |
| `adminResponse` | Text | Written response: ship date, decline reason, or alternative |
| `adminRespondedAt` | DateTime | When admin wrote the response |
| `adminRespondedBy` | String | Admin who responded |
| `shippedAt` | DateTime | Set when feature is deployed |
| `source` | Enum | `FOUNDING_DEALER`, `STANDARD_DEALER`, `DEMO_FEEDBACK`, `INTERNAL` |
| `createdAt` | DateTime | — |
| `updatedAt` | DateTime | — |

**Frequency counter logic:**
When a dealer submits a feature request that matches an existing request (by title similarity or admin merging):
1. Admin reviews and merges the new submission into the canonical `FeatureRequest`
2. `frequency` is incremented by 1
3. `expectedMrrSum` is recalculated: `sum of MRR for all unique requesting dealers`
4. The original request's `linkedRequestId` is set on the duplicate (not deleted — preserved for context)

**Deduplication is manual at founding stage.** With 5 dealers, automated deduplication is not warranted and risks incorrectly merging distinct requests.

---

### 2.2 `DealerFeedback`

**Purpose:** Per-category satisfaction ratings linked to a dealer. Provides structured data per product area — distinct from `FeatureRequest` (which captures what to build) and `NPSResponse` (which captures overall sentiment).

*(Full schema documented in `/audit/CUSTOMER_SUCCESS_ARCHITECTURE.md`, Section 2.3)*

**Relevant to feedback loop:**
- `category` maps to product areas (see Section 5 below)
- `rating` (1–5) per category surfaces which product areas are underperforming
- `comment` text is reviewed by product team during quarterly sessions
- Low ratings (≤ 2) trigger admin alerts and accelerate review

---

### 2.3 `NPSResponse`

**Purpose:** Longitudinal NPS tracking per dealer across multiple time periods. Provides trend data — is dealer sentiment improving, stable, or declining?

*(Full schema documented in `/audit/CUSTOMER_SUCCESS_ARCHITECTURE.md`, Section 2.2)*

**Relevant to feedback loop:**
- `score` and `comment` from Day 7 and Day 30 surveys are reviewed before each quarterly roadmap session
- Detractors (score ≤ 6) receive an immediate follow-up to diagnose the root cause
- Detractor comments feed directly into `FeatureRequest` submissions if they identify a missing capability

---

## 3. Workflow: Dealer Submits → Roadmap Decision

### Step 1: Dealer Submits Feature Request

**Entry points:**
- In-app: `/settings/feedback` or a persistent "Suggest a Feature" link in the sidebar
- WhatsApp/email: CS team logs it manually via `POST /api/admin/feature-requests`
- Quarterly session: founding team captures requests in real time during the video call

**On submission:** `FeatureRequest` created with `status: SUBMITTED`, `frequency: 1`, `source: FOUNDING_DEALER` (or appropriate source).

### Step 2: Admin Reviews and Deduplicates

**Cadence:** Admin reviews new feature requests daily during the founding period (5-minute task with 5 dealers).

**Actions:**
- If new: leave as-is, set `priority` based on initial assessment
- If duplicate: merge into canonical request → increment `frequency` → update `expectedMrrSum`
- If unclear: reach out to dealer for clarification before logging

### Step 3: Frequency and Priority Updated

**Priority scoring rubric:**

| Factor | Weight |
|---|---|
| `frequency` (number of dealers requesting) | High |
| `expectedMrrSum` (revenue at stake) | High |
| Implementation complexity | Medium |
| Strategic alignment | Medium |

**Composite score formula (for sorting):**
```
compositeScore = (frequency × avgMrrPerDealer) + revenueImpact
  where:
    avgMrrPerDealer = expectedMrrSum / frequency
```

**Priority assignment:**

| compositeScore | Suggested Priority |
|---|---|
| Top 20% of all requests | `CRITICAL` |
| 21–50% | `HIGH` |
| 51–80% | `MEDIUM` |
| Bottom 20% | `LOW` |

### Step 4: Top Requests Inform Next Sprint

**Sprint input meeting (monthly at founding stage):**
1. Pull `/api/admin/feature-requests?sort=compositeScore&status=SUBMITTED,UNDER_REVIEW`
2. Review top 10 by compositeScore
3. Any request with `frequency ≥ 3` automatically advances to `PLANNED` unless there is a strong reason not to
4. Admin writes `adminResponse` for each reviewed request: ship date, decline reason, or alternative
5. Dealers who requested features are notified of the decision (email or WhatsApp)

**The 3-dealer rule:**
> If 3 of the 5 founding dealers request the same feature, it goes to the next sprint.

This rule is explicit and communicated to dealers in the Founding Dealer agreement. It gives dealers confidence that their input matters.

---

## 4. Frequency as Signal — The Revenue-Weighted Model

A feature requested by 1 enterprise dealer with high MRR and a feature requested by 3 standard dealers with lower MRR may have similar `expectedMrrSum`. The composite score surfaces both.

**Example comparison:**

| Request | `frequency` | `expectedMrrSum` | `compositeScore` |
|---|---|---|---|
| "Bulk inventory CSV import" | 3 dealers × ₱3,599 avg | ₱10,797 | High |
| "Custom reporting API" | 1 dealer × ₱10,000 est. | ₱10,000 | High |
| "Facebook Messenger auto-reply" | 4 dealers × ₱3,599 avg | ₱14,396 | Very High |

**Interpretation:**
- "Facebook Messenger auto-reply" wins by both frequency and revenue signal — it should ship first
- "Bulk CSV import" and "Custom reporting API" are comparable — tiebreak by complexity and strategic fit
- Single-dealer enterprise requests are not automatically deprioritized — they are revenue-weighted correctly

**The goal is to avoid the trap of building what the loudest voice asks for.** The frequency × revenue model forces the data to speak.

---

## 5. Admin Interface: `/admin/feature-requests`

**Default sort:** `compositeScore` descending (frequency × revenueImpact)

**Columns displayed:**
- Feature title
- Requested by (dealer name, anonymized in aggregate view)
- Frequency (badge showing count)
- Expected MRR impact (₱ value)
- Priority (editable inline)
- Status (editable inline)
- Admin response (expandable)

**Filters:**
- Status: SUBMITTED / UNDER_REVIEW / PLANNED / IN_PROGRESS / SHIPPED / DECLINED
- Source: FOUNDING_DEALER / STANDARD_DEALER
- Priority: LOW / MEDIUM / HIGH / CRITICAL

**Actions:**
- Merge duplicates (links `linkedRequestId`, increments `frequency`)
- Write admin response (sets `adminResponse`, `adminRespondedAt`, `adminRespondedBy`)
- Update status (triggers dealer notification on PLANNED or SHIPPED)
- Mark as shipped (sets `shippedAt`, notifies requesting dealers)

**Access:** Admin role required. Not exposed to dealers — they see only their own requests and the response status.

---

## 6. Feedback Categories and Product Area Mapping

`DealerFeedback.category` maps each feedback item to a specific product area:

| Category | Product Area | Example Issues It Surfaces |
|---|---|---|
| `ONBOARDING` | Onboarding flow, data import, first listing | "Import was confusing", "Too many steps to go live" |
| `CRM` | 8-stage pipeline, lead management | "Stages don't match my process", "No mobile notification" |
| `LISTINGS` | Inventory management, photos, Verified | "Photo upload is slow", "Can't bulk edit price" |
| `LEADS` | Lead volume, quality, source attribution | "Leads are low quality", "Can't see where leads come from" |
| `BILLING` | Subscription, invoices, payment | "No GCash payment option", "Invoice doesn't show BIR details" |
| `GENERAL` | Overall platform, support, performance | "Page loads slowly", "Support was fast" |

**Category → FeatureRequest linkage:**
When a `DealerFeedback` entry with `rating ≤ 3` is reviewed, the admin is prompted to create or link a `FeatureRequest` in the same category. This converts qualitative dissatisfaction into a tracked, prioritized action item.

---

## 7. How This Replaces Speculation: The Hypothesis → Validation Loop

### The Problem with Guessing

Without this system, product roadmaps are driven by:
- Founder intuition ("I think dealers want X")
- Loudest customer voice ("Dealer A keeps asking for Y")
- Competitive pressure ("Competitor has feature Z")
- Internal convenience ("This is easy to build")

All of these inputs are valid signals. None of them are sufficient alone.

### The Loop

**Stage 1: Build Assumption**
Before a sprint, the product team states an assumption:
> "We believe dealers are losing leads because they have no mobile push notification for new inquiries."

**Stage 2: Measure via Feedback**
After shipping a related feature (or before building it):
- Check `DealerFeedback.category = "CRM"` ratings — are they low?
- Check `FeatureRequest` — do any requests mention notifications?
- Check `NPSResponse.comment` — do comments mention missed leads?
- Check `DealerSuccessPlan.responseTimeAvg` — is average response time > 2 hours?

**Stage 3: Decide Roadmap**

| What the data shows | Decision |
|---|---|
| 3+ dealers have requested mobile notifications | Build it. Frequency threshold met. |
| `responseTimeAvg` > 4 hours across majority of dealers | Build it. Behavioral data confirms problem. |
| CRM feedback ratings < 3 average | Investigate — mobile notifications may be part of a larger CRM dissatisfaction cluster |
| No requests, response time healthy | Deprioritize — assumption was wrong. Ship something else. |

**The goal:** No feature goes to sprint planning because someone assumed dealers want it. Every feature on the roadmap traces to at least one of: (a) explicit `FeatureRequest` with `frequency ≥ 2`, (b) behavioral data from `DealerSuccessPlan`, or (c) negative `DealerFeedback` in the relevant category.

### Quarterly Cadence

| Time | Activity |
|---|---|
| Sprint start | Review top 10 `FeatureRequest` by compositeScore |
| Mid-sprint | Check `DealerFeedback` ratings — any category below 3.0 average? |
| Sprint end | Ship or deprioritize; write `adminResponse` for all reviewed requests |
| Quarterly session (Week 4, 16, 28, 40) | Live review with each founding dealer; capture new requests in real time |

---

## 8. Related Files

- Schema: `/backend/prisma/schema.prisma` — `FeatureRequest`, `DealerFeedback`, `NPSResponse` models
- Routes: `/backend/src/routes/featureRequests.js`, `/backend/src/routes/feedback.js`, `/backend/src/routes/nps.js`
- Frontend: `/frontend/src/pages/admin/FeatureRequests.jsx`
- Audit: `/audit/CUSTOMER_SUCCESS_ARCHITECTURE.md` — `DealerFeedback` and `NPSResponse` schema detail
- Audit: `/audit/FIRST_5_DEALERS_PLAN.md` — success criteria ("at least 1 feature request per dealer captured")
