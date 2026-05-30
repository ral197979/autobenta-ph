# Dealer Monetization Plan

**Document:** DEALER_MONETIZATION_PLAN  
**Version:** 1.0  
**Date:** 2026-05-30  
**Status:** Entitlement system live; payment processor integration pending

---

## Revenue Model

AutoBentaPH monetizes its dealer network through a tiered subscription model targeting different dealer sizes. Payment processing is not yet integrated — upgrades are handled manually via `dealers@autobentaph.com`.

---

## Subscription Plans

### Free
**Price:** ₱0 forever  
**Target:** Individual sellers testing the platform; micro-dealers

| Feature | Limit |
|---|---|
| Active listings | 5 |
| Lead inbox | Basic (view only) |
| Analytics dashboard | — |
| Priority placement | — |
| Verified Dealer badge | — |
| Multi-branch support | — |
| V8Atlas / DMS sync | — |
| API access | — |

### Verified — ₱1,499/mo
**Target:** Small dealers (10–30 cars), transitioning from free

| Feature | Limit |
|---|---|
| Active listings | 25 |
| Lead inbox | Full CRM (status updates, notes, contact log) |
| Analytics dashboard | — |
| Priority placement | — |
| Verified Dealer badge | ✓ |
| Multi-branch support | — |
| V8Atlas / DMS sync | — |
| API access | — |

The Verified badge increases buyer trust and is the primary conversion driver for this tier.

### Dealer Pro — ₱3,499/mo
**Target:** Mid-size dealers (30–100 cars), serious operators

| Feature | Limit |
|---|---|
| Active listings | 100 |
| Lead inbox | Full CRM |
| Analytics dashboard | ✓ (inventory aging, win rate, activity) |
| Priority placement | ✓ (boosted search ranking) |
| Verified Dealer Pro badge | ✓ |
| Multi-branch support | — |
| V8Atlas / DMS sync | — |
| API access | — |

### Enterprise — Custom pricing
**Target:** Dealer groups (100+ cars, multiple branches)

| Feature | Limit |
|---|---|
| Active listings | Unlimited |
| Lead inbox | Full CRM |
| Analytics dashboard | ✓ |
| Priority placement | ✓ |
| Enterprise Dealer badge | ✓ |
| Multi-branch support | ✓ |
| V8Atlas / DMS sync | ✓ |
| API access | ✓ |

Enterprise contracts are handled via `dealers@autobentaph.com`. Custom SLAs available.

---

## Entitlement Enforcement

The `subscriptionEntitlements.js` service defines the feature gate:

```javascript
const PLAN_FEATURES = {
  free:       { max_listings: 5,  lead_crm: false, analytics: false, priority: false, ... },
  verified:   { max_listings: 25, lead_crm: true,  analytics: false, priority: false, ... },
  pro:        { max_listings: 100, lead_crm: true, analytics: true,  priority: true, ... },
  enterprise: { max_listings: null, lead_crm: true, analytics: true, priority: true, multi_branch: true, ... },
};
```

The `requireFeature(feature)` middleware:
1. Resolves the dealer's current plan from `DealerSubscription`
2. Checks `PLAN_FEATURES[plan][feature]`
3. Returns `403 { error: 'Feature not available', feature, upgradeUrl: '/dealer/subscription' }` if gated

Listing limits are enforced at creation time via `canAddListing(plan, currentCount)`.

---

## Upgrade Flow (Manual, Pre-Payment Integration)

1. Dealer clicks "Upgrade to [Plan]" in `/dealer/subscription`
2. `alert()` modal displays: _"Payment integration coming soon. Contact dealers@autobentaph.com to upgrade."_
3. Manual upgrade handled by admin: `PATCH /admin/dealers/:id` changes `tier`; admin creates/updates `DealerSubscription` record
4. New entitlements take effect immediately on next API request

### When Payment Processor Ships
The current architecture is designed to accept a payment processor with minimal changes:
- `DealerSubscription.stripeSubscriptionId` / `stripeCustomerId` fields are reserved in the schema
- The upgrade button already has a distinct handler (`onClick`) that can be replaced with a Stripe Checkout redirect
- Webhook handler for `invoice.payment_succeeded` → update `DealerSubscription.plan + currentPeriodEnd`

---

## Revenue Projections (Target)

| Cohort | Count | MRR Contribution |
|---|---|---|
| Free | 200 | ₱0 |
| Verified (₱1,499) | 50 | ₱74,950 |
| Pro (₱3,499) | 20 | ₱69,980 |
| Enterprise (est. ₱15,000 avg) | 5 | ₱75,000 |
| **Total target MRR** | | **₱219,930** |

These are planning targets, not commitments.

---

## Compliance Notes

- 14-day free trial: displayed in subscription UI
- No automatic charges without explicit payment intent
- Entitlements degrade gracefully on cancellation (listings stay active but new listings blocked when over limit)
- No stored credit card data in AutoBentaPH systems — payment processor handles PCI compliance
