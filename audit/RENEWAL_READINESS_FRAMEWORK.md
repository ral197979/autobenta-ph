# RENEWAL READINESS FRAMEWORK
## AutoBentaPH | Operational Reference

**Version:** 1.0 | **Date:** 2026-05-31

---

## PURPOSE

This document defines the renewal operations framework for AutoBentaPH Founding Dealers. It covers how the renewal readiness score is calculated, what the thresholds mean, what the renewal timeline looks like, and what data signals predict renewal outcomes.

---

## THE 6-FACTOR READINESS SCORE

The Renewal Readiness Score is a 0–100 composite. It is the single number that tells the operator whether a dealer is on track to renew, needs attention, or requires intervention.

### Scoring Table

| Factor | Max Points | Trigger Condition |
|--------|-----------|------------------|
| **Health Review Completed** | 20 | A formal CS review (Day 30, 60, or 90) was completed and logged within the last 30 days |
| **Usage Review Completed** | 15 | The most recent AdoptionSnapshot shows a flat or positive trend; no low-adoption flag |
| **ROI Review Completed** | 20 | The operator has presented the estimated revenue impact calculation to the dealer on a review call |
| **Expansion Opportunity Identified** | 15 | A product add-on (Featured Listings, ₱999/mo) has been introduced and dealer response logged |
| **Proposal Sent** | 15 | A formal renewal proposal document has been sent to the dealer |
| **Renewal Confirmed** | 15 | Dealer has verbally confirmed intent to renew (logged in CRM) |

**Maximum score: 100**
**Score is recomputed on every update to the RenewalReadiness record.**

### Score Thresholds

| Score | Status | Operator Action |
|-------|--------|----------------|
| **≥80** | On track | Continue the renewal timeline. No immediate intervention required. |
| **60–79** | Needs attention | Identify which factor(s) are incomplete. Complete them within 7 days. |
| **<60** | Intervention required | Escalate immediately. Run the intervention checklist in `RENEWAL_PREP.md`. |

### Score Interpretation Notes

- A score of 0 is normal at Day 1. The score accumulates as the dealer progresses.
- A score of 65 at Day 45 before renewal (Day 45 of subscription) is a warning signal, not a crisis.
- A score of 65 at Day 15 before renewal is a crisis. Intervention is required.
- The "Confirmed" factor (15 points) can only be awarded after the renewal conversation. It is not a leading indicator — it is the final confirmation.

---

## RENEWAL TIMELINE: 60-DAY COUNTDOWN

| Day Before Renewal | Action | Readiness Factors Targeted |
|--------------------|--------|---------------------------|
| **Day 60** | Health review + checklist | Health Review Completed |
| **Day 45** | Usage review + expansion introduction | Usage Review Completed + Expansion Opportunity |
| **Day 30** | ROI review meeting (Day 60 subscription review) | ROI Review Completed |
| **Day 15** | Confirmation call | Proposal Sent |
| **Day 7** | Final check-in, address remaining concerns | — |
| **Day 0** | Send invoice + confirm renewal | Renewal Confirmed |

**SLA requirement:** The renewal conversation must begin no later than Day 60 before the renewal date. Starting at Day 30 leaves insufficient time to recover a hesitant dealer. Starting at Day 60 gives two full months to resolve concerns and close the renewal confidently.

---

## DATA SIGNALS THAT PREDICT RENEWAL

Based on patterns in B2B SaaS and applied to AutoBentaPH's specific context, the following signals are the strongest predictors of renewal or churn.

### Leading Indicators (predict what will happen)

| Signal | Positive Direction | Warning Direction |
|--------|-------------------|------------------|
| Login frequency (last 4 weeks) | Stable or increasing | Declining week-over-week |
| CRM stage updates | At least 1/week | Zero for 2+ consecutive weeks |
| CS task completion rate | All 7 tasks completed on time | 2+ tasks missed or significantly delayed |
| Lead response rate | ≥80% | <50% for 2+ consecutive weeks |
| Time-to-Value progression | All 8 milestones completed | Stalled on any milestone for >14 days |

### Lagging Indicators (confirm what happened)

| Signal | Positive Outcome | Negative Outcome |
|--------|-----------------|-----------------|
| Total leads received (90 days) | ≥15 | <5 |
| Estimated revenue impact | ≥₱75,000 | <₱25,000 |
| Documented sales from ABP leads | ≥1 | 0 |
| Health score at Day 60 | ≥75 | <50 |
| Renewal readiness score at Day 15 | ≥80 | <60 |

### The Single Most Predictive Signal

Among all signals, **lead response rate over the second month** is the strongest predictor of renewal. A dealer who is actively responding to leads at Month 2 has internalized the workflow and is seeing value. A dealer whose response rate drops from Month 1 to Month 2 is disengaging, regardless of other metrics.

If lead response rate drops by more than 20 percentage points between Month 1 and Month 2, treat it as a renewal risk signal — even if the health score is still in the Healthy tier.

---

## WHAT A RENEWING DEALER LOOKS LIKE (vs. A CHURNING DEALER)

### Renewing Dealer — Behavioral Pattern
- Logs in 4–7 days per week
- Responds to leads within 2–4 hours (same day at minimum)
- Updates CRM stages regularly (moves leads through the pipeline)
- Asks questions about features ("Paano ko magagamit ito para...")
- References leads or conversations with buyers on check-in calls
- Initiates contact with the CS operator occasionally (not just responding)
- Has at least 1 documented sale or near-sale traceable to an ABP lead by Day 60

### Churning Dealer — Behavioral Pattern
- Login frequency drops after Month 1 (the "novelty curve")
- Leads go unanswered for 24–48+ hours
- CRM stages never updated past "New"
- Answers check-in questions with "ok naman" but provides no specific examples
- Has not linked any lead to a tangible result by Day 60
- Stops initiating contact; becomes purely reactive
- Raises the cost question unprompted in Month 2 or 3

The gap between these two profiles almost always traces back to one failure: the dealer never completed the Time-to-Value sequence. Specifically, they never received a lead that they responded to, which means they never experienced the core value of the product.

If TTV is stalled at "First Lead" or "First Response," the renewal is at risk regardless of what the health score shows.

---

## SLA: RENEWAL CONVERSATION START DATE

**Rule:** The renewal conversation must begin no later than Day 60 before the renewal date.

**Enforcement:** The Renewal Readiness record should have `health_review_completed = true` no later than Day 60 before renewal. If it does not, the CS operator is behind schedule.

**Rationale:** A dealer who is first asked about renewal at Day 7 before the date has no time to process, ask questions, or address concerns. Starting at Day 60 allows for:
- Two full check-in cycles (Day 60 + Day 30 before renewal)
- One mid-cycle concern resolution (Day 45)
- A clean confirmation window (Day 15)
- A zero-friction invoice day (Day 0)

Dealers who are surprised by a renewal invoice churn at a materially higher rate than dealers who have been prepared for it over 60 days.

---

*For the operational checklist that implements this framework, see `RENEWAL_PREP.md`.*
*For the scoring model implementation, see `CUSTOMER_SUCCESS_SYSTEM_V2.md`.*
