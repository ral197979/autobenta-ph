# Security Certification

**Document:** SECURITY_CERTIFICATION  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production  
**Auditor:** System audit via code review

---

## Executive Summary

AutoBentaPH's backend passed a full security code review after three P0 and four P1 vulnerabilities were identified and resolved. The security architecture — JWT authentication with live DB user validation, router-level role enforcement, per-resource tenant isolation, HMAC webhook verification, rate limiting, and security headers — is fundamentally sound.

---

## Audit Scope

Files reviewed:

- `backend/src/middleware/auth.js` — authentication and role enforcement
- `backend/src/server.js` — CORS, static file serving, helmet, rate limiting, env validation
- `backend/src/routes/v8atlasWebhooks.js` — webhook signature verification
- `backend/src/routes/billing.js` — invoice and credit routes
- `backend/src/routes/credits.js` — credit award logic
- `backend/src/routes/featured.js` — featured listing creation
- `backend/src/routes/dealers.js` — dealer-scoped resource access
- `backend/src/routes/admin.js` — admin route protection
- `backend/prisma/schema.prisma` — User model fields

---

## Authentication & Authorization

**JWT Flow**

Every protected request passes through `authenticate` middleware in `backend/src/middleware/auth.js`. The middleware calls `jwt.verify()` then performs a live database lookup on every request — there is no token-only validation. This means revoked or suspended accounts are enforced on the next request after their status changes.

**isSuspended Fix (P0-02 — RESOLVED)**

The `User` model includes an `isSuspended` field. Prior to the fix, `authenticate` only checked `!user.isActive`. A suspended dealer could still make authenticated API calls. The fix added:

```js
if (user.isSuspended) return res.status(403).json({ error: 'Account suspended' })
```

**Role Enforcement**

Admin routes in `backend/src/routes/admin.js` apply `router.use(authenticate, requireRole('admin'))` at the router level, not per-route. This means every route in the admin router is protected without requiring per-route annotations.

**Billing Role Check Fix (P1-02 — RESOLVED)**

`GET /dealer/billing/invoices` and the related dealer billing route previously used only `authenticate`. Non-dealer users (buyers) would receive a 404 since no `Dealer` record existed for them, but the correct response is 403. Fix: `requireRole('dealer', 'admin')` added to both routes.

---

## IDOR & Tenant Isolation

Dealer identity is always derived from the JWT `userId`, never from request parameters. This is the foundational isolation guarantee.

| Resource | Isolation Check | Location |
|---|---|---|
| Listings | `dealerId: dealer.id` from JWT | `routes/dealers.js` |
| Leads | `prisma.lead.findFirst({ where: { id, dealerId: dealer.id } })` | `routes/dealers.js` |
| Invoices | `prisma.invoice.findFirst({ where: { id, dealerId: dealer.id } })` | `routes/billing.js` |
| Credits | `dealerId: dealer.id` from JWT | `routes/credits.js` |
| Featured Listings | `prisma.vehicleListing.findFirst({ where: { id: listingId, dealerId: dealer.id } })` | `routes/featured.js` |
| Analytics Export | `if (dealer.id !== dealerId) return res.status(403)` | `routes/analytics.js` |

Full isolation analysis is documented in `TENANT_ISOLATION_CERTIFICATION.md`.

---

## Input Validation

**featureType Validation Fix (P1-04 — RESOLVED)**

`backend/src/routes/featured.js` previously accepted any string for `featureType`. An attacker could submit values like `"admin_override"` or `"free_feature"`. Fix: validated against the allowlist:

```js
['homepage', 'search_boost', 'featured_dealer', 'sponsored']
```

**Mass Assignment**

Route handlers use explicit field selection from `req.body` rather than spreading the full request body into Prisma create/update calls. No mass assignment vectors were identified.

---

## File Upload Security

**Confidential Document Exposure Fix (P0-03 — RESOLVED)**

`backend/src/server.js` previously included:

```js
app.use('/uploads/documents', express.static(...))
```

This served government IDs, business registrations, and dealer permits as publicly accessible static files. Anyone who obtained or guessed a document URL could access it without authentication. The static middleware was removed. Documents must now be served through an authenticated endpoint that verifies the requester's identity before returning the file.

---

## Webhook Security

**HMAC Verification**

`backend/src/routes/v8atlasWebhooks.js` verifies all incoming V8Atlas webhooks using HMAC-SHA256. The comparison uses `crypto.timingSafeEqual()` to prevent timing attacks.

**Production Bypass Fix (P0-01 — RESOLVED)**

The original code:

```js
if (!process.env.V8ATLAS_WEBHOOK_SECRET) return next();
```

If `V8ATLAS_WEBHOOK_SECRET` was unset in production, all webhook signature verification was bypassed. An attacker could forge inventory sync, dealer verification, and trust update events. Fix: returns HTTP 500 in production if the secret is missing. The dev-only bypass is preserved under `NODE_ENV !== 'production'`.

---

## Rate Limiting

Two rate limiters are applied in `backend/src/server.js`:

- `apiLimiter` — applied to all `/api` routes
- `authLimiter` — stricter limits applied specifically to authentication routes

---

## Security Headers

`helmet()` is applied in `backend/src/server.js`, setting standard security headers including `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, and `Strict-Transport-Security`.

---

## Findings Summary

| ID | Severity | File | Description | Status |
|---|---|---|---|---|
| P0-01 | Critical | `backend/src/routes/v8atlasWebhooks.js` | Webhook signature bypass when V8ATLAS_WEBHOOK_SECRET unset | RESOLVED |
| P0-02 | Critical | `backend/src/middleware/auth.js` | Suspended users could authenticate | RESOLVED |
| P0-03 | Critical | `backend/src/server.js` | Confidential documents served as public static files | RESOLVED |
| P1-01 | High | `backend/src/server.js` line 81 | CORS fallback to localhost if FRONTEND_URL unset | RESOLVED |
| P1-02 | High | `backend/src/routes/billing.js` | Billing routes missing `requireRole` check | RESOLVED |
| P1-03 | High | `backend/src/routes/credits.js` | Credit award non-atomic (TOCTOU) | RESOLVED |
| P1-04 | High | `backend/src/routes/featured.js` | `featureType` field not validated | RESOLVED |
| P2-01 | Low | `backend/src/server.js` | Health endpoint returns 200 with dead DB | Open |

---

## Verdict: PASS

All P0 and P1 findings are resolved. The security architecture is sound. P2-01 (health check without DB verification) is low-priority and does not constitute a security risk.
