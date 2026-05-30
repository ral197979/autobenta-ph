# Lead Distribution Engine

**Document:** LEAD_DISTRIBUTION_ENGINE  
**Version:** 1.0  
**Date:** 2026-05-30  
**Status:** Production

---

## Overview

The Lead Distribution Engine routes buyer inquiries to dealers — both through the internal CRM and, for enterprise dealers, to connected external DMS providers (e.g. V8Atlas).

A lead is created whenever a buyer submits an inquiry on a dealer's listing. The engine handles routing, status lifecycle management, retry on failure, and idempotency across sync boundaries.

---

## Lead Lifecycle

```
Buyer submits inquiry
        │
        ▼
   Inquiry created
   (message, buyer contact)
        │
        ▼
   Lead created
   status: "new"
   source: "inquiry"
        │
        ▼
   Dealer receives in /dealer/leads
   ├── Buyer name, phone, email visible
   ├── Linked listing with photo + price
   └── Original inquiry message
        │
        ▼
   Dealer moves through funnel:
   new → contacted → viewing_scheduled → financing → closed_won / closed_lost
        │
        ▼ (on closed_won)
   firstSaleAt set on Dealer (once)
   Win rate recalculated in analytics
```

---

## Lead Status Funnel

| Status | Description |
|---|---|
| `new` | Just arrived, no action taken |
| `contacted` | Dealer has reached out to buyer |
| `viewing_scheduled` | Test drive or in-person viewing arranged |
| `financing` | Buyer pursuing financing |
| `closed_won` | Sale completed |
| `closed_lost` | Deal fell through |

Dealers update status via the CRM dropdown in `DealerLeads`. The backend endpoint is:

```
PATCH /dealers/me/leads/:leadId
Body: { status?, notes? }
```

Status updates are idempotent — the same status can be set multiple times without side effects.

---

## Lead Sources

| Source | Origin |
|---|---|
| `inquiry` | Buyer contact form on listing page |
| `financing` | Buyer requested financing on a listing |
| `inspection` | Buyer booked inspection for a dealer's listing |
| `api` | Pushed inbound from external DMS |
| `referral` | Future: referral tracking |

Source is stored on the Lead and displayed as a badge in the CRM.

---

## External Lead Distribution (Enterprise)

For enterprise dealers with connected DMS providers, leads are forwarded in near real-time.

### Outbound (AutoBentaPH → DMS)

```javascript
// LeadProvider interface
class LeadProvider {
  async forwardLead(lead) { throw new Error('Not implemented'); }
  async updateLeadStatus(externalLeadId, status) { throw new Error('Not implemented'); }
}

// Distribution coordinator
async function distributeLeadToProviders(lead, providerNames) {
  for (const name of providerNames) {
    const provider = getLeadProvider(name);
    try {
      await provider.forwardLead(lead);
    } catch (err) {
      enqueueRetry({ providerName: name, lead, attempt: 1 });
    }
  }
}
```

### Retry Queue

Failures are queued for retry with exponential backoff:

```javascript
// In-memory queue (production: replace with Redis or DB-backed queue)
const retryQueue = [];

function enqueueRetry({ providerName, lead, attempt }) {
  const delayMs = Math.min(1000 * 2 ** attempt, 30000); // max 30s
  setTimeout(async () => {
    try {
      const provider = getLeadProvider(providerName);
      await provider.forwardLead(lead);
    } catch {
      if (attempt < 3) enqueueRetry({ providerName, lead, attempt: attempt + 1 });
    }
  }, delayMs);
}
```

Max attempts: 3. After 3 failures, the lead is logged but not retried (alerting TBD).

**Production note:** Replace in-memory queue with a durable queue (Bull + Redis, or a `LeadRetryQueue` DB table) before high-volume traffic. The interface contract is stable — only the queue implementation changes.

---

### Inbound (DMS → AutoBentaPH)

External DMS can push leads inbound:

```
POST /api/dealer-network/v1/leads
{
  "direction": "inbound",
  "dealerId": "...",
  "buyerName": "...",
  "buyerPhone": "...",
  "listingId": "...",
  "message": "..."
}
```

Idempotency: leads are deduplicated by `(listingId, buyerEmail, source)` within a 24-hour window to prevent duplicate entries from repeated pushes.

---

## Lead Analytics

The `GET /dealer/analytics` endpoint exposes:

```json
{
  "leads": {
    "total": 42,
    "new30Days": 8,
    "byStatus": {
      "new": 3,
      "contacted": 5,
      "viewing_scheduled": 2,
      "financing": 1,
      "closed_won": 25,
      "closed_lost": 6
    },
    "winRate": 80,
    "won": 25,
    "lost": 6
  }
}
```

Win rate = `closed_won / (closed_won + closed_lost) * 100`, rounded to integer.

---

## CRM Feature Access by Plan

| Feature | Free | Verified | Pro | Enterprise |
|---|---|---|---|---|
| View leads | Basic list | Full CRM | Full CRM | Full CRM |
| Update status | — | ✓ | ✓ | ✓ |
| Add notes | — | ✓ | ✓ | ✓ |
| Lead analytics | — | — | ✓ | ✓ |
| External lead push | — | — | — | ✓ |
| Inbound DMS leads | — | — | — | ✓ |

---

## Search and Filtering

The CRM supports:
- Status filter (click funnel cards at top of `DealerLeads`)
- Text search by buyer name, listing make, or listing model
- Expandable row for full contact info + inquiry message

All filtering is client-side for responsiveness. Server-side filtering available via `?status=` query param for initial load optimization.
