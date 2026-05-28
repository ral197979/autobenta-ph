# AutoBenta PH — Audit Logging

## Overview

Every significant action in AutoBenta is recorded in the `AuditLog` table. Entries are **hash-chained** — each record includes a SHA-256 hash of its own content linked to the previous record's hash, making tampering detectable.

---

## Writing an Audit Log Entry

### From an Express route handler

```javascript
const { auditFromReq } = require('../services/audit/auditLogger');

// Inside a route handler:
await auditFromReq(req, 'listing.approve', 'VehicleListing', listingId, {
  reason: 'Looks clean',
  previousStatus: 'pending',
  newStatus: 'active',
});
```

`auditFromReq` automatically captures `userId`, `ipAddress`, `userAgent`, and `requestId` from the Express request object.

### Standalone (background jobs, scripts)

```javascript
const { auditLog } = require('../services/audit/auditLogger');

await auditLog({
  userId: null,               // null for system actions
  action: 'fraud.engine.run',
  entityType: 'VehicleListing',
  entityId: listingId,
  details: { fraudScore: 45, flagCount: 3 },
  ipAddress: null,
  userAgent: null,
  requestId: null,
});
```

---

## Hash Chain

### How it works

Each entry computes:
```
hash = SHA-256({
  userId, action, entityType, entityId,
  details, ipAddress, createdAt, prevHash
})
```

The `prevHash` links to the most recent entry's `hash`, forming a linked chain. Even changing a single character in an old record will break the chain from that point forward.

### Verifying the chain

```javascript
const { verifyChain } = require('../services/audit/tamperHash');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const entries = await prisma.auditLog.findMany({
  orderBy: { createdAt: 'asc' },
});

const { valid, brokenAt } = verifyChain(entries);

if (!valid) {
  console.error('Tamper detected at entry:', brokenAt.id);
}
```

### Anchors (`AuditHashAnchor`)

For high-volume deployments, periodically snapshot the latest hash as an anchor:
```javascript
await prisma.auditHashAnchor.create({
  data: { sequence: seqNum, hash: latestHash, logId: latestEntry.id },
});
```
Verification can start from the nearest anchor rather than the genesis entry.

---

## Action Naming Conventions

Use `entity.verb` format:

| Action | Description |
|--------|-------------|
| `listing.create` | New listing submitted |
| `listing.approve` | Admin approved listing |
| `listing.reject` | Admin rejected listing |
| `listing.flag` | Admin flagged listing |
| `listing.escalate` | Admin escalated listing |
| `listing.suspend_seller` | Admin suspended seller via moderation |
| `fraud.analyze` | Fraud engine manually triggered |
| `fraud.flag.resolve` | Admin resolved a fraud flag |
| `user.suspend` | Admin suspended a user account |
| `user.restore` | Admin restored a suspended user |
| `inspection.report.submit` | Inspector submitted report |
| `financing.approve` | Admin approved financing request |

---

## Querying Audit Logs

### Via Admin API

```
GET /api/admin/audit-logs
Authorization: Bearer <admin-token>
```

Returns paginated logs with optional filters:
- `?action=listing.approve`
- `?entityType=VehicleListing&entityId=<id>`
- `?userId=<id>`

### Direct DB query (Prisma)

```javascript
const logs = await prisma.auditLog.findMany({
  where: {
    action: { startsWith: 'listing.' },
    createdAt: { gte: new Date('2024-01-01') },
  },
  orderBy: { createdAt: 'desc' },
  take: 100,
});
```

---

## Security Notes

- Audit logs are **append-only** — no update/delete routes exist
- The hash chain makes bulk tampering computationally infeasible  
- `auditLog()` failures are caught and logged but never propagate to the caller  
  (audit failures must never crash the main request)
- Sensitive fields like passwords are never written to `details`
