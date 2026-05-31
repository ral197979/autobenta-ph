# Dealer Network API Specification

**Document:** DEALER_NETWORK_API_SPEC  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production

---

## Base URLs

| Domain | Base Path | Description |
|---|---|---|
| Dealer self-service | `/api/dealers/*` | Public-facing dealer registration and profile management |
| Dealer portal | `/api/dealer/*` | Authenticated dealer operations (portal-only) |
| Admin operations | `/api/admin/*` | Admin-only dealer management |
| Analytics | `/api/analytics/*` | Event tracking and marketplace metrics |

---

## Authentication

All endpoints require Bearer JWT unless marked public.

```
Authorization: Bearer <jwt_token>
```

**Role requirements:**
- `dealer` — active dealer account (DealerProfile must exist)
- `admin` — platform administrator
- `public` — no auth required

Tokens are issued via the platform auth flow (`POST /api/auth/login`). Dealer tokens include `dealerId` in the JWT payload for downstream authorization.

---

## Dealer Self-Service Endpoints

### POST /api/dealers/register

Create a new dealer record. Called after user account creation.

| Field | Type | Required |
|---|---|---|
| `businessName` | string | Yes |
| `businessType` | string | Yes (`individual` \| `company`) |
| `location` | string | Yes |
| `phone` | string | Yes |

**Response:** `{ dealerId, status: 'pending' }`

**Auth:** Bearer JWT (role: authenticated user)

---

### POST /api/dealers/apply

Submit a dealer application with supporting documents. Creates a `DealerApplication` record.

| Field | Type | Required |
|---|---|---|
| `businessName` | string | Yes |
| `businessRegistrationNo` | string | Yes |
| `businessPermitUrl` | string | Yes (file URL) |
| `governmentIdUrl` | string | Yes (file URL) |
| `dealerType` | string | Yes (`used` \| `certified` \| `franchise`) |
| `monthlyVolume` | number | No |
| `preferredPlan` | string | No (`free` \| `verified` \| `pro` \| `enterprise`) |

**Response:** `{ applicationId, status: 'submitted', estimatedReviewDays: 3 }`

**Auth:** Bearer JWT (role: authenticated user)

---

### GET /api/dealers/apply

Get current application status for the authenticated user.

**Response:**
```json
{
  "applicationId": "app_xxx",
  "status": "submitted | under_review | approved | rejected",
  "submittedAt": "2026-05-31T00:00:00Z",
  "reviewNotes": "string | null",
  "currentStep": 2,
  "totalSteps": 4
}
```

**Auth:** Bearer JWT (role: authenticated user)

---

### PATCH /api/dealers/apply/step/:step

Update a specific step of an in-progress application. Used by the multi-step apply wizard.

**Path param:** `step` — integer (1–4)

**Request body:** Step-specific fields (varies by step number)

**Response:** `{ applicationId, step, status: 'updated' }`

**Auth:** Bearer JWT (role: authenticated user, owns application)

---

### GET /api/dealers/me/profile

Get the full dealer profile for the authenticated dealer.

**Response:**
```json
{
  "dealerId": "dpl_xxx",
  "businessName": "ABC Motors",
  "isVerified": true,
  "tier": "pro",
  "score": 82,
  "rank": "A",
  "businessHours": { "mon": "8:00-18:00", ... },
  "branches": [...],
  "subscription": { "plan": "pro", "status": "active" }
}
```

**Auth:** Bearer JWT (role: dealer)

---

### PATCH /api/dealers/me/profile

Update dealer profile fields and business hours.

| Field | Type |
|---|---|
| `businessName` | string |
| `description` | string |
| `phone` | string |
| `website` | string |
| `businessHours` | object `{ day: "HH:MM-HH:MM" }` |
| `logoUrl` | string |

**Response:** `{ dealerId, updatedAt }`

**Auth:** Bearer JWT (role: dealer)

---

### GET /api/dealers/me/subscription

Get current subscription status and feature entitlements.

**Response:**
```json
{
  "plan": "pro",
  "status": "active",
  "billingCycle": "monthly",
  "expiresAt": null,
  "trialEndsAt": null,
  "features": {
    "maxListings": 100,
    "analytics": true,
    "crm": true,
    "priorityPlacement": true,
    "leadRouting": true,
    "v8atlasSync": false,
    "multiBranch": false,
    "apiAccess": false,
    "verificationBadge": true
  }
}
```

**Auth:** Bearer JWT (role: dealer)

---

### POST /api/dealers/me/branches

Add a new branch location to the dealer's account.

**Feature gate:** `multiBranch`

| Field | Type | Required |
|---|---|---|
| `name` | string | Yes |
| `address` | string | Yes |
| `city` | string | Yes |
| `phone` | string | No |
| `managerName` | string | No |

**Response:** `{ branchId, dealerId, name, address }`

**Auth:** Bearer JWT (role: dealer)

---

### GET /api/dealers/me/branches

List all branches for the authenticated dealer.

**Feature gate:** `multiBranch`

**Response:** `{ branches: [{ branchId, name, address, city, phone, isActive }] }`

**Auth:** Bearer JWT (role: dealer)

---

## Dealer CRM Endpoints

### GET /api/dealers/me/leads

List leads assigned to the dealer with filtering.

**Feature gate:** `crm`

**Query params:**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by status: `new \| contacted \| qualified \| lost \| won` |
| `listingId` | string | Filter by specific listing |
| `from` | date | Date range start |
| `to` | date | Date range end |
| `page` | int | Pagination (default 1) |
| `limit` | int | Results per page (default 20, max 100) |

**Response:**
```json
{
  "leads": [
    {
      "leadId": "ld_xxx",
      "buyerName": "Juan dela Cruz",
      "buyerPhone": "+63...",
      "listingId": "lst_xxx",
      "vehicleTitle": "2019 Toyota Vios",
      "status": "new",
      "createdAt": "2026-05-31T08:00:00Z",
      "lastContactedAt": null,
      "notes": ""
    }
  ],
  "pagination": { "page": 1, "total": 45, "pages": 3 }
}
```

**Auth:** Bearer JWT (role: dealer)

---

### PATCH /api/dealers/me/leads/:id

Update lead status and/or notes.

**Feature gate:** `crm`

| Field | Type |
|---|---|
| `status` | `new \| contacted \| qualified \| lost \| won` |
| `notes` | string |
| `nextFollowUpAt` | datetime |

**Response:** `{ leadId, status, updatedAt }`

**Auth:** Bearer JWT (role: dealer, owns lead)

---

## Dealer Analytics Endpoints

### GET /api/dealer/analytics

Overview stats for the dealer dashboard.

**Feature gate:** `analytics`

**Query params:** `period` (default: `30d`, options: `7d \| 30d \| 90d`)

**Response:**
```json
{
  "period": "30d",
  "listingViews": 1240,
  "inquiries": 87,
  "leadsReceived": 34,
  "leadsConverted": 8,
  "conversionRate": 0.235,
  "avgResponseTimeHours": 2.4,
  "activeListings": 47,
  "soldThisPeriod": 8
}
```

**Auth:** Bearer JWT (role: dealer)

---

### GET /api/dealer/analytics/scorecard

Dealer scorecard: 0–100 score with factor breakdown and A/B/C/D rank.

**Feature gate:** `analytics`

**Response:**
```json
{
  "score": 82,
  "rank": "A",
  "factors": {
    "verified": { "points": 25, "max": 25, "achieved": true },
    "tier": { "points": 15, "max": 20, "plan": "pro" },
    "winRate": { "points": 28, "max": 30, "rate": 0.235 },
    "responseTime": { "points": 8, "max": 10, "avgHours": 2.4 }
  },
  "trend": "+4 points vs last 30 days"
}
```

**Auth:** Bearer JWT (role: dealer)

---

## Dealer Billing Endpoints

### GET /api/dealer/billing/invoices

List all invoices for the dealer.

**Query params:** `status` (filter), `page`, `limit`

**Response:**
```json
{
  "invoices": [
    {
      "invoiceId": "inv_xxx",
      "amount": 2999,
      "currency": "PHP",
      "status": "paid",
      "dueDate": "2026-06-01",
      "paidAt": "2026-05-28",
      "plan": "pro",
      "billingCycle": "monthly"
    }
  ],
  "pagination": { "page": 1, "total": 6, "pages": 1 }
}
```

**Auth:** Bearer JWT (role: dealer)

---

### GET /api/dealer/billing/invoices/:id

Invoice detail with line items and payment records.

**Response:**
```json
{
  "invoiceId": "inv_xxx",
  "amount": 2999,
  "currency": "PHP",
  "status": "paid",
  "lineItems": [
    { "description": "Pro Plan — Monthly", "quantity": 1, "unitPrice": 2999, "total": 2999 }
  ],
  "payments": [
    { "paymentId": "pay_xxx", "amount": 2999, "status": "completed", "processor": "gcash", "paidAt": "2026-05-28" }
  ]
}
```

**Auth:** Bearer JWT (role: dealer)

---

## Analytics Endpoints

### POST /api/analytics/events

Track a marketplace event.

| Field | Type | Required |
|---|---|---|
| `event` | string | Yes (`listing_view \| listing_click \| inquiry_sent \| ...`) |
| `listingId` | string | No |
| `dealerId` | string | No |
| `metadata` | object | No |

**Response:** `{ tracked: true }`

**Auth:** Public (anonymous events accepted)

---

### GET /api/analytics/funnel

Conversion funnel: view → inquiry → lead → sale.

**Query params:** `period`, `dealerId` (admin only)

**Response:**
```json
{
  "period": "30d",
  "funnel": [
    { "stage": "listing_views", "count": 45200 },
    { "stage": "inquiries", "count": 3840 },
    { "stage": "leads", "count": 1920 },
    { "stage": "sales", "count": 384 }
  ],
  "conversionRates": {
    "view_to_inquiry": 0.085,
    "inquiry_to_lead": 0.5,
    "lead_to_sale": 0.2
  }
}
```

**Auth:** Bearer JWT (role: admin)

---

### GET /api/analytics/trust-impact

Badge uplift measurement — conversion rate for verified vs unverified dealers.

**Response:**
```json
{
  "period": "30d",
  "verified": { "inquiryRate": 0.12, "conversionRate": 0.28 },
  "unverified": { "inquiryRate": 0.07, "conversionRate": 0.15 },
  "uplift": { "inquiryRate": "+71%", "conversionRate": "+87%" }
}
```

**Auth:** Bearer JWT (role: admin)

---

### GET /api/analytics/marketplace

Marketplace health metrics.

**Response:**
```json
{
  "activeListings": 8420,
  "activeDealers": 312,
  "dailyLeads": 144,
  "verifiedDealerShare": 0.48,
  "avgDaysToSell": 22.4,
  "topCategories": ["Sedan", "SUV", "Pickup"]
}
```

**Auth:** Bearer JWT (role: admin)

---

### GET /api/analytics/listing/:id/performance

Performance score and stats for a specific listing.

**Response:**
```json
{
  "listingId": "lst_xxx",
  "performanceScore": 74,
  "views": 340,
  "inquiries": 12,
  "inquiryRate": 0.035,
  "daysActive": 18,
  "pricePosition": "below_market",
  "recommendations": ["Add more photos", "Enable priority placement"]
}
```

**Auth:** Bearer JWT (role: dealer, owns listing)

---

## Admin — Dealer Management Endpoints

### GET /api/admin/dealers

List all dealers with filters.

**Query params:** `status`, `tier`, `isVerified`, `search`, `page`, `limit`

**Response:** `{ dealers: [...], pagination: {...} }`

**Auth:** Bearer JWT (role: admin)

---

### GET /api/admin/dealers/:id

Full dealer profile: subscription, branches, members, recent leads, scorecard.

**Response:** Complete dealer object with all relations

**Auth:** Bearer JWT (role: admin)

---

### PATCH /api/admin/dealers/:id

Update dealer tier or verification status manually.

| Field | Type | Description |
|---|---|---|
| `tier` | string | `free \| verified \| pro \| enterprise` |
| `isVerified` | boolean | Grant or revoke verification |
| `plan` | string | Override subscription plan |
| `reason` | string | Audit log reason (required) |

**Response:** `{ dealerId, updatedAt, changes: [...] }`

**Auth:** Bearer JWT (role: admin)

---

### PATCH /api/admin/dealers/:id/verify

Toggle dealer verification (shorthand for verification workflow).

**Request:** `{ isVerified: true | false, reason: string }`

**Side effects:** Triggers trust propagation to all active listings if `isVerified: true`

**Response:** `{ dealerId, isVerified, updatedAt }`

**Auth:** Bearer JWT (role: admin)

---

### PATCH /api/admin/dealers/:id/suspend

Suspend or unsuspend a dealer account.

**Request:** `{ suspended: true | false, reason: string }`

**Side effects on suspend:**
- All active listings deactivated
- Leads locked (read-only)
- Login still allowed (view-only mode)

**Response:** `{ dealerId, suspended, reason, updatedAt }`

**Auth:** Bearer JWT (role: admin)

---

### GET /api/admin/applications

List all dealer applications.

**Query params:** `status` (`submitted \| under_review \| approved \| rejected`), `page`, `limit`

**Response:** `{ applications: [...], counts: { submitted: n, under_review: n, ... } }`

**Auth:** Bearer JWT (role: admin)

---

### PATCH /api/admin/applications/:id

Approve or reject a dealer application.

| Field | Type | Required |
|---|---|---|
| `action` | string | Yes (`approve \| reject`) |
| `reason` | string | Required on reject |
| `plan` | string | On approve: starting plan (default: `free`) |

**Side effects on approve:**
- DealerProfile created (if not exists)
- User role updated to `dealer`
- DealerSubscription created with specified plan
- Welcome email sent to applicant

**Response:** `{ applicationId, action, dealerId (on approve) }`

**Auth:** Bearer JWT (role: admin)

---

## Admin — Billing Endpoints

### GET /api/admin/billing/invoices

List all invoices across all dealers.

**Query params:** `status`, `dealerId`, `from`, `to`, `page`, `limit`

**Response:** `{ invoices: [...], totals: { paid: n, outstanding: n } }`

**Auth:** Bearer JWT (role: admin)

---

### POST /api/admin/billing/invoices

Create a manual invoice for a dealer.

| Field | Type | Required |
|---|---|---|
| `dealerId` | string | Yes |
| `amount` | number | Yes |
| `dueDate` | date | Yes |
| `lineItems` | array | Yes |
| `notes` | string | No |

**Response:** `{ invoiceId, dealerId, amount, status: 'open' }`

**Auth:** Bearer JWT (role: admin)

---

### PATCH /api/admin/billing/invoices/:id

Update an invoice (status, add notes, mark failed).

| Field | Type |
|---|---|
| `status` | `open \| paid \| void \| failed` |
| `notes` | string |
| `paidAt` | datetime |

**Response:** `{ invoiceId, status, updatedAt }`

**Auth:** Bearer JWT (role: admin)

---

## Error Response Format

All error responses follow this structure:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "currentPlan": "free",
  "upgradeUrl": "/dealer/subscription/upgrade"
}
```

| HTTP Status | When |
|---|---|
| 400 | Invalid request body / missing required fields |
| 401 | Missing or invalid JWT |
| 403 | Valid JWT but insufficient role or feature entitlement |
| 404 | Resource not found or not owned by caller |
| 409 | Conflict (e.g., application already exists) |
| 429 | Rate limit exceeded |
| 503 | Integration disabled (e.g., V8Atlas webhooks when disabled) |
