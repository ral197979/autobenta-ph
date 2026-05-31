# AutoBentaPH — Dealer ROI Calculator Specification
## Component: `/for-dealers#roi-calculator` + Standalone Tool

---

## Purpose and Positioning

### What This Calculator Does

The ROI calculator gives a prospective dealer a personalized, number-backed answer to the question: "Is AutoBentaPH worth ₱5,999 a month for my dealership?"

It takes four inputs — all based on the dealer's own operation — and returns a set of forward-looking estimates: how many additional leads the platform is likely to generate, how many of those leads convert to sales, what that means in gross profit, and how quickly the platform pays for itself.

The output is designed to be a conversation anchor, not a closing device. The goal is for the dealer to believe the number before a sales rep validates it, so the ROI framing is already established when the rep enters the conversation.

### Positioning in the Sales Funnel

**On the landing page** (`/for-dealers#roi-calculator`): mid-funnel engagement tool. A dealer who interacts with the calculator has self-identified as evaluating AutoBentaPH seriously. Track calculator engagement as a high-intent signal in analytics.

**In a sales demo**: The sales rep walks through the calculator live, replacing the defaults with the dealer's real numbers. The output becomes the financial case for the deal. Reps should lead with: "Let me show you what this could mean for your dealership specifically." See Sales Usage Notes at the end of this document.

**As a standalone tool**: A link-shareable version (`/roi-calculator`) allows sales reps to send a pre-filled URL to prospects post-demo, or include it in follow-up emails. Pre-filled parameters via URL query string (e.g., `?vehicles=25&gross=60000&conversion=10&leads=60`).

---

## Input Fields

All inputs update output in real time. No submit button. No page reload.

---

### Input 1: Vehicles Sold Per Month

| Property | Value |
|---|---|
| Label | "How many vehicles does your dealership sell per month?" |
| Input type | Slider + numeric display |
| Min | 1 |
| Max | 50 |
| Step | 1 |
| Default | 10 |
| Display format | "10 vehicles/month" |
| Helper text | "Include all units sold — both retail and wholesale if applicable" |

---

### Input 2: Average Gross Profit Per Vehicle

| Property | Value |
|---|---|
| Label | "What is your average gross profit per vehicle?" |
| Input type | Text/numeric input with ₱ prefix |
| Min | ₱10,000 |
| Max | ₱500,000 |
| Step | ₱1,000 |
| Default | ₱50,000 |
| Display format | "₱50,000" (formatted with thousands separator) |
| Helper text | "Gross profit = selling price minus cost of vehicle. Don't include overhead or fixed costs." |
| Validation | If user enters value below ₱10,000: show warning "That seems low — did you mean net margin? Gross profit per unit for most PH dealers is ₱20,000-₱120,000." |

---

### Input 3: Current Lead-to-Sale Conversion Rate

| Property | Value |
|---|---|
| Label | "What percentage of your leads turn into sales?" |
| Input type | Slider + percentage display |
| Min | 1% |
| Max | 30% |
| Step | 0.5% |
| Default | 8% |
| Display format | "8%" |
| Helper text | "If you're not sure, 8% is the Philippine used-car market average. (If 30 people inquire per month and you close 3 deals, that's 10%.)" |
| Context note | Display a reference range below slider: "Industry range: 5-15% for active dealers. Facebook Marketplace average: 4-6%." |

---

### Input 4: Current Monthly Lead Volume

| Property | Value |
|---|---|
| Label | "How many leads (inquiries) do you receive per month today?" |
| Input type | Slider + numeric display |
| Min | 0 |
| Max | 200 |
| Step | 5 |
| Default | 30 |
| Display format | "30 leads/month" |
| Helper text | "Count all inquiries: Facebook DMs, Viber, calls, walk-ins, existing portal leads. Estimate if you don't track this." |

---

## Plan Selector

A toggle or tab switcher displayed above or adjacent to the output cards, allowing the user to switch between:

- **Verified Plan — ₱2,999/mo** (fewer leads, 20-listing cap affects multiplier; see calculation notes)
- **Pro Plan — ₱5,999/mo** (default selected; full multiplier)

The toggle changes:
1. The platform cost used in all output calculations
2. The additional_leads multiplier (Verified: 2× reach; Pro: 3× reach — rationale: Pro's unlimited listings, featured slots, and DMS sync produce higher reach)
3. The label on Output Card 1 (shows plan name)

Recommendation: default to Pro plan selected, with a note: "Switch to Verified to see entry-level plan results."

---

## Calculation Logic

All calculations are performed client-side in real time. Document these formulas exactly — they govern what's displayed and must match any backend validation or reporting.

---

### Variables

```
vehicles_sold         = Input 1 (integer, 1-50)
avg_gross_profit      = Input 2 (number, ₱10,000-₱500,000)
conversion_rate       = Input 3 (percentage expressed as decimal: 8% = 0.08)
current_leads         = Input 4 (integer, 0-200)
platform_cost         = ₱5,999 (Pro) or ₱2,999 (Verified), per plan toggle
reach_multiplier      = 3.0 (Pro) or 2.0 (Verified)
```

---

### Formula 1: Additional Leads from Platform

```
additional_leads = vehicles_sold × reach_multiplier
```

**Rationale**: The platform's verified listings, improved trust signals, and broader distribution are estimated to generate approximately 3 new leads per vehicle listed per month (Pro plan). This is conservative relative to marketplace benchmarks; actual results depend on listing quality, price competitiveness, and dealer response time.

**Example** (default values, Pro): `10 × 3.0 = 30 additional leads/month`

---

### Formula 2: Total Leads With Platform

```
total_leads_with_platform = current_leads + additional_leads
```

**Example**: `30 + 30 = 60 total leads/month`

---

### Formula 3: Current Sales (Baseline)

```
current_sales = current_leads × conversion_rate
```

**Example**: `30 × 0.08 = 2.4 sales/month (baseline)`

---

### Formula 4: Leads Converted With Platform

```
leads_converted_with_platform = total_leads_with_platform × conversion_rate
```

**Note**: Conversion rate is held constant in the base model. An optional advanced toggle (see UX Notes) can allow users to model a conversion rate improvement — the CRM's follow-up system typically improves conversion by 1-3 percentage points for dealers who were previously unstructured.

**Example**: `60 × 0.08 = 4.8 sales/month`

---

### Formula 5: Additional Sales Per Month

```
additional_sales = leads_converted_with_platform - current_sales
```

**Example**: `4.8 - 2.4 = 2.4 additional sales/month`

---

### Formula 6: Revenue Uplift

```
revenue_uplift = additional_sales × avg_gross_profit
```

**Example**: `2.4 × ₱50,000 = ₱120,000/month estimated uplift`

---

### Formula 7: Net Gain

```
net_gain = revenue_uplift - platform_cost
```

**Example**: `₱120,000 - ₱5,999 = ₱114,001 net gain/month`

---

### Formula 8: ROI Multiple

```
roi_multiple = revenue_uplift / platform_cost
```

Displayed as: "X× ROI" (round to 1 decimal place)

**Example**: `₱120,000 / ₱5,999 = 20.0× ROI`

---

### Formula 9: Payback Period

```
daily_revenue_uplift = revenue_uplift / 30
payback_days = platform_cost / daily_revenue_uplift
```

Displayed as: "X.X days to break even"

**Example**: `₱5,999 / (₱120,000 / 30) = ₱5,999 / ₱4,000 = 1.5 days`

**Display rule**: If payback_days > 30, display in weeks ("X.X weeks"). If payback_days > 90, display in months ("X.X months"). If payback_days ≤ 30, display in days.

---

### Edge Case Handling

| Condition | Behavior |
|---|---|
| `current_leads = 0` | Additional leads = vehicles_sold × multiplier; total = additional only. Show note: "Starting from 0 leads — platform generates all lead volume." |
| `revenue_uplift < platform_cost` (ROI < 1×) | ROI multiple displayed in amber/orange. Breakeven line shown. Copy: "Your projected revenue uplift is less than the platform cost at these inputs. Adjust your inputs or speak with a sales rep about your specific situation." |
| `roi_multiple ≥ 1×` | Output cards displayed in green |
| `vehicles_sold = 1` | Add note: "At low volume, the ROI math is tightest. Consider starting on Verified at ₱2,999/mo." |
| `avg_gross_profit < ₱20,000` | Show soft warning: "Low gross profit per unit can affect ROI at this volume. Confirm this is your typical margin." |
| `conversion_rate ≥ 20%` | Show note: "That's an excellent conversion rate — above the 95th percentile for PH dealers. Confirm this reflects your actual close rate." |

---

## Output Cards

Display five output cards prominently. Cards update in real time as inputs change.

---

### Output Card 1: Estimated Monthly Revenue Uplift

**Label**: Estimated Monthly Revenue Uplift

**Value**: ₱[revenue_uplift formatted with commas, e.g., ₱120,000]

**Subtext**: "vs. your current baseline of ₱[current_sales × avg_gross_profit]"

**Visual treatment**: Largest number on screen. Green background/border if roi_multiple ≥ 1×. Amber if roi_multiple < 1×.

---

### Output Card 2: ROI Multiple

**Label**: Platform ROI

**Value**: [roi_multiple]× ROI

**Subtext**: "For every ₱1 spent on AutoBentaPH [plan_name], you earn ₱[roi_multiple] back"

**Visual treatment**: Secondary headline size. Green if ≥ 1×, amber if < 1×.

---

### Output Card 3: Payback Period

**Label**: Time to Break Even

**Value**: [payback_days] days (or weeks/months per display rule)

**Subtext**: "AutoBentaPH pays for itself in [payback_days] days at these inputs"

**Visual treatment**: Tertiary card, positive blue/green color.

---

### Output Card 4: Additional Leads Per Month

**Label**: Additional Leads/Month

**Value**: +[additional_leads] leads

**Subtext**: "Platform-generated leads added to your existing [current_leads]/month"

**Visual treatment**: Standard card.

---

### Output Card 5: Additional Sales Per Month

**Label**: Additional Estimated Sales/Month

**Value**: +[additional_sales formatted to 1 decimal, e.g., 2.4] sales

**Subtext**: "At [conversion_rate]% conversion, [additional_leads] new leads = [additional_sales] more deals"

**Visual treatment**: Standard card.

---

## Breakeven Line

If `roi_multiple < 1×`, display an additional inline element below the output cards:

**Breakeven Callout**:
> "At your current inputs, the platform cost (₱[platform_cost]) is not yet fully covered by estimated revenue uplift (₱[revenue_uplift]). You'd need to close [breakeven_sales] additional sales/month to break even."

```
breakeven_sales = platform_cost / avg_gross_profit  (rounded up to nearest 0.1)
```

Include a prompt: "Not sure about your inputs? [Book a 15-minute call →] and we'll model this with your real numbers."

---

## UX Notes

### Real-Time Updates

- All output cards update on every input change — no submit button, no loading state
- Use debouncing on text input (Input 2) — update after 300ms pause in typing, not on every keypress
- Slider inputs update immediately on drag

### Mobile Responsiveness

- On mobile (< 768px): stack inputs vertically, output cards in 2×2 grid with revenue uplift spanning full width
- Sliders must be finger-friendly (minimum 44px tap target)

### Color Coding

| State | Color | Trigger |
|---|---|---|
| Positive ROI (≥ 1×) | Green (#22C55E or equivalent) | roi_multiple ≥ 1 |
| Breakeven or marginal (0.5× - 1×) | Amber (#F59E0B) | 0.5 ≤ roi_multiple < 1 |
| Negative ROI (< 0.5×) | Soft red/orange | roi_multiple < 0.5 |

### Plan Toggle Behavior

- Plan toggle is visually prominent — pill/tab style above output cards
- Default: Pro plan selected (higher absolute numbers are more compelling for lead gen)
- When switching to Verified: numbers adjust instantly; output card 1 label updates to "Verified Plan"
- Include note under toggle: "Pro plan includes V8Atlas DMS sync, unlimited listings, and advanced analytics. Verified starts at ₱2,999/mo."

### Optional: Advanced Mode Toggle

A "Show advanced assumptions" expandable section (collapsed by default) can expose:

1. **Platform conversion rate improvement**: Slider 0-5% — models CRM follow-up efficiency improvement on top of baseline conversion rate
2. **Listing quality improvement factor**: Slider 1.0-2.0× — models impact of verified listings on inquiry-to-serious-buyer ratio

Advanced mode should be clearly labeled: "These factors are highly variable. Conservative estimates recommended."

Do not expose advanced mode in the default landing page view. It is available in the demo environment and standalone tool.

### Sharing / Saving Results

In standalone tool mode:
- "Copy link to your results" button — generates URL with input parameters as query string
- "Download as PDF" — generates a one-page summary suitable for a dealer to save or share with a business partner
- No account required for sharing

---

## Disclaimers

Display below output cards at all times. Do not hide behind a toggle.

**Standard Disclaimer**:
*Estimates are based on industry averages for the Philippine used-car market and AutoBentaPH platform data. The reach multiplier (3× additional leads) reflects observed platform performance; individual results depend on listing quality, pricing competitiveness, response time, and market conditions. AutoBentaPH does not guarantee specific revenue outcomes. Actual gross profit per vehicle varies by unit, segment, and negotiation. This calculator is provided for illustrative purposes only.*

**Shortened version for mobile** (if space is constrained):
*Estimates based on PH industry averages. Actual results vary. Not a guarantee of revenue.*

---

## Sales Usage Notes

### Before the Demo

Send the standalone calculator link to the prospect 24 hours before the demo with a note: "Before we talk tomorrow, try plugging in your actual numbers. Takes 30 seconds — we'll review the output together." This primes the dealer to arrive with their numbers and emotionally engages them with the ROI framing before the rep speaks.

### During the Demo

**Step 1 — Establish their baseline**: Start by asking the four input questions as conversation. "How many cars are you selling right now? What does a typical unit earn you? What percentage of people who message you actually buy? And ballpark, how many inquiries are you getting?" Write down their answers, then enter them together.

**Step 2 — Show the output together**: Walk through the output cards in order: uplift → ROI multiple → payback period. Do not rush past the revenue uplift — pause and let the dealer sit with the number. "That's ₱[X] a month. The platform costs ₱5,999. That's the math."

**Step 3 — Stress test it**: Ask: "What number would you trust here? Is ₱50,000 per unit conservative for you?" If they lower the gross profit, let them — even conservative inputs typically show strong ROI at reasonable volumes. If the dealer adjusts the conversion rate down, acknowledge it: "Even at 5%, the math still works at your volume."

**Step 4 — Address the multiplier skepticism**: Some dealers will push back on the 3× reach assumption. Pre-empt this: "This is based on what we see from dealers who list verified units on the platform vs. Facebook. It's not guaranteed — but here's the thing: even at 1.5×, your ROI is still [X]×. Let me show you." Adjust the calculation live.

**Step 5 — Close to next step**: "Based on these numbers, what would it take for you to feel confident trying this for 30 days?" If they hesitate, remind them of the money-back guarantee. "If the first month isn't what you expected, we refund you. No questions."

### Post-Demo Follow-Up

Send a follow-up email with:
1. A link to their pre-filled calculator (URL with their input parameters)
2. The output numbers from the demo session (screenshot or PDF download)
3. The relevant plan recommendation (Verified or Pro)
4. A direct booking link for onboarding if they're ready

### Red Flags in Calculator Conversations

- **Dealer sets conversion rate at 0%**: They may not track leads at all. Pivot from ROI to "let's start by figuring out your actual conversion rate — AutoBentaPH will show you that for the first time."
- **Dealer sets lead volume at 0**: No current lead flow; position AutoBentaPH as lead generation, not lead management. The platform becomes their primary channel, not a supplement.
- **Output shows breakeven or negative ROI at their inputs**: Do not force the close. Acknowledge the math honestly. "At these numbers, the ROI is tighter. That usually means either the volume is low right now or the margin is below typical. Which feels most accurate for your business?" Use this as a diagnostic, not a dead end.
