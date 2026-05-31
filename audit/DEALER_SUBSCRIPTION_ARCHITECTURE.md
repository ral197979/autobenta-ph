# Dealer Subscription Architecture

**Document:** DEALER_SUBSCRIPTION_ARCHITECTURE  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production

---

## Subscription Model Overview

AutoBentaPH dealers operate on a tiered subscription model with four plans. Each plan unlocks a defined set of features enforced at the API layer via the `requireFeature()` middleware. No feature access is based on trust or convention — it is hard-gated.

| Plan | Target Dealer | Core Value Prop |
|---|---|---|
| **Free** | Entry-level / test-drive | 5 listings, basic marketplace presence |
| **Verified** | Small independent dealers | Verification badge, 25 listings, CRM access |
| **Pro** | Active dealers scaling operations | Priority placement, analytics, 100 listings, lead automation |
| **Enterprise** | Large dealers / dealer groups | Unlimited listings, V8Atlas sync, API access, multi-branch, dedicated support |

---

## PLAN_FEATURES Table

| Feature Flag | Free | Verified | Pro | Enterprise |
|---|---|---|---|---|
| `maxListings` | 5 | 25 | 100 | unlimited |
| `verificationBadge` | false | true | true | true |
| `crm` | false | true | true | true |
| `analytics` | false | false | true | true |
| `priorityPlacement` | false | false | true | true |
| `leadRouting` | false | false | true | true |
| `v8atlasSync` | false | false | false | true |
| `multiBranch` | false | false | false | true |
| `apiAccess` | false | false | false | true |

---

## The `requireFeature()` Middleware

`requireFeature(feature)` is an Express middleware factory that gates any route behind a feature entitlement check.

**How it works:**

```js
// Usage in route definition
router.get('/analytics', requireFeature('analytics'), analyticsController.getOverview)

// Middleware implementation (simplified)
function requireFeature(feature) {
  return async (req, res, next) => {
    const dealer = await DealerProfile.findOne({ userId: req.user.id })
      .populate('subscription')

    if (!dealer?.subscription) {
      return res.status(403).json({
        error: 'No active subscription',
        upgradeUrl: '/dealer/subscription'
      })
    }

    const plan = dealer.subscription.plan          // 'free' | 'verified' | 'pro' | 'enterprise'
    const allowed = PLAN_FEATURES[plan][feature]

    if (!allowed) {
      return res.status(403).json({
        error: `Feature '${feature}' requires a higher plan`,
        currentPlan: plan,
        upgradeUrl: '/dealer/subscription/upgrade'
      })
    }

    req.dealer = dealer
    next()
  }
}
```

**Key behaviors:**
- Reads `dealer.subscription.plan` on every gated request (no caching — subscription changes take immediate effect)
- Returns HTTP 403 with `upgradeUrl` on failure — frontend uses this to render upgrade prompts
- Attaches `req.dealer` for downstream handlers so they don't need a second DB lookup
- `maxListings` is a numeric check, not boolean — handled separately in listing creation route

---

## DealerSubscription Model

```
DealerSubscription {
  id              String          @id
  dealerId        String          @unique
  plan            PlanType        // free | verified | pro | enterprise
  status          SubStatus       // active | cancelled | suspended | trialing | past_due
  billingCycle    BillingCycle    // monthly | annual
  features        Json            // snapshot of PLAN_FEATURES at subscription time
  expiresAt       DateTime?       // null for active, set on cancellation
  trialEndsAt     DateTime?       // null if no trial active
  createdAt       DateTime
  updatedAt       DateTime
  
  dealer          DealerProfile   @relation(...)
  invoices        Invoice[]
}
```

**Notes:**
- `features` JSON is a point-in-time snapshot. If PLAN_FEATURES changes globally, existing subscriptions are unaffected until renewal.
- `status: past_due` triggers a 72-hour grace window before listing deactivation.
- `status: trialing` grants full plan features; `trialEndsAt` is checked on each request and flips to `active` or `cancelled` at expiry.

---

## Feature Entitlement Enforcement Points

| Route | Feature Required | Effect if Blocked |
|---|---|---|
| GET /dealer/analytics | `analytics` | 403 + upgrade prompt |
| GET /dealer/analytics/scorecard | `analytics` | 403 + upgrade prompt |
| GET /dealers/me/leads | `crm` | 403 + upgrade prompt |
| PATCH /dealers/me/leads/:id | `crm` | 403 + upgrade prompt |
| POST /dealers/me/branches | `multiBranch` | 403 + upgrade prompt |
| GET /dealers/me/branches | `multiBranch` | 403 + upgrade prompt |
| GET /api/v1/* (external) | `apiAccess` | 403 + upgrade prompt |
| V8Atlas sync webhook processing | `v8atlasSync` | Webhook accepted, sync skipped |
| POST /listings (> plan limit) | `maxListings` | 403 with current/max count |
| Priority placement ranking | `priorityPlacement` | Listing ranked without boost |

---

## Billing Foundation

The billing layer is processor-agnostic. It models financial events as records, not processor calls. External payment processing is handled outside this layer.

### Invoice Model

```
Invoice {
  id              String       @id
  dealerId        String
  subscriptionId  String
  amount          Decimal      // PHP
  currency        String       // 'PHP'
  status          InvoiceStatus // draft | open | paid | void | failed
  dueDate         DateTime
  paidAt          DateTime?
  lineItems       Json         // [{ description, quantity, unitPrice, total }]
  createdAt       DateTime
  updatedAt       DateTime

  dealer          DealerProfile @relation(...)
  payments        PaymentRecord[]
}
```

### PaymentRecord Model

```
PaymentRecord {
  id              String          @id
  invoiceId       String
  amount          Decimal
  currency        String
  status          PaymentStatus   // pending | completed | failed | refunded
  processor       String          // 'stripe' | 'gcash' | 'maya' | 'bank_transfer' | 'manual'
  processorRef    String?         // external transaction ID from processor
  metadata        Json?           // processor-specific fields
  createdAt       DateTime
  updatedAt       DateTime

  invoice         Invoice         @relation(...)
}
```

**Invoice → PaymentRecord flow:**

```
1. Invoice created (status: draft)
2. Invoice sent to dealer (status: open)
3. Dealer initiates payment via processor
4. Processor webhook / manual entry → PaymentRecord created (status: completed)
5. Invoice marked paid (status: paid)
6. Subscription status confirmed active
```

No business logic is coupled to a specific processor. The `processor` field on `PaymentRecord` is for audit and reconciliation only. Processor-specific SDK calls live in isolated adapters outside the core billing models.

---

## UsageMetric Model

UsageMetric tracks per-dealer, per-period resource consumption for enforcement and analytics.

```
UsageMetric {
  id          String    @id
  dealerId    String
  metricType  String    // 'listing_count' | 'api_calls' | 'lead_views'
  value       Int
  period      String    // 'YYYY-MM' (monthly rollup)
  recordedAt  DateTime

  dealer      DealerProfile @relation(...)
}
```

**Current metric types:**

| Metric | Purpose | Enforcement |
|---|---|---|
| `listing_count` | Active listings this month | Checked against `maxListings` on POST /listings |
| `api_calls` | External API calls this month | Rate limiting for `apiAccess` tier |
| `lead_views` | Leads viewed in CRM | Informational — no current hard limit |

---

## Upgrade Path

**Self-serve upgrade (dealer-initiated):**

```
1. Dealer visits /dealer/subscription
2. Selects new plan
3. POST /dealers/me/subscription { plan: 'pro', billingCycle: 'monthly' }
4. Invoice created (status: open)
5. Dealer redirected to payment flow
6. On payment success: subscription.plan updated, features JSON refreshed
7. New entitlements active immediately
```

**Admin manual change:**

```
PATCH /admin/dealers/:id
Body: { plan: 'enterprise', reason: 'manual upgrade per sales agreement' }

Effect:
- subscription.plan updated
- features JSON refreshed from PLAN_FEATURES
- Invoice optionally created manually via /admin/billing/invoices
- Audit log entry written
```

---

## Payment Processor Abstraction

AutoBentaPH supports multiple payment processors. No processor SDK is imported into the core billing layer.

| Processor | Use Case | Integration Pattern |
|---|---|---|
| Stripe | Credit/debit cards, international | Stripe webhook → PaymentRecord |
| GCash | Philippine e-wallet, high volume retail | GCash callback → PaymentRecord |
| Maya | Philippine e-wallet alternative | Maya webhook → PaymentRecord |
| Bank transfer | Manual / enterprise billing | Admin-entered → PaymentRecord (processor: 'manual') |

All processors write to the same `PaymentRecord` schema. Reconciliation is done via `processorRef` matching external transaction IDs.

---

## Future: Proration, Trials, Annual Discount

| Feature | Description | Status |
|---|---|---|
| **Proration** | Mid-cycle plan upgrades credit unused days of current plan against new plan invoice | Planned |
| **Trial periods** | `trialEndsAt` field is modeled — trial logic not yet wired end-to-end | Modeled |
| **Annual discount** | `billingCycle: annual` field is modeled — discount rate not yet applied | Modeled |
| **Dunning** | Automated retry on failed payments before suspension | Planned |
| **Coupon codes** | One-time or recurring discounts tied to invoice line items | Not started |
