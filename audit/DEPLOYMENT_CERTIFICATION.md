# Deployment Certification

**Document:** DEPLOYMENT_CERTIFICATION  
**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Production  
**Auditor:** System audit via code review

---

## Environment Variables

**Required at startup** (enforced in `backend/src/server.js` via `REQUIRED_ENV` — process exits with code 1 if any are missing):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `FRONTEND_URL` | Allowed CORS origin |

If any required variable is absent, the server logs the missing variable names and calls `process.exit(1)`. The application will not start in a misconfigured state.

---

## Optional Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `V8ATLAS_ENABLED` | Enables V8Atlas provider registration | `false` |
| `V8ATLAS_BASE_URL` | V8Atlas API base URL | none |
| `V8ATLAS_API_KEY` | V8Atlas API authentication key | none |
| `V8ATLAS_WEBHOOK_SECRET` | HMAC secret for webhook verification | none |
| `LOG_LEVEL` | Pino log level | `info` in production |
| `PORT` | HTTP server port | `3000` |

When `V8ATLAS_ENABLED=true`, the three V8Atlas variables become effectively required — the adapter will fail to make authenticated requests without them.

---

## Production Mode

`NODE_ENV=production` activates the following behaviors:

- **Frontend static serving:** Express serves the built frontend from the `frontend/dist` directory, enabling single-binary deployment (frontend + backend served from the same Node.js process)
- **Stack trace suppression:** The global error handler omits `stack` from client-facing error responses
- **Log level:** Defaults to `info` (no debug-level noise)
- **Webhook bypass disabled:** V8Atlas webhook signature bypass is disabled (returns 500 if secret missing)

---

## Graceful Shutdown

SIGTERM and SIGINT handlers are registered in `backend/src/server.js`. On signal receipt:

1. HTTP server stops accepting new connections (`server.close()`)
2. Prisma client disconnects from the database (`prisma.$disconnect()`)
3. A hard 10-second timeout forcibly exits the process if shutdown has not completed

This ensures in-flight requests are completed and the DB connection pool is released cleanly during deployments.

---

## Docker

**Status: NOT FOUND**

No `Dockerfile`, `docker-compose.yml`, or `.dockerignore` was found in the repository. Without a container image:

- Deployment is manual and environment-dependent
- There is no reproducible build artifact
- Container orchestration (Railway, Render, Fly.io, ECS) cannot be used directly

A `Dockerfile` is required before the first production deployment. This is listed as a Condition Required Before First Paying Dealer in `00_PRODUCTION_CERTIFICATION.md`.

---

## CI/CD

**Status: NOT FOUND**

No GitHub Actions workflow files, CircleCI configuration, or other CI/CD pipeline configuration was found in the repository. Without CI/CD:

- There is no automated test run on pull requests
- There is no automated build and deployment on merge to main
- Deployments are fully manual

A CI/CD pipeline is strongly recommended before onboarding external paying dealers.

---

## Build Reproducibility

- `npm` scripts are present: `build` compiles the frontend, `start` launches the backend
- Prisma client is generated from `backend/prisma/schema.prisma` via `prisma generate` — the generated client is deterministic from the schema
- `package-lock.json` is present — dependency versions are pinned

The application can be built reproducibly from source given the correct Node.js version and environment variables.

**Migration command for production:** `prisma migrate deploy` (not `prisma migrate dev`). The `deploy` command applies pending migrations without interactive prompts and does not modify the migration history.

---

## P1 Findings

| ID | Finding | Status |
|---|---|---|
| — | No Dockerfile in repository | Open — Required condition |
| — | No CI/CD pipeline configuration | Open |
| — | No deployment runbook | Open — Required condition |
| — | No `.env.example` file documenting required variables | Open |

---

## Verdict: NO-GO

Deployment cannot be certified until a `Dockerfile` and deployment runbook exist. The application code is production-ready in behavior (env validation, graceful shutdown, production mode). The infrastructure to deploy it reliably and reproducibly is absent.
