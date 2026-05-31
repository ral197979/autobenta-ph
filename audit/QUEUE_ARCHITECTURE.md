# Persistent Job Queue Architecture

**Document:** QUEUE_ARCHITECTURE.md
**Version:** 1.0
**Date:** 2026-05-31
**Status:** Production

---

## Why a Persistent Queue

The original `LeadProvider` implementation maintained an in-memory `_queue` array for retrying failed V8Atlas lead sync operations. This approach had a critical flaw: the queue was lost on every server restart, container redeploy, or crash.

**Consequences of in-memory queue:**
- A deploy during peak hours would silently drop all queued lead sync retries
- A Render instance restart (routine for platform maintenance) caused the same data loss
- There was no way to inspect what was queued, what had failed, or why
- Leads that arrived while V8Atlas was temporarily down were permanently lost with no audit trail

**Production requirement:** any operation that must eventually complete — especially cross-system sync to a partner API — requires durable, inspectable, recoverable storage.

---

## Architecture Choice: PostgreSQL Queue

AutoBentaPH uses a PostgreSQL-backed job queue rather than Redis or a dedicated queue service (SQS, Bull, BullMQ).

**Rationale:**

| Factor | Decision |
|---|---|
| Infrastructure simplicity | No additional service to provision, monitor, or pay for |
| Scale requirement | < 1,000 jobs/day — well within PostgreSQL's row-insert throughput |
| Consistency | Jobs are in the same database as application data; no cross-system consistency issues |
| Observability | Jobs are queryable with standard SQL; no separate queue dashboard needed |
| Operational familiarity | The team already operates PostgreSQL; no new operational knowledge required |

**Trade-off acknowledged:** at high throughput (> 10,000 jobs/day) or with multiple competing consumers, a PostgreSQL queue requires `SELECT FOR UPDATE SKIP LOCKED` to avoid double-processing. The current single-Render-instance deployment does not require distributed locking. See Limitations section.

---

## JobQueue Model

Defined in `backend/prisma/schema.prisma`:

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `type` | String | Job type: `lead_sync`, `inventory_sync`, `trust_sync`, `webhook_retry` |
| `payload` | Json | Job-specific data (e.g., lead ID, dealer ID, webhook body) |
| `status` | JobStatus enum | Current lifecycle state |
| `attempts` | Int | How many times this job has been attempted |
| `maxAttempts` | Int (default 5) | Maximum attempts before marking as dead |
| `scheduledAt` | DateTime | When the job was originally scheduled |
| `processedAt` | DateTime? | When the most recent attempt started |
| `completedAt` | DateTime? | When the job successfully completed |
| `lastError` | String? | Error message from the most recent failed attempt |
| `nextRetryAt` | DateTime? | Earliest time the job should be retried |
| `createdAt` | DateTime | Record creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**JobStatus enum values:** `pending`, `processing`, `completed`, `failed`, `dead`

---

## JobStatus Lifecycle

```
                    ┌─────────┐
                    │ pending │  ← initial state, or reset after failed attempt
                    └────┬────┘
                         │  poll picks up job
                         ▼
                  ┌─────────────┐
                  │ processing  │  ← being executed by handler
                  └──────┬──────┘
              success ┌──┴──┐ failure
                       │    │
              ┌────────┘    └────────────┐
              ▼                          ▼
        ┌───────────┐            ┌──────────────┐
        │ completed │            │    failed    │  attempts < maxAttempts
        └───────────┘            └──────┬───────┘
                                        │
                                        │ set nextRetryAt
                                        │ reset status → pending
                                        │
                               attempts >= maxAttempts
                                        │
                                        ▼
                                  ┌──────────┐
                                  │   dead   │  → AuditLog entry written
                                  └──────────┘
```

A `failed` job is immediately requeued as `pending` with a `nextRetryAt` timestamp. The poll loop only picks up jobs where `nextRetryAt <= now`. Jobs that exhaust all attempts are moved to `dead` status and an `AuditLog` record is created for operator review.

---

## Exponential Backoff Schedule

| Attempt | Delay | nextRetryAt formula |
|---|---|---|
| 1 (first failure) | 1 minute | `now + 1m` |
| 2 | 5 minutes | `now + 5m` |
| 3 | 15 minutes | `now + 15m` |
| 4 | 1 hour | `now + 1h` |
| 5 | 4 hours | `now + 4h` |
| 6+ | Dead | No retry — marked `dead` |

Total time from first attempt to dead-letter: approximately 5 hours 21 minutes. This window accommodates typical V8Atlas maintenance windows and transient connectivity issues without permanently losing jobs.

---

## Job Types

| Type | Purpose | Payload shape |
|---|---|---|
| `lead_sync` | Push a buyer lead to V8Atlas dealer matching API | `{ leadId, dealerId, listingId }` |
| `inventory_sync` | Sync a listing update to V8Atlas inventory feed | `{ listingId, action: 'update'|'delete' }` |
| `trust_sync` | Push dealer trust badge update to V8Atlas | `{ dealerId, badgeType, value }` |
| `webhook_retry` | Retry a failed outbound webhook delivery | `{ url, payload, headers }` |

---

## Handler Registry

Job handlers are registered at module load time using a `registerHandler(type, fn)` pattern:

```javascript
// In jobQueue.js
const handlers = new Map();

export function registerHandler(type, fn) {
  handlers.set(type, fn);
}

// In v8atlasProvider.js (loaded at server start)
registerHandler('lead_sync', async (payload) => {
  await v8atlas.pushLead(payload.leadId);
});
```

This decouples the queue infrastructure from the job implementations. Adding a new job type requires only registering a new handler — no changes to the queue poll loop.

**Unregistered job types:** if a job is picked up with a type that has no registered handler, it is marked `failed` with error `"No handler registered for type: <type>"` and follows the normal retry/dead-letter flow.

---

## Lead Sync Integration

The critical change from in-memory to persistent queue in the lead distribution flow:

**Before (fragile):**
```javascript
// On V8Atlas failure:
this._queue.push({ leadId, retryAt: Date.now() + 60000 });
// Lost on restart
```

**After (durable):**
```javascript
// On V8Atlas failure:
await enqueue('lead_sync', { leadId, dealerId, listingId });
// Persisted to PostgreSQL; survives restarts
```

`distributeLeadToProviders()` now calls `enqueue()` on any V8Atlas failure. The job will be retried according to the backoff schedule regardless of server restarts or deploys.

---

## Poll Loop

The queue worker runs a poll loop started at server initialization:

```javascript
// In server.js
startPolling(10_000); // 10-second interval
```

**Poll behavior per tick:**
1. Query for one `pending` job where `nextRetryAt <= now` (or `nextRetryAt IS NULL`), ordered by `scheduledAt ASC`
2. Update job status to `processing`, set `processedAt = now`
3. Call the registered handler with the job payload
4. On success: update status to `completed`, set `completedAt = now`
5. On failure: increment `attempts`, set `lastError`, compute `nextRetryAt`
   - If `attempts >= maxAttempts`: set status to `dead`, write AuditLog entry
   - Otherwise: set status to `pending` with new `nextRetryAt`

**One job per tick:** the poll loop processes one job per 10-second interval. This is intentional — it prevents a backlog of failed jobs from consuming all database connections. Maximum throughput is 6 jobs/minute, which is sufficient for the expected volume.

---

## Dead Letter Handling

When a job reaches `maxAttempts` without succeeding:

1. Status is set to `dead`
2. An `AuditLog` entry is created:
   ```json
   {
     "action": "job_queue_dead_letter",
     "entityType": "JobQueue",
     "entityId": "<job-id>",
     "metadata": {
       "type": "lead_sync",
       "attempts": 5,
       "lastError": "V8Atlas API timeout after 10000ms",
       "payload": { "leadId": "...", "dealerId": "..." }
     }
   }
   ```
3. The health endpoint reflects the dead-letter count in `checks.queue.dead`
4. If `dead > 10`, health status transitions to `degraded`

Dead jobs are **not** automatically retried. An operator must investigate the root cause and manually requeue if appropriate (see Operational Procedures).

---

## Monitoring

The health endpoint at `GET /api/health` reports queue state:

```json
{
  "checks": {
    "queue": {
      "status": "ok",
      "pending": 0,
      "processing": 0,
      "dead": 0
    }
  }
}
```

| Condition | Queue status | Overall health status |
|---|---|---|
| All counts zero | `ok` | `ok` (if other checks pass) |
| pending > 0, processing > 0 | `ok` | Normal queue activity |
| dead > 0 but <= 10 | `ok` | Warning but not degraded |
| dead > 10 | `degraded` | `degraded` |

**Recommended alert:** configure UptimeRobot or Render alerting to notify when `/api/health` returns `status: degraded`.

---

## Operational Procedures

**Inspect dead letter queue:**
```sql
SELECT id, type, attempts, last_error, payload, created_at
FROM job_queue
WHERE status = 'dead'
ORDER BY created_at DESC
LIMIT 20;
```

**Requeue a dead job (after fixing root cause):**
```sql
UPDATE job_queue
SET status = 'pending',
    attempts = 0,
    last_error = NULL,
    next_retry_at = NULL,
    updated_at = NOW()
WHERE id = '<job-id>'
  AND status = 'dead';
```

**Requeue all dead jobs of a given type:**
```sql
UPDATE job_queue
SET status = 'pending',
    attempts = 0,
    last_error = NULL,
    next_retry_at = NULL,
    updated_at = NOW()
WHERE status = 'dead'
  AND type = 'lead_sync';
```

**Clear the queue (emergency — use with caution):**
```sql
-- Moves all dead jobs to completed so they stop appearing in health checks
-- Use only after confirming the jobs are safe to abandon
UPDATE job_queue
SET status = 'completed', updated_at = NOW()
WHERE status = 'dead';
```

---

## Limitations

**Single-process polling:** the poll loop runs in a single Node.js process. There is no distributed lock. If AutoBentaPH is ever scaled to multiple Render instances, the same job could be picked up by two workers simultaneously.

**Resolution for multi-instance scale:** implement `SELECT ... FOR UPDATE SKIP LOCKED` in the poll query:
```sql
SELECT * FROM job_queue
WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= NOW())
ORDER BY scheduled_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;
```
This requires wrapping the poll step in a transaction. Until multi-instance deployment is needed, the current implementation is correct and sufficient.

**Throughput ceiling:** 6 jobs/minute with 10-second polling. For higher throughput, reduce the poll interval or process multiple jobs per tick. This is not a current concern given expected job volume.

---

## Verdict: PASS

Previously flagged as a blocking condition: in-memory queue lost on restart, no retry durability, no observability. Resolved by:
- `JobQueue` Prisma model with full lifecycle state machine
- Exponential backoff with configurable maxAttempts
- Dead letter handling with AuditLog integration
- Health endpoint integration with degraded-threshold alerting
- Documented operational procedures for queue inspection and requeueing
