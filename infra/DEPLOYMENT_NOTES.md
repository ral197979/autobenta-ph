# AutoBentaPH Deployment Notes

## Platform: Render.com
Config: `render.yaml` at repo root

## Build Process
1. Install all deps: `npm install --include=dev`
2. Build frontend: `npm --workspace=frontend run build`
3. Copy to backend/public: `mkdir -p backend/public && cp -r frontend/dist/. backend/public`
4. Generate Prisma: `cd backend && npx prisma generate`

## Start Process
1. Run migrations: `cd backend && npx prisma migrate deploy`
2. Start server: `node src/server.js`

## Health Check
Render polls: `GET /api/health`
Expected: HTTP 200 with `{ "status": "ok" }`

## Environment Variables
See `.env.example` for full list.
Required: DATABASE_URL, JWT_SECRET, FRONTEND_URL
V8Atlas: set V8ATLAS_ENABLED=true + V8ATLAS_* vars to enable

## Database
PostgreSQL 16 (Render managed)
Backups: Render manages daily backups (Starter plan +)
Manual backup: `./scripts/backup.sh`

## Docker (local dev only)
```
docker-compose up
```
App: http://localhost:3001
DB: localhost:5432

## Rollback
Render supports instant rollback via dashboard (Deploy → previous deploy → Rollback).
DB: restore from `./scripts/restore.sh <backup_file> $DATABASE_URL`
