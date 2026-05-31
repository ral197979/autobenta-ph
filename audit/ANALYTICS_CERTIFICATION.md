# Analytics Certification

**Document:** ANALYTICS_CERTIFICATION  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production  
**Auditor:** System audit via code review

---

## Event Ingestion

**Route:** `POST /api/analytics/events`  
**File:** `backend/src/routes/analytics.js`

Events are written to the `MarketplaceEvent` model. Each event includes an `idempotencyKey` field with a `@unique` constraint in the schema — duplicate event submissions are rejected at the database level, preventing double-counting from client retries.

---

## Funnel Calculation

The funnel tracks 8 stages derived from `MarketplaceEvent` records:

1. Listing view
2. Photo gallery open
3. Contact info reveal
4. Inquiry submitted
5. Test drive scheduled
6. Financing inquiry
7. Inspection booked
8. Sale recorded

Drop-off rate between stages is calculated as: `(stage_n - stage_n+1) / stage_n × 100`

---

## Dealer Scorecard

**File:** `backend/src/routes/analytics.js`

Scorecard is computed from `DealerMetrics` data using the following formula:

| Component | Weight | Source |
|---|---|---|
| Verified status | 25 points | `dealer.verificationStatus === 'verified'` |
| Trust tier | 20 points | Tier mapped to point value |
| Win rate | 30 points | `closed_won / total_leads × 30` |
| Response time | 10 points | Inverse of avg response time, capped at 10 |
| **Total** | **85 base** | Remaining 15 from supplemental signals |

**Grade bands:**

| Score | Grade |
|---|---|
| 80–100 | A |
| 65–79 | B |
| 50–64 | C |
| 0–49 | D |

---

## Trust Impact Calculation

Measures the revenue uplift attributable to trust verification:

```
uplift = (avg_revenue_verified - avg_revenue_unverified) / avg_revenue_unverified × 100
```

Dealers with and without verification are segmented from `DealerMetrics` data. The result is surfaced in the trust impact analytics panel.

---

## Revenue Metrics

**File:** `backend/src/routes/analytics.js`

- **MRR** — sum of `amount` for `status: 'paid'` invoices in the current month
- **ARPU** — MRR / count of active paid dealers
- **mrrGrowth** — `(currentMRR - previousMRR) / previousMRR × 100`
- **Plan breakdown** — invoice counts and revenue grouped by subscription plan

---

## Listing Performance Score

**Formula:**

```
score = (views × 0.5) + (saves × 3) + (shares × 2) + (inquiries × 10) + (financing × 8) + (inspections × 8)
score = Math.min(score, 100)
```

Scores are derived from `ListingMetrics` records (unique per listing via `@unique` constraint on `listingId`).

---

## Analytics Export IDOR Protection

`GET /api/analytics/export` accepts a `dealerId` query parameter. Before returning data, the route performs an explicit ownership check:

```js
if (dealer.id !== dealerId) return res.status(403).json({ error: 'Forbidden' })
```

A dealer cannot export another dealer's analytics by supplying a different `dealerId`.

---

## Missing Capabilities

**Sale Attribution:** `SALE_RECORDED` events are defined in the funnel stage list but are not yet wired to a backend trigger. Sales close in the CRM (`closed_won`) but do not automatically emit a `SALE_RECORDED` analytics event. Funnel completion tracking is incomplete until this is connected.

**Persistent Daily Snapshots:** The `AnalyticsSnapshot` model exists in the schema for storing daily metric snapshots. No cron job or scheduled task was found in the repository to populate it. Historical trend data will not accumulate until a snapshot job is implemented.

---

## Findings

| ID | Finding | Status |
|---|---|---|
| — | Sale attribution: `SALE_RECORDED` not wired to CRM `closed_won` | Open |
| — | `AnalyticsSnapshot` model exists but no cron job populates it | Open |

---

## Verdict: PASS WITH NOTES

Core analytics — event ingestion with idempotency, funnel calculation, dealer scorecard, trust impact, listing performance scoring, and IDOR-protected export — are implemented and correct. Sale attribution and historical snapshot accumulation are gaps that should be addressed before analytics data is used for business decisions.
