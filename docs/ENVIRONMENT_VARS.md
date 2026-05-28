# AutoBenta PH — Environment Variables Reference

## Backend (`backend/.env`)

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string. Format: `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Secret used to sign JWT tokens. Use a random 32+ character string in production. |

### Application

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port to listen on |
| `NODE_ENV` | — | `development` \| `production` \| `test`. Affects logging, error details, pino-pretty |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |
| `LOG_LEVEL` | `debug` (dev) / `info` (prod) | pino log level: `trace` / `debug` / `info` / `warn` / `error` |

### File Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_PROVIDER` | `local` | `local` (disk) or `r2` (Cloudflare R2) |
| `UPLOAD_DIR` | `uploads` | Local disk directory for photos (relative or absolute) |
| `R2_ENDPOINT_URL` | — | Cloudflare R2 endpoint URL (required if `STORAGE_PROVIDER=r2`) |
| `R2_ACCESS_KEY_ID` | — | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | — | R2 API token secret |
| `R2_BUCKET_NAME` | — | R2 bucket name |
| `R2_PUBLIC_URL` | — | Public CDN URL for serving R2 objects (e.g. `https://pub-xxx.r2.dev`) |

### AI Services

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_MODE` | `mock` | `mock` (deterministic) or `live` (real LLM calls) |
| `OPENAI_API_KEY` | — | Required when `AI_MODE=live` |

---

## Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | API base URL. In production set to the backend service URL if not same-origin. |

---

## Development Setup

Create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

Minimum working set for local development:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/autobenta_dev
JWT_SECRET=local-dev-secret-change-in-production
NODE_ENV=development
```

---

## Production Checklist (Render)

### PostgreSQL Database service
- Copy the **Internal Database URL** → set as `DATABASE_URL`

### Backend Web Service env vars
```
DATABASE_URL=<from postgres service>
JWT_SECRET=<generate: openssl rand -base64 32>
NODE_ENV=production
FRONTEND_URL=https://<your-frontend>.onrender.com
STORAGE_PROVIDER=r2
R2_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<key>
R2_SECRET_ACCESS_KEY=<secret>
R2_BUCKET_NAME=autobenta-photos
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
AI_MODE=mock
```

### Frontend Static Site env vars
```
VITE_API_URL=https://<backend-service>.onrender.com/api
```

---

## Secrets Management

- **Never commit `.env` files** — `.gitignore` already excludes them
- Use Render's **Secret Files** or **Environment Groups** for shared secrets
- Rotate `JWT_SECRET` periodically (invalidates all existing sessions)
- Generate strong secrets: `openssl rand -base64 32`

---

## Env Validation

The backend validates `DATABASE_URL` and `JWT_SECRET` at startup. Missing either causes immediate exit:

```
Missing required env vars: DATABASE_URL, JWT_SECRET
```

In test mode (`NODE_ENV=test`), `jest.setup.js` provides fallback values so tests run without a real database.
