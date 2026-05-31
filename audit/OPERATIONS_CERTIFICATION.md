# Operations Certification

**Document:** OPERATIONS_CERTIFICATION  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production  
**Auditor:** System audit via code review

---

## Admin Tooling

The `AdminPanel` provides a full operations center accessible to users with the `admin` role. Confirmed panels:

- **Users** — list, search, suspend, unsuspend, role management
- **Listings** — review, moderate, flag for fraud review
- **Dealers** — onboarding applications, approval, suspension, metrics view
- **Analytics** — platform-wide MRR, ARPU, funnel, trust impact
- **Moderation** — listing and content flagging review queue
- **Verification** — verification request review and approval
- **Fraud Review** — high-fraud-score listing queue
- **Revenue Insights** — invoice management, credit awards, featured listing approvals

All admin routes in `backend/src/routes/admin.js` are protected by `router.use(authenticate, requireRole('admin'))` at the router level.

---

## Dealer Onboarding

The dealer onboarding flow is a 5-step apply form:

1. Dealer submits application via the public-facing apply form
2. Application creates a `DealerApplication` record with `status: 'pending'`
3. Admin reviews the application in the AdminPanel
4. Admin approves or rejects via `PATCH /admin/applications/:id`
5. On approval: dealer account is provisioned and onboarding wizard guides initial setup

---

## Application Approval

**Route:** `PATCH /admin/applications/:id`  
**File:** `backend/src/routes/admin.js`

On approval, the following operations execute inside a single `prisma.$transaction()`:

1. Create `Dealer` record linked to the applicant's `User`
2. Create `DealerSubscription` record with the selected plan
3. Update `User.role` to `'dealer'`

All three writes succeed together or none do. A partial approval (user role changed but no Dealer record created) is not possible.

---

## Verification Workflow

Dealer trust verification is admin-granted, not self-claimed:

1. Dealer submits a `VerificationRequest` with supporting documents
2. Admin reviews the request and creates a `VerificationReview` record
3. Admin grants or denies verification — status is stored in `VerificationRequest.status`
4. A status history is maintained for audit purposes
5. Approved verification propagates to `dealer.verificationStatus` and trust tier fields

Dealers cannot set their own `verificationStatus` — it is controlled exclusively through admin-gated routes.

---

## Lead Distribution

**Function:** `routeLead()`  
**File:** `backend/src/routes/dealers.js`

Lead routing decisions are logged to `AuditLog` with the routing logic recorded (which dealer received the lead and why). All lead ownership assignments are protected — once a lead is assigned to a dealer, only that dealer and admins can access or modify it.

---

## Dealer Suspension

**Route:** `PATCH /admin/dealers/:id/suspend`  
**File:** `backend/src/routes/admin.js`

Suspension flow:

1. Sets `User.isSuspended = true` on the dealer's user record
2. Records the suspension reason
3. Writes an `AuditLog` entry with the admin's userId, the dealer's id, and the reason

Because `authenticate` middleware checks `user.isSuspended` on every request (P0-02 fix), suspended dealers are blocked from all API calls immediately after suspension — no token invalidation or cache flush required.

---

## Revenue Operations

All revenue operations are available in admin routes:

- **Invoice CRUD:** Create, read, update (status change), void — `backend/src/routes/billing.js` admin routes
- **Credit Award:** Admin can grant credits to any dealer — `backend/src/routes/credits.js`
- **Featured Listing Approval:** Admin review queue for pending featured listings — `backend/src/routes/featured.js`

---

## Support Workflow

**Status: NOT FOUND**

No ticketing system integration (Zendesk, Intercom, Freshdesk) was found in the repository. Dealer support requests have no in-app routing or tracking mechanism.

---

## Incident Response

**Status: NOT FOUND**

No incident response runbook was found in the repository. There are no documented procedures for:

- Database outage response
- Payment processing failure
- V8Atlas integration outage
- Security incident (data breach, unauthorized access)
- On-call escalation contacts

---

## Findings

| ID | Finding | Status |
|---|---|---|
| — | No ticketing/support system integration | Open |
| — | No incident response runbook | Open |

---

## Verdict: PASS WITH NOTES

Core operations tooling — admin panel, dealer onboarding with atomic approval, verification workflow, suspension, lead distribution with audit logging, and revenue operations — is fully implemented. The gaps are operational process documentation (support workflow, incident response runbooks) rather than system defects. These should be addressed before onboarding external paying dealers.
