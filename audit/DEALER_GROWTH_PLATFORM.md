# Dealer Growth Platform

**Document:** DEALER_GROWTH_PLATFORM  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production

---

## Platform Mission

AutoBentaPH is transitioning from a consumer vehicle marketplace into a full dealer ecosystem. The mission of the Dealer Growth Platform is to make AutoBentaPH the operating infrastructure for used-car dealers in the Philippines — not just a place to list inventory, but the system dealers use to run their business: manage leads, track performance, access financing pipelines, and sync inventory across systems.

This means AutoBentaPH earns revenue not only from buyers clicking on listings but from dealers paying for tools, tier upgrades, and integration services. The platform succeeds when dealers succeed.

---

## The Complete Dealer Lifecycle

```
Discovery → Apply → Approved → Onboard → Active → Grow → Retain
```

| Stage | What Happens | Platform Role |
|---|---|---|
| Discovery | Dealer finds AutoBentaPH via V8Atlas referral, SEO, outreach | Dealer landing page, V8Atlas network |
| Apply | Submits DealerApplication with business docs | /dealer/apply self-service flow |
| Approved | Admin reviews and approves application | Admin operations center, automated role grant |
| Onboard | Completes wizard: profile, listings, verification | /dealer/onboarding wizard (multi-step) |
| Active | Lists vehicles, receives leads, manages CRM | Dealer portal (/dealer) |
| Grow | Upgrades plan, gets verified badge, improves scorecard | Subscription engine, performance engine |
| Retain | Coaches toward higher rank, multi-branch expansion | Scorecard gamification, enterprise tier |

---

## Phase Map

| # | Phase | Description | Status |
|---|---|---|---|
| 1 | Dealer Org Model | DealerProfile, DealerBranch, DealerMember models with multi-location and role support | **Built** |
| 2 | Onboarding | /dealer/onboarding wizard — profile setup, first listing, verification prompts | **Planned** |
| 3 | Verified Program | isVerified flag, verification badge, trust propagation to listings | **Built** |
| 4 | Dealer Portal | /dealer dashboard, leads, listings, analytics, settings, subscription tabs | **Built** |
| 5 | CRM | Lead inbox, status tracking (new/contacted/qualified/lost/won), notes | **Built** |
| 6 | Lead Distribution | Internal routing engine: tier > score > response time priority | **Planned** |
| 7 | Subscription Engine | free/verified/pro/enterprise plans, requireFeature middleware, entitlement gating | **Built** |
| 8 | Billing Foundation | Invoice, PaymentRecord, UsageMetric models — processor-agnostic billing layer | **Planned** |
| 9 | Performance Engine | Dealer scorecard 0–100, A/B/C/D rank, factor breakdown | **Built** |
| 10 | Priority Engine | Listing and dealer ranking in marketplace — tier, score, verified status | **Planned** |
| 11 | V8Atlas Foundation | Provider abstraction layer (5 interfaces), adapter registration, env gating | **Built** |
| 12 | Inventory Sync | V8Atlas InventoryProvider — bidirectional listing sync, webhook ingestion | **Built** |
| 13 | Lead Sync | LeadProvider.distributeLeadToProviders(), retry queue, V8Atlas push | **Built** |
| 14 | Admin Operations | /admin/dealers — applications, suspension, full dealer management center | **Planned** |
| 15 | Commercial Readiness | Pricing finalized, billing live, go-to-market launch criteria met | **Planned** |

---

## What's Built vs. What's Planned

### Built (Production-Ready)

- **Dealer Org Model** — DealerProfile, DealerBranch, DealerMember with full relational structure
- **Dealer Portal** — /dealer with dashboard, leads, listings, analytics, settings, subscription views
- **Verified Program** — isVerified field, verification badge rendering, trust propagation hooks
- **CRM** — Lead inbox with status/notes, dealer-side lead management
- **Subscription Engine** — PLAN_FEATURES table, requireFeature() middleware, DealerSubscription model
- **Performance Engine** — Dealer scorecard (0–100), rank labels (A/B/C/D), factor breakdown
- **V8Atlas Foundation** — All 5 provider interfaces, V8AtlasAdapter, registerV8AtlasProviders(), webhook ingestion with HMAC verification
- **Inventory Sync** — inventory.created/updated webhook handling, listing upsert via V8Atlas adapter
- **Lead Sync** — distributeLeadToProviders(), retry queue logic, lead.created/converted event handling
- **Admin Panel** — Moderation, verification review, fraud review, marketplace analytics

### Planned (In-Progress / Next Phase)

- **DealerApplication model** — self-service apply flow at /dealer/apply
- **Onboarding Wizard** — /dealer/onboarding multi-step flow
- **Billing Foundation** — Invoice, PaymentRecord, UsageMetric models
- **Lead Distribution Router** — Internal routing engine with tier/score/response time logic
- **Priority Engine** — Listing and dealer ranking algorithm
- **Admin Dealer Operations Center** — /admin/dealers with application queue, suspension controls, full management

---

## Dealer Activation Funnel

The key success metric for the platform is dealer progression through this funnel:

```
Apply → Approve → First Listing → First Lead → First Sale
```

| Stage | Metric | Target |
|---|---|---|
| Apply | Applications submitted | — |
| Approve | Approval rate | > 70% |
| First Listing | % of approved dealers who post within 7 days | > 80% |
| First Lead | % of active dealers who receive a lead within 30 days | > 60% |
| First Sale | % of dealers who log a won lead within 90 days | > 30% |
| Upgrade | % of free dealers who upgrade to paid plan within 90 days | > 20% |

These metrics are tracked in the admin marketplace analytics panel.

---

## Stakeholder Map

| Stakeholder | Role | Primary Touchpoint |
|---|---|---|
| **Dealers** | Platform customers — list inventory, receive leads, pay subscriptions | /dealer portal, /dealer/apply, /dealer/onboarding |
| **Buyers** | End consumers — browse, search, contact dealers | Vehicle marketplace, listing detail pages |
| **AutoBentaPH Team** | Platform operators — review applications, monitor fraud, manage billing | /admin panel |
| **V8Atlas** | DMS integration partner — primary dealer acquisition channel, inventory/lead sync | V8AtlasAdapter, webhook ingestion, provider interfaces |

---

## Platform Success Criteria

The Dealer Growth Platform is considered commercially ready (Phase 15) when:

1. Self-serve apply → approve → onboard flow operates without manual intervention for standard applications
2. Subscription billing collects payment and gates features without admin involvement
3. Lead distribution routes leads to the correct dealer within 5 seconds
4. Dealer scorecard data is accurate and updated in near-real-time
5. V8Atlas sync operates without data loss across inventory and lead events
6. Admin operations center supports full dealer lifecycle management (approve, suspend, tier change, invoice creation)

---

## Platform Architecture Overview

```
Buyers
  └── Marketplace (browse/search/filter)
        └── Listing detail → Contact dealer → Lead created

Lead created
  └── Lead Distribution Router
        └── Routes by: tier → score → response time
              └── Dealer CRM (lead inbox)
                    └── V8Atlas LeadProvider (sync if enterprise)

Dealers
  └── /dealer/apply → Application → Admin review → Approved
  └── /dealer/onboarding → Profile + listings + verification
  └── /dealer portal → Listings, leads, analytics, scorecard
  └── Subscription → requireFeature() gates → billing invoices

Admin
  └── /admin/dealers → applications, suspend, tier change
  └── /admin → verification queue, fraud queue, marketplace analytics
  └── /admin/billing → invoices, payment records

V8Atlas
  └── Webhooks → HMAC verify → event handlers
        └── inventory.created → listing upsert
        └── lead.created → lead distribution + CRM
        └── dealer.verified → trust propagation
```
