# First Customer Success Plan
*Prepare this BEFORE the dealer signs. Execute it the same day they pay. Churn prevention starts before the contract.*

---

## Pre-Signing Commitments
Tell the dealer these things before they confirm:

- Account active within 1 hour of payment confirmation
- We assist with inventory import — free, takes ~30 minutes together
- 1-hour CRM training call on Day 1 or Day 2 (your choice of time)
- Weekly check-in for first 4 weeks (30 min each, I come to you)
- Direct WhatsApp line for support — Founding Dealer SLA: 4-hour response
- 14-day money-back guarantee: if you're not receiving leads, full refund

---

## Day 0 — Same Day as Payment

- [ ] Create dealer account in `/admin`
- [ ] Set user role to `dealer` in database
- [ ] Assign Founding Dealer plan (or Pro/Verified per agreement)
- [ ] Create `DealerSuccessPlan` record in `/admin/success-plans`
- [ ] Send credentials via WhatsApp (not just email — WhatsApp gets opened)
- [ ] Send welcome message (use `TRIAL_ACTIVATION.md` template — "Credentials delivery" version)
- [ ] Schedule Day 1 setup call — propose two time slots, let them pick
- [ ] Log Day 0 contact in `/admin/founding-dealers` CRM — stage: Onboarding

**WhatsApp message to send within 1 hour of payment:**
"Kumusta [Name]! Account mo ay active na. Login link: [URL]. Username: [email]. Temporary password: [password] (palitan mo ito pagka-login). May I-send na din ang invite sa iyong email. Kailan po tayo magre-schedule ng setup call — bukas o after-bukas? 30 minutes lang, screen-share tayo para ma-setup natin lahat ng maayos. 🚗"

---

## Day 1 — First Login

- [ ] Join setup call — screen-share walk-through (you drive, not them)
- [ ] Confirm they can log in to `/dealer` — troubleshoot if needed
- [ ] Start inventory import together:
  - **Option A:** CSV upload — if they have an Excel file, convert to CSV (takes 5 min)
  - **Option B:** Manual entry of first 5 listings together (takes ~15 min on the call)
- [ ] Show CRM — explain the 8 stages: Prospect → New Lead → Contacted → Qualified → Demo Scheduled → Proposal Sent → Negotiation → Won/Lost
- [ ] Create a test inquiry manually so they see a lead appear in the pipeline
- [ ] Walk through how to move a lead from "New Lead" to "Contacted"
- [ ] Milestone: first listing goes live — take a screenshot, send it via WhatsApp. "Narito na ang unang listing mo — live na!"
- [ ] Set Week 1 targets verbally: "By end of this week, goal natin: 10 listings live and CRM set up for your team."

---

## Week 1 Targets (Days 2–7)

- [ ] 10+ listings live (photos, price, description filled in)
- [ ] CRM understood — dealer can move a lead through stages without help
- [ ] At least 1 real inquiry received
- [ ] At least 1 inquiry responded to within 2 hours (show them the response timer)
- [ ] Day 7 NPS check-in via WhatsApp — 2 questions only:
  1. "Sa scale ng 0–10, gaano ka-satisfied sa platform so far?"
  2. "May isang bagay bang gusto mong i-improve?"

**Day 7 WhatsApp check-in script:**
"Kumusta [Name]! Isang linggo na. Quick check: (1) Gaano ka-satisfied sa platform — 0 to 10? (2) May isang bagay na gusto mong i-improve? Honest lang po — feedback mo napakahalaga. May call tayo this week, pwede nating i-address kung may concerns."

---

## Week 2 Targets (Days 8–14)

- [ ] 20+ listings live
- [ ] First lead stage moved in CRM beyond "New Lead"
- [ ] Response time average under 4 hours (check in `/dealer/analytics`)
- [ ] Ask: "Sino pa sa iyong team ang dapat matuto ng system?" — expand usage to the full sales team
- [ ] If Founding Dealer: confirm they've seen the Founding Badge on their listings

---

## Day 30 — Success Review Call

Agenda (30 minutes):

1. Review analytics together at `/dealer/analytics`:
   - Total leads received
   - Average response time
   - Listings views and top performers
2. Show the CRM pipeline — how many leads moved through stages
3. NPS question: "Sa scale ng 0–10, gaano ka-likely na i-recommend mo kami sa ibang dealer?"
4. If NPS ≥ 8: "Mayroon ka bang kaibala o ka-negosyo na dealer na puwede mong i-refer? Founding Dealer spots ay [X] pa lang natitira."
5. If NPS < 7: "Ano yung isang bagay na puwede naming i-improve?" — log in FeatureRequest system immediately after call

---

## Health Scoring

Update `DealerSuccessPlan.thirtyDayScore` as milestones are hit. Each milestone = +20 points:

| Milestone | Field | Score |
|-----------|-------|-------|
| First CSV or manual inventory upload completed | `inventoryImported` | +20 |
| First active listing published | `firstListingLive` | +20 |
| First inquiry received via platform | `firstLeadReceived` | +20 |
| First inquiry responded to within 2 hours | `firstLeadResponded` | +20 |
| First closed deal logged in CRM | `firstSaleReported` | +20 |

**Score interpretation:**
- 80–100: Healthy — on track for renewal and referral ask
- 60–79: Watch — check in mid-week, not just on the scheduled call
- <60: Call immediately — do not wait for the scheduled check-in

---

## Risk Signals — Act Same Day

| Signal | Action |
|--------|--------|
| No login in 3 days | WhatsApp: "Kumusta po yung system? May matutulungan ba kita?" |
| 0 leads after 7 days | Review listing quality together: title, price, photos — fix on a 20-min call |
| CRM not opened at all | Offer a 30-minute re-training call — keep it low-pressure |
| NPS < 7 at Day 7 | Call within 24 hours — don't leave it to the Day 30 review |
| Dealer stops responding | Try a different channel: call instead of WhatsApp, or send via Viber |

---

## Referral Ask Script (Day 30, NPS ≥ 8)

"Masaya po akong marinig yan. May tanong lang ako — mayroon ka bang kakilalang dealer, kahit maliit o malaki, na nag-struggle din sa lead tracking o Facebook management? Hindi ko sila cold-call — sabihin ko lang na pinarefer ka nila, and then ikukwento ko yung ginawa natin together. Sino ang naiisip mo?"
