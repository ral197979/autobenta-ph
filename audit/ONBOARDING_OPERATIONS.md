# Onboarding Operations Audit
## AutoBentaPH — Dealer Onboarding System Documentation

**Document type:** Audit / System Documentation
**Scope:** Onboarding milestones, OnboardingCenter admin page, success scoring, health status calculation

---

## 1. The 9 Onboarding Milestones

Each dealer progresses through 9 milestones. Milestones are tracked per dealer and displayed in the OnboardingCenter.

| # | Milestone | Trigger | Day Target |
|---|-----------|---------|------------|
| 1 | Account Activated | Admin sets account status = Active | Day 7 |
| 2 | First Login | Dealer logs in for the first time | Day 8 |
| 3 | Profile Complete | All required profile fields filled | Day 8 |
| 4 | First Listing Published | First listing goes live | Day 10 |
| 5 | 10 Listings Published | Dealer reaches 10 active listings | Day 14 |
| 6 | First Lead Received | First inquiry comes in to the dealer | Day 14 |
| 7 | First Lead Response | Dealer responds to any lead | Day 14 |
| 8 | CRM First Stage Move | Any lead moves from New to another stage | Day 21 |
| 9 | 30-Day Review Complete | Admin marks review as done in OnboardingCenter | Day 30 |

### How milestones are tracked
- Milestones 1–8 are **automatically set** via database triggers or event listeners
- Milestone 9 is **manually set** by the admin after completing the success review
- Each milestone stores: `completedAt` (timestamp) and `completedBy` (for manual milestones)
- Milestone completion is **never reversed** — if it fires, it stays

### Database model: `DealerOnboardingProgress`

```typescript
interface DealerOnboardingProgress {
  id: string;
  dealerId: string;
  milestone: MilestoneEnum;      // ACCOUNT_ACTIVATED | FIRST_LOGIN | ... | REVIEW_COMPLETE
  completedAt: Date | null;
  completedBy: string | null;    // system | admin user ID
  notes: string | null;
}
```

One row per milestone per dealer. Created as `null` on account activation; updated when the milestone event fires.

---

## 2. The OnboardingCenter Admin Page

**Route:** `/admin/onboarding`

### What it shows
- List of all dealers in onboarding (activated but not yet past Day 30)
- For each dealer:
  - Name, activation date, days since activation
  - Milestone checklist (green = complete, grey = pending)
  - Current success score (0–100)
  - Health status badge (Healthy / Watch / At Risk / Critical)
  - Link to dealer detail view
  - Quick actions: "Send Check-in", "Schedule Call", "Mark Review Complete"

### What it does not show
- Dealers who have completed all 9 milestones AND passed Day 30 (they move to the main dealer CRM view)
- Churned/cancelled dealers

### Alerts displayed
- Yellow: Any dealer at Day 7+ with fewer than 3 listings
- Orange: Any dealer at Day 14+ with 0 leads received
- Red: Any dealer at Day 7+ with 0 logins since activation

---

## 3. Success Score Calculation

The success score (0–100) is a composite health metric for each active dealer. It is calculated in real time and cached, refreshed every 24 hours.

### Score components

```typescript
function calculateSuccessScore(dealerId: string): number {
  const loginFrequency   = scoreLoginFrequency(dealerId);    // 0-25
  const listingsAdded    = scoreListings(dealerId);           // 0-20
  const leadResponseRate = scoreLeadResponse(dealerId);       // 0-25
  const crmUsageScore    = scoreCRMUsage(dealerId);           // 0-20
  const inventoryQuality = scoreInventoryQuality(dealerId);   // 0-10

  return loginFrequency + listingsAdded + leadResponseRate + crmUsageScore + inventoryQuality;
}
```

### Component scoring logic

**loginFrequency (max 25 points)**
- 7+ logins in last 7 days: 25
- 4–6 logins in last 7 days: 20
- 2–3 logins in last 7 days: 12
- 1 login in last 7 days: 6
- 0 logins in last 7 days: 0

**listingsAdded (max 20 points)**
- 15+ active listings: 20
- 10–14 active listings: 16
- 5–9 active listings: 10
- 1–4 active listings: 5
- 0 active listings: 0

**leadResponseRate (max 25 points)**
Calculated over the last 30 days.
- 90%+ response within 4h: 25
- 75–89% response within 4h: 20
- 50–74% response: 12
- 25–49% response: 6
- <25% response: 0

**crmUsageScore (max 20 points)**
- 4+ CRM stages used AND leads moving between stages: 20
- 2–3 stages used: 14
- Leads created but none moved from New: 7
- No CRM activity: 0

**inventoryQuality (max 10 points)**
- All listings have 8+ photos AND description >100 chars: 10
- Most listings (>70%) meet quality bar: 7
- Some listings (<70%) meet quality bar: 3
- No listings or all low quality: 0

---

## 4. Health Status Thresholds

Based on the success score:

| Score Range | Health Status | Color | Admin Action Required |
|-------------|--------------|-------|----------------------|
| 75–100 | Healthy | Green | Standard monthly check-in |
| 50–74 | Watch | Yellow | Proactive check-in within 48h |
| 25–49 | At Risk | Orange | Personal call within 24h |
| 0–24 | Critical | Red | Emergency save call today |

Health status is displayed:
- In the OnboardingCenter list view
- In the individual dealer admin view
- In the weekly digest email (if enabled)

---

## 5. Day 0–30 Onboarding Timeline

| Day | Event | System action | Admin action |
|-----|-------|--------------|--------------|
| 0 | Account activated | Create dealer record; initialize milestone rows; start onboarding clock | Run welcome call |
| 1 | First login | Auto-complete Milestone 2 | Verify in OnboardingCenter |
| 1 | Profile complete | Auto-complete Milestone 3 (on all required fields filled event) | |
| 3 | 72h check | No system action | WhatsApp check-in |
| 7 | Day 7 alert | System flags if <3 listings (Yellow alert in admin) | Review alert; WhatsApp if triggered |
| 10 | First listing | Auto-complete Milestone 4 on first publish event | Send celebration message |
| 14 | Day 14 alert | System flags if 0 leads (Orange alert in admin) | Lead review call; diagnose if 0 leads |
| 14 | 10 listings | Auto-complete Milestone 5 | |
| 14 | First lead | Auto-complete Milestone 6 on lead creation | Notify dealer |
| 14 | First response | Auto-complete Milestone 7 on CRM activity | |
| 21 | 3-week check | No system action | Quick WhatsApp or call |
| 21 | CRM move | Auto-complete Milestone 8 on stage change | |
| 25 | Renewal invoice | Admin manually generates | Generate and send invoice |
| 30 | Success review | No auto action | Run review; manually mark Milestone 9 |

---

## 6. Integration Points

### DealerSuccessScore
The `calculateSuccessScore()` function in the onboarding module is the same function used by:
- The ChurnRisk module (to determine intervention level)
- The Renewal module (to predict renewal probability)
- The Admin dashboard (health overview)

The score is a shared metric — changes to the scoring weights affect all three systems. Any weight changes must be documented here and in the dependent system docs.

### ChurnRisk
The ChurnRisk module subscribes to the following events and may update the dealer's risk level independent of the success score:
- `lead.received_and_no_response` (48h timer)
- `dealer.no_login` (7-day timer)
- `invoice.overdue` (payment missed)
- `inventory.not_updated` (14-day timer)

ChurnRisk can elevate a dealer to "Critical" even if the success score is 60 — payment issues are treated as a direct churn signal regardless of other activity.

---

*Last updated: 2026-05-31 | AutoBentaPH Onboarding Audit*
