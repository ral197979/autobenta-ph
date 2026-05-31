# Renewal Operations Audit
## AutoBentaPH — Renewal System Documentation

**Document type:** Audit / System Documentation
**Scope:** Monthly billing cycle, renewal signals, DealerSuccessScore as leading indicator, escalation path

---

## 1. Monthly Billing Cycle

All active dealers operate on the same billing schedule. The cycle is anchored to the dealer's subscription start date (activation date).

| Day in Cycle | Event | System Action | Admin Action |
|--------------|-------|--------------|--------------|
| Day 20 | Pre-renewal check | System generates reminder in admin queue | Call dealer to confirm satisfaction |
| Day 25 | Invoice generation | Admin generates invoice (manual) | Send invoice via email + WhatsApp |
| Day 30 (due) | Payment due | System checks payment status | Follow up if not paid |
| Day 32 | Grace period notice | System flags invoice as approaching overdue | WhatsApp reminder if not paid |
| Day 37 | Grace period ends | System sets invoice status = OVERDUE; account flagged | Account suspended if not paid |
| Day 37+ | Suspension | Admin suspends account access | Notify dealer via WhatsApp |
| Day 67 (Day 30 + 30) | Re-activation offer | No system action | Manual win-back message |

For the first billing cycle (Month 1), "Day 25" refers to calendar Day 25 after activation. For subsequent months, invoices are sent on the 25th of each calendar month.

---

## 2. Renewal Probability Signals

These signals are evaluated before each renewal cycle to predict whether a dealer will renew.

### Positive renewal signals (increases probability)
- Health score 75+ in the prior 30 days
- Responded to 80%+ of leads
- Logged in 15+ times in the prior 30 days
- CRM stages actively used (3+ stages, leads moving)
- Previous invoice paid on time (no grace period needed)
- Expressed positive sentiment in check-in (qualitative — admin logged)

### Negative renewal signals (decreases probability)
- Health score below 50 in any of the last 7 days before invoice date
- Unresolved support ticket or complaint in the last 30 days
- Previous invoice paid late (after grace period)
- No login in the 7 days before invoice date
- Low lead response rate (<50%) in the prior 14 days
- Raised pricing concern or cancellation language in any channel

### Renewal probability tiers
| Signal profile | Probability | Admin action |
|----------------|-------------|--------------|
| 3+ positive signals, 0 negative | High (>85%) | Standard invoice flow |
| Mixed signals (1–2 negative) | Medium (50–84%) | Pre-renewal call + address negatives |
| 2+ negative signals | Low (<50%) | Emergency check-in before invoice |
| Any negative + health score <50 | Critical (<25%) | Save call before invoice |

---

## 3. DealerSuccessScore as Leading Indicator

The DealerSuccessScore (0–100, described in `ONBOARDING_OPERATIONS.md`) is the primary quantitative leading indicator for renewal likelihood.

### Historical correlation (to be validated at scale)

Expected correlation pattern:
- Score 80+: ~95% renewal rate
- Score 65–79: ~80% renewal rate
- Score 50–64: ~60% renewal rate
- Score 35–49: ~35% renewal rate
- Score <35: ~15% renewal rate

These are hypothesized values. Track actuals against renewals starting from Dealer #1 and update this document at each renewal event.

### The 14-day trailing window
The score used for renewal prediction is the **average score over the 14 days before the invoice generation date** — not the point-in-time score on Day 25. This reduces false positives from single-day anomalies (e.g., dealer was sick for 2 days).

```typescript
function getRenewalRiskScore(dealerId: string, invoiceDate: Date): number {
  const window = 14; // days
  const scores = getSuccessScoreHistory(dealerId, invoiceDate, window);
  return average(scores);
}
```

---

## 4. ChurnRisk Triggers That Signal At-Risk Renewals

The ChurnRisk module fires independent signals. When any of the following fire within 30 days of a renewal date, the renewal is flagged as at-risk in the admin panel:

| Trigger | Threshold | Risk signal |
|---------|-----------|-------------|
| No login | 7 consecutive days | Watch → At Risk |
| No lead response | 48h for any lead | At Risk immediate |
| No inventory update | 14 days | Watch |
| Missed invoice | Prior invoice paid late | At Risk |
| Complaint opened | Any support ticket | Watch |
| Explicit cancellation language | Admin notes this in CRM | Critical |

When a ChurnRisk signal fires AND the renewal is within 30 days, the system:
1. Creates an alert in the admin renewal queue
2. Elevates the dealer's status to "At Risk" or "Critical" regardless of success score
3. Suggests the intervention script from the Churn Prevention Playbook

---

## 5. Escalation Path When Renewal Is at Risk

```
Signal detected: ChurnRisk trigger or SuccessScore below threshold
        │
        ▼
Step 1: Admin review (within 24h)
        Check: What exactly triggered the risk signal?
        Check: What is the specific metric that declined?
        │
        ▼
Step 2: Proactive check-in call
        "Kumusta? Nakita namin na [specific signal]. Nandito ako para tulungan."
        Goal: Identify root cause
        │
        ├── Root cause is fixable (platform issue, process issue, temporary)
        │   → Fix it immediately
        │   → Follow up within 24h to confirm fixed
        │   → Proceed with standard renewal invoice
        │
        └── Root cause is deeper (value concern, budget, leaving)
            │
            ▼
        Step 3: Save call (see CHURN_PREVENTION_PLAYBOOK.md)
                Goal: Understand intent, offer pause if appropriate
                │
                ├── Dealer commits to stay → Proceed with invoice
                │
                └── Dealer uncertain → Offer 30-day extension, hold invoice
                    │
                    └── Dealer cancels → Win-back sequence (30/60/90 days)
```

---

## 6. Future: Automated Renewal Reminders

Planned automation (post-PayMongo integration):

**Day 25 trigger (automated):**
- System generates invoice record in database
- Sends payment link via email (PayMongo hosted invoice)
- Logs outreach in CRM

**Day 30 trigger (automated):**
- If invoice still unpaid: send automated reminder email
- Admin notified via dashboard alert

**Day 37 trigger (automated):**
- Invoice status auto-updates to OVERDUE
- Account flagged for suspension (admin confirms before action)
- Automated suspension notification email

**Dependencies:**
- PayMongo integration
- Automated email system (Resend or Postmark recommended)
- Cron job infrastructure (already available on Render.com)

---

## 7. Renewal Data to Track

Log this for every renewal event in the billing spreadsheet:

| Field | Description |
|-------|-------------|
| Dealer name | |
| Renewal month | |
| Invoice date | |
| Payment date | |
| Days to pay | Invoice date → payment date |
| Payment method | GCash / BDO / BPI |
| Renewal probability tier | High / Medium / Low / Critical at time of invoice |
| Success score on invoice date | 0–100 |
| Outcome | Renewed / Churned / Paused |
| Notes | Any concerns raised, interventions made |

This data is the foundation of a renewal prediction model when you reach 20+ dealers.

---

*Last updated: 2026-05-31 | AutoBentaPH Renewal Audit*
