# CUSTOMER_SUCCESS_ARCHITECTURE.md
# AutoBentaPH — Customer Success System Architecture
# Status: Production-Ready | Last Updated: 2026-05-31
# Sprint: Founding Dealer Acquisition Sprint

---

## 1. Purpose

This document describes the architecture of the customer success system introduced in the Founding Dealer Acquisition Sprint. The system tracks dealer health post-onboarding, surfaces early churn signals, drives renewal conversations, and feeds aggregated health data into the Growth Dashboard.

**Business objective:** Keep the first 5 paying dealers active, healthy, and willing to refer — measured by NPS ≥ 7 at Day 30 and zero involuntary churn in the first 90 days.

**Design principle:** Health scoring is automatic and continuous; intervention is manual and human-driven. The system surfaces signals — the founding team acts on them.

---

## 2. Models

### 2.1 `DealerSuccessPlan`

**Purpose:** One-to-one record with `Dealer`. Tracks milestone completion, health score, and renewal risk for each active dealer.

**Relationship:** `Dealer` 1:1 `DealerSuccessPlan` — created automatically when a dealer activates their account.

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `dealerId` | FK | Required, unique — one plan per dealer |
| `inventoryImported` | Boolean | Default false |
| `crmAdoptionRate` | Float | 0.0–1.0 — ratio of leads touched via CRM vs total |
| `firstLeadResponded` | Boolean | Default false |
| `responseTimeAvg` | Float | Average hours to first response (rolling 7-day) |
| `firstSaleReported` | Boolean | Default false |
| `healthScore` | Int | 0–100, auto-calculated (see Section 4) |
| `riskLevel` | Enum | `LOW`, `MEDIUM`, `HIGH` — derived from healthScore |
| `renewalLikelihood` | Enum | `LIKELY`, `UNCERTAIN`, `AT_RISK` |
| `onboardingCompletedAt` | DateTime | Set when all 5 milestones are true |
| `lastHealthCheck` | DateTime | Timestamp of last auto-recalculation |
| `notes` | Text | CS team notes (manual) |
| `createdAt` | DateTime | — |
| `updatedAt` | DateTime | — |

**Milestone fields and their sources:**

| Milestone Field | Set to `true` when... | Source event |
|---|---|---|
| `inventoryImported` | Dealer uploads first vehicle listing | `Vehicle.create` event |
| `crmAdoptionRate` | Recalculated on each lead update | Lead activity service |
| `firstLeadResponded` | First `LeadActivity` of type `RESPONSE` created | Lead response tracking |
| `responseTimeAvg` | Recalculated rolling 7-day average | Lead activity service |
| `firstSaleReported` | First deal in CRM reaches `CLOSED_WON` stage | CRM stage update |

---

### 2.2 `NPSResponse`

**Purpose:** Captures periodic NPS survey responses from dealers. Supports longitudinal tracking — multiple responses per dealer over time.

**Survey cadence:** Day 7, Day 30, Day 90 post-activation. Triggered automatically via email/WhatsApp prompt. Admin can also trigger manually.

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `dealerId` | FK | Required |
| `score` | Int | 0–10 (standard NPS scale) |
| `comment` | Text | Optional qualitative context |
| `surveyPeriod` | Enum | `DAY_7`, `DAY_30`, `DAY_90`, `MONTHLY` |
| `promoter` | Boolean | Score ≥ 9 |
| `detractor` | Boolean | Score ≤ 6 |
| `passive` | Boolean | Score 7–8 |
| `respondedAt` | DateTime | When dealer submitted |
| `createdAt` | DateTime | When survey was sent |

**NPS calculation (for dashboard):**
```
NPS = (% Promoters − % Detractors) × 100
  where:
    Promoters = responses with score ≥ 9
    Detractors = responses with score ≤ 6
    Passives = responses with score 7–8
```

**Alert rule:** If `score ≤ 6` (detractor), immediately flag `DealerSuccessPlan.riskLevel` as `HIGH` and create a CS team alert for same-day follow-up.

---

### 2.3 `DealerFeedback`

**Purpose:** Qualitative feedback per product category, linked to dealer. Distinct from NPS (which is a single number) — this captures structured opinions about specific areas.

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `dealerId` | FK | Required |
| `category` | Enum | See categories below |
| `rating` | Int | 1–5 (category-specific satisfaction) |
| `comment` | Text | Required for rating ≤ 2 |
| `submittedAt` | DateTime | — |
| `reviewedAt` | DateTime | Set when CS team acknowledges |
| `reviewedBy` | String | Admin who reviewed |

**Feedback categories and product area mapping:**

| Category | Maps to Product Area |
|---|---|
| `ONBOARDING` | Onboarding flow, import tools, first listing |
| `CRM` | 8-stage pipeline, lead management, notifications |
| `LISTINGS` | Inventory management, photo upload, Verified badges |
| `LEADS` | Lead volume, quality, source attribution |
| `BILLING` | Subscription management, invoices, payment |
| `GENERAL` | Overall platform, support, performance |

**Trigger for review:** Any `rating ≤ 2` creates an alert in the admin panel for CS team follow-up within 24 hours (Founding Dealer SLA: 4 hours).

---

### 2.4 `SupportTicket`

**Purpose:** Formal support request tracking. All Founding Dealer support interactions are tracked here, whether initiated via WhatsApp, email, or in-app.

**Key fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `dealerId` | FK | Required |
| `subject` | String | Required |
| `description` | Text | Required |
| `priority` | Enum | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `status` | Enum | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `channel` | Enum | `EMAIL`, `WHATSAPP`, `IN_APP` |
| `assignedTo` | String | Admin handling the ticket |
| `firstResponseAt` | DateTime | Set when first reply sent (for SLA tracking) |
| `resolvedAt` | DateTime | Set on resolution |
| `slaBreached` | Boolean | Set to true if firstResponse exceeds SLA |
| `resolutionNotes` | Text | What was done to resolve |
| `createdAt` | DateTime | — |
| `updatedAt` | DateTime | — |

**SLA rules:**

| Dealer Plan | Priority | SLA Target |
|---|---|---|
| Founding Dealer | Any | 4 hours |
| Pro | HIGH/CRITICAL | 8 hours |
| Pro | LOW/MEDIUM | 24 hours |
| Verified | Any | 24 hours |

**`slaBreached` logic:** Set automatically when `firstResponseAt` is populated and `(firstResponseAt − createdAt)` exceeds the plan SLA in business hours (Mon–Sat, 8 AM–8 PM PHT).

---

## 3. Health Score Calculation

The health score is a 0–100 integer computed automatically from 5 binary/threshold milestone checks. It is stored on `DealerSuccessPlan.healthScore` and recalculated on every relevant event.

### Formula

```
healthScore = sum of points from each milestone:

  inventoryImported === true          → +20
  crmAdoptionRate > 0.5               → +20 (>50% of leads touched via CRM)
  firstLeadResponded === true         → +20
  responseTimeAvg < 2.0 (hours)       → +20
  firstSaleReported === true          → +20

Maximum: 100
Minimum: 0
```

### Health Score → Risk Level Mapping

| Health Score Range | `riskLevel` | Interpretation |
|---|---|---|
| 80–100 | `LOW` | Dealer is fully adopted; minimal churn risk |
| 40–79 | `MEDIUM` | Partial adoption; check in proactively |
| 0–39 | `HIGH` | Low adoption; intervention required within 48 hours |

### Health Score → Renewal Likelihood Mapping

| Health Score + NPS | `renewalLikelihood` |
|---|---|
| healthScore ≥ 80 AND latest NPS ≥ 8 | `LIKELY` |
| healthScore 40–79 OR NPS 6–7 | `UNCERTAIN` |
| healthScore < 40 OR latest NPS ≤ 5 | `AT_RISK` |

**Priority override:** If any `SupportTicket` with `priority: CRITICAL` is open for > 4 hours without first response, `renewalLikelihood` is overridden to `AT_RISK` regardless of score.

### Recalculation Triggers

The health score is recalculated (not scheduled — event-driven) when:
- A new vehicle is created for the dealer (`inventoryImported`)
- A lead activity is recorded (`crmAdoptionRate`, `firstLeadResponded`, `responseTimeAvg`)
- A CRM deal reaches `CLOSED_WON` (`firstSaleReported`)

Recalculation is synchronous within the service layer. No background job needed at founding scale.

---

## 4. Risk Levels and Intervention Actions

### `LOW` — No immediate action required

**Dashboard indicator:** Green badge
**Recommended action:** Send Day 30 NPS survey on schedule; capture feature request at next quarterly session
**Auto-actions:** None

### `MEDIUM` — Proactive check-in

**Dashboard indicator:** Yellow badge
**Recommended action:** CS team initiates a 15-minute check-in call within 5 business days
**Typical triggers:** Inventory imported but CRM adoption < 50%; no sale reported after Day 14
**Auto-actions:** Create alert in admin panel; surface on Growth Dashboard "At Risk" tab

### `HIGH` — Intervention required

**Dashboard indicator:** Red badge
**Recommended action:** CS team contact within 48 hours; diagnose the specific missing milestone; offer hands-on session
**Typical triggers:** No leads responded to; health score < 40 after Day 7; detractor NPS score
**Auto-actions:**
- Create `HIGH` priority `SupportTicket` on behalf of dealer (subject: "Proactive health check")
- Notify assigned CS team member via internal alert
- Escalate to founding team member if unresolved within 24 hours

---

## 5. Integration Points with Growth Dashboard

The `DealerSuccessPlan` data feeds the `/admin/growth` endpoint and the Growth Dashboard at `/admin/growth`.

**Data provided to growth endpoint:**

```json
{
  "dealerHealth": {
    "totalActive": 5,
    "byRiskLevel": {
      "LOW": 3,
      "MEDIUM": 1,
      "HIGH": 1
    },
    "avgHealthScore": 72,
    "byRenewalLikelihood": {
      "LIKELY": 3,
      "UNCERTAIN": 1,
      "AT_RISK": 1
    }
  },
  "nps": {
    "latestScore": 38,
    "responseCount": 4,
    "promoters": 2,
    "passives": 1,
    "detractors": 1
  },
  "supportTickets": {
    "open": 2,
    "slaBreached": 0,
    "avgResolutionHours": 2.4
  },
  "onboardingCompletion": {
    "allMilestonesComplete": 3,
    "partiallyOnboarded": 2
  }
}
```

**Refresh cadence:** Growth endpoint queries are live (no caching) at founding scale. Each request re-aggregates from source tables. Add query caching when active dealer count exceeds 50.

---

## 6. Related Files

- Schema: `/backend/prisma/schema.prisma` — `DealerSuccessPlan`, `NPSResponse`, `DealerFeedback`, `SupportTicket` models
- Routes: `/backend/src/routes/successPlans.js`, `/backend/src/routes/nps.js`, `/backend/src/routes/feedback.js`, `/backend/src/routes/support.js`
- Health score service: `/backend/src/services/dealerHealthService.js`
- Frontend: `/frontend/src/pages/admin/Growth.jsx` — Growth Dashboard (consumes health data)
- Audit: `/audit/DEALER_FEEDBACK_LOOP.md` — feedback system architecture
- Plan: `/audit/FIRST_5_DEALERS_PLAN.md` — success criteria (NPS ≥ 7 at Day 30)
