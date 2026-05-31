# Marketplace First Principles

**Date:** 2026-06-01  
**Status:** Product Governance Document

---

## The Core Test for Every Feature

Before any feature is built, it must improve at least one of the following:

1. **Inventory quality** — more listings, better photos, accurate pricing, faster updates
2. **Buyer acquisition** — more unique buyers visiting and searching
3. **Lead volume** — more buyer inquiries generated per listing
4. **Lead conversion** — more of those inquiries turning into contacts/deals
5. **Dealer retention** — dealers renewing because Ryderr demonstrably works
6. **Marketplace revenue** — subscriptions, lead credits, referrals

If a proposed feature improves none of these, it doesn't belong in the roadmap. If it improves one at the expense of another (e.g., adding DMS features that distract from buyer growth), it must be debated explicitly — not assumed.

---

## Ryderr Does NOT Become a DMS

A DMS handles:
- Stocking and deal structuring
- F&I (finance and insurance) product workflows
- Service department scheduling
- Internal CRM and follow-up sequences
- Document management and e-contracting
- Floorplan financing

**None of this belongs in Ryderr.** Not a lite version of it. Not a "starter CRM." Not a document storage area.

Dealers already have systems for this. Adding DMS functionality to Ryderr means:
- Competing with established systems dealers are contractually locked into
- Building infrastructure that doesn't drive marketplace value
- Creating features that benefit one dealer's internal workflow instead of the entire buyer-side network
- Engineering resources diverted from the marketplace to dealer back-office tooling

The moment Ryderr tries to be a DMS, it stops being a good marketplace.

---

## The V8Atlas Trap

The V8Atlas trap is the specific failure mode where Ryderr builds features that only make sense for V8Atlas users, or that assume V8Atlas is the inventory source.

**Examples of falling into the trap:**
- Adding a "V8Atlas sync status" widget to the main dealer dashboard instead of a source-agnostic sync status
- Building lead routing that calls V8Atlas directly instead of going through the adapter layer
- Storing V8Atlas-specific fields in the core listings table instead of in a provider metadata column
- Requiring V8Atlas login to access Ryderr admin features
- Writing product specs that say "when V8Atlas sends inventory..." instead of "when inventory is received from any source..."

**The trap is structural:** V8Atlas is a single dealer customer. It happens to also build dealer tools. That does not make it Ryderr's infrastructure partner. It is a plugin. Any dependency on V8Atlas internals is technical debt that must eventually be removed.

---

## What Ryderr Owns Permanently

These are Ryderr's core assets. They must never be delegated to a DMS or third-party system:

| Asset | Why Ryderr Must Own It |
|---|---|
| **Buyer relationship** | Buyers trust Ryderr, not the dealer's DMS. If buyers go directly to dealer CRMs, Ryderr loses its leverage. |
| **Listing discovery surface** | The search, SEO, and browse experience is Ryderr's product. No DMS should control how listings appear to buyers. |
| **Trust verification** | Dealer badges, verification status, and review scores belong to Ryderr. This is what makes buyers choose Ryderr over Craigslist. |
| **Lead origination** | Every lead starts in Ryderr. Ryderr gets credit for the lead regardless of where the dealer closes it. |
| **Performance analytics** | Ryderr sees across all dealers. No individual DMS has that view. This data is a competitive moat. |

---

## What Dealer Systems Own

These are the dealer's domain. Ryderr should not attempt to replace or replicate them:

- CRM workflow and follow-up sequences
- Deal structuring and F&I management
- Internal notes and communication logs
- Document storage and e-contracting
- Service department operations
- Employee management and commissions

Ryderr's job is to deliver a high-quality lead to the dealer's system and then get out of the way.

---

## The 10 Marketplace Health Metrics (Weekly Review)

| # | Metric | Healthy Target |
|---|---|---|
| 1 | Total active listings | Growing week-over-week |
| 2 | Unique buyer sessions (7d) | Growing week-over-week |
| 3 | Listings-to-lead rate | ≥ 1.5 leads/listing/month |
| 4 | Lead-to-contact conversion | ≥ 15% |
| 5 | Avg listing quality score | ≥ 7.5/10 |
| 6 | Stale listing rate (>14 days no update) | < 15% of active inventory |
| 7 | Dealer churn rate (30d) | < 3% |
| 8 | New dealer activations (30d) | Exceeds churn count |
| 9 | Marketplace revenue (30d) | Growing month-over-month |
| 10 | Provider error rate (any source) | < 0.5% of sync/push attempts |

Any metric outside target range triggers a review. No metric is acceptable at "good enough" — the goal is consistent improvement.

---

## Evaluating Features Against Marketplace-First Principles

**Evaluation checklist for any proposed feature:**

```
□ Does it improve at least one of the 6 marketplace outcomes?
□ Does it work for ALL dealer source types, or just one?
□ Does it require Ryderr to own data or workflow that belongs to the dealer's DMS?
□ Does it pass the "V8Atlas offline" test?
□ Does it help buyers, or only dealers? (both is fine, buyers-only is fine, dealers-only is yellow flag)
□ Does it create a new dependency on any external system?
□ Is there a simpler version that achieves the same marketplace outcome?
```

A feature that fails more than two of these checks should be redesigned or deprioritized.

---

## The "If V8Atlas Goes Offline" Test

This is the most direct way to identify hidden dependencies.

**How to apply it:** For any feature, ask: "If V8Atlas's API returns 503 for 24 hours, does this feature break?"

- If yes: the feature has an undeclared dependency on V8Atlas that must be removed.
- If no: the feature is correctly isolated.

This test applies to:
- Lead routing
- Inventory display on buyer-facing pages
- Dealer dashboard metrics
- Admin network monitoring
- Billing and subscription logic
- Search and filtering

Every single one of these must continue working with V8Atlas offline. If any fails the test today, that failure is a bug — not a future enhancement.
