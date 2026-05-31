# Trust Impact Measurement

**Document:** TRUST_IMPACT_MEASUREMENT  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production

---

## Objective

Quantify the conversion impact of each trust badge on the AutoBentaPH marketplace. Transform qualitative trust claims ("verified sellers get more inquiries") into measured uplift percentages backed by platform data.

---

## Trust Signals Measured

| Signal | Field | Badge Displayed |
|---|---|---|
| Seller Identity Verified | `sellerVerified` / `dealer.isVerified` | "Verified Seller" |
| Ownership Verified | `ownershipVerified` | "Ownership Verified" |
| Transfer Ready | `transferReady` | "Transfer Ready" |
| Financing Eligible | `financingEligible` | "Financing Eligible" |
| Vehicle History | `vehicleHistoryAvailable` | "History Available" |
| Inspection Completed | `inspectionRequests[].status = completed` | "Inspected" |

---

## Measurement Method

### Primary Metric: Inquiry Rate
```
inquiryRate = inquiryCount / max(viewCount, 1)
```

Calculated from `ListingMetrics` joined with `VehicleListing` trust fields.

### API: GET /api/analytics/trust-impact
For each trust signal, the endpoint:
1. Queries all active listings
2. Groups by whether the signal is present (`with`) vs absent (`without`)
3. Computes `avgInquiries` for each group
4. Computes `uplift = ((with.avg - without.avg) / without.avg) * 100`

```json
{
  "sellerVerified": {
    "withBadge": { "avgInquiries": 4.2, "count": 312 },
    "withoutBadge": { "avgInquiries": 1.8, "count": 2841 },
    "uplift": 133.3
  },
  "ownershipVerified": { ... },
  "transferReady": { ... },
  "financingEligible": { ... },
  "vehicleHistory": { ... }
}
```

---

## Interpreting Uplift

| Uplift | Interpretation |
|---|---|
| > 100% | Strong evidence — this badge more than doubles inquiry rate |
| 50–100% | Meaningful — prioritize badge acquisition for sellers |
| 20–50% | Moderate — worth promoting but not urgent |
| < 20% | Weak signal — may be confounded by other factors |
| Negative | Badge may indicate listing type that converts differently (e.g. higher-priced dealer cars) |

---

## Confounders and Limitations

### Selection bias
Verified sellers may have better listings overall (better photos, more complete descriptions, better pricing). The badge may correlate with listing quality, not cause the inquiry uplift independently.

**Mitigation:** Control for price band and listing age in future analysis. Compare badge-off vs badge-on for the same seller over time.

### Low N warning
Trust signals like `inspection_completed` may have very few listings (< 50). Report confidence alongside uplift — results with N < 100 in either group should be flagged as low-confidence.

### Time effect
Older listings accumulate more views and inquiries regardless of trust badges. All metrics should be normalized by listing age or measured as rate-per-day.

---

## Trust Impact by Feature Area

### Verification Engine (Phases 2–3)
The Verification Engine makes `sellerVerified`, `ownershipVerified`, and `transferReady` admin-controlled (not seller-claimed). This means verified listings are genuinely different, not just self-reported — the measurement reflects real trust signal value.

### Readiness Score
The `ReadinessScore` component (0–100 on CarDetail page) is a composite of all trust signals. High-scoring listings should show the strongest inquiry uplift. The trust impact API isolates each signal — composite score analysis is Phase 2.

### Inspection Impact
`inspection_completed` is the trust signal with the clearest causal story: a third-party inspector certified the vehicle, reducing buyer risk. Expected uplift: highest among all signals for listings where inspection was completed before the first inquiry.

---

## Using This Data

### Dealer coaching
Show dealers which badges increase their specific listing type's conversion. A dealer with 0% `transferReady` listings loses measurable inquiries. Admin dashboard highlights this gap.

### Onboarding prompt
Show sellers: "Listings with Ownership Verified get 2× more inquiries. [Get Verified →]"

### Marketplace SEO / placement
Future: use `performanceScore` + trust signal density as a ranking factor. Verified listings get priority placement (already gated by Dealer Pro plan).

### V8Atlas integration value
When V8Atlas pushes inventory with verified trust signals, those listings will show measurable higher conversion than equivalent non-V8Atlas listings. This quantifies the integration's business value.

---

## Reporting Cadence

| Report | Frequency | Audience |
|---|---|---|
| Trust impact table | Weekly (admin dashboard) | AutoBentaPH team |
| Per-dealer trust gap | Monthly | Dealer account managers |
| Badge acquisition funnel | Monthly | Verification team |
| Aggregate uplift trend | Quarterly | Business leadership |
