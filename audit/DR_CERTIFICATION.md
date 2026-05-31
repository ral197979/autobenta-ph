# Disaster Recovery Certification

**Document:** DR_CERTIFICATION  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production  
**Auditor:** System audit via code review

---

## Database

- **Engine:** PostgreSQL
- **ORM:** Prisma
- **Migration tracking:** `backend/prisma/migrations/` — all schema changes are tracked as versioned migration files
- **Schema file:** `backend/prisma/schema.prisma`

---

## Migration Safety

The Prisma migration workflow (`prisma migrate dev` for development, `prisma migrate deploy` for production) applies migrations deterministically from a clean state. Each migration is a named, timestamped SQL file that is applied exactly once per database instance.

Migrations found in `backend/prisma/migrations/`:

| Migration | Description |
|---|---|
| `20260528205452_init` | Initial schema |
| `20260530094838_add_lat_lng_to_listings` | Add latitude/longitude to VehicleListing |
| `20260530102428_add_trust_fields_to_listings` | Add trust signal fields to VehicleListing |
| `20260530105629_verification_engine` | Verification workflow models |
| `20260530111556_dealer_network_platform` | Dealer network and B2B models |
| `20260531113738_marketplace_analytics` | Analytics and event tracking models |
| `20260531120340_dealer_growth_platform` | Growth and metrics models |
| `20260531121729_crm_revenue_activation` | CRM, revenue, and billing models |

All migrations are additive (new tables, new columns, new indexes). No destructive DDL (DROP TABLE, DROP COLUMN) was found in the migration history.

**For production deployments:** Use `prisma migrate deploy` (not `prisma migrate dev`). The `deploy` command applies pending migrations without generating new ones and does not run the Prisma schema diff interactively.

---

## Backup Strategy

**Status: NOT CONFIGURED**

No database backup scripts, cron jobs, or managed backup configuration were found in the repository. There is no automated mechanism to create or store PostgreSQL backups.

This is a P0 finding for disaster recovery. A database failure without a recent backup means complete data loss.

**Recommended minimum:**
- Automated daily `pg_dump` with retention of at least 7 days
- Backup stored off-host (S3, GCS, or equivalent)
- Backup completion and file size monitored and alerted on

If using a managed database service (Railway, Render, Supabase, RDS), enable the platform's automated backup feature immediately on first production deployment.

---

## Restore Process

**Status: NOT DOCUMENTED**

No restore runbook was found in the repository. In the event of data loss, there is no documented procedure for:

- Identifying the most recent clean backup
- Restoring to a fresh PostgreSQL instance
- Running `prisma migrate deploy` to apply any post-backup schema changes
- Verifying data integrity after restore
- Switching application traffic to the restored instance

A restore runbook must be written and tested before the first paying dealer is onboarded.

---

## Environment Recreation

Prisma migrations allow a fresh database to be recreated from zero by running `prisma migrate deploy` against an empty PostgreSQL instance. This covers schema recovery. However:

- **Environment variable documentation** is not present in the repository. The `REQUIRED_ENV` list in `backend/src/server.js` is the only source of truth for required variables. A documented `.env.example` file is missing.
- **Seed data** — no seed script was found. Admin user creation and initial plan/package data must be done manually after a restore.

---

## P0 Finding: No Database Backup Policy

The absence of any backup configuration in the repository means the production database has no automated recovery path. This is the primary reason for the DR NO-GO verdict.

---

## Verdict: NO-GO

Disaster recovery cannot be certified until:

1. Automated database backup is configured and verified
2. A restore runbook is written and tested
3. Environment variable documentation (`.env.example`) is committed to the repository

Schema recovery via Prisma migrations is the only DR capability that is currently in place.
