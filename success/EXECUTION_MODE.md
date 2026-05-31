# AutoBentaPH — Dealer #1 Execution Mode

**Status:** Engineering complete. Customer success execution active.  
**Objective:** Renew Dealer #1.  
**Everything else is secondary.**

---

## Mode Rules

- Do not build new features unless they directly improve adoption, retention, expansion revenue, or renewal probability.
- Every hour spent building is an hour not spent with the dealer.
- The next meaningful milestone is `git commit -m "Dealer #1 renewed"`.

---

## AutoBentaPH Activation Metrics
*(Mapped from generic SaaS framework to AutoBentaPH-specific milestones)*

| Generic Metric | AutoBentaPH Equivalent | Target |
|---|---|---|
| Time to first work order | Time to first listing published | ≤ Day 3 |
| Time to first estimate | Time to first lead received | ≤ Day 7 |
| Time to first invoice | Time to first lead responded | ≤ Day 7 |
| Time to first payment | Time to first CRM stage movement | ≤ Day 14 |

Track these in `/admin/dealer-success` → TTV drawer. Update manually after each dealer interaction.

---

## Weekly Adoption Metrics

Check every Monday. Takes 10 minutes. Use `/admin/dealer-success`.

| Metric | Healthy Target | At Risk Threshold |
|---|---|---|
| Logins this week | ≥ 3 | 0 |
| Listings added this month | ≥ 5 | 0 |
| Leads updated (CRM) | ≥ 80% of new leads | < 50% |
| CRM stage movements | ≥ 1 per week | 0 for 14 days |
| Analytics page views | ≥ 1 per week | 0 for 14 days |

Log each week's numbers in `/admin/adoption/snapshot/:dealerId`.

---

## Business Value Metrics

Review monthly. Use `/admin/value-proof/:dealerId`.

| Metric | How to Measure |
|---|---|
| Revenue pipeline created | Leads × assumed close rate × avg margin |
| Leads generated | Total leads received via platform |
| Response rate improvement | Compare current vs. pre-platform baseline (capture at Day 0) |
| Admin time saved | Leads managed × 30 min per lead |
| Process improvements | Documented in success review notes |

---

## Weekly Founder Rhythm (30 Minutes Every Monday)

**Step 1 — Dashboard check (5 min)**  
Open `/admin/dealer-success`. Look at health score, risk flags, overdue CS tasks.

**Step 2 — Adoption snapshot (5 min)**  
Log this week's usage numbers via `POST /admin/adoption/snapshot/:dealerId`.

**Step 3 — CS task check (5 min)**  
Open `/admin/cs-tasks/overdue`. Complete or reschedule any overdue tasks.

**Step 4 — Risk scan (5 min)**  
Run `POST /admin/churn-risk/scan`. Review any new open risks. Take action on Critical.

**Step 5 — Log the week (10 min)**  
Write 3 lines in your dealer notes: what happened, what's next, any blockers.

---

## AT RISK Flags — Automatic Triggers

The system flags AT RISK when any of these are true:

| Trigger | Threshold | Action |
|---|---|---|
| No login | 7 days | WhatsApp check-in (see DEALER_1_PLAYBOOK.md §6) |
| No listing update | 14 days | Training offer — offer inventory import help |
| No lead response | 48 hours | Urgent WhatsApp — leads are going cold |
| No CRM activity | 14 days | Schedule CRM refresher call |
| Open complaint unresolved | 7 days | Escalate — founder to resolve personally |
| Renewal readiness score | < 70 | Trigger intervention protocol (see RENEWAL_PREP.md) |

Run `/admin/churn-risk/scan` manually each Monday. Respond to any Critical risk within 24 hours.

---

## Customer Success Schedule

Execute from `success/DEALER_1_PLAYBOOK.md`. No skipping.

| Day | Task | Duration | Tool |
|---|---|---|---|
| Day 1 | Welcome check-in call | 30 min | `/admin/cs-tasks/:dealerId` |
| Day 3 | CRM training walkthrough | 45 min | Screen share |
| Day 7 | Week 1 review call | 30 min | `success/DAY_30_REVIEW.md` (week 1 section) |
| Day 14 | Listing optimization review | 30 min | `/admin/dealer-success` |
| Day 30 | Month 1 success review | 30 min | `success/DAY_30_REVIEW.md` |
| Day 60 | Month 2 deep review + expansion | 30 min | `success/DAY_60_REVIEW.md` |
| Day 90 | Renewal meeting | 45 min | `success/DAY_90_REVIEW.md` |

Document every interaction. Minimum log entry: date, duration, what was discussed, next action, dealer sentiment (positive / neutral / concerned).

---

## Renewal Timeline

### Before Day 60
- [ ] Demonstrate measurable ROI (pull from `/admin/value-proof/:dealerId`)
- [ ] Complete value proof report (use `success/CASE_STUDY_TEMPLATE.md` baseline)
- [ ] Capture at least one dealer quote (for case study)
- [ ] Identify the decision maker (is it the dealer themselves or a business partner?)
- [ ] Resolve all open objections (log in your notes)

### Before Day 75
- [ ] Present renewal proposal (see `success/RENEWAL_PREP.md` one-page format)
- [ ] Confirm who approves the payment (GCash holder, business partner, etc.)
- [ ] Get verbal yes or surface final objection

### Before Day 90
- [ ] Secure renewal (signed + invoice sent)  
  **OR**
- [ ] Produce churn postmortem (what failed, what to fix, what to build next)

---

## Renewal Readiness Score Targets

Track in `/admin/renewal-readiness/:dealerId`.

| Factor | Done? | Points |
|---|---|---|
| Health review completed | | +20 |
| Usage review completed | | +20 |
| ROI review completed | | +20 |
| Expansion opportunity identified | | +15 |
| Renewal proposal sent | | +15 |
| Renewal confirmed | | +10 |

**Target: ≥ 80 by Day 75.**  
If below 60 at Day 60: trigger intervention. Read `success/RENEWAL_PREP.md` → "If renewal is at risk."

---

## Intervention Protocol

When health score drops below 50 OR a risk flag is triggered:

1. **Within 24 hours:** Personal WhatsApp message (not templated — write it fresh based on what you know about this dealer)
2. **If no response in 48 hours:** Phone call
3. **If still no response in 72 hours:** Visit in person if Metro Manila
4. **Document everything:** What triggered it, what you did, dealer response, resolution

Do not wait. Do not send a generic message. Do not assume it will resolve itself.

---

## What Success Looks Like

**Day 30:** Dealer has at least one listing live, has received at least one lead, has responded to that lead in the CRM.

**Day 60:** Dealer logs in at least 3× per week, has moved at least one lead through the pipeline, can describe the platform's value in their own words.

**Day 90:** Dealer renews without hesitation. Dealer is willing to give a testimonial. Dealer mentions the platform to another dealer without being asked.

That last sentence is the real success condition.

---

*Last updated: 2026-05-31*  
*Mode: Customer Success Execution — no new features without explicit adoption/retention justification*
