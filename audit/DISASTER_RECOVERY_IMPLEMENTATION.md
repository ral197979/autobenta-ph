# Disaster Recovery Implementation

**Document:** DISASTER_RECOVERY_IMPLEMENTATION.md
**Version:** 1.0
**Date:** 2026-05-31
**Status:** Production

---

## DR Objective

AutoBentaPH targets the following recovery parameters for a full data loss or service failure event:

| Metric | Target | Basis |
|---|---|---|
| RTO (Recovery Time Objective) | < 2 hours | Manual restore + redeploy on Render |
| RPO (Recovery Point Objective) | < 24 hours | Daily automated backup |

These targets are achievable with the current backup scripts and Render.com managed database backups. A monthly restore drill is required to keep the RTO credible.

---

## Backup Strategy

| What | How often | Retention | Location |
|---|---|---|---|
| PostgreSQL database | Daily (cron) + on-demand | 30 backups | `./backups/` (local) |
| PostgreSQL database | Daily (automated) | Per Render plan | Render managed backup |
| `uploads/` directory | Manual / on-demand | N/A | Local filesystem only |

**Recommended production addition:** configure offsite backup by piping `backup.sh` output to an S3-compatible bucket (Cloudflare R2 is zero-egress cost). The `backups/` directory on the Render instance is ephemeral — if the instance is replaced, local backups are lost. Offsite storage is the only durable backup target.

---

## scripts/backup.sh

**Location:** `scripts/backup.sh`

**What it does:**
1. Runs `pg_dump $DATABASE_URL | gzip` to a timestamped file: `backups/autobenta_YYYYMMDD_HHMMSS.sql.gz`
2. Runs `gunzip -t` integrity check on the resulting file — aborts and exits non-zero if corrupt
3. Counts backups in `./backups/` and deletes oldest files beyond the 30-backup retention limit
4. Prints backup filename and size on success

**Usage:**
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/autobenta"
./scripts/backup.sh
```

**Expected output:**
```
[backup] Starting backup...
[backup] Wrote: backups/autobenta_20260531_140000.sql.gz (2.1MB)
[backup] Integrity check: PASSED
[backup] Retention: kept 30 backups, deleted 0
[backup] Done.
```

---

## scripts/restore.sh

**Location:** `scripts/restore.sh`

**What it does:**
1. Accepts two arguments: `<backup_file>` and `<target_DATABASE_URL>`
2. Runs `gunzip -t` integrity check before touching the target database
3. Prompts: `Type RESTORE to confirm you want to overwrite the target database:`
4. On confirmation: drops and recreates the target database, pipes decompressed dump to `psql`
5. Runs `cd backend && npx prisma migrate deploy` to apply any pending schema migrations
6. Prints row counts for `users`, `listings`, `dealers` as a basic smoke check

**Usage:**
```bash
./scripts/restore.sh backups/autobenta_20260531_140000.sql.gz $DATABASE_URL
```

**Safety:** The `RESTORE` confirmation prompt prevents accidental execution. The integrity check prevents restoring a corrupt file.

---

## scripts/verify-backup.sh

**Location:** `scripts/verify-backup.sh`

**What it does:**
1. Takes the most recent backup from `./backups/` (or a specified file)
2. Restores it to `VERIFY_DB_URL` (a scratch database — never the production URL)
3. Runs row count checks on critical tables: `users`, `listings`, `dealers`, `job_queue`
4. Prints pass/fail for each check and exits non-zero if any count is zero

**Usage:**
```bash
export DATABASE_URL="postgresql://prod..."
export VERIFY_DB_URL="postgresql://scratch..."
./scripts/verify-backup.sh
```

**Purpose:** Confirms that the backup file is not only structurally valid (gunzip passes) but actually contains the expected data. A backup that restores to an empty database is useless.

---

## Render.com Managed Backups

Render provides daily automated PostgreSQL backups on paid plans (Starter and above). These are accessible from the Render dashboard under the database service → Backups tab.

- **Retention:** 7 days (Starter), 30 days (Standard+)
- **Restore:** one-click restore via Render dashboard; creates a new database instance
- **Limitation:** Render backups restore to a new database URL — update `DATABASE_URL` in the web service env vars and redeploy after a Render-managed restore

The `scripts/backup.sh` supplements Render backups by providing on-demand backups and a scriptable restore path that does not depend on Render dashboard access.

---

## Uploads Recovery

The `uploads/` directory contains listing photos uploaded by dealers. This directory is **not** backed up by `backup.sh`.

**Current state:** uploads live on the Render instance filesystem. If the instance is replaced or scaled, uploads are lost.

**Recommended production configuration:**
1. Configure an S3-compatible bucket (Cloudflare R2 recommended — zero egress fees)
2. Update the upload handler to write to the bucket instead of local filesystem
3. Enable bucket versioning so overwritten files are recoverable
4. The database stores the file path/key; as long as the DB is restored and the bucket is intact, uploads are fully recoverable

Until R2/S3 is configured, uploads should be manually synced off the instance before any destructive operation (instance replacement, region migration).

---

## Restore Runbook

Step-by-step procedure for a complete restore from backup:

**Step 1 — Identify last known good backup**
```bash
ls -lt ./backups/ | head -5
```
Choose the most recent backup before the incident. If using Render managed backups, identify the backup timestamp in the Render dashboard.

**Step 2 — Provision a clean environment**

- **Render:** create a new PostgreSQL instance from the Render dashboard, or restore a Render-managed backup to a new instance
- **Docker (local):** `docker-compose up -d postgres` creates a fresh PostgreSQL container

**Step 3 — Run restore**
```bash
./scripts/restore.sh backups/autobenta_20260531_140000.sql.gz "$NEW_DATABASE_URL"
# Type RESTORE when prompted
```

**Step 4 — Apply migrations**
```bash
cd backend && DATABASE_URL="$NEW_DATABASE_URL" npx prisma migrate deploy
```

**Step 5 — Update env var and redeploy**

In Render dashboard: update `DATABASE_URL` to the new database URL → trigger redeploy.

**Step 6 — Run smoke tests**
```bash
export API_URL="https://your-service.onrender.com"
./scripts/smoke-test.sh
```

**Step 7 — Verify health endpoint**
```bash
curl https://your-service.onrender.com/api/health
# Expect: { "status": "ok", "checks": { "database": { "status": "ok" }, ... } }
```

**Step 8 — Confirm RTO**

Document the time from incident declaration to `status: ok`. Target is < 2 hours. Log any deviations for process improvement.

---

## DR Test Schedule

| Test | Frequency | Procedure |
|---|---|---|
| Backup verification | Monthly | Run `scripts/verify-backup.sh` against latest backup |
| Full DR drill | Quarterly | Follow complete restore runbook on a staging environment, measure RTO |
| Render backup restore test | Quarterly | Restore Render-managed backup to a new database instance |

DR tests must be logged with: date, tester, backup file used, actual RTO achieved, and any issues found.

---

## Verdict: PASS

Previously flagged as NO-GO due to absence of backup scripts and undocumented restore process. Resolved by:
- `scripts/backup.sh` — automated pg_dump with integrity check and retention
- `scripts/restore.sh` — interactive restore with safety prompt
- `scripts/verify-backup.sh` — restore-to-scratch with row count validation
- This runbook documenting the end-to-end restore procedure
