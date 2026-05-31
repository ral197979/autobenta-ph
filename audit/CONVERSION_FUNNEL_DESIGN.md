# Conversion Funnel Design

**Document:** CONVERSION_FUNNEL_DESIGN  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production

---

## Funnel Stages

The AutoBentaPH transaction funnel has 8 stages. Each stage maps to one or more event types tracked in MarketplaceEvent.

```
Stage 1: Visitor
   ↓ (drop-off: users who search vs. bounce)
Stage 2: Search
   ↓ (drop-off: users who view a listing vs. search only)
Stage 3: Listing View
   ↓ (drop-off: users who contact vs. browse only)
Stage 4: Inquiry
   ↓ (drop-off: users who request inspection vs. just inquire)
Stage 5: Inspection Request
   ↓ (drop-off: users who pursue financing vs. inspection only)
Stage 6: Financing Request
   ↓ (drop-off: users who start transfer vs. financing only)
Stage 7: Transfer Checklist
   ↓ (drop-off: transfers that complete vs. stall)
Stage 8: Sale
```

---

## Event Mapping

| Stage | Event Types Counted |
|---|---|
| Visitor | Any event (session count) |
| Search | SEARCH_PERFORMED |
| Listing View | LISTING_VIEW |
| Inquiry | SELLER_CONTACT + LEAD_CREATED |
| Inspection | INSPECTION_REQUEST |
| Financing | FINANCING_REQUEST |
| Transfer | TRANSFER_CHECKLIST_STARTED |
| Sale | SALE_RECORDED (future) |

---

## Funnel API Response

`GET /api/analytics/funnel` returns:

```json
{
  "period": "30d",
  "stages": [
    { "stage": "Visitors",       "count": 4800 },
    { "stage": "Searches",       "count": 2100 },
    { "stage": "Listing Views",  "count": 3200 },
    { "stage": "Inquiries",      "count": 380  },
    { "stage": "Inspections",    "count": 72   },
    { "stage": "Financing",      "count": 48   },
    { "stage": "Transfers",      "count": 31   },
    { "stage": "Sales",          "count": 0    }
  ],
  "dropOff": [
    { "from": "Visitors",      "to": "Searches",      "rate": 56.25 },
    { "from": "Searches",      "to": "Listing Views", "rate": 0     },
    { "from": "Listing Views", "to": "Inquiries",     "rate": 88.13 },
    { "from": "Inquiries",     "to": "Inspections",   "rate": 81.05 },
    { "from": "Inspections",   "to": "Financing",     "rate": 33.33 },
    { "from": "Financing",     "to": "Transfers",     "rate": 35.42 },
    { "from": "Transfers",     "to": "Sales",         "rate": 100   }
  ]
}
```

Note: Listing Views can exceed Searches because users may arrive on listing pages directly (deep link, share, ad).

---

## Drop-off Calculation

```javascript
dropOff[i] = {
  from: stages[i].stage,
  to:   stages[i+1].stage,
  rate: stages[i].count > 0
    ? Math.round((1 - stages[i+1].count / stages[i].count) * 10000) / 100
    : 0
}
```

A rate of 88% at Listing Views → Inquiries means 88% of users who view a listing do not make an inquiry. This is the primary conversion optimization target.

---

## Benchmarks (Philippine Used Car Market Estimates)

| Stage Transition | Expected Drop-off | Red Flag |
|---|---|---|
| Visitor → Search | 40–60% | >75% |
| Search → Listing View | — (can exceed) | — |
| Listing View → Inquiry | 85–92% | >95% |
| Inquiry → Inspection | 70–85% | >90% |
| Inspection → Financing | 25–45% | >70% |
| Financing → Transfer | 30–50% | >70% |
| Transfer → Sale | 5–20% | >50% |

---

## Funnel Interpretation Guide

### High Visitor → Search drop-off (>75%)
Users are not searching. Possible causes: homepage is not compelling, search UX is unclear, users are browsing without intent.

### High Listing View → Inquiry drop-off (>95%)
The listing page is not converting. Possible causes: missing trust badges, unclear pricing, no visible CTA, slow image load.

**Trust impact is most measurable here.** A 5% improvement in this step (95% → 90% drop-off) doubles inquiry volume.

### High Inquiry → Inspection drop-off (>90%)
Buyers are not progressing to inspection. Possible causes: inspection friction (was auth-gated — P1 hotfix applied), pricing unclear, no booking incentive.

### Inspection → Financing gap
Users who complete inspections rarely proceed to financing in the same session. This is expected — financing is often separate. Track via user ID across sessions.

---

## Time-Between-Steps Tracking

The `createdAt` on MarketplaceEvent allows computing median time between stages per user:

```sql
SELECT 
  u.id,
  MIN(CASE WHEN event_type = 'LISTING_VIEW' THEN created_at END) as view_time,
  MIN(CASE WHEN event_type = 'SELLER_CONTACT' THEN created_at END) as contact_time,
  EXTRACT(EPOCH FROM (
    MIN(CASE WHEN event_type = 'SELLER_CONTACT' THEN created_at END) -
    MIN(CASE WHEN event_type = 'LISTING_VIEW' THEN created_at END)
  )) / 3600 as hours_view_to_contact
FROM marketplace_events
WHERE user_id IS NOT NULL
GROUP BY u.id
```

This query is not yet exposed via API — reserved for Phase 2 analytics reporting.

---

## Multi-Session Attribution

The same listing may be viewed across multiple sessions before an inquiry. The current model tracks each event independently. Stitching sessions by `userId` (when authenticated) enables true multi-session funnel analysis:

```
Session 1: LISTING_VIEW (anonymous)
Session 2: LISTING_VIEW (authenticated, same user)
Session 3: SELLER_CONTACT (authenticated)
```

Full cross-session path tracking is Phase 6 (Lead Attribution) work.

---

## Conversion Targets

| Phase | Target | Metric |
|---|---|---|
| Current | Establish baseline | Funnel populated with first 30d data |
| 3 months | 15% improvement in view→inquiry | Listing trust badges on all active listings |
| 6 months | Inspection step drop-off <85% | InspectionServices page + public route (P1 hotfix) |
| 12 months | Full sale attribution | SALE_RECORDED events wired to payment/transfer completion |
