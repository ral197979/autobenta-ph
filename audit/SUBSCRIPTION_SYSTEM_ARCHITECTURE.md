# Subscription System Architecture

**Document:** SUBSCRIPTION_SYSTEM_ARCHITECTURE  
**Version:** 1.0  
**Date:** 2026-05-30  
**Status:** Entitlement layer complete; payment processing not yet integrated

---

## Architecture Overview

The subscription system has two distinct layers:

1. **Entitlement layer** — determines what features a dealer can access based on their current plan. This is fully built and enforced.
2. **Payment layer** — handles billing, invoices, and plan changes triggered by payment events. This is not yet integrated; upgrades are manual.

The entitlement layer is intentionally decoupled from the payment layer so it can enforce feature access correctly regardless of how the plan was set (manual admin action today, Stripe webhook tomorrow).

---

## Data Model

### DealerSubscription

```prisma
model DealerSubscription {
  id              String           @id @default(cuid())
  dealerId        String           @unique
  dealer          Dealer           @relation(fields: [dealerId], references: [id])
  plan            SubscriptionPlan @default(free)
  status          String           @default("active")
  trialEndsAt     DateTime?
  currentPeriodEnd DateTime?
  // Reserved for future Stripe integration:
  // stripeSubscriptionId String? @unique
  // stripeCustomerId     String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

enum SubscriptionPlan {
  free
  verified
  pro
  enterprise
}
```

---

## Entitlement Engine

Located at `backend/src/services/dealerNetwork/subscriptionEntitlements.js`.

### Plan Feature Map

```javascript
const PLAN_FEATURES = {
  free: {
    max_listings: 5,
    lead_crm: false,
    analytics: false,
    priority_placement: false,
    verified_badge: false,
    multi_branch: false,
    inventory_api: false,
    lead_api: false,
  },
  verified: {
    max_listings: 25,
    lead_crm: true,
    analytics: false,
    priority_placement: false,
    verified_badge: true,
    multi_branch: false,
    inventory_api: false,
    lead_api: false,
  },
  pro: {
    max_listings: 100,
    lead_crm: true,
    analytics: true,
    priority_placement: true,
    verified_badge: true,
    multi_branch: false,
    inventory_api: false,
    lead_api: false,
  },
  enterprise: {
    max_listings: null,
    lead_crm: true,
    analytics: true,
    priority_placement: true,
    verified_badge: true,
    multi_branch: true,
    inventory_api: true,
    lead_api: true,
  },
};
```

`max_listings: null` means unlimited.

### API Functions

```javascript
getFeatures(plan)           // Returns full feature object for plan
hasFeature(plan, feature)   // Boolean check for single feature
canAddListing(plan, count)  // Boolean: count < max_listings (null = always true)
requireFeature(feature)     // Express middleware
```

### requireFeature Middleware

```javascript
function requireFeature(feature) {
  return async (req, res, next) => {
    const dealer = await prisma.dealer.findUnique({
      where: { userId: req.user.id },
      include: { subscription: true },
    });
    const plan = dealer?.subscription?.plan || 'free';
    if (!hasFeature(plan, feature)) {
      return res.status(403).json({
        error: 'Feature not available on your current plan',
        feature,
        currentPlan: plan,
        upgradeUrl: '/dealer/subscription',
      });
    }
    req.dealer = dealer;
    next();
  };
}
```

---

## Plan Resolution Priority

When determining a dealer's current plan:
1. Check `DealerSubscription.plan` (source of truth)
2. If no subscription record exists, default to `'free'`
3. If `DealerSubscription.status === 'cancelled'`, downgrade to `'free'` at period end

---

## API Endpoints

### GET /dealers/me/subscription
Returns current subscription state. Used by `DealerLayout` to populate outlet context.

```json
{
  "plan": "pro",
  "status": "active",
  "trialEndsAt": null,
  "currentPeriodEnd": "2026-06-30T00:00:00.000Z"
}
```

### POST /dealers/me/branches (enterprise-gated)
Creates a branch for the dealer. Middleware chain:
```javascript
[authenticate, requireRole('dealer', 'admin'), requireFeature('multi_branch')]
```

### GET /api/dealer-network/v1/analytics (plan-gated)
Requires `analytics` feature. Returns listing + lead breakdown for DMS consumers.

---

## Frontend Subscription UI

`DealerSubscription.jsx` presents a 4-column comparison grid:

- Each plan card shows: name, icon, price, description, feature list (CheckCircle/XCircle)
- Current plan highlighted with `ring-2 ring-deepblue` border and "Active Plan" badge
- "Dealer Pro" card has "Most Popular" banner (purple)
- Non-current plans show "Upgrade" button (currently shows alert + contact email)
- Enterprise shows "Contact Sales" → `mailto:dealers@autobentaph.com`

The sidebar in `DealerLayout` shows an "Upgrade Plan" CTA for all non-enterprise dealers.

---

## Payment Integration Readiness

When a payment processor (Stripe recommended) is integrated:

### Required Changes

1. **Backend**: Add `stripeSubscriptionId`, `stripeCustomerId` to `DealerSubscription`
2. **Backend**: Add webhook handler for `invoice.payment_succeeded` → update plan + `currentPeriodEnd`
3. **Backend**: Add webhook handler for `customer.subscription.deleted` → downgrade to free
4. **Frontend**: Replace `onClick={() => alert(...)}` in `DealerSubscription.jsx` with Stripe Checkout redirect
5. **Frontend**: Add billing portal link (Stripe Customer Portal) for plan management

### No Changes Required
- Entitlement middleware (`requireFeature`) — already plan-based, not payment-state-based
- Feature gating logic — unchanged
- DealerSubscription model — fields already reserved

---

## Trial Policy

All plans include a 14-day free trial (displayed in subscription UI footer). Trial is tracked via `DealerSubscription.trialEndsAt`. During trial, the dealer has full access to the plan features. Enforcement of trial expiry requires the payment layer.
