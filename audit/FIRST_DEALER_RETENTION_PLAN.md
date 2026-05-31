# FIRST DEALER RETENTION PLAN
## AutoBentaPH | Dealer #1 First-Principles Retention Framework

**Version:** 1.0 | **Date:** 2026-05-31

---

## PURPOSE

This document defines the first-principles framework for retaining Dealer #1. It is not a playbook (see `DEALER_1_PLAYBOOK.md` for that) — it is the reasoning behind the playbook. It answers: why do these specific actions, at these specific times, in this specific order?

---

## THE 5-LEVEL SUCCESS HIERARCHY

Retention is not binary (active or churned). It is a sequence of levels, and a dealer can only move forward by completing each level fully.

```
Level 1: SIGNED        ──► dealer agreement executed, invoice issued
Level 2: PAID          ──► invoice paid, account activated
Level 3: USING         ──► dealer has logged in, published listings, received leads
Level 4: VALUE         ──► dealer has received a tangible result (responded to a lead, progressed a deal, or closed a sale)
Level 5: RENEWED       ──► dealer paid the renewal invoice willingly
```

**The most common retention failure:** operators assume a dealer at Level 3 is safe, and stop monitoring. A dealer who is "using" the platform but has never received a lead that progressed to a test drive has not reached Level 4. Without Level 4, renewal is a gamble, not a certainty.

### How to Measure Each Level

| Level | Measurement | Source |
|-------|------------|--------|
| Signed | Agreement on file + `agreement_signed_at` set | CRM |
| Paid | `invoice_paid_at` set + payment confirmed | Manual log + receipt |
| Using | `first_login_at` set + `first_listing_at` set + first lead received | TTV record + platform events |
| Value | At least one lead in CRM at stage "Test Drive" or beyond, OR documented sale | CRM pipeline |
| Renewed | `renewal_confirmed` = true + renewal invoice paid | Renewal Readiness record |

A dealer who has completed Levels 1–3 but is stuck at Level 4 is the highest-priority CS focus at any given time.

---

## THE SINGLE MOST IMPORTANT METRIC FOR EACH MONTH

These are not the only metrics that matter. They are the one metric per period that, if it's wrong, overrides everything else.

### Day 30: First Lead Received

If the dealer has not received a single lead by Day 30, something is fundamentally broken.

- Listing quality is insufficient (no photos, incomplete specs, wrong pricing)
- Listings are not published or are marked inactive
- Platform SEO or indexing issue
- Category/location mismatch

**Action if no lead by Day 30:** Stop everything else. Fix the listings. This is a P1 issue.

### Day 60: Lead Response Rate ≥80%

By Day 60, the dealer should have internalized the lead response workflow. A response rate below 80% at this stage means the dealer is not checking the platform regularly, is not receiving notifications, or has decided that the leads are not worth responding to.

A dealer who is not responding to leads is not receiving value. A dealer who is not receiving value does not renew.

**Action if response rate <80% at Day 60:** Run the root cause checklist: notification settings, lead quality perception, time constraints, CRM usability. Fix the specific issue.

### Day 90: Renewal Confirmed

The Day 90 metric is binary: the dealer has either confirmed renewal or they have not.

If the dealer has not confirmed by Day 85, the renewal is not on track. The 48-hour follow-up protocol in `DEALER_1_PLAYBOOK.md` must be executed immediately.

---

## LEADING VS. LAGGING INDICATORS

Understanding this distinction changes how you use the data.

### Leading Indicators (act on these early)
These are behavior signals that predict future outcomes. When they move in the wrong direction, intervene before the lagging indicator catches up.

| Leading Indicator | What It Predicts | Warning Threshold |
|------------------|-----------------|------------------|
| Login frequency (weekly) | Platform engagement; will decline before leads decline | <3 days/week for 2 consecutive weeks |
| CRM stage updates | Active pipeline management; predicts closed deals | 0 updates for 2 consecutive weeks |
| CS task completion rate | Relationship depth; predicts trust at renewal | Any missed task |
| Time-to-Value progression | Path to value; predicts whether dealer reaches Level 4 | Any milestone stalled >14 days |

### Lagging Indicators (measure outcomes)
These confirm what has already happened. Use them to demonstrate value, not to detect risk.

| Lagging Indicator | What It Confirms | Use It For |
|------------------|-----------------|-----------|
| Total leads received | Platform is generating demand | ROI calculation, case study |
| Estimated revenue impact | Platform value in ₱ terms | Value conversation at reviews |
| Documented sales | Platform → revenue connection | Renewal close, case study headline |
| Health score (current) | Composite of past behavior | Tier classification, CS task prioritization |

**Common mistake:** operators monitor lagging indicators (lead count, health score) and take action only when they drop. By the time a lagging indicator shows a problem, the dealer has already been disengaged for weeks. Monitor leading indicators for early intervention.

---

## THE 3 MOST COMMON REASONS FIRST SAAS CUSTOMERS CHURN

These are not hypothetical. They are documented across B2B SaaS and specifically observable in AutoBentaPH's customer context.

### Reason 1: They Never Saw Value

The dealer signed up, set up their account, and received a few leads — but no lead ever progressed to a meaningful outcome. Without a tangible result, the subscription feels like an expense, not an investment.

**How AutoBentaPH addresses this:**
- Time-to-Value tracking monitors all 8 milestones. A stalled TTV triggers a CS intervention.
- The CS operator is responsible for helping the dealer get to Level 4 (First Qualified Lead) by Day 14, not just "getting them set up."
- The Day 30 review explicitly frames the ROI calculation in Philippine peso terms — making value visible even before a sale is closed.

### Reason 2: They Forgot Why They Signed

After the onboarding excitement fades, many dealers drift back to their existing habits (Facebook posts, referrals, walk-ins). The platform becomes one of many things competing for their attention — and they gradually stop checking it.

**How AutoBentaPH addresses this:**
- The 7-touchpoint CS task schedule maintains consistent contact through the first 90 days.
- The "No Activity Protocol" kicks in after Day 1 of silence — ensuring no dealer goes quiet for more than 3 days without a direct outreach.
- The WhatsApp-first communication model matches Filipino dealer behavior patterns. A WhatsApp message from the CS operator is harder to ignore than an email from a system.

### Reason 3: They Found It Too Complex

The platform has more features than the dealer needs in the first 30 days. If the onboarding presents too much at once, the dealer becomes overwhelmed and withdraws to the features they understand (or stops using it altogether).

**How AutoBentaPH addresses this:**
- Onboarding is designed around a 3-step first week: publish listings → check leads → respond from WhatsApp. Nothing else in Week 1.
- Advanced features (CRM automation rules, analytics, bulk updates, Featured Listings) are introduced at Day 60 or later — only after the dealer has a working habit.
- The Day 14 check-in specifically targets friction ("May naguluhan ka ba?") before it hardens into avoidance.

---

## THE DEALER #1 → DEALER #50 FLYWHEEL

Dealer #1 is not just a customer. They are the first link in the acquisition chain.

```
Dealer #1 retention
        │
        ▼
Tangible results (leads → sales)
        │
        ▼
Documented case study + testimonial
        │
        ▼
Social proof for Dealer #2–5 conversations
        │
        ▼
Faster close rate on Dealer #2–5 (shorter objection cycle)
        │
        ▼
Dealer #1 referral (Filipino business culture: trust networks)
        │
        ▼
Dealer #3–10 acquired through warm introduction
        │
        ▼
Case studies from Dealers #2–5 create next-tier social proof
        │
        ▼
Dealer #50 closes faster than Dealer #2 did
```

At each stage, the compounding effect grows because trust and proof accumulate.

**The break in the flywheel:** If Dealer #1 churns, this chain breaks entirely. There is no case study. Cold outreach to Dealer #2 starts from zero. Objection cycles are longer. Close rates are lower.

This is why Dealer #1 retention is not a customer success task — it is a business strategy.

### Referral Mechanics

Filipino business culture is strongly relationship-driven. A recommendation from a trusted dealer carries more weight than any marketing material. At the 90-day renewal, ask explicitly:

> "May kilala ka bang ibang dealer na maganda ang maging fit sa AutoBentaPH? Hindi pressure — kung may naiisip ka, gusto naming ma-introduce mo kami."

A warm introduction from Dealer #1 to Dealer #2 cuts the sales cycle by an estimated 40–60%.

---

## WHAT "SUCCESS" MEANS BEYOND DEALER #1

Dealer #1 is the proof point. But the platform's purpose is broader.

**For the platform:**
- 5 Founding Dealers = ₱17,995 MRR = product-market fit demonstrated
- 50 active dealers = marketplace liquidity threshold (enough supply for buyers to return regularly)
- 200 dealers = the point at which the marketplace network effect begins compounding

**For Philippine used-car dealers:**
- AutoBentaPH's success means a dealer in any city can compete with the largest used-car Facebook pages because their inventory is searchable, their CRM is organized, and their lead response is professional.
- The platform succeeds when a dealer's first month on AutoBentaPH outperforms their last 6 months on Facebook Marketplace — not in volume, but in lead quality and conversion.

**For Dealer #1 specifically:**
- Success is not just a renewal. It is a dealer who, 12 months in, considers AutoBentaPH an indispensable part of their business — not a subscription they're considering canceling.
- That outcome requires consistent value delivery, consistent communication, and a relationship, not just a product.

---

*This document provides the reasoning framework. For day-to-day execution, see `DEALER_1_PLAYBOOK.md`.*
*For the renewal operations process, see `RENEWAL_PREP.md` and `RENEWAL_READINESS_FRAMEWORK.md`.*
