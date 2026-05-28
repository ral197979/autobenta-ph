# AutoBenta PH — Listing Moderation Workflow

## Overview

All new listings enter `pending` status and must be approved before they appear on the marketplace. Admins manage the queue from the **Moderation** tab in the Admin Panel.

---

## Listing Status Flow

```
draft → pending → active    (approved by admin)
               → rejected   (rejected by admin)
               → flagged    (suspicious, under review)

active → archived           (seller archives it)
       → sold               (seller marks sold)
       → flagged            (admin flags active listing)

flagged → pending           (admin restores for re-review)
        → active            (admin approves after review)
        → rejected          (admin permanently rejects)
```

---

## Moderation Actions

| Action | New Status | Use Case |
|--------|-----------|----------|
| `approve` | `active` | Listing is clean, go live |
| `reject` | `rejected` | Fraudulent, duplicate, violates ToS |
| `flag` | `flagged` | Suspicious but needs more investigation |
| `request_info` | unchanged | Ask seller for clarification |
| `escalate` | unchanged | Flag for senior review |
| `suspend_seller` | unchanged (+ user suspended) | Seller is a bad actor |
| `restore` | `pending` | Return flagged/rejected listing to queue |

---

## Fraud Score in Moderation

The queue is sorted by `fraudScore` descending — highest-risk listings appear first.

| fraudScore | Risk | Action recommended |
|-----------|------|-------------------|
| 0–24 | Low | Quick approve if photos and price are reasonable |
| 25–49 | Medium | Review carefully, check all disclosures |
| 50–74 | High | Scrutinize — likely has multiple issues |
| 75+ | Critical | Strong likelihood of fraud; consider reject |

---

## Admin API Reference

### Get moderation queue

```
GET /api/admin/moderation?page=1&limit=20&minFraudScore=0
Authorization: Bearer <admin-token>
```

Response includes unresolved fraud flags per listing.

### Take action

```
POST /api/admin/moderation/:listingId
Authorization: Bearer <admin-token>

{
  "action": "approve" | "reject" | "flag" | "request_info" | "escalate" | "suspend_seller" | "restore",
  "reason": "Optional explanation",
  "details": {}   // optional JSON
}
```

### View action history

```
GET /api/admin/moderation/:listingId/history
```

Returns all `ListingModerationAction` records for the listing, newest first.

---

## Moderation Queue UI

The **Moderation** tab in `/admin` shows:
- Listing thumbnail + title + price
- Seller name and relative creation time
- Photo count
- Fraud flag badges (color-coded by severity)
- Fraud score badge
- Action buttons: Approve (green), Reject (red), Flag (orange), Request Info (blue)

Clicking Reject, Flag, or Request Info opens a modal for entering a reason. Approve is immediate.

---

## Seller Suspension

When an admin takes the `suspend_seller` action:
1. `User.isSuspended` is set to `true`
2. `User.suspendReason` is set to the admin's reason
3. All future requests from that user return `403 Account suspended`
4. The `SellerRiskProfile.riskLevel` is updated on next fraud engine run

To restore: use `PATCH /api/admin/users/:id` with `{ isSuspended: false }`.

---

## Audit Trail

Every moderation action is recorded in two places:
1. `ListingModerationAction` table (listing-scoped, viewable via history endpoint)
2. `AuditLog` table (global tamper-evident chain, viewable in Admin → Audit Logs tab)

Action format in AuditLog: `listing.{action}` (e.g., `listing.approve`, `listing.suspend_seller`)
