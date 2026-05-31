# Health Monitoring Architecture

**Document:** HEALTH_MONITORING.md
**Version:** 1.0
**Date:** 2026-05-31
**Status:** Production

---

## Health Endpoint

`GET /api/health`

- **Authentication:** none required — public endpoint
- **Purpose (dual):** used by Render.com as the deployment health check gate, and as the primary operational monitoring target for uptime services
- **No rate limiting applied** — health check must be accessible from Render's internal health check agent at any time

---

## Response Schema

Full response structure returned by the endpoint:

```json
{
  "status": "ok | degraded | error",
  "service": "AutoBenta PH API",
  "version": "2.0.0",
  "environment": "production",
  "uptime": 3600,
  "timestamp": "2026-05-31T14:00:00.000Z",
  "requestId": "req_abc123",
  "responseTimeMs": 12,
  "checks": {
    "database": {
      "status": "ok | error"
    },
    "queue": {
      "status": "ok | degraded",
      "pending": 0,
      "processing": 0,
      "dead": 0
    },
    "v8atlas": {
      "status": "ok | degraded | skipped"
    },
    "storage": {
      "status": "ok | degraded"
    }
  }
}
```

| Field | Description |
|---|---|
| `status` | Aggregate status derived from all checks |
| `service` | Fixed service name for log parsing |
| `version` | Application version from package.json |
| `environment` | `NODE_ENV` value |
| `uptime` | Process uptime in seconds |
| `timestamp` | ISO 8601 timestamp of the health check |
| `requestId` | Unique request ID for log correlation |
| `responseTimeMs` | Time taken to run all checks in milliseconds |
| `checks.*` | Individual subsystem check results |

---

## Status Levels

| Status | HTTP Code | Meaning | Render behavior |
|---|---|---|---|
| `ok` | 200 | All checks passing | Deploy succeeds, traffic routes normally |
| `degraded` | 200 | Non-critical check failing | Deploy succeeds, but operators should investigate |
| `error` | 503 | Database unreachable | Render takes the service out of rotation; deploy fails |

**Key design decision:** HTTP 503 is returned **only** when the database is completely unreachable. All other failures return HTTP 200 with `status: "degraded"`. This ensures that a V8Atlas outage or a full upload volume does not cause Render to kill a healthy instance, while a genuine database failure correctly prevents Render from routing traffic to a broken service.

---

## Check: Database

```javascript
await prisma.$queryRaw`SELECT 1`
```

- **Pass:** query returns within timeout → `{ "status": "ok" }`
- **Fail:** query throws or times out → `{ "status": "error" }`
- **Impact on aggregate status:** `error` → overall status = `error`, HTTP 503
- **Render behavior:** 503 causes Render to mark deploy unhealthy and keep old instance alive

The database check is the only check that can trigger HTTP 503. This is intentional — without the database, AutoBentaPH cannot serve any meaningful request.

---

## Check: Queue

```javascript
const [pending, processing, dead] = await Promise.all([
  prisma.jobQueue.count({ where: { status: 'pending' } }),
  prisma.jobQueue.count({ where: { status: 'processing' } }),
  prisma.jobQueue.count({ where: { status: 'dead' } })
]);
```

- **Pass:** dead <= 10 → `{ "status": "ok", "pending": N, "processing": N, "dead": N }`
- **Degraded:** dead > 10 → `{ "status": "degraded", "pending": N, "processing": N, "dead": N }`
- **Impact on aggregate status:** `degraded` → overall status = `degraded`, HTTP 200

**Threshold rationale:** dead > 10 indicates a systemic failure (V8Atlas down for hours, schema mismatch, handler bug) rather than normal transient failures. Ten dead-letter jobs is a meaningful signal that requires operator attention.

---

## Check: V8Atlas

- **Condition:** only runs if `V8ATLAS_ENABLED=true` in environment
- **If disabled:** returns `{ "status": "skipped" }` — does not affect aggregate status
- **If enabled:** `GET <V8ATLAS_BASE_URL>/health` with 3-second timeout

**Pass:** HTTP 2xx within 3 seconds → `{ "status": "ok" }`

**Degraded:** non-2xx or timeout → `{ "status": "degraded" }`

**Impact on aggregate status:** `degraded` → overall status = `degraded`, HTTP 200

**Design decision:** V8Atlas unavailability is `degraded`, not `error`. AutoBentaPH continues to function for buyers, sellers, and admin operations even when V8Atlas is unreachable. New leads are queued (durable queue) and will sync when V8Atlas recovers. A V8Atlas outage should not take AutoBentaPH offline.

---

## Check: Storage

```javascript
const testPath = path.join(UPLOADS_DIR, '.health');
await fs.writeFile(testPath, 'ok');
await fs.unlink(testPath);
```

- **Pass:** write and delete succeed → `{ "status": "ok" }`
- **Degraded:** throws on write or delete → `{ "status": "degraded" }`
- **Impact on aggregate status:** `degraded` → overall status = `degraded`, HTTP 200

**What this detects:** full disk, permission errors on the uploads directory, or a read-only filesystem mount. Dealers cannot upload listing photos if storage is unwritable, but existing data remains accessible.

---

## Aggregate Status Logic

```
if database.status == "error":
    status = "error"
    http = 503
else if any check.status == "degraded":
    status = "degraded"
    http = 200
else:
    status = "ok"
    http = 200
```

The database check is evaluated first. If the database is down, all other checks are skipped (they would fail anyway since they depend on Prisma) and HTTP 503 is returned immediately.

---

## Render.com Integration

`render.yaml` configures:
```yaml
healthCheckPath: /api/health
```

Render's deployment flow:
1. New container starts, begins accepting requests
2. Render polls `GET /api/health` every 10 seconds
3. If HTTP 2xx is received within `startPeriod` (60 seconds default): deploy succeeds, traffic switches
4. If HTTP non-2xx or timeout: deploy fails, previous container remains live

**Our behavior aligns correctly:**
- `status: ok` → HTTP 200 → deploy succeeds
- `status: degraded` → HTTP 200 → deploy succeeds (operators investigate post-deploy)
- `status: error` (DB down) → HTTP 503 → deploy fails (correct: a new instance with no DB is non-functional)

---

## Smoke Test Compatibility

`scripts/smoke-test.sh` includes a health check step:
```bash
curl -sf "$API_URL/api/health" | grep -q '"status":"ok"'
```

The upgraded endpoint returns `"status":"ok"` (lowercase, in the root object) when all checks pass. This matches the grep pattern exactly. No changes to `smoke-test.sh` are required.

---

## Recommended Alerting Configuration

**Option 1 — Render native alerting:**
- Render Dashboard → Web Service → Notifications
- Alert on deploy failure (health check not passing)
- Alert on service going offline

**Option 2 — External uptime monitor (recommended for production):**

| Tool | Free tier | Configuration |
|---|---|---|
| UptimeRobot | 50 monitors, 5-min interval | Monitor URL: `/api/health`; alert on HTTP non-200 |
| BetterUptime | 10 monitors, 3-min interval | Monitor URL: `/api/health`; alert on non-200 or response body contains `"degraded"` |

**Recommended alert rules:**
1. HTTP 503 → immediate PagerDuty/SMS (database down)
2. Response body contains `"status":"degraded"` → Slack notification within 5 minutes
3. Response time > 5000ms → Slack warning (slow DB queries or resource exhaustion)

---

## Future Additions

The following metrics can be added to the health response without breaking existing consumers (additive changes to the `checks` object):

| Addition | Value |
|---|---|
| `checks.memory` | Node.js `process.memoryUsage()` — detect memory leaks |
| `checks.connections` | Active Prisma connection pool usage |
| `checks.v8atlas_sync_lag` | Time since last successful V8Atlas sync |
| `checks.queue.oldest_pending_age` | Age of oldest pending job — detect stalled poll loop |

---

## Verdict: PASS

Previously flagged as P2 (partial implementation — health endpoint existed but returned minimal data). Resolved by:
- Structured health response with all subsystem checks
- Database check with HTTP 503 on failure
- Queue check with dead-letter threshold (degraded if dead > 10)
- V8Atlas check with feature-gate (only active if `V8ATLAS_ENABLED=true`)
- Storage check with write/delete test
- Aggregate status logic correctly isolating database failures from partial degradation
- Render.com integration aligned (503 only on DB failure)
