# Dealer Scorecard System

**Document:** DEALER_SCORECARD_SYSTEM  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production

---

## Purpose

A single 0–100 score and A/B/C/D rank that tells dealers where they stand and tells the marketplace how to prioritize them in search results, lead distribution, and V8Atlas partner matching.

---

## Score Calculation

```javascript
function calcDealerScore({ isVerified, tier, totalLeads, convertedLeads, avgResponseTimeMs }) {
  let score = 0;

  // Trust & verification (max 25 pts)
  if (isVerified) score += 25;

  // Subscription tier (max 20 pts)
  if (tier === 'verified')     score += 5;
  if (tier === 'verified_pro') score += 15;
  if (tier === 'enterprise')   score += 20;

  // Lead conversion rate (max 30 pts)
  const winRate = totalLeads > 0 ? convertedLeads / totalLeads : 0;
  score += Math.round(winRate * 30);

  // Response time (max 10 pts)
  if (avgResponseTimeMs && avgResponseTimeMs < 3_600_000)  score += 10; // < 1 hour
  else if (avgResponseTimeMs && avgResponseTimeMs < 86_400_000) score += 5; // < 24 hours

  return Math.min(100, score);
}
```

### Rank Bands

| Score | Rank | Meaning |
|---|---|---|
| 80–100 | A | Top dealer — verified, responsive, high conversion |
| 60–79 | B | Good dealer — verified or strong conversion |
| 40–59 | C | Average — unverified or slow response |
| 0–39 | D | Needs improvement — unverified, no conversions |

---

## Score Breakdown

| Factor | Max Points | Notes |
|---|---|---|
| Verified status | 25 | Admin-granted, not self-claimed |
| Tier: verified | 5 | Paying subscriber, committed |
| Tier: verified_pro | 15 | Priority placement eligible |
| Tier: enterprise | 20 | Full platform partner |
| Lead conversion (win rate) | 30 | Won / (Won + Lost) × 30 |
| Response time < 1hr | 10 | |
| Response time < 24hr | 5 | Partial credit |
| **Total** | **100** | |

---

## API

### GET /dealer/analytics/scorecard

Returns:
```json
{
  "score": 72,
  "rank": "B",
  "breakdown": {
    "verified": 25,
    "tier": 15,
    "winRate": 22,
    "responseTime": 10
  },
  "meta": {
    "totalLeads": 42,
    "convertedLeads": 31,
    "winRatePct": 73.8,
    "avgResponseHours": 0.4
  }
}
```

---

## How Score Is Used

### Dealer Dashboard
Displayed in `DealerAnalytics.jsx` as a visual score card with rank badge (A/B/C/D). Color-coded: A=green, B=blue, C=yellow, D=red. Breakdown visible to dealer.

### Future: Search Placement (Phase 13 — Priority Engine)
Dealer score is an input to the marketplace priority engine. Higher-ranked dealers get:
- Priority placement in search results (implemented for Pro/Enterprise plans)
- Priority lead distribution
- Featured dealer listing on relevant pages

The priority engine currently gates on subscription tier. Dealer score will be added as a multiplier when the engine is extended.

### Future: Lead Distribution
When a buyer inquiry matches multiple dealers' inventory, leads are distributed by:
1. Tier (Enterprise > Pro > Verified > Free)
2. Dealer score (within same tier)
3. Response time (tiebreaker)

### Future: V8Atlas Partner Matching
V8Atlas dealer connections require minimum dealer score of B (60+). This ensures AutoBentaPH only syncs with committed, responsive dealer partners.

---

## DealerMetrics Table

The `DealerMetrics` model stores denormalized counters:

| Field | Source |
|---|---|
| totalLeads | Incremented on LEAD_CREATED event |
| convertedLeads | Incremented on LEAD_CONVERTED event |
| avgResponseTimeMs | Calculated on lead status update (new → contacted) |
| totalViews | Incremented on DEALER_PAGE_VIEW event |
| totalInquiries | Incremented on SELLER_CONTACT event |
| performanceScore | Recalculated on each counter change |

`avgResponseTimeMs` is updated using a running average:
```javascript
const n = dealer.metrics.totalLeads;
const newAvg = ((existing * (n-1)) + responseMs) / n;
```

---

## Score Improvement Guide (Dealer-Facing)

| Current State | Action | Points Gained |
|---|---|---|
| Not verified | Submit verification docs | +25 |
| Free plan | Upgrade to Verified | +5 |
| Verified plan | Upgrade to Pro | +10 more |
| Win rate < 50% | Improve lead follow-up | Up to +30 |
| Response > 24hr | Respond within 1 hour | +5 to +10 |

The dealer dashboard shows this breakdown and highlights the highest-impact improvement available. A dealer at rank C (50 pts) with 0 verified + free plan who verifies and upgrades gains +30 pts instantly → rank A.

---

## Score Freshness

The `DealerMetrics.lastCalculatedAt` field tracks when the score was last updated. Score is recalculated:
- On each relevant MarketplaceEvent (LEAD_CREATED, LEAD_CONVERTED, DEALER_PAGE_VIEW)
- On admin verification status change
- On subscription plan change

Score is never stale by more than the time since the last relevant event.
