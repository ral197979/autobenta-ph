# CUSTOMER SUCCESS SYSTEM — V2 AUDIT
## AutoBentaPH | Technical + Operational Overview

**Version:** 2.0 | **Audit Date:** 2026-05-31 | **Platform Certification:** 90/100

---

## OVERVIEW

This document records what was built in the Customer Success System V2 sprint, how each component works, and what remains to be done. It is the authoritative reference for any engineer or operator onboarding to the CS infrastructure.

---

## WHAT WAS BUILT IN THIS SPRINT

### New Models (4)

**1. TimeToValue**
Tracks the 8 milestone progression from agreement signing to first qualified sale. One record per dealer. Milestones are timestamped as they are completed.

Fields: `dealer_id`, `agreement_signed_at`, `invoice_paid_at`, `first_login_at`, `first_listing_at`, `first_lead_at`, `first_response_at`, `first_qualified_lead_at`, `first_sale_at`, `updated_at`

Logic:
- Milestones are set by the CS operator (or automatically, where data is available)
- Elapsed days between each milestone are calculated at query time: `(current_milestone_timestamp - previous_milestone_timestamp).days`
- Bottleneck detection: identifies the milestone with the longest elapsed time
- If a milestone has been open for >7 days without completion, the record flags as "stalled"

**2. AdoptionSnapshot**
A weekly point-in-time capture of dealer usage metrics. One record per dealer per week.

Fields: `dealer_id`, `week_start`, `login_days`, `listings_active`, `leads_received`, `lead_response_rate`, `crm_updates`, `health_score`, `snapshot_at`

Logic:
- Intended cadence: weekly (manual or cron-triggered)
- Low-adoption alert: if `login_days < 3` OR `lead_response_rate < 0.5`, the record is flagged for CS review
- Trend calculation: compares current snapshot to the prior 3 weeks; tags as `improving`, `flat`, or `declining`

**3. CustomerSuccessTask**
Tracks the 7 standard CS touchpoints (Day 1, 3, 7, 14, 30, 60, 90) per dealer.

Fields: `dealer_id`, `task_type` (enum: `day_1`, `day_3`, `day_7`, `day_14`, `day_30`, `day_60`, `day_90`), `due_date`, `completed_at`, `notes`, `outcome` (enum: `healthy`, `watch`, `at_risk`, `critical`)

Logic:
- **Idempotent generation:** calling the task generation endpoint twice for the same dealer does not create duplicate tasks. Checks for existing records by `(dealer_id, task_type)` before inserting.
- Due dates are calculated from the dealer's `agreement_signed_at` date: Day 1 = agreement + 1 day, etc.
- Overdue tasks (due_date passed, completed_at null) are surfaced in the CS dashboard

**4. RenewalReadiness**
Composite 0–100 score tracking the dealer's readiness to renew. One active record per dealer.

Fields: `dealer_id`, `health_review_completed` (bool), `usage_review_completed` (bool), `roi_review_completed` (bool), `expansion_opportunity_identified` (bool), `proposal_sent` (bool), `renewal_confirmed` (bool), `readiness_score` (computed), `last_updated`

Logic: See `RENEWAL_READINESS_FRAMEWORK.md` for the full scoring formula.

---

### New API Routes (5)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dealers/:id/time-to-value` | Returns TTV milestones, elapsed days, and bottleneck flag |
| GET | `/api/dealers/:id/adoption-snapshots` | Returns last 12 weekly snapshots with trend tag |
| POST | `/api/dealers/:id/adoption-snapshots` | Creates a new weekly snapshot |
| GET | `/api/dealers/:id/cs-tasks` | Returns all 7 CS tasks with due dates and completion status |
| GET | `/api/dealers/:id/renewal-readiness` | Returns current readiness score and component breakdown |

All routes require authentication. Founding Dealer routes are scoped to admin role only.

---

### New Frontend Page (1)

**Dealer Success Dashboard** (`/admin/dealers/:id/success`)

Panels:
1. Time-to-Value timeline — visual milestone tracker, stalled milestones highlighted in amber
2. Health Score widget — current tier (Healthy / Watch / At Risk / Critical) with 30-day trend chart
3. Adoption Snapshot table — last 4 weeks of usage metrics, trend indicator
4. CS Task checklist — 7 tasks with due date, status (pending / completed / overdue), and notes field
5. Renewal Readiness scorecard — 6-factor breakdown, total score, renewal date countdown

---

## TIME-TO-VALUE TRACKING

### The 8 Milestones

```
1. Agreement Signed     ──► invoice sent (Day 0)
2. Invoice Paid         ──► account activated (target: ≤3 business days)
3. First Login          ──► dealer accessed the platform (target: Day 1)
4. First Listing        ──► first live listing published (target: Day 3)
5. First Lead           ──► first inbound lead received (target: Day 7–10)
6. First Response       ──► dealer responded to a lead (target: within 4 hrs of lead)
7. First Qualified Lead ──► lead progressed past "Contacted" stage (target: Day 14)
8. First Sale           ──► documented sale traced to ABP lead (target: Day 30–60)
```

### Bottleneck Detection

At any point, the system computes which gap between consecutive milestones has the most elapsed days. This is the "active bottleneck." Example: if a dealer completed milestones 1–4 quickly but has been waiting 12 days for a lead, milestone 5 is the bottleneck and the CS operator should focus on listing quality and SEO.

### Elapsed Day Calculation

All elapsed times are computed at query time as:
`(milestone_N_timestamp - milestone_N-1_timestamp).days`

If a milestone is not yet completed, elapsed days for that step are computed as:
`(today - milestone_N-1_timestamp).days` (open duration)

---

## ADOPTION SNAPSHOT

### Weekly Cadence

Snapshots are designed to be captured every Monday. Currently: manual entry via the admin dashboard or POST to the API.

### Low-Adoption Alert Logic

A snapshot triggers a low-adoption alert if any of the following are true:
- `login_days < 3` (logged in fewer than 3 of 7 days)
- `lead_response_rate < 0.50` (responded to fewer than half of leads)
- `crm_updates == 0` (no CRM stage updates in the week)

Flagged snapshots appear in the CS dashboard in amber. The CS operator is expected to act within 48 hours.

---

## CS TASK AUTO-GENERATION

When a dealer is created and an `agreement_signed_at` date is set, the system can auto-generate all 7 CS tasks with correct due dates.

**Idempotency guarantee:** The generation function queries for existing tasks by `(dealer_id, task_type)` before inserting. Running it twice produces exactly 7 tasks — not 14.

**Task types:** `day_1`, `day_3`, `day_7`, `day_14`, `day_30`, `day_60`, `day_90`

**Completion:** Tasks are marked complete by the CS operator via the dashboard. Completion triggers an optional notes field prompt and outcome classification (Healthy / Watch / At Risk / Critical).

---

## RENEWAL READINESS

### The 6-Factor Score

Each factor contributes a fixed number of points. Maximum total: 100.

| Factor | Points | Condition |
|--------|--------|-----------|
| Health Review | 20 | CS review completed in last 30 days |
| Usage Review | 15 | Usage trend is flat or positive |
| ROI Review | 20 | ROI calculation presented to dealer |
| Expansion Opportunity | 15 | Featured listing or add-on discussed |
| Proposal Sent | 15 | Renewal proposal sent |
| Confirmed | 15 | Dealer verbally confirmed intent |

Score is recomputed on every update to the `RenewalReadiness` record.

---

## VALUE PROOF — ESTIMATED REVENUE IMPACT FORMULA

Displayed on the dealer success dashboard to support the CS operator's value conversation.

```
estimated_revenue_impact = leads_received × 0.15 × 50000
platform_cost = months_active × 3599
roi_multiple = estimated_revenue_impact / platform_cost
```

Displayed as: "Estimated pipeline value: ₱[X] | ROI on platform cost: [X]×"

This is a conservative estimate for illustration. Not audited revenue — a projection for the CS value conversation.

---

## FUTURE WORK

| Priority | Item | Rationale |
|----------|------|-----------|
| High | Automate AdoptionSnapshot via weekly cron | Manual capture is error-prone; misses weeks |
| High | Email/WhatsApp alert when snapshot flags low-adoption | Currently requires manual dashboard check |
| Medium | Baseline capture at Day 0 (before platform use) | Needed for accurate before/after case study data |
| Medium | TTV milestone auto-detection from platform events | Login event → auto-set `first_login_at` |
| Low | CS task email reminders to the operator | Prevent missed check-ins |
| Low | Renewal readiness score history chart | Track trend over 60-day renewal runway |

---

*This document reflects the state of the system as of 2026-05-31. Update after each sprint that modifies CS infrastructure.*
