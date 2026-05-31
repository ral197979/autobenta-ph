# Inventory Source Analysis

**Date:** 2026-06-01  
**Status:** Audit — Gap Identification & Target State

---

## Why Tracking Inventory Source Matters

Not all inventory is equal. A listing entered manually by a dealer who hasn't touched it in 60 days carries different risk than a listing synced from a live DMS 10 minutes ago. A CSV import with incomplete photos behaves differently in search than an API-connected listing with real-time pricing.

Source tracking enables:

1. **Trust scoring** — Ryderr's trust algorithm must weight freshness and source reliability. A V8Atlas-synced listing (auto-updated) is objectively more current than a manual listing from 6 weeks ago.
2. **Accountability** — When a buyer complains a car was already sold, Ryderr needs to know which source failed to remove the listing.
3. **Performance analysis** — Ryderr cannot improve lead quality without knowing which source types generate the best leads.
4. **Dealer coaching** — Showing a dealer "your CSV listings generate 2x fewer leads than auto-synced dealers" is a compelling upgrade argument.
5. **Revenue attribution** — Knowing which source types drive the most closed deals informs pricing and feature investment.

---

## Current State: No Source Tracking

As of this audit, inventory in Ryderr has no `dealerSourceType` field on listings. The database treats all listings identically regardless of origin. This means:

- No way to identify which listings came from V8Atlas vs. manual entry
- No per-source health monitoring
- No staleness detection by source
- Lead routing cannot differentiate by source — all leads go to the same place
- Admin dashboard has no source breakdown

**This is a data gap that cascades into every downstream system.**

---

## Target State: Every Listing Tagged with Its Source

**Schema change required:**

```sql
ALTER TABLE listings ADD COLUMN dealer_source_type VARCHAR(20) NOT NULL DEFAULT 'MANUAL';
ALTER TABLE listings ADD COLUMN last_synced_at TIMESTAMP;
ALTER TABLE listings ADD COLUMN source_external_id VARCHAR(255);  -- VIN or DMS record ID

-- Index for source-level queries
CREATE INDEX idx_listings_source ON listings(dealer_source_type, dealer_id);
```

**Enum values:**

```
MANUAL | CSV | V8ATLAS | API | DEALERSOCKET | TEKION
```

**Migration for existing records:** All pre-migration listings default to `MANUAL`. This is a conservative assumption — if a listing has no source metadata, treat it as manually managed.

---

## Metrics to Track Per Source

For each `dealerSourceType`, Ryderr should compute and store the following weekly:

| Metric | Description | How Computed |
|---|---|---|
| **Total active listings** | Count of live, non-expired listings | COUNT where status = 'active' |
| **Lead generation rate** | Leads per listing per 30 days | total_leads / active_listing_count |
| **Lead conversion rate** | Leads that resulted in a contact/deal | converted_leads / total_leads |
| **Avg listing quality score** | Ryderr's internal quality rating (photos, completeness, price accuracy) | average of quality_score field |
| **Sync freshness** | Median hours since last update | median of (NOW - last_synced_at) |
| **Stale listing rate** | % of listings not updated in >14 days | stale_count / active_count |
| **Revenue generated** | Subscription + lead credit + referral revenue attributed to source | joins to revenue table |

**Sample report output (admin dashboard):**

```
Source     | Active  | Lead Rate | Conversion | Avg Quality | Freshness | Revenue
-----------+---------+-----------+------------+-------------+-----------+--------
MANUAL     |   1,240 |    0.8/mo |      12%   |    6.2/10   |  18.4 hrs |  $4,800
CSV        |     890 |    1.1/mo |      14%   |    7.0/10   |  48.2 hrs |  $3,200
V8ATLAS    |   3,410 |    2.3/mo |      22%   |    8.4/10   |   0.4 hrs |  $18,100
API        |     220 |    2.1/mo |      19%   |    8.1/10   |   1.2 hrs |  $2,400
```

This table is the single most important dashboard view for Ryderr's marketplace health.

---

## How Source Data Improves the Trust Algorithm

Ryderr's trust score for a listing should incorporate source quality as a signal:

```
listing_trust_score = base_score
  + source_freshness_bonus    // V8Atlas synced < 1hr ago → +1.5 pts
  + completeness_score        // all fields filled → up to +2 pts
  - staleness_penalty         // not updated in 14+ days → -2 pts
  + dealer_reputation_score   // dealer's historical accuracy → up to +2 pts
```

**Source-specific defaults for freshness bonus:**

| Source | Default freshness bonus | Rationale |
|---|---|---|
| MANUAL | 0 (must be evaluated per listing) | No automatic updates |
| CSV | 0 (based on last upload date) | Freshness depends on dealer behavior |
| V8ATLAS | +1.5 if synced < 2 hours | Live DMS connection implies accuracy |
| API | +1.0 if synced < 4 hours | Near-real-time integration |

---

## Surfacing Source Health in the Admin Dashboard

The admin network dashboard must include a **Source Health Panel** showing:

1. **Per-source listing counts** — bar chart, updated daily
2. **Stale listing alerts** — any source with >20% stale listings triggers a warning
3. **Sync failure log** — V8Atlas/API sources with failed syncs in the past 24 hours
4. **Source distribution trend** — are dealers migrating from Manual to V8Atlas over time? (target: yes)
5. **Lead quality by source** — which source type produces the highest-converting leads?

**Operational alerts to configure:**

```
IF source = V8ATLAS AND last_synced_at < NOW() - 4 HOURS → alert: "V8Atlas sync gap detected"
IF source = CSV AND last_synced_at < NOW() - 30 DAYS → flag listing as stale
IF source_stale_rate > 30% for any dealer → trigger dealer health email
```

These alerts protect marketplace quality without requiring manual review.
