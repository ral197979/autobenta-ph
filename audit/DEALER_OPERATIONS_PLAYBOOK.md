# Dealer Operations Playbook

**Document:** DEALER_OPERATIONS_PLAYBOOK  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production

---

## Purpose

This playbook is the operational reference for the AutoBentaPH admin team. It covers the end-to-end dealer lifecycle from application review through active management, including billing operations, performance coaching, and escalation procedures.

---

## Application Review Process

### Standard Flow

| Step | Action | Location | Time Target |
|---|---|---|---|
| 1 | Application submitted by dealer | Automatic | — |
| 2 | Email notification to admin team | Automatic | — |
| 3 | Admin opens application queue | /admin/dealers → Applications tab | Within 1 business day |
| 4 | Review documents | In-panel document viewer | 15–30 min per application |
| 5 | Approve or reject | Approve/Reject buttons in admin panel | Within 3 business days of submission |
| 6 | Post-decision automation runs | Automatic | Immediate |

### Document Checklist

Before approving any application, verify:

- [ ] Business Registration Certificate (SEC for corporations, DTI for sole proprietors)
- [ ] Business Permit (current year, matching business name)
- [ ] Government-issued ID of owner/authorized representative
- [ ] Business name on documents matches application
- [ ] Phone number is reachable (spot-check for high-volume applicants)

### Approving an Application

```
PATCH /api/admin/applications/:id
{ "action": "approve", "plan": "free", "reason": "Documents verified" }
```

**What happens automatically on approval:**
1. DealerProfile created (if not exists)
2. User role updated to `dealer`
3. DealerSubscription created with specified starting plan
4. Welcome email sent to applicant with onboarding link
5. Application status set to `approved`

Default starting plan is `free`. Upgrade to `verified`, `pro`, or `enterprise` at approval if a commercial arrangement has been confirmed (e.g., V8Atlas enterprise referral).

### Rejecting an Application

```
PATCH /api/admin/applications/:id
{ "action": "reject", "reason": "Business permit expired. Please resubmit with current year permit." }
```

**Rejection reason is sent directly to the applicant.** Write clearly and include the specific document issue and what the dealer should do to reapply.

**Common rejection reasons:**
- Expired business permit
- Document name mismatch (permit vs. registration)
- Blurry or illegible uploaded documents
- Business registration not found in public records (for suspicious applicants)
- Duplicate application (same business, different account — merge or refer to existing account)

---

## Verification Process

### What "isVerified" Means

`isVerified` is an admin-granted status. It cannot be self-claimed by dealers.

A verified dealer has had their business identity confirmed by the AutoBentaPH team through document review. The verification badge on the dealer profile and listings signals to buyers that the seller has been vetted — it is not automatic or algorithmic.

**What isVerified is NOT:**
- It does not confirm the dealer has no complaints
- It does not confirm vehicle ownership for any specific listing
- It is separate from individual listing-level trust signals (ownershipVerified, transferReady)

### Verification Review Queue

Location: `/admin → Verification tab`

Dealers in this queue have either:
- Submitted upgraded documentation requesting verification
- Been flagged for verification review by the system (e.g., V8Atlas `dealer.verified` webhook)
- Been manually queued by an admin

### Granting Verification

```
PATCH /api/admin/dealers/:id/verify
{ "isVerified": true, "reason": "Physical inspection completed, documents confirmed" }
```

**What triggers automatically:**
1. `dealer.isVerified` set to `true`
2. All active listings for this dealer updated:
   - `sellerVerified: true`
   - `ownershipVerified` and `transferReady` set from current trust signals
3. Trust event logged (`type: dealer_verified, source: admin`)
4. If V8Atlas-connected: TrustProvider.onVerificationChange() called

This runs inside a Prisma `$transaction` — either all updates succeed or none do.

### Revoking Verification

```
PATCH /api/admin/dealers/:id/verify
{ "isVerified": false, "reason": "Business permit expired and not renewed" }
```

Trust propagation runs in reverse — listings updated to `sellerVerified: false`. This immediately affects buyer-facing displays.

### Verification SLA

Target: **5 business days** from dealer request to decision.

Applications flagged as high-priority (V8Atlas enterprise referrals) should be reviewed within **1 business day**.

---

## Tier Management

### Tier vs. Plan

| Concept | Controlled By | What It Affects |
|---|---|---|
| **Plan** | Subscription (billing) | Feature entitlements (requireFeature gates) |
| **Tier** | Admin (manual) or subscription upgrade | Dealer scorecard tier factor (20pt max), lead routing priority |

Tier and plan are typically aligned but can diverge in special cases (e.g., a free-plan dealer manually granted a higher tier for a pilot).

### When to Upgrade Tier Manually vs. Waiting for Self-Serve

**Upgrade manually when:**
- Commercial agreement has been signed (e.g., V8Atlas enterprise deal)
- Compensatory upgrade (e.g., service issue resolution)
- Pilot or beta program dealer
- Admin confirms payment outside the automated billing flow

**Wait for self-serve when:**
- Dealer has been notified of upgrade options and is evaluating
- Billing is live and the dealer should pay through the standard flow

### How to Change Tier

```
PATCH /api/admin/dealers/:id
{
  "tier": "pro",
  "plan": "pro",
  "reason": "Manual upgrade per V8Atlas enterprise agreement — invoice to follow"
}
```

**Immediate effects:**
- Feature entitlements updated
- Listing limit adjusted (no retroactive deactivation on upgrades; on downgrades, dealer must reduce listings to new limit or excess listings are deactivated)
- Scorecard tier factor recalculated on next score refresh

---

## Suspension Protocol

### Triggers for Suspension

| Trigger | Severity | Response Time |
|---|---|---|
| Confirmed fraud (document fraud, listing fraud) | Critical | < 2 hours |
| Multiple escalated buyer complaints | High | < 4 hours |
| Payment failure after grace period | Medium | < 24 hours |
| Suspected account sharing / unauthorized access | High | < 4 hours |
| Regulatory notice or legal hold | Critical | Immediate |

### Suspension Process

```
Step 1: Document the trigger
  - Screenshot evidence or link to complaint ticket
  - Note in dealer's admin record

Step 2: Suspend via admin panel
  PATCH /api/admin/dealers/:id/suspend
  { "suspended": true, "reason": "Suspected listing fraud under investigation" }

Step 3: Internal investigation
  - Review listing history, lead records, payment records
  - Contact dealer via registered email/phone for response
  - Target: complete within 5 business days

Step 4a: Restore if cleared
  PATCH /api/admin/dealers/:id/suspend
  { "suspended": false, "reason": "Investigation complete, no violation found" }

Step 4b: Permanent ban if confirmed
  - Keep suspended: true
  - Update internal record with ban reason and evidence
  - Blacklist associated phone/email/business registration for future applications
```

### Impact of Suspension

| Effect | Behavior |
|---|---|
| Active listings | Deactivated immediately (not deleted) |
| Leads | Locked — dealer can view but cannot update status or contact buyers |
| Login | Still allowed — dealer can see their account but cannot perform write actions |
| V8Atlas sync | Paused — incoming webhooks accepted but not processed |
| Billing | Active subscription continues; invoices still generated |

Dealers are NOT notified of suspension reasons by default — admin decides whether to communicate. For payment-related suspensions, standard billing notifications apply.

---

## Lead Distribution Monitoring

### Reviewing the Routing Queue

```
GET /api/admin/leads/routing/queue
```

Returns pending leads with routing status, assigned dealer, and any errors.

### Routing Priority Order

```
1. Dealer tier (enterprise > pro > verified > free)
2. Dealer score (higher score = higher priority within same tier)
3. Response time (lower avg hours = higher priority within same score band)
4. Geographic match (dealer's listed coverage area includes listing location)
```

### Common Routing Issues

| Issue | Symptom | Resolution |
|---|---|---|
| No eligible dealer in region | Lead stuck in queue with `no_match` status | Manually assign to nearest dealer via admin override |
| Dealer at listing capacity | Lead routed but dealer at maxListings, can't receive more | Prompt dealer to upgrade or archive old listings |
| Routing failure (system error) | Lead has `routing_failed` status | Check error log; re-trigger routing manually |
| Dealer suspended mid-routing | Lead was assigned to now-suspended dealer | Re-route to next eligible dealer |

### Manual Override

To assign a lead directly to a dealer, bypassing the router:

```
PATCH /api/dealers/me/leads/:id
{ "dealerId": "dpl_xxx", "adminOverride": true, "reason": "Manual assignment — no eligible dealer in auto router" }
```

Manual assignments are logged with the admin user ID and reason for audit purposes.

---

## Dealer Performance Coaching

### Identifying At-Risk Dealers

Pull D-rank dealers (score < 40) from analytics:

```
GET /api/admin/dealers?minScore=0&maxScore=39&status=active
```

Also watch for:
- Dealers with score < 40 AND `lastActivityAt` > 14 days ago (disengaged)
- Dealers with 0 listings in the last 30 days (possibly abandoned)
- Dealers with `inquiries > 0` but `leadsConverted = 0` (conversion problem, not visibility)

### Scorecard Factor Breakdown

| Factor | Max Points | Common Issue | Coaching Action |
|---|---|---|---|
| `verified` | 25 | Not verified | Prompt to complete verification; explain badge impact on buyer trust |
| `tier` | 20 | On free plan | Show ROI of upgrading: priority placement + analytics + CRM |
| `winRate` | 30 | Low conversion | Review response quality; suggest CRM notes practice; check pricing vs. market |
| `responseTime` | 10 | Slow response | Set expectation: leads go cold after 2 hours; recommend mobile app use |

### Coaching Workflow

```
1. Identify D-rank dealer (score < 40)
2. Review scorecard factor breakdown in /admin/dealers/:id
3. Identify primary drag (usually 'verified' = 0 or 'winRate' = low)
4. Outreach via email:
   - Lead with specific insight: "Your score is 32/100. Adding verification adds 25 points immediately."
   - Include link to verification form or upgrade page
5. Log outreach in internal notes (admin panel)
6. Follow up in 7 days if no action
```

### D-Rank Action Thresholds

| Score | Action |
|---|---|
| 60–100 | No action needed |
| 40–59 | Automated nudge (email with scorecard breakdown) |
| 25–39 | Manual outreach from admin team |
| < 25 | High churn risk — escalate to account manager |

---

## Billing Operations

### Creating Invoices Manually

Used for enterprise agreements, adjustments, or when automated billing is not yet live.

```
POST /api/admin/billing/invoices
{
  "dealerId": "dpl_xxx",
  "amount": 15000,
  "dueDate": "2026-06-15",
  "lineItems": [
    { "description": "Enterprise Plan — Monthly (June 2026)", "quantity": 1, "unitPrice": 15000, "total": 15000 }
  ],
  "notes": "Per commercial agreement signed 2026-05-15"
}
```

Invoice is created in `open` status. Send invoice URL to dealer via email.

### Handling Failed Payments

```
Step 1: Mark invoice as failed
  PATCH /api/admin/billing/invoices/:id
  { "status": "failed", "notes": "GCash payment declined 2026-06-01" }

Step 2: Send notification to dealer
  - Email: payment failed, link to retry
  - Include grace period end date

Step 3: 7-day grace period
  - Subscription remains active
  - No immediate feature restriction

Step 4: If not resolved in 7 days
  - Subscription status → past_due
  - Listing priority removed
  - At 14 days: subscription suspended, listings deactivated

Step 5: On payment received
  - Create PaymentRecord { status: completed }
  - Update invoice { status: paid }
  - Restore subscription status to active
```

### Refund Process

```
Step 1: Determine refund amount and reason

Step 2: Process refund via original payment processor (Stripe dashboard / GCash merchant / Maya merchant)

Step 3: Record refund in AutoBentaPH:
  POST (or manual create) PaymentRecord:
  {
    "invoiceId": "inv_xxx",
    "amount": 2999,
    "status": "refunded",
    "processor": "gcash",
    "processorRef": "GCX-REF-12345",
    "metadata": { "refundReason": "Service outage 2026-05-28 to 2026-05-30" }
  }

Step 4: Update invoice if full refund:
  PATCH /api/admin/billing/invoices/:id
  { "status": "void", "notes": "Voided — full refund issued 2026-06-01" }

Step 5: Log in dealer's admin record
```

---

## SLA Targets Summary

| Process | SLA Target | Priority |
|---|---|---|
| Application review | 2–3 business days | Standard |
| Application review (V8Atlas enterprise) | 1 business day | High |
| Verification review | 5 business days | Standard |
| Suspension action (confirmed fraud) | < 2 hours | Critical |
| Suspension action (complaints / payment) | < 4 hours | High |
| Lead routing (automated) | < 5 seconds | System |
| Lead manual override | < 1 hour after escalation | High |
| Failed payment notification | < 24 hours of failure | Medium |
| Refund processing | 3–5 business days | Medium |
| D-rank coaching outreach | Within 7 days of reaching D rank | Low |

---

## Escalation Path

| Issue | First Escalation | Second Escalation |
|---|---|---|
| Document fraud / legal | Admin lead → Legal team | CEO |
| Serious buyer complaints | Admin lead → Customer support lead | Admin lead review board |
| System outage affecting lead routing | Ops admin → Engineering on-call | Engineering lead |
| V8Atlas sync failure | Ops admin → Engineering | V8Atlas technical contact |
| Payment processor issue | Admin lead → Finance team | Payment processor support |
