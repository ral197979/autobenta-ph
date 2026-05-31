# Churn Prevention Playbook
## AutoBentaPH — Proactive Dealer Retention System

**Purpose:** Detect churn risk early and intervene before the dealer decides to cancel. Target: <5% monthly churn across all active dealers.

---

## Part 1: The 5 Churn Triggers

These are observable signals that predict cancellation 14–30 days before the dealer explicitly decides to leave.

### Trigger 1: No Login — 7 Days
**What it signals:** The dealer has stopped integrating the platform into their daily routine.
**Risk level:** Medium — single week could be vacation or hardware issue.
**Action:** WhatsApp check-in (warm, not alarming).

### Trigger 2: No Lead Response — 48 Hours
**What it signals:** The dealer is receiving leads but not acting on them. This is the highest-risk signal because leads going cold = zero ROI experience.
**Risk level:** High — unresponsive leads are a visible platform failure in the dealer's eyes.
**Action:** Immediate WhatsApp alert with the specific leads listed.

### Trigger 3: No Inventory Update — 14 Days
**What it signals:** Listings are stale. Stale listings get fewer views and fewer leads. The dealer will blame the platform ("walang leads") when the actual problem is outdated inventory.
**Risk level:** Medium-high — inventory freshness directly correlates to lead volume.
**Action:** WhatsApp with specific inventory note and an offer to help.

### Trigger 4: Low CRM Usage
**What it signals:** The dealer is not progressing leads through stages. This could mean they're tracking sales externally (good but risky — they might stop seeing platform value) or they're not closing leads (bad).
**Risk level:** Medium — correlates with perceived ROI.
**Action:** Coaching message + offer a CRM walkthrough.

### Trigger 5: Missed Invoice
**What it signals:** Either financial stress, reduced platform value perception, or oversight.
**Risk level:** High — payment friction is the most direct precursor to cancellation.
**Action:** Follow the Payment Collection Playbook. If Day 5 and no response, escalate to a personal call.

---

## Part 2: Health Scoring Framework

Each dealer gets a 0–100 health score, updated weekly.

### Score components

| Component | Weight | How to measure |
|-----------|--------|----------------|
| Login frequency (last 7 days) | 25% | 4+ logins = 25pts; 2–3 = 15pts; 1 = 8pts; 0 = 0pts |
| Listings quality (active, updated) | 20% | All listings updated <14 days = 20pts; some stale = 10pts; all stale/none = 0pts |
| Lead response rate | 25% | 80%+ response within 4h = 25pts; 50–79% = 15pts; <50% = 5pts |
| CRM usage score | 20% | Actively using 3+ stages = 20pts; using but static = 10pts; unused = 0pts |
| Invoice status | 10% | Current = 10pts; 1–7 days late = 5pts; 8+ days late = 0pts |

### Health status thresholds

| Score | Status | What it means | Action required |
|-------|--------|---------------|-----------------|
| 75–100 | Healthy | Active, engaged, getting value | Standard monthly check-in |
| 50–74 | Watch | Inconsistent usage, possible friction | Proactive WhatsApp within 48h |
| 25–49 | At Risk | Low engagement, possible unresolved issue | Personal call within 24h |
| 0–24 | Critical | Near-zero activity, likely considering cancel | Emergency save call today |

---

## Part 3: Weekly Health Review Process

### When to run it
Every Monday morning — 15 minutes maximum.

### What to check
1. Open the dealer CRM/spreadsheet
2. For each active dealer, score the 5 components (see framework above)
3. Calculate total score
4. Assign status: Healthy / Watch / At Risk / Critical
5. Note any change from last week's score (improving or declining)

### What to do with results

**Healthy dealers:** Nothing extra this week. Proceed with scheduled touches only.

**Watch dealers:** Send a proactive WhatsApp check-in this week. No urgency, just warmth. Look for the specific trigger that dropped the score.

**At Risk dealers:** Personal call within 24 hours. Come to the call with specific data: "Napansin namin na 5 days kayong hindi nag-log in at may 3 leads na naghihintay ng sagot."

**Critical dealers:** Call today. This is a save call, not a check-in.

---

## Part 4: Intervention Scripts

### Trigger 1: No Login — 7 Days

**WhatsApp (Taglish, warm):**
```
[First name], kumusta na? Nakita namin na ilang araw na di ka naka-log in sa AutoBentaPH — nag-aalala lang kami kung okay ang lahat.

May nangyari ba? O busy lang sa dealership?

Kung may mga leads na naghihintay o kailangan ng update sa listing, andito lang kami para tulungan. Pwede rin kaming mag-hop on ng mabilis na call anumang oras. 🙏
```

**Follow-up after 24h if no response:**
```
[First name], paumanhin sa follow-up — gusto ko lang matiyak na nakikita mo ang mensahe ko. Kung busy kayo ngayon, okay lang. Nandito lang ako kung kailangan.

May 2 bagong leads na naghihintay sa inyong account — ayaw ko silang mag-cold bago kayo makapag-respond.
```

---

### Trigger 2: No Lead Response — 48 Hours

**WhatsApp (immediate, informative):**
```
[First name]! May 2 bagong leads kayo na naghihintay ng sagot sa AutoBentaPH — [X] hours na silang hindi nare-respond.

Quick reminder: ang mga buyer na nagtatanong ng kotse ay kadalasang nag-cocontact ng 3–5 dealers sabay. Kung hindi muna kayo sumagot, may posibilidad na pumunta sila sa ibang dealer.

Pwede ba ninyong i-check ang inyong account ngayon? Nandito lang ako kung kailangan ng tulong sa kung paano sagutin ang leads.
```

**If it happens twice in one week:**
Call them directly. "Napansin namin na dalawang beses na ngayong linggo na may leads na naghintay ng 48h+ bago masagot. Gusto kong malaman kung may problema — may paraan ba para gawing mas madali ang response process para sa inyo?"

---

### Trigger 3: Low Inventory — No Update in 14 Days

**WhatsApp:**
```
[First name], kumusta! Napansin namin na di pa na-a-update ang inventory mo sa AutoBentaPH — [X] days na.

Baka may bagong stock na hindi pa naka-list, o baka may nabentang unit na kailangan nang i-remove?

Ang mga fresh na listings ay nakakakuha ng mas maraming views — gusto kong matiyak na ikaw ay nakikita ng mga buyer. Kung kailangan ng tulong sa pag-update, andito lang kami — 15 minutes lang ang kailangan para maging updated ang lahat. Pwede akong mag-screen share sa iyo.
```

---

### Trigger 4: Low CRM Usage

**WhatsApp:**
```
[First name], may nakita akong bagay na gusto kong ibahagi.

Ang inyong AutoBentaPH account ay may [X] leads na received na ngayon — pero kaunti pa lang ang naka-move through sa CRM stages. Ibig sabihin, may mga buyers na interested pero hindi pa natin alam kung saan sila sa inyong sales process.

Ang CRM ay dinisenyo para alam ninyo palagi kung sino ang pwede nang ma-close at sino ang nangangailangan pa ng follow-up. Hindi mahirap gamitin — 5 minutes lang per day.

Gusto ba nating mag-quick walk-through ng CRM sa isang call? 20 minutes lang — at magse-set kayo ng maayos mula doon.
```

---

### Trigger 5: Missed Invoice

See `PAYMENT_COLLECTION_PLAYBOOK.md` for the full escalation sequence.

**Key addition for churn prevention context:** When a dealer misses an invoice, it's often not about money — it's a signal that they're re-evaluating value. Treat payment follow-ups as opportunity to re-sell the value, not just collect money.

Add to any Day 5+ payment follow-up:
```
...at kung may concern kayo sa value ng platform o kung may bagay na hindi gumagana, sabi lang sa akin — gusto ko munang ayusin iyon bago kayo magdesisyon ng anuman.
```

---

## Part 5: The Save Call Script

Use when a dealer is Critical health score OR when they explicitly say they want to cancel.

### Before the call: preparation
- Pull their account data: total logins, leads received, leads responded, listings published, last login date
- Identify the likely reason: no leads, no time, too complex, cost
- Have a specific offer ready (free session, feature fix, pause option)

### Opening (30 seconds)
```
"[First name], salamat sa pag-sagot. Si [YOUR NAME] ito — direkta na lang ako. Nakikita namin na ang account ninyo ay hindi masyadong aktibo ngayon, at nandito ako para malaman kung bakit at kung may magagawa kami."
```

### Discovery (2–3 minutes)
```
"Bago ako mag-assume ng anuman — ano ang pinaka-malaking concern ninyo sa platform ngayon?"
```

Shut up and listen. Do not fill silence. Let them talk.

### Common reasons and responses

**"Walang leads"**
```
"Naiintindihan ko ang frustration. Tingnan natin mismo ang data — mula nang nag-launch kayo, nakatanggap kayo ng [X] leads. Ang concern ko ay ang mga lead na ito ay talagang existing buyers na naghahanap ng kotse — kailangan lang nating tiyakin na ang listings ninyo ay optimized para makita sila.

Pwede ba tayong mag-30 minutes na working session ngayong araw para i-fix ang mga listing? Makikita ninyo ang pagbabago sa views sa loob ng 48 hours."
```

**"Hindi ko oras para gamitin ito"**
```
"Ito ang pinakacommon na concern — at naiintindihan ko. Ang tanong ko ay: kung 10 minutes lang bawat araw ang kailangan, worth it pa rin ba para sa inyo?

Gusto ko kayong tulungan na gawing mas mabilis ang daloy — ipapakita ko kung paano. At kung talagang sobrang busy, may isang bagay akong gusto ninyong malaman..."

[Transition to pause offer if needed]
```

**"Mahal para sa aming budget ngayon"**
```
"Naiintindihan ko — may buwan na mas mahirap kaysa ibang buwan. Gusto ko lang i-share: ang inyong subscription ay nagge-generate ng access sa leads na ang value ay napakaraming beses na mas mataas kaysa ₱3,599.

Pero kung ang problem talaga ay cash flow ngayon, may opsyon kaming pause option — iki-kwento ko ito sa inyo."
```

**"Mas gusto ko ang Facebook ads"**
```
"Okay — at gusto kong maging tapat. Facebook ads ay maganda para sa awareness. Ang AutoBentaPH ay nagbibigay ng leads na actively naghahanap ng kotse. Hindi competing ito — complementary.

Pero kung iyon ang direksyon ninyo, okay lang iyon sa akin. Bago tayo mag-decide, isang tanong: gaano karami sa inyong Facebook leads ang talagang naging actual buyers compared sa platform leads?"
```

### The close
After addressing their concern, offer a path forward — never ask them to stay, ask them to take a specific action:
```
"Okay — ito ang gusto kong i-propose: mag-commit kayo ng isa pang buwan, at mag-schedule tayo ng dalawang sessions sa next 30 days para matiyak na gumagana ang platform para sa inyo. Kung pagkatapos ng 30 days ay hindi pa rin kayo satisfied, pag-uusapan natin kung ano ang best next step.

Okay ba iyon para sa inyo?"
```

---

## Part 6: The Pause Option

Offer this when a dealer wants to cancel due to temporary circumstances (renovation, vacation, family emergency, cash flow crunch).

**Never offer a pause before the save conversation.** Try to retain first. Offer pause only if cancellation is imminent.

**Script:**
```
"[First name], naiintindihan ko. Kung hindi tayo ready para mag-cancel ngayon pero kailangan ninyo ng break — may isang bagay akong ioffer:

Ang Pause Option ay nagpapahintulot sa inyo na mag-pause ng isang buwan — walang bayad sa pause month, at sa katapusan ng buwan, automatic na umaaktibo ulit ang account ninyo sa parehong Founding Dealer rate.

Ito ay para lang sa mga Founding Dealers — hindi ito available sa lahat ng subscribers.

Gusto ninyong gamitin ito ngayong buwan?"
```

**Rules for pause:**
- Maximum 1 pause per 12-month period
- Account data is preserved
- Founding Dealer rate is maintained
- After pause month, billing resumes automatically (confirm this with them before activating)

---

## Part 7: Win-Back Sequence for Cancelled Dealers

If a dealer cancels, do not disappear. The relationship is not over.

### Immediate (same day as cancellation)
```
[First name], naiintindihan ko ang desisyon ninyo. Gusto ko lang sabihin — salamat sa pagiging bahagi ng AutoBentaPH Founding Dealer program. Ang inyong feedback ay nagpabago ng platform para sa mas marami pang dealers.

Kung magbabago ang sitwasyon o gusto ninyong bumalik anumang oras, nandito lang kami — at ang inyong Founding Dealer rate ay mapapanatili namin, depende sa availability.

Ingat po.
```

### Day 30 win-back
```
[First name], isang buwan na mula nang umalis kayo. Gusto ko lang i-share — naglabas kami ng [specific new feature] last week na akala ko ay useful para sa inyong dealership.

Wala akong inaasahan — gusto ko lang manatiling updated kayo. Kumusta ang negosyo?
```

### Day 60 win-back
```
[First name], kumusta na? Isang dealer na dating katulad ng inyong size ay bumalik sa platform last month at nakatanggap ng [X] leads sa unang linggo pa lang.

Kung curious kayo kung paano, magsabi lang at magpapadala ako ng quick update.
```

### Day 90 win-back
```
[First name], last na ito mula sa akin for a while — ayaw kong magmukhang persistent.

Kung gusto ninyong bumalik sa AutoBentaPH, available pa rin ang inyong Founding Dealer rate hanggang [date]. Pagkatapos noon, available na lang ang bagong pricing.

Kung hindi talaga — walang reklamo. Maligayang negosyo sa inyo.
```

After Day 90, move to quarterly check-ins only.

---

## Part 8: Churn Prevention Metrics

Track these monthly:

| Metric | Target | How to measure |
|--------|--------|----------------|
| Monthly churn rate | <5% | Cancelled dealers ÷ active dealers |
| Average health score | 70+ | Sum of all dealer scores ÷ count |
| Triggers fired per week | Identify and act on all | Manual review |
| Save call success rate | >50% | Saves ÷ total save calls |
| Pause utilization | Track but no target | Pauses used per month |
| Win-back rate (Day 30–90) | >20% | Win-backs ÷ total cancelled in period |

---

*Last updated: 2026-05-31 | AutoBentaPH Churn Prevention*
