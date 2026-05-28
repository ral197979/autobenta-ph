# AutoBenta PH — Used Car Marketplace

AI-powered used car marketplace for the Philippines. Buy, sell, finance, and inspect used vehicles with confidence.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 1. Clone & Install
```bash
git clone <repo-url>
cd autobenta-ph
cp .env.example .env
# Edit .env — set DATABASE_URL
npm install
```

### 2. Setup Database
```bash
npm run migrate        # Run Prisma migrations
npm run seed           # Seed demo data
```

### 3. Run Development
```bash
npm run dev            # Starts backend (3001) + frontend (5173)
```

Open http://localhost:5173

### Test Accounts (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@autobenta.ph | admin123 |
| Inspector | inspector@autobenta.ph | inspector123 |
| Dealer | dealer@lto-motors.ph | dealer123 |
| Buyer | juan@example.com | buyer123 |
| Seller | carlo@example.com | seller123 |

## Project Structure
```
autobenta-ph/
├── backend/           # Node.js + Express + Prisma
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── middleware/ # Auth, upload
│   │   └── services/ai/ # AI service stubs
│   ├── prisma/        # Schema + seed
│   └── __tests__/     # Jest tests
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── pages/     # 12 route pages
│       ├── components/ # Shared components
│       ├── context/   # Auth context
│       └── api/       # Axios client
├── docs/              # Documentation
├── scripts/           # Smoke test
└── infra/             # Deployment config
```

## Available Scripts
```bash
npm run dev            # Run both frontend and backend
npm run dev:backend    # Backend only (port 3001)
npm run dev:frontend   # Frontend only (port 5173)
npm run migrate        # Prisma DB migrate dev
npm run seed           # Seed demo data
npm run test           # Run Jest test suite
bash scripts/smoke-test.sh  # API smoke tests
```

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + TanStack Query
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Upload**: Multer (local, S3-ready)
- **AI**: Mock mode (plug in OpenAI by setting AI_MODE=live + OPENAI_API_KEY)

## Docs
- [Product Spec](docs/PRODUCT_SPEC.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Reference](docs/API_REFERENCE.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [PH Marketplace Roadmap](docs/PH_MARKETPLACE_ROADMAP.md)
