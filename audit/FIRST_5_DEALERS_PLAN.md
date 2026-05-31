# FIRST_5_DEALERS_PLAN.md
# AutoBentaPH — First 5 Paying Dealers: Executive Plan
# Status: Active | Last Updated: 2026-05-31
# Sprint: Founding Dealer Acquisition Sprint

---

## 1. Current Status (As of Sprint Completion)

All systems required to acquire, onboard, and retain the first 5 dealers are live and production-certified.

### Platform Readiness

| Area | Status | Score / Note |
|---|---|---|
| Overall platform certification | Production-ready | 90/100 |
| Security | Certified | Tenant isolation, encrypted credentials, JWT auth |
| Uptime / disaster recovery | Certified | Docker, backup scripts, health monitoring live |
| CRM (8-stage pipeline) | Certified | Full lead lifecycle management |
| Inventory + Verified listings | Certified | V8Atlas sync optional |
| Analytics dashboard | Certified | Inventory turnover, conversion, revenue |
| Billing / subscriptions | Certified | Stripe integration, plan management |

### Demo Environment

| Asset | Status |
|---|---|
| Seeded vehicles | 50 vehicles across make/model mix |
| Seeded leads | 50 leads across CRM stages |
| Analytics data | Fully populated, realistic distributions |
| Admin dashboard | Live at `/admin` |
| Demo dealer account | Active, accessible for live walkthroughs |

### Sales Toolkit

| Asset | Status | Location |
|---|---|---|
| Pitch deck | Complete | `/sales/` |
| Objection handling guide | Complete | `/sales/` |
| Demo script | Complete | `/sales/` |
| Competitive positioning | Complete | `/sales/` |
| ROI report template | Complete | `/marketing/DEALER_ROI_REPORT_TEMPLATE.md` |
| Founding Dealer offer doc | Complete | `/marketing/FOUNDING_DEALER_OFFER.md` |

### Landing Pages and Acquisition Infrastructure

| Page / System | Status | URL |
|---|---|---|
| Dealer landing page | Live | `/for-dealers` |
| Founding Dealer page | Live | `/for-dealers/founding` |
| Demo booking page | Live | `/book-demo` |
| Acquisition CRM | Live | `/admin/founding-dealers` |
| Growth dashboard | Live | `/admin/growth` |

---

## 2. Ideal Customer Profile (ICP)

These are the characteristics of the dealer most likely to become a paying customer, refer others, and provide useful product feedback.

### Primary ICP

| Attribute | Target |
|---|---|
| Location | Metro Manila (NCR) — priority region for founding cohort |
| Inventory volume | 10–50 vehicles/month |
| Current listing channel | Facebook Marketplace, Philkotse, or Carmudi |
| Inquiry management | Facebook Messenger (manually, no CRM) |
| Team size | 1–5 people including owner |
| Decision maker | Business owner — not a hired general manager |
| DMS / CRM | None — or V8Atlas only |
| Tech comfort | Uses smartphone, Facebook, basic web apps |

### Secondary ICP (acceptable, not ideal)

| Attribute | Range |
|---|---|
| Location | Cebu, Davao, Laguna, Cavite |
| Inventory volume | 5–10 vehicles/month |
| Decision maker | Hired GM with owner's buy-in |

### Disqualifying Signals

- Franchise group with 3+ branches (needs enterprise tier, not yet available)
- Already has a full DMS and CRM (switching cost too high at founding stage)
- Owner is not involved in the sales process (long approval chain)
- Primary channel is auction/wholesale (not our marketplace's strength)

---

## 3. Go-to-Market Approach

### No paid advertising at founding stage

Paid acquisition (Meta Ads, Google Ads) will not be used to acquire the first 5 dealers. Rationale:
- CAC from paid channels at low volume is not informative
- The founding relationship requires personal trust — not a click-through conversion
- Manual outreach lets us qualify prospects before they see the platform

### Channel 1: Manual Founder Outreach (primary)

**Method:** Founder personally contacts 20 target dealers via Facebook Messenger, LinkedIn, or phone. Goal is a 30-minute demo call, not a cold pitch.

**Opening message framing:**
> "I'm building an operations platform for used-car dealers in the Philippines. We're looking for 5 dealers to be our founding partners — you get 40% off for 24 months and real influence over what we build next. Can I show you 30 minutes of the product?"

**Target list:** 20 dealers identified from Philkotse, OLX, and Facebook Marketplace listings in Metro Manila. Prioritize dealers with 20+ active listings (signals active inventory management need).

**Goal:** 20 outreach messages → 10 replies → 5 demos booked

### Channel 2: Inbound via /for-dealers (secondary)

**Method:** SEO-optimized landing page at `/for-dealers` and `/book-demo`. Organic search traffic from Philippine dealers searching for dealer CRM, inventory management, or Philkotse alternatives.

**Timeline:** SEO is a 60–90 day channel. Unlikely to generate founding dealer conversions before Month 2. Plant the seeds now.

**Action:** Submit sitemap to Google Search Console. Ensure `/book-demo` page is indexed.

### Channel 3: Referral from Dealer 1 (Month 2+)

**Method:** After the first paying dealer is live and satisfied, ask explicitly:
> "Do you know 2–3 other dealers who might benefit from this? I'll give them the same Founding Dealer rate if they sign up through your referral."

**No formal referral program yet** — this is a relationship ask, not an incentive structure. Add a formal referral bonus (e.g., 1 month free per referral) once we have 5 dealers and understand the LTV math.

---

## 4. Week-by-Week Milestones

### Week 1 (Days 1–7)

**Goal:** Pipeline populated, demos scheduled

| Milestone | Target |
|---|---|
| Prospects in acquisition CRM (`/admin/founding-dealers`) | 20 |
| Outreach messages sent | 20 |
| Demo bookings (via `/book-demo` or direct schedule) | 5 |
| Demo booking page live and indexed | Done |
| Founding Dealer offer doc distributed to every prospect | Done |

**Success check:** Is the `/admin/growth` pipeline showing 20 prospects and 5 in `DEMO_SCHEDULED` stage?

---

### Week 2 (Days 8–14)

**Goal:** Demos completed, proposals in hand

| Milestone | Target |
|---|---|
| Demos completed | 5 |
| ROI reports sent post-demo | 5 |
| Founding Dealer proposals sent | 2 |
| Prospects advanced to `PROPOSAL_SENT` | 2 |
| Objections documented | All objections logged in `/admin/founding-dealers` notes |

**Success check:** Do we have at least 2 prospects who have received a proposal and have not said no?

---

### Week 3 (Days 15–21)

**Goal:** First paying dealer live

| Milestone | Target |
|---|---|
| First paying dealer activated | 1 |
| Dealer onboarding session completed | 1 |
| First Verified listing live | 1 |
| 5 additional prospects added to CRM | 5 (total now 25) |
| 3 more demos scheduled | 3 |

**Success check:** Is there at least 1 `Dealer` record in the database with `plan: "FOUNDING"` and an active subscription? Is their first listing live?

---

### Week 4 (Days 22–30)

**Goal:** 2–3 paying dealers, first renewal signal

| Milestone | Target |
|---|---|
| Paying dealers (cumulative) | 2–3 |
| Day 7 NPS response collected from Dealer 1 | Done |
| NPS score ≥ 7 from Dealer 1 | Target |
| Feature requests captured from each paying dealer | ≥ 1 per dealer |
| First referral ask made to Dealer 1 | Done |
| MRR (confirmed) | ₱7,198–₱10,797 |

**Success check:** Can we project a realistic path to 5 dealers by Day 45 based on the pipeline?

---

## 5. Risk Factors and Mitigations

### Risk 1: Slow demo-to-close cycle

**Description:** Philippine SME decision-making can involve multiple conversations, family consultation, or budget timing issues. Demo does not convert in 1 week.

**Mitigation:**
- Founding Dealer scarcity (5 spots) creates genuine urgency without artificial pressure
- Follow up on Day 3 after proposal: "Two other dealers are reviewing the same offer this week."
- Offer 14-day money-back to reduce commitment anxiety

**Acceptable outcome:** If close cycle is 2–3 weeks, we still reach 5 dealers by Day 45. Adjust week-by-week milestones accordingly.

---

### Risk 2: Price objection

**Description:** ₱3,599/month feels expensive relative to ₱0 (Facebook Marketplace) or ~₱1,500/month (basic Philkotse subscription).

**Mitigation:**
- Always lead with the ROI report, not the price: "You sell 10 cars/month. If we add 30 more leads/month and you close 15% of them, that's 4.5 more cars — at ₱50K gross, that's ₱225,000 more per month."
- Frame ₱3,599 as the cost of one tire rotation, not a software subscription
- Offer to do the demo on their actual inventory numbers — makes the math concrete

**Fallback position:** If price is genuinely prohibitive, offer the Verified Dealer plan (₱2,999/month) — still better than Philkotse with a CRM included.

---

### Risk 3: "We need to see more dealers using it first"

**Description:** Social proof objection — dealers want to know others have validated the product before they commit.

**Mitigation:**
- Demo environment has 50 vehicles and 50 leads — it looks like a working dealer platform, not an empty prototype
- Platform is production-certified (90/100) — share the certification summary if asked
- Counter-frame: "That's exactly why Founding Dealer pricing exists. You're not paying full price to be a guinea pig — you're getting 40% off because you're helping us prove it."
- First signing creates proof for the second. Move fast on Dealer 1.

---

### Risk 4: V8Atlas integration complexity

**Description:** Dealers using V8Atlas may want to see the integration working before signing up, which creates a dependency on a third-party system.

**Mitigation:**
- Demo works fully without V8Atlas — show the standalone platform first
- V8Atlas integration is optional and documented as such in all materials
- Frame it as a bonus: "If you use V8Atlas, we eliminate double-entry entirely. If you don't, the platform still gives you full inventory and CRM management."
- Integration setup is part of the onboarding session — it does not delay go-live

---

### Risk 5: Founder bandwidth

**Description:** Manual outreach + demo delivery + onboarding + CS all by one person is unsustainable beyond 5 dealers.

**Mitigation:**
- The 5-dealer founding cohort is explicitly a bounded sprint, not a permanent state
- Document all processes during founding sprint (objection handling, onboarding checklist) so they can be delegated or systematized at scale
- If bandwidth is genuinely a constraint by Week 3, prioritize onboarding quality over new outreach — a successful Dealer 1 is worth 3 prospects

---

## 6. Definition of Success (This Sprint)

The Founding Dealer Acquisition Sprint is complete and successful when:

| Success Criterion | Target | How Measured |
|---|---|---|
| Paying dealers | 5 | `Dealer` records with active Founding subscription |
| Monthly recurring revenue | ₱17,995–₱29,995 MRR | Stripe MRR dashboard |
| Day 30 NPS | ≥ 7 (per dealer) | `NPSResponse.score` average across active dealers |
| Feature requests captured | ≥ 1 per dealer | `FeatureRequest` records linked to founding dealers |
| Involuntary churn | 0 | No `Dealer` with `status: CANCELLED` |
| Health score | ≥ 60 per dealer at Day 30 | `DealerSuccessPlan.healthScore` |

**MRR targets:**

| Scenario | Dealers | Price | MRR |
|---|---|---|---|
| Minimum viable | 5 Founding | ₱3,599 | ₱17,995 |
| Mixed (3 Founding + 2 Pro) | 5 | blended | ₱22,793 |
| All Pro | 5 | ₱5,999 | ₱29,995 |

---

## 7. Next Steps After 5 Dealers

### Immediate (Days 31–45)

1. **Collect Day 30 NPS** from all 5 dealers
2. **Run first quarterly roadmap session** with each Founding Dealer (can be group call or individual)
3. **Review `FeatureRequest` table** — identify the top 3 requests by compositeScore
4. **Begin referral conversations** with dealers who scored NPS ≥ 8

### Short Term (Month 2–3)

1. **Formalize pricing** — validate whether ₱5,999 Pro is the right public price based on founding dealer feedback and willingness to pay signals from demos that did not close
2. **Begin inbound optimization** — use demo booking data to understand which demo types and objections are most common; update `/for-dealers` copy accordingly
3. **Hire / engage first CS person** if health score monitoring and support volume exceed 5 hours/week for the founder
4. **Roadmap sprint 2** — execute the top-frequency feature requests from founding dealers

### Medium Term (Month 3–6)

1. **Begin paid acquisition** — with validated ICP and conversion benchmarks from founding cohort, run small Meta Ads test (₱10,000 budget) targeting Metro Manila car dealer pages
2. **Open Verified Dealer plan** to general signups — the Founding Dealer program closes; standard pricing applies
3. **Case study publication** — with first dealer's permission, publish a named case study: "How [Dealer Name] added ₱X revenue/month with AutoBentaPH"
4. **Enterprise plan scoping** — if any of the 5 dealers expresses multi-branch or franchise needs, begin discovery for the Enterprise tier

---

## 8. Appendix: Acquisition Funnel Benchmarks

Use these to assess whether the pipeline is healthy at each stage.

| Stage | Input | Target Conversion | Output |
|---|---|---|---|
| Outreach sent | 20 | 50% open/reply | 10 |
| Demo booked | 10 | 50% | 5 |
| Demo completed | 5 | 80% | 4 |
| Proposal sent | 4 | 75% | 3 |
| Closed (signed) | 3 | 67% | 2 |
| 30-day retained | 2 | 100% | 2 |

**Overall funnel:** 20 outreach → 2 paying dealers at Day 30. Run 2 waves (40 outreach total) to reach 5 dealers.

**If conversion drops below benchmark at any stage:**
- Demo booked < 25%: Revise outreach message; adjust ICP targeting
- Demo → Proposal < 50%: Demo is not creating value; review demo script
- Proposal → Close < 40%: Price objection or urgency gap; add stronger Founding Dealer scarcity framing
- 30-day retention < 80%: Onboarding or product quality issue; escalate to engineering

---

## 9. Related Files

- Acquisition system: `/audit/DEALER_ACQUISITION_SYSTEM.md`
- Customer success: `/audit/CUSTOMER_SUCCESS_ARCHITECTURE.md`
- Feedback loop: `/audit/DEALER_FEEDBACK_LOOP.md`
- Founding Dealer offer: `/marketing/FOUNDING_DEALER_OFFER.md`
- ROI report template: `/marketing/DEALER_ROI_REPORT_TEMPLATE.md`
- Demo booking copy: `/marketing/DEMO_BOOKING_PAGE_COPY.md`
- Sales toolkit: `/sales/`
