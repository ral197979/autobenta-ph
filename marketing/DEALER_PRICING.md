# AutoBentaPH — Dealer Pricing Strategy
## Internal Reference Document

---

## Pricing Philosophy

### Value-Based Pricing Rationale for the Philippine Market

AutoBentaPH is priced against the value it creates for a dealer, not against the cost of software delivery. The benchmark is simple: a Philippine used-car dealer with an average gross profit of ₱30,000-₱80,000 per vehicle needs to close one additional unit per month to justify the Verified plan. That is a low bar for a tool that professionalizes their entire sales process.

**The core equation**:
- Average dealer gross profit per unit: ₱30,000-₱80,000
- Verified plan: ₱2,999/mo → 1 additional sale per month at any price point justifies the entire cost
- Pro plan: ₱5,999/mo → 2 additional sales per month justifies the cost, even conservatively

This means the platform sells itself on math, not on feature lists. Every sales conversation should return to this equation.

**Why not free or freemium**:
A free tier attracts hobbyist sellers, not professional dealers. AutoBentaPH's value depends on dealer quality — low-quality listings erode the trust score ecosystem for everyone. The paywall filters for dealers who have a real business and can justify the spend.

**Why not ₱999/mo**:
Underpricing signals low quality in a market where buyers are already skeptical. A ₱2,999/mo platform reads as "professional business tool." A ₱999/mo platform reads as "another listing site." The price anchors perception.

**Why not ₱15,000/mo**:
The Philippine mid-market dealer (5-50 vehicles/month) is price-sensitive and accustomed to free Facebook tools. The jump to paid needs to feel achievable in month one. ₱2,999 and ₱5,999 are psychologically accessible price points that don't require CFO approval.

---

## Plan Details — Full Feature Matrix

### Pricing Summary

| Plan | Monthly | Annual | Annual Savings |
|---|---|---|---|
| Verified Dealer | ₱2,999/mo | ₱29,990/yr | Save ₱5,998 (2 months free) |
| Dealer Pro | ₱5,999/mo | ₱59,990/yr | Save ₱11,998 (2 months free) |
| Enterprise | Custom | Custom | Negotiated |
| Founding Dealer (closed offer) | ₱3,599/mo | ₱43,188/yr | Locked for life |

---

### Full Feature Matrix

| Feature | Verified Dealer | Dealer Pro | Enterprise |
|---|---|---|---|
| **LISTINGS** | | | |
| Active listings | 20 | Unlimited | Unlimited |
| AI Listing Wizard (photo-to-listing) | Yes | Yes | Yes |
| LTO OR/CR document upload | Yes | Yes | Yes |
| V8Atlas Trust Score on listings | Yes | Yes | Yes |
| Listing expiry / auto-renewal | 30 days | 60 days | Custom |
| Featured listing slots | Add-on | Included (2/mo) | Custom |
| **LEAD CRM** | | | |
| 8-stage lead pipeline | Yes | Yes | Yes |
| Lead notes and activity log | Yes | Yes | Yes |
| Follow-up reminders | Yes | Yes | Yes |
| Lead import (CSV / manual) | Yes | Yes | Yes |
| Lead export | Yes | Yes | Yes |
| Lead credits (pay-per-lead) | Yes | Included pool | Included pool |
| Lead assignment (multi-user) | — | Yes | Yes |
| **V8ATLAS INTEGRATION** | | | |
| V8Atlas Trust Score | Yes | Yes | Yes |
| V8Atlas DMS Sync (CDK/Reynolds/DealerSocket) | Add-on (₱3,000/mo) | Yes | Yes |
| Live inventory push (DMS → listings) | Add-on | Yes | Yes |
| Sold unit auto-unpublish | Add-on | Yes | Yes |
| Vehicle history API | — | Yes | Yes |
| **ANALYTICS** | | | |
| Basic dashboard (views, inquiries, clicks) | Yes | Yes | Yes |
| Lead velocity tracking | — | Yes | Yes |
| Conversion funnel analytics | — | Yes | Yes |
| Source attribution | — | Yes | Yes |
| Inventory turn rate reporting | — | Yes | Yes |
| Dealer scorecard (A/B/C/D rank) | — | Yes | Yes |
| Revenue projection | — | Yes | Yes |
| Custom report builder | — | — | Yes |
| Data export (CSV/API) | — | Yes | Yes |
| **SUPPORT** | | | |
| Support SLA | 48 hours | 8 hours | 4 hours |
| Email support | Yes | Yes | Yes |
| Chat support | — | Yes | Yes |
| Phone / Viber support | — | — | Yes |
| Dedicated account manager | — | — | Yes |
| Onboarding call | — | Yes | Yes |
| **PLATFORM** | | | |
| Dealer profile page | Yes | Yes | Yes |
| Mobile-responsive dashboard | Yes | Yes | Yes |
| Multi-user accounts (staff logins) | 2 users | 5 users | Unlimited |
| Multi-branch management | — | — | Yes |
| White-label / custom branding | — | — | Yes |
| API access | — | — | Yes |
| Custom domain | — | — | Yes |
| SSO / enterprise auth | — | — | Yes |
| SLA-backed uptime | 99.5% | 99.9% | 99.9% |

---

### Plan Billing Options

**Verified Dealer**
- Monthly: ₱2,999/mo, billed monthly on subscription date
- Annual: ₱29,990/yr, billed upfront (equivalent to ₱2,499/mo — saves ₱5,998)

**Dealer Pro**
- Monthly: ₱5,999/mo, billed monthly
- Annual: ₱59,990/yr, billed upfront (equivalent to ₱4,999/mo — saves ₱11,998)

**Enterprise**
- Custom contract: typically annual, with quarterly billing option
- Multi-year discounts negotiated on a case-by-case basis
- SOW (Statement of Work) required for API and white-label features

**Founding Dealer**
- ₱3,599/mo, annual commitment required
- Rate locked for life of account — does not increase at renewal
- Billed annually at ₱43,188/yr

---

## Annual Pricing Detail

**Offer framing**: "Pay annually and get 2 months free."

Do not frame it as a discount percentage — "2 months free" is a stronger mental model than "17% off." It maps directly to calendar time.

**Annual billing psychological note**: Annual commitment also reduces churn. A dealer who has prepaid for the year has more incentive to fully onboard and use the platform vs. one who can cancel month-to-month. Push annual during sales calls for any dealer who expresses commitment.

**Annual plan specifics**:
- Verified annual: ₱29,990/yr (vs ₱35,988 monthly × 12)
- Pro annual: ₱59,990/yr (vs ₱71,988 monthly × 12)
- Proration on upgrade: if upgrading from Verified to Pro mid-year, credit remaining Verified balance against Pro

---

## Add-Ons (Current + Future Roadmap)

### Currently Available

| Add-On | Price | Notes |
|---|---|---|
| Extra listing slots (Verified only, beyond 20) | ₱500/listing/mo | Max 10 extra slots via add-on; beyond that, upgrade to Pro |
| Featured homepage slot | ₱2,500/week | Top placement on AutoBentaPH homepage and search results; 1 listing per week |
| V8Atlas DMS sync (Verified plan upgrade) | ₱3,000/mo | Adds full V8Atlas CDK/Reynolds/DealerSocket sync to Verified plan |

### Lead Credit Packs (Pay-Per-Lead Top-Ups)

Lead credits allow dealers to unlock contact details on verified buyer leads. Verified plan includes a monthly credit allocation; Pro includes a larger pool. Additional credits purchasable at any time:

| Pack | Price | Per-Credit Cost |
|---|---|---|
| 10 credits | ₱999 | ₱99.90/lead |
| 50 credits | ₱3,999 | ₱79.98/lead |
| 100 credits | ₱6,999 | ₱69.99/lead |

Credits expire 90 days from purchase. Do not roll over between billing months unless purchased as a pack.

### Planned Add-Ons (Roadmap)

| Add-On | Est. Price | Stage |
|---|---|---|
| AutoBentaPH buyer advertising (promote listing to buyers) | ₱1,500-₱5,000/campaign | Q3 roadmap |
| Dealer website builder (AutoBentaPH-hosted) | ₱2,000/mo | Q4 roadmap |
| SMS/Viber lead notification upgrade | ₱500/mo | Q2 roadmap |
| Chatbot lead qualifier (WhatsApp / Messenger integration) | ₱3,000/mo | Q4 roadmap |

---

## Competitive Price Positioning

### The Competitive Landscape

| Platform | Model | Effective Cost | What You Get |
|---|---|---|---|
| Facebook Marketplace | Free | ₱0 | Basic listing, Messenger leads, no CRM, no verification, no analytics |
| Philkotse.com | Per-listing fee | ~₱1,500/listing/mo | Listing placement, no CRM, no DMS sync |
| OLX Philippines | Per-listing or subscription | ~₱800-₱2,000/mo | Listing placement, minimal dealer tools |
| CDK Global | Full DMS | ₱200,000-₱500,000+/yr | Enterprise DMS, not a consumer marketplace |
| AutoTrader (PH) | N/A / not established | — | No dominant equivalent in PH market |
| **AutoBentaPH Verified** | SaaS subscription | **₱2,999/mo** | CRM + verified listings + analytics + lead credits |
| **AutoBentaPH Pro** | SaaS subscription | **₱5,999/mo** | All of above + V8Atlas DMS sync + unlimited listings + scorecard |

### Positioning Arguments by Competitor

**vs. Facebook Marketplace (Free)**:
Facebook is free and will stay free. The argument is not cost — it is professionalism, trust, and operational efficiency. A dealer managing 30 leads on Messenger is losing deals they don't even know they're losing. AutoBentaPH costs ₱2,999/mo and turns that chaos into a closeable pipeline. The ROI argument closes this every time: one additional sale pays for 10 months.

**vs. Philkotse / OLX**:
Philkotse charges per listing, provides no CRM, no verification layer, no analytics. A dealer with 15 listings on Philkotse is spending ₱22,500/mo for what amounts to a billboard with no sales infrastructure behind it. AutoBentaPH at ₱2,999/mo gives them more listings, better trust signals, and the CRM to actually work the leads those listings generate.

**vs. CDK / Reynolds & Reynolds (Enterprise DMS)**:
These are accounting and inventory systems, not marketplaces. They don't generate leads. They don't have buyer-facing listing platforms. They don't provide trust scores. AutoBentaPH is not a DMS replacement — it is the consumer-facing layer that connects DMS data to buyers. For Enterprise dealers already running CDK/Reynolds, AutoBentaPH via V8Atlas sync is additive infrastructure, not competitive.

### Positioning Summary Statement (Sales Use)
"Facebook is free, but you're not getting serious buyers and you're losing track of leads. Philkotse gives you a listing but no system to work it. CDK is your back-office DMS — it doesn't talk to buyers. AutoBentaPH is the layer in between: it puts your verified inventory in front of buyers who trust it, and gives you a real CRM to close them."

---

## ROI Justification by Price Point

### Verified Dealer — ₱2,999/mo

**Breakeven requirement**: 1 additional sale per month at ₱30,000 gross profit (low end).

At ₱30K gross profit per vehicle, one additional closed deal generates ₱30,000. AutoBentaPH costs ₱2,999. Net gain: ₱27,001.

Even at the most conservative estimates — 10% improvement in lead follow-up, 5 additional leads per month, 8% conversion — a 10-vehicle/month dealer generates 0.4 additional sales/month, meaning breakeven inside 3 months.

**Who this justification works best for**: Dealers moving fewer than 20 vehicles/month who have never had a systematic follow-up process. The CRM alone captures deals that were previously falling through Messenger cracks.

### Dealer Pro — ₱5,999/mo

**Breakeven requirement**: 2-3 additional sales per month at ₱30,000 gross profit.

The Pro plan adds V8Atlas DMS sync, unlimited listings, and advanced analytics. For a dealer moving 20-50 vehicles/month, the analytics alone (identifying which lead sources actually convert) can reduce wasted marketing spend by ₱10,000-₱30,000/month — more than covering the subscription.

**Who this justification works best for**: Dealers spending money on advertising or paying lead-gen services who have no way to measure which spend is working. Analytics ROI is often faster than lead volume ROI.

**Secondary argument**: For dealers with DMS systems, V8Atlas sync eliminates the manual labor of updating listings. At even ₱500/hour labor cost and 3 hours/week of manual updates, the DMS sync pays for itself at ₱6,000/month in labor savings — roughly equal to the Pro plan cost.

### Enterprise — Custom Pricing

**ROI model is bespoke by account.** Key value drivers for Enterprise:
- Multi-branch inventory consolidation (eliminate duplicate management labor)
- White-label platform (build brand equity, not AutoBentaPH's)
- API integration (embed trust data in own website and showroom)
- Dedicated account manager (business advisory, not just support)

For Enterprise deals, build a custom ROI model in the sales conversation using:
1. Number of branches × labor hours saved by centralized management
2. White-label brand value (long-term equity vs. renting space on a third-party marketplace)
3. API value (custom integrations that create switching costs = your defensible position)

Minimum viable Enterprise deal: ₱15,000/mo. Typical range: ₱20,000-₱60,000/mo depending on branch count and custom build requirements.

---

## Discounting Policy

### Hard Floors

| Plan | Floor Price |
|---|---|
| Verified Dealer | ₱2,499/mo (never below) |
| Dealer Pro | ₱4,999/mo (never below) |
| Enterprise | Negotiated; no floor, but log any deal below ₱15,000/mo |
| Founding Dealer | ₱3,599/mo (this is already below-floor Pro; no further discounting) |

### Standard Discounts Available

1. **Annual billing**: 2 months free (Verified: ₱29,990/yr; Pro: ₱59,990/yr) — this is the only standard discount and can be offered by any sales rep without approval
2. **Founding Dealer rate**: ₱3,599/mo Pro equivalent — closed offer, 5 spots only, requires manager confirmation

### Non-Standard Discounts (Require Approval)

- Any monthly price below the floor prices listed above
- Discounts framed as "trial period at reduced rate" (these convert to churn, not upgrades)
- Multi-year deals at more than 20% off annual rate

### What Not To Do

- Do not offer "3 months free" as an alternative close — it trains the market to wait for deals
- Do not offer a free month extension when a dealer threatens to cancel — this is a churn risk signal; escalate to retention playbook instead
- Do not negotiate on feature access (e.g., "we'll give you Pro features at Verified price") — this undermines the plan tier structure

---

## Trial and Free Tier Policy

### No Free Tier

AutoBentaPH does not offer a free plan. Rationale:
- Free users do not represent the dealer persona (professional, volume-selling dealership)
- Free users degrade listing quality and trust scores for paying dealers
- Free-to-paid conversion rates in B2B SaaS typically run 2-5%; the effort of managing free users is not worth the conversion at current stage
- The ₱2,999 paywall is a quality filter, not a barrier

### 14-Day Money-Back Guarantee (Monthly Plans)

- Applicable to first month only
- Requested within 14 days of first charge
- Full refund, no questions asked
- Applies to Verified and Pro monthly plans
- Does not apply to annual plans after 30 days
- Annual plans: pro-rated refund within first 30 days

**How to communicate this**: "We're confident in the platform. If you sign up and it's not right for your dealership within two weeks, we'll refund you completely. No questions."

### Demo Environment

- Available to any prospect, no credit card required
- Pre-populated with sample dealer data (Metro Manila used-car dealer profile)
- Accessed at `/demo` or via sales team link
- Time-limited session (24-48 hours, extendable by sales rep)
- Does not connect to live LTO or V8Atlas data in demo mode

---

## Plan Upgrade and Downgrade Rules

### Upgrades (Verified → Pro, or any plan upward)

- Effective immediately upon upgrade confirmation
- Prorated billing: remaining days on current plan credited against new plan cost
- Access to new features (DMS sync, advanced analytics) enabled within 15 minutes of upgrade
- Annual plan upgrade: remaining value of annual term applied as credit to new annual term

### Downgrades (Pro → Verified)

- Effective at end of current billing period (no immediate downgrade)
- Data retained: all CRM leads, listing history, analytics history preserved
- Active listings over the new plan limit (20 for Verified): dealer selects which to keep active; remainder move to draft status (not deleted)
- V8Atlas DMS sync: disconnected at downgrade; re-syncing requires Pro reactivation

### Cancellation

- Cancel anytime; no cancellation fee
- Access continues through end of paid period
- Data export available in CSV format within 30 days of cancellation
- After 30 days post-cancellation: data archived (recoverable within 12 months on reactivation, then purged)
- Listings unpublished immediately upon cancellation of subscription

---

## Churn Prevention Triggers

### When to Escalate to Retention

Flag an account for retention review when any of the following occur:

1. **No CRM activity for 14+ days**: Dealer signed up but is not using the CRM — at-risk of "didn't work because I didn't use it" churn
2. **0 listings in first 7 days**: Onboarding friction; assign to onboarding support immediately
3. **Support ticket volume > 3 in 30 days**: Frustration signal; proactive check-in call
4. **Downgrade request**: Do not process immediately — route to retention conversation first
5. **Cancellation request**: Trigger retention playbook before processing

### Retention Playbook

**Step 1**: Understanding call (within 24 hours of churn signal)
- Objective: understand the actual reason (not using vs. ROI concern vs. competitive vs. business change)
- Do not offer a discount on this call — diagnose first

**Step 2**: Address the real problem
- Not using → Assign onboarding session, show quick wins (import 5 leads, create 1 listing)
- ROI concern → Walk through ROI calculator with their actual data
- Competitive → Re-anchor on differentiation vs. Facebook/Philkotse
- Business change → Acknowledge and offer pause (hold account active 30 days, no charge)

**Step 3**: Retention offer (only if steps 1-2 fail)
- Verified plan: offer 1 free month extension (not a price reduction)
- Pro plan: offer downgrade to Verified (retain revenue, reduce churn)
- Annual plan: offer to convert remaining months to credits

### Retention Discount Authorization

- 1 free month extension: any support rep can authorize, once per account lifetime
- Price reduction (to floor): requires manager approval
- Below-floor price to retain: requires director approval; document reason

---

## Founding Dealer Program — Pricing Details

**Rate**: ₱3,599/mo (Dealer Pro equivalent, all Pro features)
**Discount from Pro monthly**: 40% off ₱5,999 = ₱2,400/mo savings
**Commitment**: Annual (₱43,188/yr upfront or ₱3,599/mo with annual contract)
**Spots**: 5 total; track and update sales materials when spots are filled
**Grandfathering**: Rate locked for life of account — explicitly stated in contract
**SLA**: 4-hour support response (Enterprise SLA at Pro rate)
**Product influence**: Monthly check-in with product team; feature requests logged and prioritized
**Badge**: Founding Dealer badge displayed on dealer profile and listings
**Exclusivity**: One spot per legal entity; cannot be transferred or sold

**Sales guidance**: Position the Founding Dealer offer as closing — when a Pro-interested dealer is on the fence, "we have one Founding spot remaining" is a strong close. Do not offer Founding pricing to dealers who have not expressed interest in Pro features.
