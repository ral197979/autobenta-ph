# Dealer Retention Strategy

**Document:** DEALER_RETENTION_STRATEGY
**Version:** 1.0
**Date:** 2026-05-31
**Status:** Production

---

## Retention Hypothesis

Dealers who use the CRM daily have 3× lower churn than dealers who only post listings. A passive listing publisher has no behavioral lock-in — they can move to a competitor the day a cheaper platform appears. A dealer who manages their pipeline in AutoBentaPH, logs every call, tracks every lead, and relies on automation rules to run their follow-up has switching costs that a price cut cannot easily overcome.

Every retention lever in this document is designed to increase the CRM usage rate among paid dealers.

---

## Daily Active Dealer Metrics

A dealer is considered "daily active" on a given day if at least one of the following is true:

| Signal                        | DealerActivity type(s) that satisfy it           |
|-------------------------------|--------------------------------------------------|
| Logged in                     | Session record (non-activity; tracked separately) |
| Lead status updated           | `lead_updated`                                   |
| Reminder marked complete      | `DealerReminder.isDone` set to true              |
| Note added to a lead          | `note_added`                                     |
| Message sent (SMS/email/call) | `sms_sent`, `email_sent`, `call_made`            |

All five signals are derivable from `DealerActivity` records. No separate analytics event stream is required for this metric.

**DAU calculation:**

```sql
SELECT COUNT(DISTINCT dealerId)
FROM DealerActivity
WHERE createdAt >= DATE_TRUNC('day', NOW())
  AND type IN ('lead_updated', 'note_added', 'sms_sent', 'email_sent', 'call_made')
```

Combined with session login data, this gives a complete DAU picture.

---

## Churn Risk Model

Risk tiers are computed by a daily job that evaluates each paid dealer against the following signals:

| Signal                                               | Risk level  |
|------------------------------------------------------|-------------|
| No login in 7 days                                   | Medium      |
| No login in 14 days AND no lead updates in 14 days   | High        |
| Plan expiry within 7 days AND no renewal payment     | Critical    |
| D-rank for 2+ consecutive weeks                      | High        |
| No activity on any lead within 48h of creation       | Medium      |

### Recommended actions per risk level

| Risk level | Action                                                                   |
|------------|--------------------------------------------------------------------------|
| Medium     | In-app notification: "You haven't logged in recently. 3 leads are waiting." |
| High       | Email + in-app: feature highlight, link to CRM onboarding, check-in offer |
| Critical   | Email sequence begins (see Churn Recovery section); account manager alert if enterprise |

Risk levels are stored on `Dealer.churnRiskLevel` (enum: low/medium/high/critical), updated daily by the risk computation job.

---

## Pipeline Adoption

**Target:** 80% of active leads have at least one logged `DealerActivity` within 48 hours of lead creation.

**Current metric query:**

```sql
SELECT
  COUNT(CASE WHEN a.leadId IS NOT NULL THEN 1 END) * 100.0 / COUNT(l.id) AS adoptionPct
FROM Lead l
LEFT JOIN DealerActivity a
  ON a.leadId = l.id
  AND a.createdAt <= l.createdAt + INTERVAL '48 hours'
WHERE l.createdAt >= NOW() - INTERVAL '30 days'
  AND l.status NOT IN ('closed_won', 'closed_lost')
```

A dealer below 50% pipeline adoption is flagged in the admin dashboard and added to the medium-risk churn cohort regardless of other signals.

---

## CRM Adoption Funnel

Five milestones mark a dealer's progression from lead recipient to active CRM user. Each step is measured as the percentage of dealers who have reached it.

```
Step 1: Lead created (inquiry received)
         ↓
Step 2: First note added to any lead
         ↓
Step 3: First manual activity logged (call_made, meeting_held, test_drive_completed)
         ↓
Step 4: Follow-up set (nextFollowUpAt populated OR DealerReminder created)
         ↓
Step 5: Status updated beyond 'new' on at least one lead
```

Dealers who complete step 5 within the first 7 days of receiving their first lead have measurably higher 60-day retention. This funnel is reported weekly in the admin dashboard under "CRM Adoption."

Dealers stuck at step 1 or 2 after 72 hours receive a targeted in-app tip: "Your first lead is waiting. Here's how to log a call."

---

## Response Time Metric

`avgResponseTimeMs` is stored on `DealerMetrics` and represents the median time from `Lead.createdAt` to the first `DealerActivity` record associated with that lead.

```
avgResponseTimeMs = MEDIAN(firstActivity.createdAt - lead.createdAt)
  for all leads in the trailing 30 days
  where firstActivity is the earliest DealerActivity with leadId = lead.id
```

This feeds the dealer score. Response time targets by rank:

| Rank | Target response time |
|------|----------------------|
| A    | < 1 hour             |
| B    | < 4 hours            |
| C    | < 24 hours           |
| D    | > 24 hours or no response |

A dealer whose median response time crosses into a higher tier gets an immediate rank improvement notification. This gamification creates a tangible reward for faster responses.

---

## Lifecycle Milestones

Three timestamps on the `Dealer` model anchor lifecycle analysis:

| Field            | Set when                                  |
|------------------|-------------------------------------------|
| `firstListingAt` | First `VehicleListing` created            |
| `firstLeadAt`    | First `Lead` record created for dealer    |
| `firstSaleAt`    | First `Lead.status` = `closed_won`        |

**Time-to-first-lead** (firstLeadAt − firstListingAt): measures how quickly new dealers receive buyer interest. Dealers who wait more than 7 days for their first lead are contacted proactively — often the issue is listing quality or missing photos.

**Time-to-first-sale** (firstSaleAt − firstLeadAt): measures pipeline efficiency. Dealers with short time-to-first-sale are used as benchmark cohorts in the monthly performance digest.

---

## Retention Levers

### 1. Score gamification

The dealer rank badge (A/B/C/D) is displayed prominently on the dealer dashboard. The badge is accompanied by a progress indicator showing the dealer's score and the gap to the next rank.

```
"Your dealer score: 72 / 100  (Rank B)
 You're 8 points from Rank A.
 Fastest path: respond to leads within 1 hour."
```

The score formula and improvement tips are always visible. Dealers know exactly what to do next.

### 2. Featured listing revenue sharing

Pro and Enterprise dealers whose listings generate high buyer engagement (measured by inquiry-to-listing-view ratio) receive priority placement consideration when featured slots are being allocated. This is not a guaranteed benefit but is presented as a reason to maintain listing quality and CRM engagement.

### 3. Onboarding completion

Onboarding consists of 4 steps. Dealers who complete all 4 have measurably higher 30-day retention than those who complete 0–2:

| Step | Action                              |
|------|-------------------------------------|
| 1    | Add first vehicle listing           |
| 2    | Complete dealer profile (logo, description, contact) |
| 3    | Respond to first lead               |
| 4    | Set a follow-up reminder            |

Incomplete onboarding steps surface as a persistent checklist on the dashboard until all 4 are done.

### 4. Missed follow-up alerts

Dealers with leads that have had no activity in 72 hours receive a push notification and in-app banner:

```
"You have 3 leads with no contact in 72h. Act now before they go cold."
```

The banner links directly to a filtered lead view showing only the overdue leads. One tap to the Kanban board. Zero navigation friction.

### 5. Monthly performance digest

On the 1st of each month, each paid dealer receives an email containing:

- Their current rank and score
- Total leads received vs. leads responded to
- Win rate (closed_won / total leads × 100)
- Win rate vs. platform average (anonymized)
- Listings with highest inquiry volume
- One recommended action for the coming month

The digest is generated from `DealerActivity` aggregates and does not require a separate analytics pipeline.

---

## Retention Reporting Cadence

| Metric                        | Cadence  | Audience        |
|-------------------------------|----------|-----------------|
| Daily active dealer count     | Daily    | Admin dashboard |
| CRM adoption % (pipeline)     | Weekly   | Admin dashboard |
| Churn risk tier breakdown     | Weekly   | Admin + dealer success team |
| Monthly churn rate            | Monthly  | Executive report |
| 60-day retention cohort       | Monthly  | Executive report |

**Monthly churn rate:**

```
churnRate = COUNT(dealers who cancelled or downgraded to free this month)
            / COUNT(paid dealers at start of month)
            × 100
```

---

## Churn Recovery

When a dealer enters the high-risk churn tier (no login 14d + no lead updates), a 3-email sequence begins automatically:

| Day | Email subject                                  | Content                                              |
|-----|------------------------------------------------|------------------------------------------------------|
| 0   | "We noticed you've been away"                  | Check-in; link to open leads; one-click login        |
| 7   | "Here's what's new on AutoBentaPH"             | Feature highlight (automation rules, new analytics)  |
| 14  | "We'd like to keep you — here's an offer"      | One-time 20% discount on next month's subscription   |

The discount offer (day 14 email) generates a single-use promo code recorded against the dealer's account. Redemption is tracked to measure recovery email ROI.

No email is sent if the dealer logs in and exits the risk tier before the scheduled send date — the sequence cancels automatically.

---

## Success Criteria

| Metric                                    | Target                          |
|-------------------------------------------|---------------------------------|
| 60-day retention rate (paid dealers)      | > 70%                           |
| Monthly churn rate (paid dealers)         | < 5%                            |
| CRM pipeline adoption (leads with activity within 48h) | > 80%          |
| Avg response time (A-rank target)         | < 1 hour                        |
| Onboarding completion rate (4/4 steps)    | > 60% of new paid dealers       |
| Recovery email conversion (day 14 offer)  | > 15% redemption                |
