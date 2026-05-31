# Demo Booking Process

**Purpose:** End-to-end playbook for scheduling, preparing, running, and following up on product demos. One founder running all sales.

---

## Before the Demo (2 Hours Before)

Run through this every time. No shortcuts.

- [ ] Send confirmation WhatsApp/Viber: "Hi [Name], kumpirmahin ko lang ang demo natin ngayon [time]. Nandyan pa ba kayo?" Wait for reply.
- [ ] Open demo environment: [your-domain]/dealer — log in, verify it loads correctly
- [ ] Confirm 50+ listings are visible in the demo account
- [ ] Confirm leads are present in all 8 CRM stages (new, contacted, qualified, demo, proposal, negotiating, won, lost)
- [ ] Pull up ROI calculator tab (calculate their specific numbers — see ROI section below)
- [ ] Know their inventory count before you start: how many cars do they currently have listed?
- [ ] Know their current system: Facebook only? Philkotse? Excel?
- [ ] Have pricing page open in a second tab
- [ ] Test screen share or Zoom/Meet link before the call

**Demo environment credentials:**
- URL: [your-domain]/dealer
- Email: demo@autobentaph.com
- Password: [set in .env — never share this file]

---

## ROI Calculator (Fill Before Every Demo)

Use the prospect's own numbers to make the value real.

| Variable | Prospect's Number | AutoBentaPH Estimate |
|----------|------------------|----------------------|
| Cars sold per month | [ask them] | — |
| Avg selling price | [ask them] | — |
| Avg profit per car | [ask them] | — |
| Current lead response time (hrs) | [estimate from FB test] | < 2 hours target |
| Estimated leads lost per month (slow response) | [assume 20-30%] | — |
| Leads recovered with CRM | — | +2-4 per month |
| Revenue recovered | — | [leads × avg profit] |
| AutoBentaPH cost | — | ₱2,999–₱5,999/mo |
| Net ROI | — | [revenue - cost] |

**Rule of thumb pitch:** If they sell 10 cars/month at ₱20,000 avg profit per car, recovering even 1 additional sale per month = ₱20,000 revenue vs. ₱2,999 cost. ROI is obvious.

---

## Demo Type Guides

Choose the demo type based on what the prospect cares about most. When in doubt, use Full Platform Demo.

---

### Demo Type 1: Marketplace Demo (15 minutes)

**Best for:** Dealers focused on "I want more buyers" — not yet thinking about CRM.

**Goal:** Show how AutoBentaPH helps buyers find their listings, builds trust, and generates inquiries.

**Flow:**
1. (2 min) Start at autobentaph.com homepage — "Ito ang nakikita ng buyers"
2. (3 min) Browse listings — show search, filter by location/make/price
3. (3 min) Click into a listing detail page — show photos, specs, trust badges (Verified OR/CR badge)
4. (3 min) Show the inquiry flow — buyer sends message, it goes straight into the dealer's CRM
5. (4 min) Show how dealers with complete listings + Verified badge get priority placement

**Talking points:**
- "Buyers dito ay handa nang bumili — hindi sila nag-browse lang para mag-enjoy"
- "Ang Verified badge ay ginawa para mapagkatiwalaan ng buyers — maraming scam kasi sa FB Marketplace"
- "Lahat ng inquiries napupunta sa CRM — hindi na mawawala sa Messenger"

---

### Demo Type 2: CRM Demo (20 minutes)

**Best for:** Dealers who already get leads from Facebook but are losing them — "nawawala ang mga messages."

**Goal:** Show how the 8-stage Kanban CRM organizes every lead and prevents drop-off.

**Flow:**
1. (3 min) Dashboard — "Ito ang nakikita mo every morning: ilang leads, anong stage, who to follow up today"
2. (5 min) 8-stage Kanban board — walk through each stage: New → Contacted → Qualified → Demo/Viewing → Proposal → Negotiating → Won → Lost
3. (4 min) Click into a specific lead — show activity log, notes, next follow-up date
4. (3 min) Live demo: move a lead from one stage to the next, log an activity
5. (3 min) Show the follow-up reminder system — "Hindi ka na makakalimot mag-follow up"
6. (2 min) Show win/loss reporting — "Alam mo kung saan namamatay ang deals"

**Talking points:**
- "Sa Facebook, pagkaalis ng buyer sa Messenger, wala nang record. Dito, lahat naka-log."
- "Ang average dealer na hindi gumagamit ng CRM ay nawawalan ng 20-30% ng leads dahil hindi na-follow up"
- "8 stages — alam mo kung saan naroon ang bawat buyer sa anumang oras"

---

### Demo Type 3: V8Atlas DMS Demo (15 minutes)

**Best for:** Dealers who already use V8Atlas DMS and want to know about integration.

**Goal:** Show how AutoBentaPH syncs with V8Atlas so inventory is always current.

**Flow:**
1. (3 min) Dealer settings page — show V8Atlas sync status
2. (4 min) Show inventory count and last sync timestamp
3. (4 min) Show how a V8Atlas inventory update reflects in AutoBentaPH listings (simulate or use demo data)
4. (4 min) Show lead routing from AutoBentaPH back to V8Atlas deal record

**Talking points:**
- "Kapag nagbenta ka sa V8Atlas, awtomatikong nawi-withdraw ang listing dito — hindi na kailangang manual"
- "Hindi double work — isa lang ang pinagku-kunan ng inventory"

---

### Demo Type 4: Full Platform Demo (30 minutes)

**Best for:** Prospects who are seriously evaluating or asked for a full overview.

**Flow:**
1. (5 min) Marketplace walkthrough (condensed from Demo Type 1)
2. (10 min) CRM walkthrough (condensed from Demo Type 2)
3. (5 min) AI listing wizard — show how it helps write listings faster
4. (5 min) Analytics — response time, listing views, lead conversion
5. (5 min) ROI calculator — use their specific numbers, present the math

**Talking points:** Combine the best from each demo type above.

**End with:** "Batay sa [X] cars per month na ibinebenta ninyo, ang AutoBentaPH ay mag-re-recover ng [Y] leads per month na maaaring maging [Z] pesos. At ₱[plan price]/month lang ang cost. Ang tanong lang: kailan tayo magsisimula?"

---

## After-Demo Process (Within 24 Hours)

Do this the same day as the demo, or first thing the next morning at latest.

- [ ] Send follow-up email/WhatsApp with summary of what was shown (use DEMO_CONFIRMATION template)
- [ ] Attach ROI calculation using their specific numbers
- [ ] Include pricing page link (or attach PDF if prospect is not tech-savvy)
- [ ] Log demo as completed in CRM
- [ ] Move prospect to `demo_completed` stage
- [ ] Schedule follow-up call within 3 business days — set it in CRM now

**Follow-up timing:** 3 business days is the sweet spot. Less than 24 hours feels pushy. More than 5 days loses momentum.

---

## No-Show Protocol

This will happen. Have a plan ready.

1. **At the scheduled time:** Wait 10 minutes before taking any action.
2. **After 10 minutes:** Send WhatsApp: "Hi [Name], naghihintay lang kami — kumusta na? Pwede pa kayo ngayon o gusto ninyong mag-reschedule?"
3. **Reschedule:** Try to lock in a new time the same day. Strike while warm.
4. **Max 2 reschedule attempts.** After 2 no-shows, mark as lower priority and move to 30-day follow-up queue.
5. **Log the no-show in CRM.** Note time, what you sent, and when the reschedule is.

**Never shame a prospect for a no-show.** Be warm and easy. They're busy. Make it easy to come back.

---

## Demo Environment Reset

No reset needed after each demo. The demo account uses seeded read-only data.

If data looks stale or broken, re-run:
```bash
node scripts/seedDemo.js
```

Verify after running: log in as demo@autobentaph.com and confirm 50 listings and 8-stage CRM leads are populated.
