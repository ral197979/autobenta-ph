# AutoBentaPH Commercialization Plan

**Document:** COMMERCIALIZATION_PLAN  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production

---

## Revenue Model

AutoBentaPH's commercial strategy centers on subscription revenue from dealers as the primary and most durable revenue stream. Additional revenue lines are planned once the dealer base reaches scale.

| Revenue Stream | Model | Status | Notes |
|---|---|---|---|
| **Dealer Subscriptions** | Monthly/annual recurring, tiered plans | Primary — planned | Infrastructure built, pricing TBD |
| **Lead Distribution Fees** | Per-lead fee for routed leads | Future | Requires lead router live + dealer base established |
| **Featured Listings** | Per-listing or per-period placement boost | Future | Priority engine prerequisite |
| **Inspection Referrals** | Commission on referred third-party inspections | Future | Requires inspection partner network |
| **Financing Referrals** | Commission on financing applications submitted | Future | Existing trust infrastructure supports this |

---

## Subscription Pricing (PHP)

Prices are placeholders. Final pricing to be set by commercial lead before Phase 15 launch.

| Plan | Price | Billing Cadence | Key Inclusions |
|---|---|---|---|
| **Free** | ₱0 / month | n/a | 5 listings, basic marketplace visibility |
| **Verified** | ₱X / month | Monthly or annual | 25 listings, verification badge, CRM access |
| **Pro** | ₱X / month | Monthly or annual | 100 listings, priority placement, analytics, lead automation |
| **Enterprise** | Custom | Annual | Unlimited listings, V8Atlas sync, API access, multi-branch, dedicated support |

**Annual discount:** modeled in billing layer (billingCycle: annual) — discount rate TBD.

**Pricing inputs to resolve before launch:**
- Competitive analysis vs. Carmudi PH, Carousell Motors, AutoDeal dealer plans
- Target ARPU by plan tier
- Acceptable payback period on CAC
- V8Atlas enterprise pricing alignment

---

## Dealer Acquisition Funnel

```
Awareness → /dealer/apply → Review → Onboard → Active → Upgrade
```

| Stage | Channel | Conversion Action | Tracked Metric |
|---|---|---|---|
| **Awareness** | V8Atlas referral, SEO, direct outreach | Dealer lands on AutoBentaPH | Unique dealer page visits |
| **Apply** | Self-serve /dealer/apply | Submits application | Applications submitted |
| **Review** | Admin operations center | Admin approves | Approval rate |
| **Onboard** | /dealer/onboarding wizard | Completes profile + first listing | Onboarding completion rate |
| **Active** | Dealer portal | Receives first lead | First lead rate |
| **Upgrade** | In-app upgrade prompts (requireFeature 403) | Upgrades from Free to paid | Free-to-paid conversion rate |

**Primary acquisition channel:** V8Atlas dealer network. V8Atlas-referred dealers have pre-existing DMS relationships and are higher-intent applicants. Enterprise tier is essentially a V8Atlas-connected plan.

**Secondary channels:**
- Organic SEO via public dealer profile pages (each dealer gets a crawlable profile URL)
- Direct outreach to dealers currently on Carmudi/AutoDeal with competitive positioning on trust signals

---

## Unit Economics Framework

These metrics define commercial health. Populate with actuals once billing is live.

| Metric | Formula | Target | Current |
|---|---|---|---|
| **ARPU** | Total MRR / Active paid dealers | TBD | Not yet measured |
| **MRR** | Sum of all active subscription monthly values | TBD | Not yet measured |
| **CAC** | Total acquisition spend / New dealers activated | TBD | Not yet measured |
| **LTV** | ARPU × (1 / monthly churn rate) | TBD | Not yet measured |
| **LTV:CAC Ratio** | LTV / CAC | > 3:1 target | Not yet measured |
| **Payback Period** | CAC / ARPU | < 12 months target | Not yet measured |
| **Monthly Churn Rate** | Dealers cancelled / Total active dealers | < 5% target | Not yet measured |
| **Free-to-Paid Rate** | Paid upgrades / Free registrations | > 20% target | Not yet measured |
| **Expansion MRR** | Revenue from plan upgrades in period | TBD | Not yet measured |

---

## Commercial Readiness Metrics (Phase 15)

Phase 15 is complete when the following metrics are measurable and within target range:

| Metric | Definition | Target |
|---|---|---|
| **Time to First Listing** | Hours from account approval to first active listing | < 24 hours |
| **Time to First Lead** | Days from first listing to first lead received | < 14 days |
| **Time to First Sale** | Days from first lead to first won lead logged | < 45 days |
| **Subscription Conversion Rate** | % of free dealers who upgrade within 90 days | > 20% |
| **Dealer Churn Risk (30d)** | % of active dealers with zero activity in 30 days | < 15% |
| **Onboarding Completion Rate** | % of approved dealers who complete the onboarding wizard | > 75% |
| **Application Review SLA** | % of applications reviewed within 3 business days | > 95% |

---

## Go-to-Market Approach

### Phase 1: V8Atlas Network Launch (Immediate)
- Activate enterprise tier for V8Atlas-connected dealers
- V8Atlas drives initial dealer acquisition through their existing DMS customer base
- AutoBentaPH provides inventory visibility + lead generation as the value prop
- Target: 50 enterprise dealers live in first 60 days

### Phase 2: Paid Tier Rollout
- Open Verified and Pro plans with finalized PHP pricing
- Enable self-serve upgrade flow
- Enable billing collection (GCash + Maya + bank transfer)
- Target: 30% of active dealers on a paid plan within 90 days of launch

### Phase 3: Free Tier Conversion Pressure
- requireFeature() 403 responses drive upgrade prompts automatically
- Free tier dealers will hit maxListings (5) quickly if active
- Analytics and CRM locked behind Verified tier creates clear upgrade moment
- Target: maintain > 20% free-to-paid conversion

### Phase 4: Lead Distribution Monetization
- Once lead router is live and dealer base is established
- Introduce per-lead fee for distributed leads (separate from subscription)
- This creates a second revenue stream that scales with marketplace volume

---

## Retention Levers

| Lever | Mechanism | Effect |
|---|---|---|
| **Dealer Scorecard** | 0–100 score with A/B/C/D rank — visible to dealer at all times | Gamification drives ongoing engagement; D-rank dealers are at-risk indicators |
| **Performance Coaching** | Admin can identify D-rank dealers and initiate outreach | Proactive intervention before churn |
| **Trust Badge Acquisition** | Verification unlocks badge that measurably improves listing conversion | Creates sticky feature value tied to platform trust system |
| **Lead Quality** | Higher-tier dealers get priority lead routing | Subscription tier directly affects business outcomes, not just features |
| **Analytics Lock-in** | Pro plan analytics create data dependency — churning means losing historical trend data | Feature stickiness increases LTV |
| **V8Atlas Sync** | Enterprise dealers have DMS inventory synced via V8Atlas — churning breaks their workflow | High switching cost for enterprise tier |

---

## The Marketplace Flywheel

```
More dealers
    ↓
More inventory (more listings, more variety)
    ↓
More buyers attracted to platform
    ↓
More inquiries and leads generated
    ↓
More dealer revenue from AutoBentaPH leads
    ↓
More dealers willing to pay subscription
    ↓
Platform funds better tools and trust infrastructure
    ↓
Better buyer experience → more buyers
```

The flywheel is self-reinforcing once the dealer base crosses a critical mass for any given metro area. V8Atlas accelerates entry into that critical mass by bringing an existing dealer network.

**Flywheel risks:**
- Chicken-and-egg in new regions (not enough dealers → not enough buyers → dealers churn)
- Lead quality perception — if lead-to-sale rate is low, dealers lose confidence regardless of volume
- Trust infrastructure is the moat — Carmudi and Carousell do not have equivalent verification depth

---

## Competitive Positioning

| Feature | AutoBentaPH | Carmudi PH | AutoDeal PH | Carousell Motors |
|---|---|---|---|---|
| Dealer verification system | Yes (admin-granted, trust-propagated) | Basic | Basic | None |
| Trust signals on listings | Deep (5+ signals) | Limited | Limited | None |
| Dealer scorecard | Yes (0-100, A-D) | No | No | No |
| DMS integration (V8Atlas) | Yes (enterprise) | No | No | No |
| Multi-branch support | Yes (enterprise) | No | Limited | No |
| Ownership transfer workflow | Yes | No | No | No |
| Inspection integration | Yes | Partial | Partial | No |
| Financing pipeline | Yes | Partial | Yes | No |
