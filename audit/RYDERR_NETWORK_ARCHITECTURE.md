# Ryderr Network Architecture

**Date:** 2026-06-01  
**Status:** Canonical Reference

---

## What Ryderr Is

Ryderr is an automotive marketplace network. It is not a DMS (Dealer Management System), not a CRM, and not a dealer back-office tool. It is the connective layer between car buyers and car sellers — owning the discovery surface, the trust layer, and the lead pipeline.

The marketplace is the product. Dealers are supply-side participants. Buyers are demand-side participants. Ryderr's job is to maximize the match rate between them.

**Ryderr does NOT:**
- Manage dealer inventory in their own systems
- Handle dealer CRM workflows
- Process deal documents
- Replace or compete with DMS platforms

**Ryderr DOES:**
- Publish vehicle listings visible to buyers
- Verify dealer identity and listing quality
- Route buyer inquiries as structured leads
- Track listing performance and marketplace health
- Monetize the connection between buyers and dealers

---

## The Two-Sided Marketplace

```
BUYERS                          RYDERR NETWORK                  SELLERS / DEALERS
-------                         ---------------                 -----------------
Search listings         →       Inventory Layer         ←       Push inventory (any source)
Submit inquiries        →       Lead Engine             →       Receive structured leads
View dealer trust        ←      Trust Layer             ←       Earn verification badges
Get financing offers     ←      Referral Layer          →       Drive revenue per lead
```

Both sides must grow for the network to function. Ryderr's product decisions must always ask: does this help buyers find cars, or does this help dealers get leads? If neither, it doesn't belong.

---

## Dealer Source Types

Every piece of inventory in Ryderr has a `dealerSourceType`. This is not cosmetic metadata — it determines sync behavior, lead routing, and trust scoring.

| Source Type | Description | Who uses it |
|---|---|---|
| `MANUAL` | Dealer enters listings directly in Ryderr UI | Small/independent dealers |
| `CSV` | Bulk upload via spreadsheet; dealer maps columns | Mid-size dealers, wholesale lots |
| `V8ATLAS` | OAuth/API sync with V8Atlas DMS | V8Atlas dealer customers |
| `API` | Custom webhook/REST integration | Enterprise dealers, custom DMS |
| `DEALERSOCKET` *(future)* | DealerSocket DMS adapter | DealerSocket customers |
| `TEKION` *(future)* | Tekion DMS adapter | Tekion customers |

Each source type is a plugin. The Ryderr marketplace layer does not care which plugin supplied a listing — it only cares that the listing exists, is valid, and has a source it can route leads back to.

---

## Inventory Flow (Source → Marketplace)

```
Dealer System (any source)
        │
        ▼
[ Source Adapter ]   ←── normalizes data to Ryderr schema
        │
        ▼
[ Inventory Ingest Layer ]
  - Validates required fields
  - Deduplicates VINs
  - Applies trust scoring
  - Publishes to marketplace index
        │
        ▼
[ Ryderr Marketplace Listings ]
  - Visible to all buyers
  - SEO-indexed
  - Searchable/filterable
```

The adapter is the only place where source-specific logic lives. Everything downstream is source-agnostic.

---

## Lead Flow (Marketplace → Source)

```
Buyer submits inquiry on listing
        │
        ▼
[ Ryderr Lead Engine ]
  - Captures buyer contact + intent
  - Scores lead quality
  - Stores lead in Ryderr (always)
        │
        ▼
[ Lead Router ]
  - Reads listing's dealerSourceType
  - Calls the matching Lead Adapter
        │
        ├── MANUAL  → delivers to Ryderr dealer inbox
        ├── CSV     → delivers to Ryderr dealer inbox
        ├── V8ATLAS → pushes to V8Atlas CRM via API
        └── API     → fires webhook to dealer endpoint
```

If the lead push to an external system fails, the lead is not lost. It is stored in Ryderr and retried. The buyer experience is never affected by a downstream provider failure.

---

## Why Ryderr Must Stay Source-Agnostic

If Ryderr's core logic depends on V8Atlas (or any single provider), it becomes fragile:
- V8Atlas API downtime = Ryderr cannot process leads
- V8Atlas pricing changes = Ryderr is held hostage
- V8Atlas feature gaps = Ryderr inherits those gaps

Source-agnosticism is a structural constraint, not a preference. Every feature that touches inventory, leads, or dealer data must work identically regardless of source type.

**The test:** If V8Atlas goes offline, can Ryderr continue to show listings, accept inquiries, route leads, and collect revenue? If yes, the architecture is correct. If no, there is a dependency that must be removed.

---

## Network Effects

The marketplace has compounding dynamics that drive value over time:

```
More dealers onboard
        ↓
More inventory listed
        ↓
More buyers use Ryderr
        ↓
More leads generated
        ↓
More dealer ROI demonstrated
        ↓
More dealers onboard  ← (loop)
```

This loop only works if inventory quality and buyer trust are maintained. Both require the source-agnostic architecture — every dealer's listings must be treated consistently to maintain marketplace integrity.

---

## Revenue Model

| Stream | Description | Tied To |
|---|---|---|
| Dealer subscriptions | Monthly/annual access to list inventory | Dealer count |
| Featured listings | Premium placement in search results | Inventory volume |
| Lead credits | Pay-per-lead for non-subscriber dealers | Lead volume |
| Financing referrals | Commission on financed deals | Buyer conversions |
| Inspection referrals | Pre-purchase inspection bookings | Listing trust layer |
| Transfer/title referrals | DMV/title services at close | Deal completions |

All revenue streams flow through Ryderr owning the buyer relationship. If dealers bypass Ryderr and transact directly, Ryderr earns nothing. This is why the lead and trust layers must remain Ryderr-owned infrastructure — not delegated to any DMS.
