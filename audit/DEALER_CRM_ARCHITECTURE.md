# Dealer CRM Architecture

**Document:** DEALER_CRM_ARCHITECTURE
**Version:** 1.0
**Date:** 2026-05-31
**Status:** Production

---

## Objective

The CRM system exists to make dealers daily active users of AutoBentaPH — not passive listing publishers who log in once a week to post inventory. Every architectural decision in the CRM is evaluated against one question: does this give a dealer a reason to open the app tomorrow?

Dealers who track leads, log activities, and complete follow-ups on AutoBentaPH are far less likely to churn than those who only post listings. The CRM captures that behavioral data, which also feeds dealer scoring, trust signals, and platform analytics.

---

## Lead Lifecycle

Every buyer inquiry generates a `Lead` record. That record travels through a defined set of stages from first contact to resolution.

```
Lead Created → new → contacted → qualified → test_drive_scheduled
             → financing → negotiating → closed_won / closed_lost
```

Stage transitions are triggered by the dealer manually moving a card on the Kanban board, or automatically by an `AutomationRule`. Each transition appends a `DealerActivity` record to the lead's timeline.

| Stage                  | What it means                                                                 |
|------------------------|-------------------------------------------------------------------------------|
| `new`                  | Inquiry received, dealer has not yet made contact                             |
| `contacted`            | Dealer has called, texted, or emailed the buyer at least once                 |
| `qualified`            | Dealer has confirmed buyer intent, budget range, and vehicle interest         |
| `test_drive_scheduled` | A test drive appointment exists — date and time confirmed                     |
| `financing`            | Buyer is in financing evaluation; dealer may have submitted a financing request |
| `negotiating`          | Price or terms are being actively discussed                                   |
| `closed_won`           | Deal completed; vehicle sold                                                  |
| `closed_lost`          | Lead ended without a sale; `lostReason` field captures why                    |

---

## Lead Model

```prisma
model Lead {
  id              String         // CUID primary key
  dealerId        String         // Owning dealer — leads are not transferable
  inquiryId       String?        // Source inquiry (buyer's original message)
  listingId       String?        // Vehicle the buyer inquired about
  buyerName       String
  buyerEmail      String?
  buyerPhone      String?
  status          InquiryStatus  // Current pipeline stage
  notes           String?        // Freeform dealer notes
  source          String?        // e.g. "organic", "featured", "v8atlas"
  lostReason      String?        // Populated when status = closed_lost
  closedAt        DateTime?      // Timestamp of closed_won or closed_lost
  assignedUserId  String?        // Sub-user (salesperson) assigned to this lead
  nextFollowUpAt  DateTime?      // Drives missed follow-up alerts
  leadScore       Int?           // 0–100; future: AI-scored from engagement signals
  activities      DealerActivity[]
}
```

### Field notes

- `leadScore` is reserved for a future AI scoring pass. Planned inputs: buyer response speed, number of messages sent, whether financing was requested, whether a test drive was completed. Current value: null.
- `source` distinguishes leads that arrived organically (buyer found listing on AutoBentaPH) from leads pushed in from V8Atlas or other integrations.
- `lostReason` is a free-text field today. Future: constrained enum (price_too_high, bought_elsewhere, no_response, financing_denied, changed_mind).
- `assignedUserId` allows a dealer with multiple salespeople to route leads. Sub-user management is a Pro/Enterprise feature.

---

## Activity Timeline

Every meaningful action on a lead or listing is recorded as a `DealerActivity`. This creates an auditable, chronological history of what happened and who did it.

```prisma
model DealerActivity {
  id          String              // CUID
  dealerId    String
  leadId      String?             // Null for listing-level activities
  actorId     String              // User who performed the action
  type        DealerActivityType
  description String              // Human-readable summary
  metadata    Json?               // Structured payload varies by type
  createdAt   DateTime
}
```

| Activity Type          | Trigger                              | Manual or Automatic |
|------------------------|--------------------------------------|---------------------|
| `lead_created`         | New inquiry arrives                  | Automatic           |
| `lead_updated`         | Any field on Lead changes            | Both                |
| `note_added`           | Dealer types a note                  | Manual              |
| `reminder_set`         | DealerReminder created               | Both                |
| `listing_created`      | New VehicleListing posted            | Manual              |
| `listing_sold`         | Listing marked sold                  | Manual              |
| `inquiry_received`     | Buyer submits inquiry                | Automatic           |
| `financing_requested`  | Buyer or dealer triggers financing   | Both                |
| `call_made`            | Dealer logs an outbound call         | Manual              |
| `sms_sent`             | SMS sent via platform                | Both                |
| `email_sent`           | Email sent via platform              | Both                |
| `meeting_held`         | In-person meeting logged             | Manual              |
| `test_drive_completed` | Test drive marked complete           | Manual              |
| `automation_triggered` | AutomationRule fires                 | Automatic           |

The `metadata` JSON carries type-specific data. For `call_made`: `{ duration_seconds, outcome }`. For `sms_sent`: `{ message_preview, delivery_status }`. For `automation_triggered`: `{ ruleId, trigger, actionsExecuted }`.

---

## Kanban Board Design

The pipeline view renders one column per `InquiryStatus` value. Cards represent individual leads.

**Click-to-move design decision:** A dealer drags or clicks a lead card to a new column. The UI fires a `PATCH /api/crm/leads/:id` with `{ status: newStatus }`. The backend validates the transition (no jumping from `new` directly to `closed_won` without intermediate steps — soft warning, not hard block), updates `Lead.status`, and appends a `lead_updated` activity record.

This design was chosen over a form-based status dropdown because it surfaces all leads simultaneously. Dealers visually see where their pipeline is thin (too many leads stuck in `contacted`, none progressing to `qualified`) without running a report.

**Stage counts** are shown in each column header: "Qualified (7)" tells the dealer at a glance that 7 leads need test drive scheduling.

---

## Automation Rules

`AutomationRule` allows dealers to define if-this-then-that logic that fires without manual intervention.

```prisma
model AutomationRule {
  id        String    // CUID
  dealerId  String
  trigger   String    // See trigger types below
  conditions Json     // Filter criteria — see schema below
  actions   Json      // Array of actions — see schema below
  isActive  Boolean
  runCount  Int       // Total times this rule has fired
}
```

### Trigger types

| Trigger              | Fires when                                             |
|----------------------|--------------------------------------------------------|
| `lead_created`       | A new Lead record is inserted for this dealer          |
| `no_response_24h`    | Lead status is still `new` 24 hours after creation     |
| `no_response_72h`    | Lead status is still `new` or `contacted` after 72h    |
| `financing_requested`| A financing request is attached to a lead              |
| `inspection_requested`| Buyer requests a vehicle inspection                  |

### Conditions JSON schema

```json
{
  "leadSource": "organic",
  "minLeadScore": 60,
  "status": ["new", "contacted"]
}
```

All conditions are ANDed. An empty conditions object means the rule fires for all matching leads.

### Actions JSON schema

```json
[
  { "type": "set_status", "value": "contacted" },
  { "type": "add_note", "text": "Auto-flagged: no response after 24h" },
  { "type": "create_reminder", "title": "Follow up urgently", "offsetHours": 2 }
]
```

Each action in the array executes in order. If one fails, subsequent actions still attempt; the failure is logged in the `automation_triggered` activity metadata.

---

## Follow-Up Engine

Two mechanisms surface missed follow-ups to dealers:

1. **`nextFollowUpAt` on Lead** — set manually or by a `create_reminder` automation action. The dashboard "Today's Follow-Ups" widget queries `Lead WHERE nextFollowUpAt <= now AND status NOT IN (closed_won, closed_lost)`.

2. **`DealerReminder` model** — a discrete reminder record that can be linked to a lead.

```prisma
model DealerReminder {
  id        String    // CUID
  dealerId  String
  leadId    String?
  title     String
  dueAt     DateTime
  isDone    Boolean   // Dealer checks this off in the UI
}
```

Reminders that are overdue (`dueAt < now AND isDone = false`) surface in the dashboard notification panel and increment the dealer's "overdue" count. Overdue reminders beyond 48h also count against the dealer's response-time metric, which feeds the dealer score.

**Missed follow-up alert:** a cron job runs every 4 hours and emits in-app notifications for any dealer with reminders more than 2 hours past due. The notification reads: "You have {n} leads with no contact in 72h" — linking directly to those lead cards.

---

## Customer Profile Aggregation

A buyer may inquire on multiple vehicles across multiple leads. AutoBentaPH aggregates these into a unified buyer view.

Aggregation logic: at read time, query `Lead WHERE (buyerEmail = X OR buyerPhone = Y) AND dealerId = Z`, ordered by `createdAt DESC`. The most recent lead is the primary record; older leads are listed as "Previous Inquiries."

This is a read-time aggregation — no separate `Customer` model exists in v1. A dedicated `Customer` model with deduplication logic is planned for v2 when multi-salesperson assignment becomes necessary.

---

## CRM API Endpoints

| Method | Path                               | Description                                      |
|--------|------------------------------------|--------------------------------------------------|
| GET    | `/api/crm/leads`                   | List all leads for the authenticated dealer; supports `?status=`, `?assignedTo=`, `?search=` |
| POST   | `/api/crm/leads`                   | Create a lead manually (walk-in, phone inquiry)  |
| GET    | `/api/crm/leads/:id`               | Fetch a single lead with full activity timeline  |
| PATCH  | `/api/crm/leads/:id`               | Update status, notes, assignedUserId, nextFollowUpAt |
| GET    | `/api/crm/leads/:id/activities`    | Paginated activity log for a lead                |
| POST   | `/api/crm/leads/:id/activities`    | Log a manual activity (call_made, meeting_held, etc.) |
| GET    | `/api/crm/reminders`               | List all reminders for the dealer; `?overdue=true` filter |
| POST   | `/api/crm/reminders`               | Create a reminder (standalone or linked to lead) |

All endpoints require `Authorization: Bearer <dealerToken>` and are scoped to the authenticated dealer's `dealerId`. A dealer cannot access another dealer's leads.

---

## Data Ownership

Leads belong to the dealer who received or created them. This is enforced at the database query level — every CRM query includes `WHERE dealerId = authenticatedDealerId`. There is no admin API for transferring leads between dealers. If a dealer's account is suspended, their leads are retained in the database but the API returns 403 for all CRM endpoints until the account is reinstated.

Lead data is never shared with V8Atlas without explicit dealer opt-in. When V8Atlas integration is enabled, `distributeLeadToProviders()` pushes a copy of the lead to the V8Atlas DMS — but the canonical record always lives in AutoBentaPH's database.
