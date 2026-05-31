# Dealer Integration Strategy

**Date:** 2026-06-01  
**Status:** Operational Specification

---

## Overview

Dealers join Ryderr through one of four onboarding paths. The path determines how their inventory enters the marketplace and how leads are routed back to them. All paths are first-class citizens — none is preferred over another from Ryderr's perspective.

A dealer can start on any path and migrate up without losing listings or lead history.

---

## The Four Onboarding Paths

### Path 1: Manual

The dealer adds and manages listings directly through the Ryderr dealer portal. No external system required.

**How it works:**
- Dealer logs in to `/dealer/inventory`
- Clicks "Add Vehicle"
- Fills in VIN, make, model, year, price, photos, description
- Publishes — listing goes live immediately

**Lead routing:** Leads are delivered to the Ryderr dealer inbox. Dealer manages follow-up inside Ryderr.

**Best for:** Small independent dealers, weekend sellers, dealers evaluating Ryderr before committing to a deeper integration.

**DealerSourceType:** `MANUAL`

---

### Path 2: CSV Upload

The dealer uploads a spreadsheet of inventory. Ryderr parses it, maps columns, validates data, and bulk-publishes listings.

**How it works:**
1. Dealer navigates to `/dealer/integrations/csv`
2. Uploads `.csv` or `.xlsx` file
3. Ryderr displays column mapping UI: dealer matches their column names to Ryderr fields (VIN, price, mileage, etc.)
4. Ryderr runs validation pass: flags missing VINs, invalid prices, duplicate entries
5. Dealer reviews preview of listings with any errors highlighted
6. Dealer confirms → listings are published

**Re-upload behavior:** On next upload, Ryderr matches by VIN. Existing listings are updated, new VINs are added, VINs absent from the new file are marked inactive.

**Lead routing:** Leads delivered to Ryderr dealer inbox.

**Best for:** Dealers with an existing inventory spreadsheet workflow, wholesale lots, auction dealers.

**DealerSourceType:** `CSV`

---

### Path 3: V8Atlas

For dealers already using V8Atlas as their DMS. Ryderr connects to V8Atlas via API key or OAuth and syncs inventory automatically.

**How it works:**
1. Dealer navigates to `/dealer/integrations/v8atlas`
2. Enters V8Atlas API credentials or completes OAuth flow
3. Ryderr immediately pulls current active inventory
4. Sync runs on a scheduled interval (configurable: every 15, 30, or 60 minutes)
5. V8Atlas can push real-time updates via webhook (preferred for pricing/status changes)

**Lead routing:** When a buyer inquires on a V8Atlas-sourced listing, Ryderr pushes the structured lead to V8Atlas via its lead intake API. The dealer works the lead entirely inside V8Atlas.

**Disconnect behavior:** See `V8ATLAS_PLUGIN_ARCHITECTURE.md`.

**Best for:** Active V8Atlas customers who want zero manual work in Ryderr.

**DealerSourceType:** `V8ATLAS`

---

### Path 4: API / Custom DMS

For dealers using a DMS not natively supported by Ryderr, or enterprise dealers with custom systems.

**How it works:**
1. Dealer's technical team connects via Ryderr's REST API or webhook endpoints
2. Ryderr provides an API key and documentation for the inventory ingestion and lead push endpoints
3. Dealer's system pushes inventory updates to Ryderr's `/api/v1/inventory` endpoint
4. Ryderr fires a webhook to a dealer-configured URL when a lead is generated

**Lead routing:** Webhook to dealer's configured endpoint. If webhook fails, falls back to Ryderr inbox.

**Best for:** Enterprise dealers, dealer groups with internal tech teams, future DMS integrations during pilot.

**DealerSourceType:** `API`

---

## Comparison Table

| | Manual | CSV | V8Atlas | API |
|---|---|---|---|---|
| **Setup time** | < 5 min | 15–30 min | 30–60 min | 1–3 days (dev time) |
| **Ongoing dealer effort** | High (manual updates) | Medium (re-upload per cycle) | None (automated) | None (automated) |
| **Sync frequency** | Real-time (manual) | On upload | Every 15–60 min + webhooks | Real-time (webhook) |
| **Lead routing** | Ryderr inbox | Ryderr inbox | V8Atlas CRM | Dealer webhook endpoint |
| **Requires IT/dev** | No | No | No | Yes |
| **Best fit** | Small/independent | Mid-size, CSV workflow | V8Atlas customers | Enterprise / custom DMS |

---

## Migration Path

Dealers can upgrade their integration path without losing data. Listing history, lead records, and analytics are preserved through migrations.

```
MANUAL
  ↓  (export existing listings to CSV, re-upload)
CSV
  ↓  (connect V8Atlas credentials, VINs matched by VIN)
V8ATLAS
  ↓  (V8Atlas provides API key, Ryderr switches to API adapter)
API
```

**Rules during migration:**
- VINs already in Ryderr are matched and ownership transferred to the new source type.
- Lead history is retained under the listing regardless of source type changes.
- The dealer's subscription tier does not change during migration.

---

## The `/dealer/integrations` Page

The integrations page is the dealer's single place to manage their connection to Ryderr.

**Sections:**
1. **Current integration** — shows active source type, last sync time, listing count, any errors
2. **Available integrations** — cards for each path with setup CTAs
3. **Sync log** — last 50 sync events with timestamps and record counts
4. **Lead routing settings** — where leads go (Ryderr inbox vs. external push)
5. **Upgrade path** — contextual prompt to upgrade if dealer is on Manual or CSV

**Error states visible on this page:**
- Last sync failed (with error message and retry button)
- API key expired or revoked
- V8Atlas connection lost
- Webhook endpoint returning non-200

The dealer must never need to contact Ryderr support to diagnose an integration issue — the page surfaces all relevant state.
