# Customer Success Playbook

**Purpose:** Retention and success system for AutoBentaPH dealers after they pay. Goal: get every dealer to renewal at Day 30 and beyond.

---

## Success Philosophy

**The only retention metric that matters in Month 1:** Did the dealer receive at least 3 genuine buyer inquiries?

If yes → they renew. The platform works. They see the value.
If no → they churn. It doesn't matter how good the CRM is or how clean the UI is. No inquiries = no proof of value.

Everything in this playbook is in service of that one number: 3+ genuine inquiries in the first 30 days.

---

## 30–60–90 Day Success Framework

### Days 1–7: Activation
**Goal:** Listings live, CRM set up, dealer logging in.
**Definition of success:** 10+ listings live, CRM accessed at least once.
**Your job:** High-touch. Daily check-ins. Help with uploads. Remove friction.
**Key question to ask:** "May nakapasok na bang inquiry?" (Has any inquiry come in yet?)

### Days 8–14: First Value
**Goal:** Dealer receives their first real inquiry, uses CRM for the first time.
**Definition of success:** First lead received, first activity logged in CRM.
**Your job:** Celebrate the first inquiry. Help them respond fast. Show them how to move the stage.
**Key question:** "Nasagot na ba? Gaano katagal bago kayo nag-reply?" (Did you reply? How long did it take?)

### Days 15–30: Habit
**Goal:** Dealer is using the CRM regularly. Response time under 2 hours. Renewal feels automatic.
**Definition of success:** 5+ CRM activities logged, avg response time < 2 hours.
**Your job:** Back off to 2-3x/week check-ins. Analyze their analytics with them. Plant renewal conversation.
**Key question:** "Anong pinaka-helpful sa inyo ngayon?" (What's been most helpful?)

### Days 31–60: Expansion
**Goal:** Dealer is getting consistent value. Start planting expansion seeds.
**Definition of success:** Featured listing purchased OR V8Atlas sync enabled OR listing count growing.
**Your job:** One upgrade conversation. Keep it natural, not pushy.
**Key question:** "Ilang listings na kayo ngayon? Gusto ninyo mas marami pang buyers?"

### Days 61–90: Renewal (Month 2-3)
**Goal:** Confident, habitual renewal. Start asking for referrals.
**Definition of success:** Second renewal processed, NPS 8+.
**Your job:** Send NPS. Ask for testimonial. Ask for referral.
**Key question:** "May kakilala ka bang dealer na pwedeng makinabang sa AutoBentaPH?"

---

## Health Scoring

Update `DealerSuccessPlan.thirtyDayScore` for each dealer by Day 30.

| Factor | Points |
|--------|--------|
| 10+ listings live | +20 |
| CRM used (≥5 activities logged) | +20 |
| First lead responded within 2 hours | +20 |
| Average response time < 2 hours | +20 |
| First sale reported in CRM | +20 |
| **Total possible** | **100** |

**Score interpretation:**
- 80–100 = Healthy. On track to renew. Ask for referral.
- 60–79 = Monitor. Something is underused. Find the gap.
- 40–59 = At risk. Proactive call needed this week.
- < 40 = Critical. Same-day call. Find out what's wrong.

Calculate this at Day 14 (early warning) and Day 30 (final before renewal).

---

## Intervention Playbooks

### Score < 60 at Day 14
1. Call the dealer personally. Open with: "Nakita ko na hindi pa masyadong active ang account — gusto ko lang matiyak na okay kayo at may value na nakukuha ninyo."
2. Find the real blocker: no time? Confusing UI? No leads coming in? Technical issue?
3. Offer a 30-minute training call. "Pwede ba tayo mag-30 minuto ngayong linggo — ipapakita ko kung paano gamitin ng mas epektibo?"
4. Log call outcome in CRM. Set 7-day follow-up.

### No Login for 5+ Days (Anytime in Month 1)
1. **WhatsApp (Day 1 of absence):** "Hi [Name]! Kumusta na kayo? Nakikita ko na may [X] listings kayo live — may tanong ba o may kailangan ba kayo?"
2. **Call (Day 3 if no WhatsApp reply):** "Just checking in — gusto ko lang matiyak na okay ang account ninyo."
3. Never shame. Never pressure. Just be helpful.

### Churn Risk Conversation
When a dealer signals they want to cancel, here's what to do and not do.

**Do:**
- Ask: "Ano ang pinaka-malaking problema ninyo?" Listen fully before responding.
- Ask: "Kung maayos namin [specific issue], magpapatuloy ba kayo?"
- Acknowledge genuinely: "Naiintindihan ko. Kung ganyan din ang nangyari sa akin, nag-aalangan din ako."

**Don't:**
- Don't immediately offer a discount. It signals that the price was always negotiable and undermines value.
- Don't get defensive about the product.
- Don't promise features that don't exist yet.

**Retention offer (last resort, only if all else fails):**
- Offer a 1-month extension (not a price reduction): "Para mapakita namin na serious kami sa success ninyo, gusto naming bigyan kayo ng isang libre na buwan — para magamit ninyo nang buo."
- Conditions: dealer must have real usage (not ghosted you), and must have a genuine temporary cash issue.
- Never reduce the monthly price. It sets a bad precedent for future renewals.

---

## NPS Process

### When to Send
- **Day 14:** First NPS. Early signal. Catch problems before renewal.
- **Day 30:** Second NPS. Renewal decision support.

### How to Send
Send via WhatsApp with a Google Form or Typeform link. Keep it short:

"Hi [Name]! Quick question lang — sa scale na 0 to 10, gaano ka-likely na i-recommend mo ang AutoBentaPH sa ibang dealer? 0 = hindi, 10 = siguradong irerecommend. [link] Salamat!"

### How to Act on Responses

**Promoters (9–10):**
1. Thank them warmly.
2. Ask for a testimonial: "Pwede ba kayong mag-ilang salita tungkol sa experience ninyo? Gagamitin namin bilang social proof para sa ibang dealers."
3. Ask for referral: "May kakilala ka bang dealer na pwedeng makinabang sa AutoBentaPH? Ipagpapakilala ko."

**Passives (7–8):**
1. Thank them.
2. Ask: "Ano ang magpapataas ng score ninyo sa 9 o 10? Gusto naming malaman." 
3. Take note of what they say — this is real product feedback.

**Detractors (0–6):**
1. Call within 24 hours. Not email, not WhatsApp. Phone call.
2. Open with: "Nakita ko ang feedback ninyo — salamat sa katapatan. Gusto kong marinig kung ano ang nangyari."
3. Listen. Don't defend. Log in SupportTicket with full detail.
4. Follow up within 48 hours with what you're doing about it.

---

## Expansion Revenue Triggers

Watch for these signals. Bring them up naturally in check-in calls.

| Signal | What to Say |
|--------|-------------|
| Dealer at 18-20 listings (near Verified plan cap) | "Napansin ko na malapit na kayong maabot ang limit ng Verified plan. Gusto bang i-upgrade sa Pro para unlimited listings at analytics?" |
| Dealer using V8Atlas (detected in onboarding) | "Nakita ko na may V8Atlas kayo — nag-set up na ba kayo ng sync? Automatic na ang inventory update pag connected." |
| Response time > 4 hours in analytics | "Nakikita ko na average response time ninyo ay [X] hours — pag mas mabilis, mas maraming deals. Gusto kong ipakita kung paano mapabilis." |
| Dealer mentions needing more buyers | "Para sa mas maraming serious buyers, may featured listing option kami — [price]. Worth it pag fast-moving yung sasakyan." |

**Key rule on upsells:** Only bring these up when the dealer is already healthy (score ≥ 60). Don't try to upsell a dealer who isn't getting basic value yet.
