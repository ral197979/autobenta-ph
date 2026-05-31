# Founding Dealer Execution Plan

**Goal:** Close 5 paying dealers on the Founding Dealer plan (₱3,599/month, 40% off Pro, locked for life).
**Timeline:** 4 weeks. One person running all sales.
**Non-negotiable:** 1 hour of focused sales work every day.

---

## Week 1 — Research + Prospecting

**Theme:** Build the pipeline before you start selling.

**Tasks:**
- [ ] Research and identify 20 target dealers in Metro Manila
  - Sources: Facebook Marketplace dealer pages, Philkotse dealer listings, referrals, OLX
  - Look for: 10+ cars in inventory, active posting, Facebook-only or no CRM visible
  - Record each one in `/admin/founding-dealers` pipeline with: name, phone, platform, inventory count, notes
- [ ] Add all 20 prospects to the CRM pipeline with stage = `research`
- [ ] Send first outreach to 10 prospects (see COLD_OUTREACH template)
  - Send via WhatsApp. Not email. WhatsApp gets read.
  - Personalize each message — mention their specific listing or platform
- [ ] Run `node scripts/seedDemo.js` to confirm demo environment is ready
- [ ] Verify /book-demo page is live and form submission works
- [ ] Verify /for-dealers page is live and correctly describes Founding Dealer offer
- [ ] Confirm you can log in to demo account: demo@autobentaph.com

**End-of-week targets:**
- 20 prospects in pipeline
- 10 first messages sent
- Demo environment confirmed working
- 0 demos yet (that's Week 2)

**Research method — 10 minutes per dealer:**
1. Find their Facebook page or Philkotse profile
2. Count their active listings
3. Test their Facebook response time (send a test inquiry)
4. Note their phone number
5. Add to CRM with all notes

---

## Week 2 — Demo Blitz

**Theme:** Get as many demos done as possible. Every demo is a potential close.

**Tasks:**
- [ ] Follow up on all Week 1 contacts (Day 4 follow-up per cadence)
- [ ] Send first outreach to remaining 10 prospects from your list
- [ ] Schedule and complete 3–5 demos
- [ ] Use Founding Dealer urgency messaging in every demo: "5 spots lang — 2 linggo na lang ang offer na ito"
- [ ] After each demo: send follow-up summary same day (use DEMO_CONFIRMATION template)
- [ ] Send first proposal to any demo-completed prospects (use PROPOSAL_EMAIL template)

**End-of-week targets:**
- 3 demos completed
- 1 proposal sent
- All 20 prospects contacted at least once

**Founding Dealer urgency script (use verbatim in demos):**
"Ang Founding Dealer program ay 5 slots lang. Kapag naubos na, tapos na ang ₱3,599 rate — babalik sa regular na ₱5,999/month. Ngayon [X] slots na lang ang natitira. Gusto mo bang i-lock ito ngayon?"

---

## Week 3 — Close

**Theme:** Push every warm prospect to a decision.

**Tasks:**
- [ ] Follow up on all demo-completed prospects with personalized ROI calculations
  - Use their actual numbers (cars/month, avg price, avg margin)
  - Show exactly: cost of AutoBentaPH vs. leads recovered vs. net ROI
- [ ] For every warm prospect: ask directly — "Handa na ba kayong mag-sign up, o may nag-hahadlang pa?"
- [ ] Handle objections head-on (refer to DEALER_OBJECTION_HANDLING.md for specific scripts)
- [ ] Continue outreach cadence on all cold contacts (Day 10 follow-up)
- [ ] Send breakup emails to unresponsive Day 1 contacts (Day 20 of cadence)

**End-of-week targets:**
- First paying dealer signed
- 1–2 more deals in "negotiating" stage
- 2–3 demos scheduled or pending for Week 4

**Close conversation script:**
"Batay sa pinag-usapan natin, ang ROI ay malinaw — kahit isa lang karagdagang benta sa isang buwan, nag-cover na ang cost. Ang tanong lang ay: kailan tayo magsisimula? Puwede ko kayong i-onboard ngayon or bukas."

---

## Week 4 — Onboard + Expand Pipeline

**Theme:** Deliver value to Dealer #1. Close Dealers #2–5.

**Tasks:**
- [ ] Onboard Dealer #1 immediately — follow DEALER_ONBOARDING_PLAYBOOK.md exactly
- [ ] Day 7 NPS from Dealer #1 (early signal — not standard but useful for a Founding Dealer)
- [ ] Use Dealer #1's early experience as social proof for remaining prospects:
  - "Nag-onboard na kami ng first Founding Dealer — nandoon na ang listings, gumagana na. Gusto mong makita?"
- [ ] Continue demo and close cadence for Dealers #2–5
- [ ] Gather feedback from Dealer #1 to sharpen pitch: what made them sign? What almost stopped them?

**End-of-week targets:**
- Dealer #1 fully onboarded (10+ listings live, CRM shown)
- 2–3 additional dealers in proposal or close stage
- 5 total Founding Dealer spots filled (stretch goal — reality may be 2–3 by end of Week 4)

---

## Daily Routine (1 Hour/Day Minimum)

**Morning (15–20 min):**
- Open CRM. Check all prospects with follow-up due today.
- Action every one — call, WhatsApp, or email based on where they are in cadence.
- Check inbound: did anyone fill out /book-demo or /for-dealers overnight? Respond immediately.

**Midday (20–30 min):**
- Run any scheduled demo calls.
- If no demo today: make 2–3 outreach calls to cold prospects.
- Send any pending follow-up messages.

**Evening (10–15 min):**
- Log every interaction from the day in CRM.
- Set every follow-up date for active prospects. Every single one.
- Review tomorrow's due follow-ups so you're ready.

**Non-negotiables:**
- No prospect sits for 7+ days with no logged activity.
- No demo happens without a follow-up sent the same day.
- Every inbound lead gets a response within 2 hours.

---

## Daily Metrics Tracker

Log these every day. Keep a simple spreadsheet or running note.

| Date | Prospects Added | Contacts Made | Demos Scheduled | Demos Completed | Proposals Sent | Dealers Won | Dealers Lost | Notes |
|------|----------------|---------------|-----------------|-----------------|----------------|-------------|--------------|-------|
| W1D1 | | | | | | | | |
| W1D2 | | | | | | | | |
| W1D3 | | | | | | | | |
| W1D4 | | | | | | | | |
| W1D5 | | | | | | | | |
| W2D1 | | | | | | | | |
| W2D2 | | | | | | | | |
| W2D3 | | | | | | | | |
| W2D4 | | | | | | | | |
| W2D5 | | | | | | | | |
| W3D1 | | | | | | | | |
| W3D2 | | | | | | | | |
| W3D3 | | | | | | | | |
| W3D4 | | | | | | | | |
| W3D5 | | | | | | | | |
| W4D1 | | | | | | | | |
| W4D2 | | | | | | | | |
| W4D3 | | | | | | | | |
| W4D4 | | | | | | | | |
| W4D5 | | | | | | | | |

**Dealers Lost — always record the reason:**
- Price too high
- No budget right now
- Using competitor / happy with current system
- No time / not a priority
- Couldn't reach / unresponsive
- Other: [note]

Reasons inform your pitch improvement for the next prospect.

---

## Pipeline Stage Reference

Use these stages in `/admin/founding-dealers` pipeline:

| Stage | Meaning |
|-------|---------|
| `research` | Identified, not yet contacted |
| `contacted` | First message sent |
| `responding` | Two-way conversation started |
| `demo_scheduled` | Demo booked |
| `demo_completed` | Demo done, follow-up sent |
| `proposal_sent` | Proposal or ROI calc sent |
| `negotiating` | Active back-and-forth on decision |
| `won` | Paid — move to onboarding |
| `lost` | Decided not to move forward — note reason |
| `dormant` | Not responsive — revisit in 30–60 days |
