# Inspection Conversion Fix

**Document:** INSPECTION_CONVERSION_FIX  
**Severity:** P1 — UX / Conversion  
**Date:** 2026-05-31  
**Status:** Resolved

---

## Root Cause

The `TrustSection` on the homepage contained a card:

> **Inspection-ready**  
> "Book an inspection" → `/inspections`

`/inspections` was registered in `App.jsx` as a `<ProtectedRoute>` — requiring authentication before the page rendered. An unauthenticated visitor clicking this card was immediately redirected to `/login` with no context about what they were about to book, no explanation of the service, and no incentive to create an account.

This is a textbook **intent-before-authentication** failure: the user had demonstrated interest (clicked a trust CTA on the homepage) but was met with a login wall before receiving any value. The result is a conversion dead-end.

**Verified during audit:** Navigating to `/inspections` as an unauthenticated user → `302` redirect → `/login`, `h1: "Welcome back"`.

---

## Principle Applied

> **Authentication should occur only after user intent is demonstrated.**

Users should be able to discover, learn, and evaluate a service before being asked to create an account. The booking step — where real user commitment occurs — is the correct authentication gate, not the landing page.

This matches industry-standard conversion architecture:

```
Discovery (public) → Evaluation (public) → Intent (public) → Action (auth required)
```

---

## Solution

Created `/inspection-services` — a fully public landing page requiring no authentication. Authentication is triggered only when the user clicks **Book Inspection** or **Book now** (plan cards).

### Auth gate logic

```javascript
const handleBook = () => {
  if (user) {
    navigate('/inspections');   // authenticated — go directly to booking
  } else {
    navigate('/login?redirect=/inspections');  // unauthenticated — login then return
  }
};
```

The existing `/inspections` route (authenticated booking flow) is preserved unchanged.

---

## Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/InspectionServices.jsx` | **Created** — public landing page |
| `frontend/src/App.jsx` | Added `<Route path="/inspection-services" element={<InspectionServices />} />` (no ProtectedRoute); updated footer link |
| `frontend/src/components/home/TrustSection.jsx` | Changed `to: '/inspections'` → `to: '/inspection-services'` |

---

## Routes Changed

| Route | Before | After |
|---|---|---|
| `/inspection-services` | Did not exist | **Public** — no auth required |
| `/inspections` | Protected (auth required, booking) | Protected — unchanged |
| TrustSection card link | `/inspections` (auth-gated) | `/inspection-services` (public) |
| Footer "Book Inspection" link | `/inspections` | `/inspection-services` |

---

## InspectionServices Page Structure

The public landing page (`/inspection-services`) contains:

1. **Hero** — Headline, subheadline, two CTAs: "Book Inspection" (auth-gated) + "Browse Vehicles" (`/cars`, public)
2. **How it works** — 5 steps: Choose vehicle → Schedule → Inspector reviews → Receive report → Buy with confidence
3. **What's covered** — 6 benefit cards: Mechanical review, Body condition, Road test, Photo documentation, Inspection report, Negotiation leverage
4. **Pricing** — 3 placeholder tiers (Basic ₱1,499 / Premium ₱2,999 / Dealer Custom). No provider logic hardcoded — pricing is UI-only until provider contracts are signed.
5. **FAQ** — 5 common buyer questions
6. **Bottom CTA** — "Book Inspection" + "Browse Vehicles"

Every "Book" CTA on the page routes through `handleBook()`. Authenticated users go straight to `/inspections`. Unauthenticated users go to `/login?redirect=/inspections` so they land on the booking flow post-login.

---

## Conversion Rationale

| Metric | Before | After |
|---|---|---|
| Page views before auth prompt | 0 | Full landing page |
| Context given before login wall | None | Hero + process + benefits + pricing + FAQ |
| Conversion path | Homepage → Login wall | Homepage → Service page → Login → Booking |
| User intent at auth gate | Unknown | High (user read pricing, clicked Book) |

Moving the auth gate from "start of discovery" to "start of booking" is expected to significantly reduce drop-off from the TrustSection CTA. Users who reach the login prompt from the Book button have already seen the full value proposition.

---

## Future Architecture

```
/inspection-services (public)     ← discovery + evaluation
        ↓ (Book Inspection click)
/login?redirect=/inspections      ← auth gate, only at intent
        ↓
/inspections (protected)          ← booking flow
        ↓
Inspection Request created
        ↓
Provider Assignment
        ↓
Inspection Report delivered
```

The `InspectionServices` page is stateless — no API calls, no auth dependency. It can be enhanced with real provider availability, live pricing from an API, or an inspection date picker without touching the auth flow.

---

## Build / Validation

```
vite build
✓ 1646 modules transformed
✓ built in 1.28s — no errors
```

Manual verification (Chrome MCP):
- `GET /inspection-services` (unauthenticated) → 200, full page renders, no redirect
- "Book Inspection" click (unauthenticated) → navigates to `/login?redirect=/inspections`
- `GET /inspections` (unauthenticated) → still correctly redirects to `/login` (booking flow preserved)
- TrustSection "Book an inspection" → now links to `/inspection-services`
