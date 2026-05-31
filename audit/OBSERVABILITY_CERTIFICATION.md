# Observability Certification

**Document:** OBSERVABILITY_CERTIFICATION  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production  
**Auditor:** System audit via code review

---

## Logging

**Library:** `pino` (structured JSON logging)  
**Configuration file:** `backend/src/server.js`

- Log level is controlled by the `LOG_LEVEL` environment variable
- Development: `pino-pretty` transport for human-readable output
- Production (`NODE_ENV=production`): level defaults to `info`, JSON output

Structured logging means every log line is a valid JSON object with consistent fields (timestamp, level, requestId, message), making logs queryable in any log aggregation platform.

---

## Request IDs

Every incoming HTTP request is assigned a unique ID using `crypto.randomUUID()` before any route handler executes. The request ID is:

- Attached to the `req` object for use in all route handlers and middleware
- Returned in the `x-request-id` response header
- Included in all error response payloads
- Included in all pino log lines via the HTTP logger context

This allows any error reported by a client to be traced to the exact server log entry.

---

## HTTP Logging

`pinoHttp` middleware is applied globally and logs every HTTP transaction with:

- HTTP method, URL, status code, response time
- Log level selection by status code:
  - 5xx → `error`
  - 4xx → `warn`
  - 2xx/3xx → `info`

---

## Audit Logs

The `AuditLog` model in the database stores a tamper-evident chain of key administrative and operational events. Fields:

| Field | Purpose |
|---|---|
| `userId` | Actor who performed the action |
| `action` | Action type (e.g., `dealer.verify`, `lead.route`, `dealer.suspend`) |
| `entityType` | Type of entity affected |
| `entityId` | ID of the entity affected |
| `ipAddress` | Originating IP address |
| `prevHash` | Hash of the previous audit log entry |
| `hash` | Hash of this entry (chained) |

The hash chain means any tampering with a past audit log entry invalidates all subsequent entries. Confirmed audit-logged actions: dealer verification, V8Atlas sync events, lead routing decisions, dealer suspension.

---

## Error Handling

A global error handler is registered as the last middleware in `backend/src/server.js`. It:

- Logs the error with the request ID at `error` level
- Returns a structured JSON error response including the request ID
- Suppresses stack traces in the response when `NODE_ENV=production`

Stack traces are still logged server-side at `error` level — they are only hidden from the client response in production.

---

## Health Check

**Route:** `GET /api/health`  
**File:** `backend/src/server.js`

Current response:

```json
{ "status": "ok", "timestamp": "...", "version": "..." }
```

**Gap (P2-01):** The health endpoint returns HTTP 200 without verifying database connectivity. A complete database outage would still return `{ "status": "ok" }` to load balancers and uptime monitors, masking the incident.

**Recommended fix:** Add `await prisma.$queryRaw\`SELECT 1\`` inside the handler. If it throws, return HTTP 503.

---

## Missing Capabilities

**External Error Tracking:** No Sentry, Bugsnag, or equivalent integration was found. Unhandled errors are logged to stdout but not surfaced as alerts or grouped by occurrence frequency.

**Metrics Endpoint:** No Prometheus or StatsD metrics endpoint exists. CPU, memory, request latency percentiles, and DB pool utilization are not instrumented.

**Alerting:** No alerting configuration (PagerDuty, OpsGenie, Slack alerts) was found in the repository.

---

## Findings

| ID | Finding | Status |
|---|---|---|
| P2-01 | Health endpoint does not verify DB connectivity | Open |
| — | No external error tracking (Sentry/Bugsnag) | Open |
| — | No metrics endpoint (Prometheus) | Open |
| — | No alerting configuration | Open |

---

## Verdict: PASS WITH NOTES

Structured logging, request IDs, HTTP log levels, tamper-evident audit logs, and production-appropriate error handling are all in place. The primary gap is the health endpoint not verifying DB connectivity, which should be fixed before connecting to a load balancer or uptime monitor. External error tracking is strongly recommended before onboarding paying dealers.
