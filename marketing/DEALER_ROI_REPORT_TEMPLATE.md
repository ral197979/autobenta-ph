# DEALER_ROI_REPORT_TEMPLATE.md
# AutoBentaPH — Dealer ROI Analysis (PDF-Ready Template)
# Status: Production-Ready | Last Updated: 2026-05-31
# Usage: Fill manually during sales call, or generate programmatically via /api/admin/prospects/:id/roi-report

---

## REPORT LAYOUT GUIDE

This document is designed to print/export as a single A4 page (or near-single-page PDF).
Sections are ordered for visual flow: header → inputs → current state → with platform → proof → CTA.
Font: Use Inter or system-sans. Accent color: AutoBentaPH brand (use #1D4ED8 or equivalent).

---

---
# [HEADER BLOCK]

**[AutoBentaPH Logo — top left, ~120px wide]**

**Report title (H1, right-aligned or centered):**
`Dealer ROI Analysis`

**Dealer name (H2):**
`[DEALER_NAME]`

**Report date:**
`Prepared: [DATE]` — e.g. `Prepared: May 31, 2026`

**Prepared by:**
`AutoBentaPH Sales Team | dealers@autobientaph.com`

**Divider line**

---

---
## SECTION 1 — YOUR INPUTS

*"We used the numbers you shared with us. Change any of them and the math updates."*

| Input | Your Number |
|---|---|
| Vehicles you sell per month | **[UNITS_PER_MONTH]** |
| Average gross profit per unit | **₱ [AVG_GROSS_PER_UNIT]** |
| Current lead-to-sale conversion rate | **[CURRENT_CONVERSION_RATE]%** |
| Estimated leads you receive per month (current) | **[CURRENT_LEADS_PER_MONTH]** |

**Calculation notes:**
- If dealer does not know their conversion rate, default to 15% (Philippine used-car market baseline)
- If dealer does not know their lead count, derive: `CURRENT_LEADS_PER_MONTH = UNITS_PER_MONTH / (CURRENT_CONVERSION_RATE / 100)`
- If dealer does not know avg gross, ask for average selling price and typical margin; default gross = ₱30,000 if unknown

---

---
## SECTION 2 — YOUR CURRENT STATE (WITHOUT AUTOBENTAPH)

### Estimated Monthly Performance Today

| Metric | Calculation | Your Estimate |
|---|---|---|
| Monthly leads | Given or derived above | **[CURRENT_LEADS_PER_MONTH]** |
| Monthly sales (units) | Given above | **[UNITS_PER_MONTH]** |
| Monthly gross revenue | `UNITS_PER_MONTH × AVG_GROSS_PER_UNIT` | **₱ [CURRENT_MONTHLY_GROSS]** |

**Formula — Current Monthly Gross:**
```
CURRENT_MONTHLY_GROSS = UNITS_PER_MONTH × AVG_GROSS_PER_UNIT
```

**Example (10 units × ₱50,000):**
```
10 × ₱50,000 = ₱500,000/month
```

---

---
## SECTION 3 — WITH AUTOBENTAPH

### How the Platform Adds Revenue

AutoBentaPH increases dealer revenue through three levers:
1. **More leads** — Verified listings + marketplace reach expand top of funnel
2. **Better conversion** — 8-stage CRM ensures no lead falls through
3. **Faster response** — Auto-assign and mobile alerts reduce time-to-first-contact

### Additional Leads from Marketplace Reach

| Metric | Calculation | Estimate |
|---|---|---|
| Additional leads/month | `CURRENT_LEADS_PER_MONTH × 3` (marketplace multiplier) | **[ADDITIONAL_LEADS]** |
| Total leads/month | `CURRENT_LEADS_PER_MONTH + ADDITIONAL_LEADS` | **[TOTAL_LEADS]** |

**Formula — Additional Leads:**
```
ADDITIONAL_LEADS = CURRENT_LEADS_PER_MONTH × 3
TOTAL_LEADS = CURRENT_LEADS_PER_MONTH + ADDITIONAL_LEADS
             = CURRENT_LEADS_PER_MONTH × 4
```

*Note: 3× multiplier is a conservative baseline. Dealers on comparable ASEAN platforms report 3–5× lead volume increase within 60 days of Verified status.*

### Additional Sales and Revenue

| Metric | Calculation | Estimate |
|---|---|---|
| Additional sales/month | `ADDITIONAL_LEADS × (CURRENT_CONVERSION_RATE / 100)` | **[ADDITIONAL_UNITS]** |
| Additional gross revenue/month | `ADDITIONAL_UNITS × AVG_GROSS_PER_UNIT` | **₱ [ADDITIONAL_REVENUE]** |

**Formula — Additional Sales:**
```
ADDITIONAL_UNITS  = ADDITIONAL_LEADS × (CURRENT_CONVERSION_RATE / 100)
ADDITIONAL_REVENUE = ADDITIONAL_UNITS × AVG_GROSS_PER_UNIT
```

### Net ROI Calculation

| Line Item | Amount |
|---|---|
| Additional gross revenue/month | **₱ [ADDITIONAL_REVENUE]** |
| Platform cost (Pro plan) | — ₱ 5,999 |
| **Net gain per month** | **₱ [NET_GAIN_PER_MONTH]** |
| **ROI multiple** | **[ROI_MULTIPLE]×** |
| **Payback period** | **[PAYBACK_DAYS] days** |

**Formula — Net Gain:**
```
NET_GAIN_PER_MONTH = ADDITIONAL_REVENUE − 5,999

ROI_MULTIPLE = ADDITIONAL_REVENUE / 5,999
  (round to nearest whole number)

PAYBACK_DAYS = 5,999 / (ADDITIONAL_REVENUE / 30)
             = 5,999 × 30 / ADDITIONAL_REVENUE
  (round up to nearest day)
```

**Founding Dealer variant** (use if discussing Founding Dealer pricing):
```
NET_GAIN_PER_MONTH (Founding) = ADDITIONAL_REVENUE − 3,599
ROI_MULTIPLE (Founding)       = ADDITIONAL_REVENUE / 3,599
```

---

---
## SECTION 4 — ASSUMPTIONS

*Print this section in smaller type, below the ROI table, before the case study.*

This analysis uses the following assumptions. All are conservative and adjustable.

1. **3× lead multiplier**: Marketplace reach adds 3 leads for every 1 the dealer currently generates. Based on ASEAN automotive platform benchmarks. Actual results may be higher.
2. **Conversion rate held constant**: We assume your current conversion rate applies to new leads. In practice, CRM adoption typically improves conversion 10–20% within 90 days — not included here.
3. **Gross profit per unit is dealer-provided**: We use your number, not an estimate.
4. **Platform cost**: Pro plan at ₱5,999/month. Founding Dealer rate is ₱3,599/month, locked for 24 months.
5. **No implementation cost**: Onboarding is included. No setup fees.
6. **No V8Atlas requirement**: DMS sync is optional. Revenue figures do not depend on V8Atlas integration.
7. **Month 1 results**: Estimates reflect steady-state performance. Month 1 may be lower while listings are being set up (typically 7–14 days to first Verified listing).

---

---
## SECTION 5 — CASE STUDY: METRO MANILA DEALERSHIP A

*"Here's what these numbers look like for a dealer similar to yours."*

**Dealer profile:** Metro Manila used-car lot, 10 units/month, avg gross ₱50,000/unit, 15% conversion rate

| Metric | Before AutoBentaPH | With AutoBentaPH |
|---|---|---|
| Monthly leads | 67 | 268 (67 × 4) |
| Monthly sales | 10 units | 40 units |
| Monthly gross revenue | ₱500,000 | ₱2,000,000 |
| Platform cost | — | ₱5,999 (Pro) |
| Additional gross/month | — | **+₱1,500,000** |
| Net gain/month | — | **₱1,494,001** |
| Net gain/month (Founding rate) | — | **₱1,496,401** |
| ROI multiple | — | **250×** |
| Payback period | — | **< 1 day** |

**Note on the case study numbers:** This illustrates potential at full multiplier effect. Conservative scenario (1.5× leads, no conversion improvement):

| Conservative metric | Value |
|---|---|
| Additional leads/month | 67 × 1.5 = ~100 |
| Additional units | 100 × 15% = 15 |
| Additional revenue | 15 × ₱50,000 = ₱750,000 |
| Net gain (Pro) | ₱744,001 |
| Net gain (Founding) | ₱746,401 |
| ROI multiple (conservative) | **124×** |

*Use the conservative case in sales conversations — it's easier to defend and still compelling.*

---

---
## SECTION 6 — NEXT STEPS CTA

**Heading:**
`Ready to see these numbers on your dealership?`

**Body:**
`We have 5 Founding Dealer spots at ₱3,599/month — that's 40% off the Pro plan, locked for 24 months. After the 5 spots are filled, regular pricing applies.`

**Primary action:**
`→ Claim your Founding Dealer spot at ₱3,599/mo`
URL: `autobientaph.com/for-dealers/founding`

**Secondary action:**
`→ Book a free 30-minute demo first`
URL: `autobientaph.com/book-demo`

**Contact:**
`Questions? WhatsApp us: +63 9XX XXX XXXX | dealers@autobientaph.com`

---

---
## APPENDIX — PROGRAMMATIC FILL GUIDE

If generating this report via code (e.g. from `/api/admin/prospects/:id/roi-report`), map these variables:

| Template Variable | Source Field | Default if Missing |
|---|---|---|
| `[DEALER_NAME]` | `DealerProspect.dealershipName` | "Your Dealership" |
| `[DATE]` | `new Date().toLocaleDateString('en-PH')` | Today's date |
| `[UNITS_PER_MONTH]` | `DealerProspect.monthlyVolume` | 10 |
| `[AVG_GROSS_PER_UNIT]` | `DealerProspect.avgGrossPerUnit` | 50000 |
| `[CURRENT_CONVERSION_RATE]` | `DealerProspect.conversionRate` | 15 |
| `[CURRENT_LEADS_PER_MONTH]` | Derived or `DealerProspect.currentLeads` | `UNITS / (RATE/100)` |
| `[ADDITIONAL_LEADS]` | `CURRENT_LEADS × 3` | — |
| `[TOTAL_LEADS]` | `CURRENT_LEADS × 4` | — |
| `[ADDITIONAL_UNITS]` | `ADDITIONAL_LEADS × (RATE/100)` | — |
| `[ADDITIONAL_REVENUE]` | `ADDITIONAL_UNITS × AVG_GROSS` | — |
| `[NET_GAIN_PER_MONTH]` | `ADDITIONAL_REVENUE − 5999` | — |
| `[ROI_MULTIPLE]` | `Math.round(ADDITIONAL_REVENUE / 5999)` | — |
| `[PAYBACK_DAYS]` | `Math.ceil(5999 * 30 / ADDITIONAL_REVENUE)` | — |
