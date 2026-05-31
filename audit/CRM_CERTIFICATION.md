# Dealer CRM Certification

**Document:** CRM_CERTIFICATION  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production  
**Auditor:** System audit via code review

---

## Lead Lifecycle

Leads flow through the `InquiryStatus` enum with the following stages:

```
new → contacted → qualified → test_drive_scheduled → financing → negotiating → closed_won
                                                                              → closed_lost
```

Status transitions are applied via `PATCH /api/dealer/leads/:id`. The route confirms `dealerId: dealer.id` ownership before applying any update. `firstSaleAt` is set on first `closed_won` transition and is not overwritten on subsequent closes.

---

## Lead Ownership

`PATCH /me/leads/:id` in `backend/src/routes/dealers.js` resolves the lead using:

```js
prisma.lead.findFirst({ where: { id: leadId, dealerId: dealer.id } })
```

If the lead does not belong to the authenticated dealer, the result is `null` and the route returns 404. Dealers cannot update leads owned by other dealers.

---

## Activity Tracking

Activities are stored in the `DealerActivity` model. `DealerActivityType` enum values cover the full CRM action set (call, email, note, test drive, offer, contract, follow-up, and other interaction types). Activity create and read routes in `backend/src/routes/dealers.js` scope all queries to `dealerId: dealer.id`.

---

## Pipeline

The dealer CRM implements an 8-stage Kanban pipeline corresponding to the `InquiryStatus` enum. Leads can be moved between stages via the pipeline UI (click-to-move), which calls `PATCH /api/dealer/leads/:id` with the new status. All pipeline mutations go through the same ownership-checked route.

---

## Follow-ups

The `DealerReminder` model stores scheduled follow-up events per lead. The `Lead` model includes a `nextFollowUpAt` timestamp field that is updated when a reminder is created or completed. Reminder read and write routes in `backend/src/routes/dealers.js` scope all queries to `dealerId: dealer.id`.

---

## Automation

The `AutomationRule` model stores dealer-configured automation rules with the following structure:

- `trigger` — event that fires the rule (e.g., lead status change, time elapsed)
- `conditions` — JSON array of conditions that must match
- `actions` — JSON array of actions to execute (e.g., send email, assign tag, update status)

Automation rules are dealer-scoped and cannot reference or affect other dealers' leads.

---

## Customer Aggregation (P2-02)

**File:** `backend/src/routes/dealers.js`, `GET /me/customers`

The current implementation loads all leads for the authenticated dealer into Node.js memory and groups them by buyer identity using JavaScript. At current scale this is acceptable. At 10,000+ leads per dealer, this will produce slow responses and high memory usage.

**Recommended fix:** Replace in-memory grouping with a database-side `GROUP BY` query. Not blocking for launch.

---

## Data Integrity

- Lead status transitions update `updatedAt` on every change
- `firstSaleAt` is set once on first `closed_won` and never overwritten
- `nextFollowUpAt` is updated when reminders are created or resolved
- Automation rule conditions and actions are stored as JSON — no schema validation on the JSON structure itself (future hardening recommended)

---

## Findings

| ID | Finding | Status |
|---|---|---|
| P2-02 | Customer aggregation loads all dealer leads into memory — will degrade at 10K+ leads | Open |

---

## Verdict: PASS WITH NOTES

Lead ownership, pipeline transitions, activities, follow-ups, and automation are all correctly implemented with tenant isolation. P2-02 (in-memory customer aggregation) is not blocking at current scale but should be addressed before significant lead volume accumulates.
