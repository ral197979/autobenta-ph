# AutoBenta PH — Product Roadmap

## Current: MVP (Phase 1)
**Status**: Complete

### Delivered
- Public marketplace with full search + filters
- Seller listing workflow (multi-step form, photo upload)
- Buyer workflow (favorites, inquiries, inspection requests, financing)
- Dealer dashboard with lead pipeline (CRM)
- AI services in mock mode (price estimate, fraud detection, listing quality, buyer assistant)
- Vehicle inspection workflow (request → report → badge)
- Financing calculator with pre-qualification
- Admin panel (listings, users, dealers, financing, audit logs)
- Role-based access control (buyer/seller/dealer/inspector/admin)
- Seed data: 8 PH cars, 2 dealers, multiple users
- REST API with JWT auth
- Test suite + smoke tests

---

## Phase 2 — Engagement & Trust
**Target**: 3–6 months post-launch

### Real-time Messaging
- In-app chat between buyer and seller
- WebSocket-based using Socket.io
- Message read receipts
- Push notifications (web push or SMS via Semaphore PH)

### Enhanced AI (Live Mode)
- Connect OpenAI GPT-4o for real buyer assistant
- Voice-to-text for buyer queries
- Auto-generated listing descriptions from photos (vision API)
- Smarter price estimation using live market comps

### Verified Listings
- LTO plate verification integration (or manual + admin check)
- "AutoBenta Verified" badge for inspected + OR/CR confirmed units
- CarFax-style vehicle history stub

### Seller Trust Features
- Seller rating/review system
- ID verification (GovernmentID + selfie upload)
- Chat response rate badge
- Response time metric

### Buyer Tools
- EMI schedule breakdown
- Pre-approval letter PDF download
- Compare saved cars later (persistent comparison lists)
- Price history chart per make/model

---

## Phase 3 — Revenue & Scale
**Target**: 6–12 months

### Monetization
- Featured/sponsored listings (pay per day or boost)
- Dealer subscription plans (basic/pro/enterprise)
- Premium inspection add-ons (same-day, with video)
- Affiliate financing (partner bank fee-sharing)
- Lead generation packages for dealers

### Dealer Pro Features
- Bulk listing CSV import
- API access for dealer inventory systems
- White-label dealer microsite
- Advanced CRM (reminders, email sequences, notes history)
- Multi-user dealer account (salesperson sub-accounts)

### Marketplace Expansion
- Motorcycles category
- Commercial vehicles (trucks, buses, heavy equipment)
- Parts & accessories listings
- Auction listings (highest bid with reserve)

### Infrastructure
- S3 photo storage (remove local disk dependency)
- CDN for photo serving
- Redis caching for listings
- Full-text search with Elasticsearch/Meilisearch
- Background jobs (BullMQ) for AI analysis, notifications

---

## Phase 4 — PH Market Dominance
**Target**: 12–18 months

### Regional & Language
- Tagalog/Filipino UI option
- Cebuano interface for Visayas
- Regional pricing insights (NCR vs Cebu vs Davao)

### Financial Services
- In-app loan application routing to BDO, BPI, Metrobank, RCBC
- Insurance marketplace integration (car insurance quotes)
- Extended warranty marketplace

### Mobile Apps
- React Native or Expo app
- Camera-first listing creation (snap + AI auto-fill)
- AR price estimation (point at car, see estimate)
- Offline listing drafts

### Trust Infrastructure
- Escrow-based payment holding for COD protection
- Digital Deed of Sale generator
- LTO transfer assistance service (partner notaries)
- Fraud blacklist database (shared across PH used car platforms)

### Data & Analytics
- Market price index (published monthly)
- Depreciation curve by model
- Regional demand heatmap
- Seller analytics dashboard (listing views, conversion funnel)

---

## Known Technical Debt (Phase 1)
| Item | Priority | Notes |
|------|----------|-------|
| S3 photo storage | High | Current: local disk (not persistent on Render free tier) |
| Real AI provider | High | Set AI_MODE=live + OPENAI_API_KEY |
| Email notifications | Medium | Inquiry received, inspection scheduled, etc. |
| Photo optimization | Medium | Resize/compress on upload |
| Rate limiting | Medium | Add express-rate-limit to auth endpoints |
| Password reset | Medium | Needs email provider |
| Prisma connection pooling | Low | Use PgBouncer or Prisma Data Proxy for production scale |
| Message queue | Low | Move AI analysis to background job |
| Logging | Low | Add structured logging (pino/winston) |
