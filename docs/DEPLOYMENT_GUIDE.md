# AutoBenta PH — Deployment Guide (Render)

## Overview
AutoBenta PH is designed to deploy on Render with a PostgreSQL database.

## Services Required
1. **Web Service** — Node.js backend
2. **Static Site** — React frontend (or serve from backend)
3. **PostgreSQL** — Managed database

---

## 1. Database Setup (Render PostgreSQL)

1. Create a new PostgreSQL instance on Render
2. Copy the **Internal Database URL**
3. Set it as `DATABASE_URL` in environment variables

---

## 2. Backend Web Service

**Settings:**
- **Environment**: Node
- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command**: `node src/server.js`
- **Root Directory**: `backend`

**Environment Variables:**
```
DATABASE_URL=<from render postgres>
JWT_SECRET=<generate a strong secret: openssl rand -hex 64>
JWT_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend.onrender.com
PORT=10000
AI_MODE=mock
UPLOAD_DIR=uploads
```

**Disk** (for photo uploads):
- Mount Path: `/opt/render/project/src/uploads`
- Size: 5 GB

---

## 3. Frontend Static Site

**Settings:**
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Root Directory**: `frontend`

**Environment Variables:**
```
VITE_API_URL=https://your-backend.onrender.com
```

Update `frontend/vite.config.js` proxy target to use the Render backend URL in production builds, or set `VITE_API_URL` and configure `src/api/client.js` baseURL accordingly.

---

## 4. Post-Deploy: Seed Data

After first deploy, run seed via Render Shell:
```bash
cd backend && node prisma/seed.js
```

Or add a one-time job in your Render dashboard.

---

## 5. Custom Domain (Optional)

1. Add custom domain in Render settings
2. Update `CORS_ORIGIN` / `FRONTEND_URL` to match
3. SSL is automatic via Render

---

## 6. Monitoring

- Render provides basic request logs via the dashboard
- Add a health check in Render: `GET /api/health`
- Set auto-deploy on push to `main`

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_SECRET | Yes | Secret key for JWT signing |
| JWT_EXPIRES_IN | No | Token expiry (default: 7d) |
| PORT | No | Server port (Render uses 10000) |
| NODE_ENV | Yes | Set to `production` |
| FRONTEND_URL | Yes | Frontend URL for CORS |
| AI_MODE | No | `mock` or `live` |
| OPENAI_API_KEY | No | Required if AI_MODE=live |
| AWS_ACCESS_KEY_ID | No | For S3 photo storage |
| AWS_SECRET_ACCESS_KEY | No | For S3 photo storage |
| AWS_REGION | No | AWS region (default: ap-southeast-1) |
| AWS_S3_BUCKET | No | S3 bucket name |

---

## Production Checklist

- [ ] Strong `JWT_SECRET` set (never use default)
- [ ] `NODE_ENV=production`
- [ ] CORS restricted to frontend domain
- [ ] Database URL points to production DB
- [ ] Seed data loaded
- [ ] Health check configured in Render
- [ ] Custom domain set (optional)
- [ ] S3 configured for photo persistence (disk is ephemeral on free tier)
