# Dealer Conversion System — Architecture
*Documents the qualification + conversion system added in the Dealer #1 Conversion Sprint.*

---

## Overview

The conversion system adds structured qualification scoring to the DealerProspect model, enabling the founder to prioritize outreach based on objective criteria rather than intuition. Scores are calculated automatically on every PATCH request and displayed in the CRM frontend at `/admin/founding-dealers`.

---

## Qualification Scoring Fields (DealerProspect Model)

Ten fields added to the `DealerProspect` schema:

| Field | Type | Description |
|-------|------|-------------|
| `monthlyUnits` | Integer | Number of vehicles sold per month (0–50+ range) |
| `painLevel` | Integer (1–5) | Assessed pain severity: 1=no pain, 5=critical pain |
| `currentSystem` | Enum | `none`, `excel`, `facebook`, `philkotse`, `cdk`, `reynolds`, `other` |
| `decisionMakerAccess` | Boolean | Whether the DM has been contacted and confirmed |
| `budget` | Enum | `confirmed`, `likely`, `unknown`, `none` |
| `timeline` | Enum | `immediate` (0–30 days), `soon` (30–60 days), `exploring` (60+), `unknown` |
| `referral` | Boolean | Whether this prospect came through a referral |
| `branches` | Integer | Number of physical locations |
| `teamSize` | Integer | Number of salespeople on their team |
| `qualificationScore` | Integer (0–100) | Calculated field — do not set manually |

---

## Scoring Algorithm

Score is computed from 5 weighted dimensions, totaling 0–100:

```
qualificationScore =
  monthlyUnitsScore (0–20)
  + painLevelScore (0–25)
  + timelineScore (0–20)
  + decisionMakerScore (0–20)
  + budgetScore (0–15)
```

### Monthly Units (0–20 points)
```
50+ units/mo  → 20
25–49 units/mo → 15
10–24 units/mo → 10
5–9 units/mo   → 5
<5 units/mo    → 0
```

### Pain Level (0–25 points)
```
painLevel 5 (critical) → 25
painLevel 4 (high)     → 20
painLevel 3 (medium)   → 12
painLevel 2 (low)      → 5
painLevel 1 (none)     → 0
```

Pain heuristics by current system (use as starting point, adjust after first call):
- `none` (paper-only like Bayanihan) → start at painLevel 5
- `excel` → start at painLevel 4
- `facebook` only → start at painLevel 3
- `cdk` / `reynolds` → start at painLevel 2 (pain is cost, not chaos)

### Timeline (0–20 points)
```
immediate (0–30 days)  → 20
soon (30–60 days)      → 12
exploring (60+ days)   → 5
unknown                → 5
```

### Decision Maker Access (0–20 points)
```
decisionMakerAccess = true  → 20
decisionMakerAccess = false → 0
```

Note: Set to false until you've spoken directly to the person who can sign. Do not assume.

### Budget (0–15 points)
```
budget = confirmed → 15
budget = likely    → 10
budget = unknown   → 5
budget = none      → 0
```

---

## Tier Thresholds

| Tier | Score Range | Action |
|------|-------------|--------|
| Hot | ≥ 70 | Prioritize — demo this week |
| Warm | 40–69 | Follow up within 48 hours with specific ROI |
| Cold | 20–39 | Nurture — re-engage in 2–4 weeks |
| Unqualified | < 20 | Deprioritize — document why, revisit in 60+ days |

---

## Auto-Recalculation on PATCH

When a PATCH request updates any of the 9 input fields on a `DealerProspect` record, the system:

1. Merges the incoming fields with the existing record (partial update — only provided fields change)
2. Recalculates `qualificationScore` from the merged state
3. Derives `qualificationTier` from the new score
4. Returns the updated record including the new score and tier

This means the score always reflects the most current known information. Early calls set conservative values; the score improves as you learn more about the prospect.

**Example:**
- Initial record: `{ monthlyUnits: 25, painLevel: 3, decisionMakerAccess: false, budget: "unknown", timeline: "unknown" }` → score: ~37 (Warm)
- After discovery call: PATCH `{ decisionMakerAccess: true, painLevel: 5, timeline: "immediate" }` → score recalculated to ~82 (Hot)

---

## Frontend Display

### Kanban Card (compact)
- Tier badge in top-right corner of each prospect card: `HOT` (red), `WARM` (amber), `COLD` (blue), `UNQUALIFIED` (gray)
- Badge updates in real time after any edit to the prospect

### Detail Drawer (expanded view)
- **Qualification Panel:** shows all 5 scored dimensions as a visual breakdown
- Editable inline — founder can update `painLevel`, `timeline`, `budget`, `decisionMakerAccess` directly from the drawer after each call
- Score history is not tracked — only the current score matters for daily prioritization

---

## How Qualification Feeds Daily Priority Decisions

1. Morning pipeline review in `/admin/founding-dealers` — sort by `qualificationScore` descending
2. Top 3 Hot-tier prospects → today's call list
3. Any prospect that drops to Warm after a difficult call → move to 48-hour follow-up cadence
4. Cold-tier prospects → do not spend daily outreach time; schedule a re-engage date 2–4 weeks out
5. Unqualified → archive with a note; revisit only if their situation changes (e.g., they expand)

**The score is a prioritization tool, not a verdict.** A Cold prospect with the right referral becomes Hot overnight. Update the score after every meaningful interaction.

---

## Expected Outcome

- Founder spends 80%+ of outreach time on Hot and Warm prospects
- Cold and Unqualified prospects are not ignored — they are systematically deferred
- Over 14-day sprint: at least 3 Hot-tier prospects reached demo stage; at least 1 closes as Dealer #1
- Score accuracy improves each week as discovery call data replaces assumed values
