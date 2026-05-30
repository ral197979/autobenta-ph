# Dealer Network Architecture

**Document:** DEALER_NETWORK_ARCHITECTURE  
**Version:** 1.0  
**Date:** 2026-05-30  
**Status:** Production

---

## Overview

AutoBentaPH operates a two-sided marketplace connecting vehicle buyers with individual sellers and a network of verified dealers. The Dealer Network Platform is the B2B layer of the marketplace — a purpose-built portal for dealer businesses to manage inventory, leads, subscriptions, and performance analytics.

The architecture maintains a strict boundary between the consumer marketplace (buyer-facing) and the dealer portal (B2B). Both surfaces draw from the same underlying data models but present entirely different UX and access patterns.

---

## System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Consumer Marketplace                      │
│           /cars  /cars/:id  /sell  /dashboard               │
└─────────────────────────────────────────────────────────────┘
                              │
              Shared Listings + Leads Database
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Dealer Portal Layer                       │
│   /dealer  /dealer/leads  /dealer/listings  /dealer/*       │
│                                                             │
│  DealerLayout (sidebar + auth guard)                        │
│    ├── DealerDashboard   (KPIs, onboarding, recent leads)   │
│    ├── DealerLeads       (full CRM, status funnel, notes)   │
│    ├── DealerListings    (listing management, status tabs)  │
│    ├── DealerAnalytics   (performance, aging, activity)     │
│    ├── DealerSettings    (profile, hours, contact)          │
│    └── DealerSubscription (plan comparison, upgrade CTAs)   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Dealer Network API v1                       │
│                /api/dealer-network/v1/*                     │
│                                                             │
│  POST /inventory   — DMS inventory push                     │
│  POST /leads       — inbound/outbound lead routing          │
│  POST /dealers     — dealer registration (admin)            │
│  GET  /trust       — trust state for external consumers     │
│  GET  /analytics   — plan-gated analytics export            │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│              Provider Abstraction Layer                      │
│                                                             │
│  DealerProvider   — dealer identity + tier                  │
│  InventoryProvider — listing CRUD + sync                    │
│  LeadProvider      — lead distribution + retry              │
│  TrustProvider     — badge broadcast + claim intake         │
│  AnalyticsProvider — performance data export                │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                External DMS Adapters                        │
│                                                             │
│  V8AtlasAdapter  (first connected DMS)                      │
│  [Future adapters implement same interfaces]                │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Dealer
Core entity for a dealership. One per business entity.

| Field | Type | Notes |
|---|---|---|
| id | cuid | Primary key |
| userId | FK | Owner account |
| businessName | String | Display name |
| tier | Enum | basic/verified/verified_pro/enterprise |
| isVerified | Boolean | Admin-controlled |
| onboardingStep | Int | 0–5, controls checklist display |
| firstListingAt | DateTime? | Lifecycle tracking |
| firstLeadAt | DateTime? | Lifecycle tracking |
| firstSaleAt | DateTime? | Lifecycle tracking |

### DealerBranch
Child locations under an enterprise dealer.

| Field | Type | Notes |
|---|---|---|
| dealerId | FK | Parent dealer |
| name | String | Branch display name |
| address | String | Physical location |
| city | String | |
| managerName | String? | |

Branch creation is gated to enterprise plan via `requireFeature('multi_branch')`.

### DealerSubscription
One-to-one with Dealer. Stores plan level and billing metadata.

| Field | Type | Notes |
|---|---|---|
| dealerId | FK unique | |
| plan | Enum | free/verified/pro/enterprise |
| status | String | active/cancelled/trial |
| trialEndsAt | DateTime? | 14-day trial |
| currentPeriodEnd | DateTime? | Next billing date (future) |

### DealerMember
Staff members of a dealership with role-based access.

| Field | Type | Notes |
|---|---|---|
| dealerId | FK | |
| userId | FK | AutoBentaPH user |
| role | String | manager/agent/analyst |
| active | Boolean | |

---

## Routing Architecture

The dealer portal uses React Router nested routing with `DealerLayout` as the parent element. The layout owns authentication guard, sidebar navigation, and outlet context distribution.

```
<Route path="/dealer" element={<ProtectedRoute roles={['dealer','admin']}><DealerLayout /></ProtectedRoute>}>
  <Route index element={<DealerDashboard />} />
  <Route path="leads" element={<DealerLeads />} />
  <Route path="listings" element={<DealerListings />} />
  <Route path="analytics" element={<DealerAnalytics />} />
  <Route path="settings" element={<DealerSettings />} />
  <Route path="subscription" element={<DealerSubscription />} />
</Route>
```

`DealerLayout` fetches `dealer-profile` and `dealer-sub` once and distributes `{ profile, sub, plan, tier }` to all child routes via `Outlet context`.

---

## Dealer Tier System

| Tier | Listing Limit | Lead CRM | Analytics | Priority Placement | Branches |
|---|---|---|---|---|---|
| basic (Free) | 5 | Basic | — | — | — |
| verified | 25 | Full | — | — | — |
| verified_pro | 100 | Full | ✓ | ✓ | — |
| enterprise | Unlimited | Full | ✓ | ✓ | ✓ |

Tier determines:
1. The `Verified Dealer Badge` displayed on listings in the marketplace
2. Feature access via `requireFeature(feature)` middleware
3. API rate limits (future implementation)

---

## Onboarding Lifecycle

Five steps tracked by `profile.onboardingStep` (integer, increments server-side):

1. Complete dealer profile (`/dealer/settings`)
2. Post first listing (`/sell`)
3. Get verified (`/dashboard?tab=verification`)
4. Respond to first lead (`/dealer/leads`)
5. Choose a plan (`/dealer/subscription`)

The `DealerDashboard` displays a checklist until `onboardingStep >= 5`.

---

## Admin Dealer Operations

The Admin Panel (`/admin`, dealers tab) allows:
- View all registered dealers with tier, plan, verification status
- Toggle verified status (triggers trust propagation)
- Change dealer tier directly (dropdown, calls `PATCH /admin/dealers/:id`)
- View subscription plan per dealer

---

## Lead Flow

1. Buyer submits inquiry on a listing → creates `Inquiry` record
2. `POST /dealers/me/leads` creates a `Lead` linked to the inquiry and dealer
3. Lead appears in `DealerLeads` CRM under `new` status
4. Dealer updates status through the funnel: new → contacted → viewing_scheduled → financing → closed_won / closed_lost
5. On `closed_won`, `firstSaleAt` is set on the dealer record (once)
6. Lead distribution to external DMS providers (if registered) via `LeadProvider.distributeLeadToProviders()`

---

## Security

- All `/dealer/*` routes require `role IN ['dealer', 'admin']`
- Feature-gated endpoints use `requireFeature(feature)` middleware returning 403 + upgradeUrl on denial
- Dealer data is tenant-isolated: all queries filter by `req.dealer.id` resolved from the authenticated user
- Admin tier/verification changes are audit-logged via `auditLog()`
