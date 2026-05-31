# Revenue Activation Plan

**Document:** REVENUE_ACTIVATION_PLAN
**Version:** 1.0
**Date:** 2026-05-31
**Status:** Production

---

## Revenue Streams

AutoBentaPH has four revenue streams. Two are live, one is live but not yet monetized at scale, and one is planned.

| Stream                  | Status        | Billing model               |
|-------------------------|---------------|-----------------------------|
| Subscriptions           | Live          | Monthly / annual recurring  |
| Featured listings       | Live          | Pay-per-feature, weekly     |
| Lead credits            | Live          | Pay-per-lead, package-based |
| Inspection referrals    | Planned (v2)  | Revenue share per booking   |

---

## Featured Listings

Dealers pay to surface their inventory and brand above organic results. Featured listings are time-bounded and admin-approved.

### Feature types and pricing

| Feature Type       | Price (PHP) | Duration | Placement                                      |
|--------------------|-------------|----------|------------------------------------------------|
| `homepage`         | ₱2,500/wk   | 7 days   | Homepage hero carousel and "Featured Vehicles" section |
| `search_boost`     | ₱500/wk     | 7 days   | Boosted position in search results; "Sponsored" label |
| `sponsored`        | ₱300/wk     | 7 days   | Inline sponsored card in search results        |
| `featured_dealer`  | ₱1,500/wk   | 7 days   | Dealer brand featured in "Top Dealers" section |

### FeaturedListing model

```prisma
model FeaturedListing {
  id          String       // CUID
  listingId   String       // The vehicle listing being featured
  dealerId    String
  featureType String       // homepage | search_boost | sponsored | featured_dealer
  startAt     DateTime     // When the feature goes live (set on admin approval)
  endAt       DateTime     // startAt + 7 days (or custom duration)
  pricePhp    Decimal      // Locked in at time of purchase
  status      String       // pending | active | expired | cancelled
}
```

### Workflow

```
Dealer requests feature → FeaturedListing(status=pending) created
  → Admin reviews in dashboard → Approves
    → status=active, startAt=now, endAt=now+7d
    → Listing surfaces in designated placement
  → endAt passes → cron sets status=expired
  → Listing returns to organic position
```

Admin rejection sets `status=cancelled` and triggers a refund if payment was collected upfront. Auto-expiry runs via a scheduled job that checks `endAt < now AND status=active` every hour.

---

## Lead Credit System

Lead credits decouple lead delivery from subscription tier. A dealer on the free plan can still receive qualified leads by maintaining a credit balance.

### How credits work

1. Dealer purchases a `CreditPackage` — receives `credits` added to their `LeadCredit.balance`.
2. When a qualified lead is delivered to the dealer, the system deducts 1 credit from `LeadCredit.balance`.
3. If balance reaches 0, lead delivery is paused until the dealer tops up.
4. Every deduction creates a `CreditTransaction` record for full audit trail.

### CreditPackage examples

| Package name | Credits | Price (PHP) | Per-credit cost |
|--------------|---------|-------------|-----------------|
| Starter      | 10      | ₱500        | ₱50/lead        |
| Growth       | 30      | ₱1,200      | ₱40/lead        |
| Pro          | 100     | ₱3,000      | ₱30/lead        |

Volume discount increases with package size. Dealers on Pro/Enterprise subscriptions may receive bonus credits on renewal (configured as `CreditTransaction(type=bonus)`).

### LeadCredit model

```prisma
model LeadCredit {
  id              String   // CUID
  dealerId        String   @unique
  balance         Int      // Current spendable balance
  lifetimeCredits Int      // Total credits ever received (for LTV analysis)
}
```

### CreditTransaction audit trail

```prisma
model CreditTransaction {
  id            String   // CUID
  dealerId      String
  creditId      String   // FK to LeadCredit
  packageId     String?  // FK to CreditPackage (null for consumption/refund/bonus)
  leadId        String?  // FK to Lead (populated for consumption transactions)
  type          String   // purchase | consumption | refund | bonus
  credits       Int      // Positive = added, negative = deducted
  balanceBefore Int      // Balance before this transaction
  balanceAfter  Int      // Balance after this transaction
  createdAt     DateTime
}
```

`balanceBefore` and `balanceAfter` are written atomically in the same transaction as the `LeadCredit.balance` update. This ensures the audit log is always consistent with the actual balance, even under concurrent writes.

---

## Subscription Revenue

### Plan features framework

| Feature                     | Free | Verified | Pro  | Enterprise |
|-----------------------------|------|----------|------|------------|
| Active listing limit        | 5    | 20       | 100  | Unlimited  |
| CRM leads                   | 10   | 50       | Unlimited | Unlimited |
| Sub-user seats              | 1    | 1        | 3    | Unlimited  |
| Automation rules            | No   | No       | Yes  | Yes        |
| V8Atlas DMS sync            | No   | No       | Yes  | Yes        |
| Analytics dashboard         | Basic| Basic    | Full | Full + export |
| Featured listing discount   | —    | 10%      | 20%  | 30%        |
| Lead credit bonus on renewal| —    | —        | 5cr  | 20cr       |

Entitlement enforcement is handled by `requireFeature(featureName)` middleware at the API route level. Business logic never hard-codes plan names.

### Billing cycles

- **Monthly:** full price, billed on the same calendar day each month.
- **Annual:** 2 months free (effective 16.7% discount), billed as a single upfront invoice.

### Trial period

New dealers get a 14-day trial of the Verified plan. Trial is tracked via `Dealer.trialEndsAt`. On trial expiry, plan reverts to Free unless the dealer has an active paid invoice.

---

## Revenue Metrics

### MRR calculation

```
MRR = SUM(Invoice.amount WHERE status='paid' AND periodEnd >= first_of_month AND periodStart <= last_of_month)
```

Annual plan invoices are pro-rated monthly for MRR purposes: `annualAmount / 12`.

### ARPU

```
ARPU = MRR / COUNT(Dealer WHERE plan != 'free' AND subscriptionStatus = 'active')
```

### Revenue API response shape

```json
// GET /api/analytics/revenue
{
  "mrr": 185000,
  "mrrGrowthPercent": 12.4,
  "arpu": 3200,
  "activePaidDealers": 57,
  "featuredRevenue": 42500,
  "creditRevenue": 31000,
  "periodStart": "2026-05-01",
  "periodEnd": "2026-05-31"
}
```

All amounts in PHP (integer pesos, no decimals in the API response).

### Revenue breakdown

| Category          | Metric                                              |
|-------------------|-----------------------------------------------------|
| Subscription MRR  | Sum of recurring invoice amounts, current month     |
| Featured revenue  | Sum of FeaturedListing.pricePhp where paid this month |
| Credit revenue    | Sum of CreditTransaction(type=purchase).credits × package pricePhp this month |
| MRR growth %      | `(currentMRR - priorMRR) / priorMRR × 100`         |

---

## Monthly Revenue Targets Framework

Revenue targets are set quarterly by the business team and are not hardcoded in the application. The analytics dashboard exposes a target configuration (admin-only) that accepts `{ mrrTarget, featuredTarget, creditTarget }` for the current month, then renders actuals vs. target on the admin revenue screen.

This design means target changes do not require a code deploy.

---

## Upgrade Incentives

### Listing limit nudge

When a dealer's active listing count reaches 80% of their plan limit, the dashboard displays a yellow banner:

```
"You're using 16 of 20 listings. Upgrade to Pro for 100 listings."
```

The banner links to the upgrade flow. This fires at 80% and again at 95%. At 100%, new listing creation is blocked with a modal that includes a direct upgrade CTA.

### D-rank dealer intervention

Dealers with a platform rank of D (lowest tier) receive a proactive intervention:

1. In-app notification: "Your dealer score is D. Here's how to improve it."
2. Link to score breakdown (response time, listing quality, lead conversion rate).
3. CTA to upgrade plan — higher plan correlates with features (automation, analytics) that mechanically improve score.

The D-rank check runs as part of the weekly score recalculation job. Dealers who have been D-rank for 2+ consecutive weeks are flagged for a manual outreach by the AutoBentaPH dealer success team.
