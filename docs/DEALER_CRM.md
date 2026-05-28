# AutoBenta PH — Dealer CRM Guide

## Overview

The Dealer CRM gives used car dealers a full pipeline from inquiry to closed deal, with analytics, reminders, and activity history.

---

## Lead Pipeline

### Lead States

```
new → contacted → viewing_scheduled → financing → closed_won
                                                 ↘ closed_lost
```

### How Leads Are Created

1. **From an inquiry**: When a buyer sends an inquiry to a dealer's listing, the system automatically creates a `Lead` record linked to the `Inquiry`.
2. **Direct / walk-in**: Dealer manually creates a lead via the CRM panel.

### API

```
GET /api/dealers/me/leads              — list leads (optional ?status=new)
PATCH /api/dealers/me/leads/:leadId    — update status, notes, lostReason
```

**Update lead status:**
```json
PATCH /api/dealers/me/leads/:id
{
  "status": "viewing_scheduled",
  "notes": "Test drive scheduled for Saturday 10am"
}
```

**Close a lost deal:**
```json
{
  "status": "closed_lost",
  "lostReason": "Buyer purchased elsewhere"
}
```

---

## Analytics Dashboard

```
GET /api/dealer/analytics
```

Returns:
```json
{
  "dealer": { "id": "...", "businessName": "..." },
  "listings": { "total": 12, "active": 8, "sold": 3, "byStatus": [...] },
  "leads": {
    "total": 45,
    "new30Days": 12,
    "won": 8,
    "lost": 5,
    "winRate": 18,
    "conversionRate": 62,
    "byStatus": [...]
  },
  "inventory": { "aging30": 4, "aging60": 2, "aging90": 1 },
  "recentActivities": [...],
  "upcomingReminders": [...]
}
```

**Win rate** = won / total leads × 100  
**Conversion rate** = won / (won + lost) × 100

### Inventory Aging

Listings still `active` after a certain number of days since `listedAt`:
- **30+ days**: may need a price adjustment
- **60+ days**: stale — consider refreshing photos or description
- **90+ days**: critically stale — typically priced too high

---

## Reminders

Dealers can set task reminders with a due date, optionally linked to a lead.

### API

```
GET  /api/dealer/analytics/reminders          — pending reminders (add ?done=true for completed)
POST /api/dealer/analytics/reminders          — create reminder
PATCH /api/dealer/analytics/reminders/:id     — mark done, update title/notes/dueAt
```

**Create:**
```json
{
  "title": "Follow up with Juan on Vios test drive",
  "dueAt": "2024-06-15T10:00:00.000Z",
  "leadId": "lead-uuid",
  "notes": "He asked about financing options"
}
```

**Mark done:**
```json
{ "isDone": true }
```

Overdue reminders (dueAt < now, isDone = false) are highlighted in red in the frontend.

---

## Activity Log

All significant CRM events are recorded as `DealerActivity` entries:

| Type | Trigger |
|------|---------|
| `lead_created` | New lead received |
| `lead_updated` | Lead status changed |
| `note_added` | Note added to lead |
| `reminder_set` | Reminder created |
| `listing_created` | New listing published |
| `listing_sold` | Listing marked sold |
| `inquiry_received` | New buyer inquiry |
| `financing_requested` | Financing request on a listing |

```
GET /api/dealer/analytics/activities
```

Returns the 50 most recent activities for the dealer.

---

## Frontend Panels

### DealerPanel (tabbed)

The main dealer page at `/dealer` has three tabs:

1. **Lead Pipeline** — kanban-style list with status filter pills. Click any lead to open a detail panel, update status, and add notes.

2. **Analytics** — stat cards (active listings, total leads, win rate, sold units), inventory aging chart, upcoming reminders widget, and recent activity feed.

3. **Reminders** — list of pending/completed reminders. Create new via "+ New" button.

---

## Lead Source Tracking

The `Lead.source` field tracks how the lead originated:
- `inquiry` (default) — from a buyer message
- `direct` — dealer manually entered
- `referral` — referred by another customer
- `walk-in` — in-person visit

Set at creation; update via PATCH.
