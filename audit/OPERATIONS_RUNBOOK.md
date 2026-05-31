# Operations Runbook

**Document:** OPERATIONS_RUNBOOK.md
**Version:** 1.0
**Date:** 2026-05-31
**Status:** Production

---

## 1. Regular Operations

### Daily Checks

| Check | How | Pass condition |
|---|---|---|
| Health endpoint | `curl https://<host>/api/health` | `"status":"ok"` |
| Dead letter queue count | Health response `checks.queue.dead` | 0 or < 10 |
| Failed invoices | Admin panel → Billing → Failed | 0 unpaid overdue invoices |

If the health endpoint returns `"status":"degraded"`, investigate immediately using the Incident Response section below.

### Weekly Checks

| Check | How | Action if abnormal |
|---|---|---|
| Dealer scorecard distribution | `GET /api/analytics/revenue` or admin panel | Investigate if > 20% of dealers are grade D |
| Pending dealer applications | Admin panel → Applications | Approve or reject within 48 hours |
| Pending featured listing approvals | Admin panel → Featured | Review and approve/reject within 24 hours |
| Dead-letter audit log | `/api/admin/audit-logs?action=job_queue_dead_letter` | Investigate any new entries |

### Monthly Checks

| Check | How | Action |
|---|---|---|
| Backup verification | `./scripts/verify-backup.sh` | Investigate any row count failures |
| Audit log review | Filter audit logs by `action` for anomalies | Escalate suspicious patterns |
| DR drill | Follow Restore Runbook on staging | Log RTO; must be < 2 hours |
| Review dead jobs | SQL: see Queue section | Requeue or close resolved issues |

---

## 2. Deployment Procedure

### Normal Deploy

AutoBentaPH deploys automatically on every git push to `main`. No manual steps required for standard deploys.

```
git push origin main
# Render auto-detects push → triggers build → runs health check → switches traffic
```

### Verifying a Deploy

After any deploy — automatic or manual:

**Step 1 — Check health endpoint:**
```bash
curl https://<host>/api/health
# Expect: { "status": "ok", ... }
```

**Step 2 — Run smoke tests:**
```bash
export API_URL="https://<host>"
./scripts/smoke-test.sh
# All checks should pass
```

**Step 3 — Monitor Render logs:**

Render Dashboard → Web Service → Logs → watch for the first 5 minutes post-deploy.

Look for:
- `Server started on port ...` — confirms startup completed
- `Prisma migrate deploy completed` — confirms migrations ran
- Any `ERROR` log lines — investigate immediately

### Rollback

**When to rollback:** deploy fails health check (Render handles automatically), or smoke tests fail after a successful deploy.

**Procedure:**
1. Render Dashboard → Web Service → Deploys tab
2. Identify the last successful deploy (green checkmark)
3. Click the three-dot menu → Rollback
4. Render re-deploys the previous build artifact immediately
5. Verify with health endpoint and smoke tests

**Note on database rollback:** if the failed deploy included a schema migration, rolling back the code may leave the schema in a newer state than the code expects. Assess whether the migration was additive (safe to roll back code) or destructive (requires database restore). See `DISASTER_RECOVERY_IMPLEMENTATION.md` for the database restore procedure.

---

## 3. Incident Response

### Database Down (HTTP 503 on /api/health)

**Symptoms:** `/api/health` returns HTTP 503, `checks.database.status = "error"`, service is unreachable for users.

**Response steps:**

1. **Check Render status first:**
   - Visit `https://status.render.com`
   - If Render reports a PostgreSQL outage: wait for Render resolution; no action required on our end
   - Subscribe to Render status updates

2. **If no Render outage — check database in Render dashboard:**
   - Render Dashboard → PostgreSQL service → Metrics
   - Check connection count, CPU, memory
   - Check for recent alerts or errors in the database logs

3. **If database is healthy but service cannot connect:**
   - Verify `DATABASE_URL` env var is set correctly in web service env vars
   - Trigger a manual redeploy (Render Dashboard → Web Service → Manual Deploy)

4. **If database is corrupted or inaccessible beyond recovery:**
   ```bash
   # Identify last good backup
   ls -lt ./backups/ | head -5

   # Provision new database in Render dashboard, then:
   ./scripts/restore.sh backups/<latest>.sql.gz "$NEW_DATABASE_URL"
   # Type RESTORE when prompted

   # Apply any pending migrations
   cd backend && DATABASE_URL="$NEW_DATABASE_URL" npx prisma migrate deploy
   ```
   - Update `DATABASE_URL` in Render web service env vars
   - Trigger redeploy
   - Verify health endpoint returns `status: ok`

5. **Document the incident:** RTO achieved, root cause, any data loss window.

---

### High Dead Letter Queue (health shows queue.dead > 10)

**Symptoms:** `/api/health` returns `"status":"degraded"`, `checks.queue.dead` > 10. V8Atlas sync operations are failing persistently.

**Response steps:**

1. **Identify failing job type:**
   ```sql
   SELECT type, COUNT(*) as dead_count, MAX(last_error) as sample_error
   FROM job_queue
   WHERE status = 'dead'
   GROUP BY type
   ORDER BY dead_count DESC;
   ```

2. **Check V8Atlas connectivity (most common cause):**
   - Check `checks.v8atlas.status` in health response
   - If `degraded`: V8Atlas is unreachable — jobs will continue to fail until V8Atlas recovers
   - Contact V8Atlas partner support (see Support Escalation table)

3. **Check audit logs for job failure details:**
   ```
   GET /api/admin/audit-logs?action=job_queue_dead_letter
   ```
   Review `metadata.lastError` for the failing jobs.

4. **Once root cause is resolved — requeue dead jobs:**
   ```sql
   -- Requeue all dead lead_sync jobs
   UPDATE job_queue
   SET status = 'pending',
       attempts = 0,
       last_error = NULL,
       next_retry_at = NULL,
       updated_at = NOW()
   WHERE status = 'dead'
     AND type = 'lead_sync';
   ```

5. **Monitor queue drain:** watch `checks.queue.dead` return to 0 over the next hour.

---

### V8Atlas Webhook Delivery Failure

**Symptoms:** Render logs show webhook 401 errors; V8Atlas reports it cannot deliver events to AutoBentaPH.

**Cause:** HMAC signature mismatch. V8Atlas signs outbound webhooks with `V8ATLAS_WEBHOOK_SECRET`; our handler verifies this before processing.

**Response steps:**

1. **Verify HMAC is active** (should return 401 — confirms verification is running):
   ```bash
   curl -X POST https://<host>/api/webhooks/v8atlas/dealer-verified \
     -H "Content-Type: application/json" \
     -H "x-v8atlas-signature: invalid" \
     -d '{}'
   # Expect: HTTP 401
   ```

2. **Check secret matches:**
   - Render Dashboard → Web Service → Environment → `V8ATLAS_WEBHOOK_SECRET`
   - Compare with the secret configured in the V8Atlas partner dashboard
   - If mismatch: update `V8ATLAS_WEBHOOK_SECRET` in Render to match V8Atlas

3. **Trigger redeploy** after updating env var (env var changes require a new deploy to take effect on Render).

4. **Ask V8Atlas to redeliver failed webhooks** from their dashboard after confirming the secret is correct.

---

### Dealer Account Abuse

**Symptoms:** reports of fraudulent listings, impersonation, or ToS violations by a dealer account.

**Response steps:**

1. **Immediately suspend the dealer:**
   ```
   PATCH /api/admin/dealers/:id/suspend
   ```
   This creates an AuditLog entry and returns HTTP 403 on all subsequent requests from that dealer.

2. **Review the dealer's listings:**
   - Admin panel → Dealers → [dealer] → Listings
   - Mark fraudulent listings as removed

3. **Document in audit log:**
   - The suspension automatically creates an AuditLog entry
   - Add an admin note with the reason via the admin panel

4. **Dealer remains visible to buyers** (existing listings stay live) but cannot log in or manage their account.

5. **For account deletion:** contact the admin team; this requires a manual database operation and cannot be undone.

---

## 4. Database Operations

### Manual Backup

Run at any time before a risky operation (migration, bulk update, major deploy):

```bash
export DATABASE_URL="postgresql://..."
./scripts/backup.sh
# Output: backups/autobenta_YYYYMMDD_HHMMSS.sql.gz
```

### Verify Latest Backup

Run monthly as part of the DR test schedule:

```bash
export DATABASE_URL="postgresql://prod..."
export VERIFY_DB_URL="postgresql://scratch..."   # NEVER use prod URL here
./scripts/verify-backup.sh
# Expect: row count checks PASS for users, listings, dealers
```

### Run Migrations Manually

In emergencies where auto-migration on deploy is not available:

```bash
cd backend
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### Inspect Job Queue

**Pending and dead jobs:**
```sql
SELECT type, status, attempts, last_error, next_retry_at
FROM job_queue
WHERE status IN ('pending', 'dead')
ORDER BY created_at DESC
LIMIT 20;
```

**Jobs stuck in `processing` (indicates a crashed handler):**
```sql
SELECT id, type, processed_at, attempts
FROM job_queue
WHERE status = 'processing'
  AND processed_at < NOW() - INTERVAL '5 minutes';
```

If jobs are stuck in `processing` after a server crash, reset them:
```sql
UPDATE job_queue
SET status = 'pending', next_retry_at = NOW(), updated_at = NOW()
WHERE status = 'processing'
  AND processed_at < NOW() - INTERVAL '5 minutes';
```

### Access Prisma Studio (Local)

For direct database inspection without writing SQL:

```bash
cd backend
DATABASE_URL="postgresql://..." npx prisma studio
# Opens browser at http://localhost:5555
```

Do not run Prisma Studio pointed at the production database from a shared machine.

---

## 5. Admin Operations Reference

### Dealer Application Approval

```
PATCH /api/admin/applications/:id
Body: { "action": "approve" }
```

What this does in a single `$transaction`:
- Creates `Dealer` record linked to the user
- Creates `DealerSubscription` (free tier by default)
- Updates `user.role` to `"dealer"`
- Sends approval email notification

**Rejection:**
```
PATCH /api/admin/applications/:id
Body: { "action": "reject", "reason": "Incomplete documentation" }
```

---

### Manual Credit Award

```
POST /api/admin/credits/award/:dealerId
Body: { "credits": 10, "description": "Onboarding bonus" }
```

Creates a `CreditTransaction` record. Credits are immediately available for the dealer to use on featured listings.

---

### Featured Listing Approval

```
PATCH /api/admin/featured/:id
Body: { "status": "active", "adminNote": "Approved — complies with guidelines" }
```

To reject:
```
PATCH /api/admin/featured/:id
Body: { "status": "rejected", "adminNote": "Missing exterior photos" }
```

---

### Invoice Management

Mark an invoice as paid (for manual/bank transfer payments):
```
PATCH /api/admin/billing/invoices/:id
Body: { "status": "paid", "paidAt": "2026-05-31" }
```

---

## 6. Support Escalation

| Issue | Who to contact | SLA |
|---|---|---|
| Platform outage (Render) | `https://status.render.com` | Per Render SLA |
| Database performance or corruption | Render support portal | Per plan tier |
| V8Atlas sync failure or API unavailability | V8Atlas partner contact | 4 hours |
| Payment dispute or billing error | Admin team | 24 hours |
| Dealer account suspension appeal | Admin team | 48 hours |
| Security incident (unauthorized access) | Admin team + Render support | Immediate |

---

## 7. Key Monitoring URLs

| Endpoint | Auth required | Purpose |
|---|---|---|
| `GET /api/health` | None | Service health, queue state, V8Atlas connectivity |
| `GET /api/admin/stats` | Admin JWT | Platform overview: users, listings, revenue |
| `GET /api/analytics/revenue` | Admin JWT | Revenue breakdown by period and plan |
| `GET /api/admin/audit-logs` | Admin JWT | All admin actions and system events |
| `./scripts/smoke-test.sh` | `API_URL` env var | End-to-end functional check |

### Quick Health Check

```bash
curl -s https://<host>/api/health | python3 -m json.tool
```

### Quick Status Summary

```bash
# Check overall status and queue depth in one line
curl -s https://<host>/api/health | \
  python3 -c "import sys,json; h=json.load(sys.stdin); \
  print(f\"Status: {h['status']} | Dead jobs: {h['checks']['queue']['dead']}\")"
```
