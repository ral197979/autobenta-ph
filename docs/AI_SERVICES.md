# AutoBenta PH — AI Services Guide

## Overview

All AI services support two modes controlled by `AI_MODE`:

| Mode | Behavior |
|------|----------|
| `mock` (default) | Deterministic, no API calls, fast, testable |
| `live` | Real LLM/vision API calls (requires keys) |

---

## Core AI Services (`src/services/ai/`)

### Price Estimator

```javascript
const { estimatePrice } = require('./priceEstimator');

const result = await estimatePrice({
  make: 'Toyota',
  model: 'Vios',
  year: 2020,
  mileage: 40000,
  condition: 'good',   // excellent | good | fair | poor
});
// result: { estimatedPrice, priceLow, priceHigh, confidence, factors }
```

**Mock logic:**
- Base price from PH market table (`PH_PRICE_BASE`)
- × depreciation factor: `(1 - 0.08) ^ age`
- × mileage factor: `1 - (mileage / 10000) × 0.01`
- × condition multiplier: `excellent:1.05 / good:1.0 / fair:0.88 / poor:0.75`
- `confidence`: `high` if make+model in base table, `medium` otherwise

---

### Fraud Risk Scorer

```javascript
const { checkFraud } = require('./fraudRiskScorer');

const result = await checkFraud({
  make, model, year, mileage, condition,
  price, hasOrCr, hasFlood, hasAccident,
  floodNotes, accidentNotes, description,
});
// result: { riskScore, riskLevel, flags: [{ type, severity, message }] }
```

Used by the listing route before creating a listing. Also called by the fraud rules engine.

---

### Listing Quality Analyzer

```javascript
const { analyzeListingQuality } = require('./listingQualityAnalyzer');

const result = await analyzeListingQuality(listing, photoCount);
// result: { score, quality, suggestions }
```

Scores: description length, photo count, completeness (color/bodyType/variant/ownerCount), disclosures (serviceHistory/accident/flood/orCr).

Quality grades: `excellent (80+)` / `good (60+)` / `fair (40+)` / `poor`

---

### Buyer Assistant

```javascript
const { buyerAssistant } = require('./buyerAssistant');

const result = await buyerAssistant({
  question: 'Is this a good deal?',
  listing: { year, make, model, price, mileage, condition },   // optional
  compareListings: [listing1, listing2],                        // optional
});
// result: { answer, checklist, negotiationTips }
```

Pattern-matches keywords: `good deal`, `flood`, `check/inspect`, `compare`, `negotiate`, `OR/CR/document`.

---

### Full Listing Analysis (orchestrator)

```javascript
const { analyzeListingWithAI } = require('./index');

await analyzeListingWithAI(listingId);
// Creates AIAnalysis record + updates listing.fraudScore
```

Called automatically on every `POST /api/listings` submission.

---

## AI Vision Pipeline (`src/services/aiVision/`)

Photo-based listing draft generation — used by the AI Listing Wizard.

```javascript
const { generateListingDraft } = require('./listingDraftGenerator');

const draft = await generateListingDraft([
  'https://cdn.example.com/photo1.jpg',
  'https://cdn.example.com/photo2.jpg',
]);
/*
draft: {
  make, model, year, bodyType, color,
  mileage, condition, hasAccident, accidentNotes,
  aiConfidence: 78,     // 0–100
  source: 'ai_vision_mock',
  partial: false,
}
*/
```

The draft is stored as `VehicleListing.aiDraftData` (JSON) for auditing and pre-filling the create form.

### Vision API Endpoint

```
POST /api/ai-vision/draft
Authorization: Bearer <token>
Content-Type: application/json

{ "imageUrls": ["url1", "url2"] }
```

---

## Enabling Live Mode

### Core AI (buyer assistant, price estimator)

```bash
AI_MODE=live
OPENAI_API_KEY=sk-...
```

Update `src/services/ai/buyerAssistant.js` to call the OpenAI chat completions API when `AI_MODE === 'live'`.

### Vision Pipeline

```bash
AI_MODE=live
OPENAI_API_KEY=sk-...   # GPT-4o with vision
```

Update each vision module's `if (process.env.AI_MODE === 'live')` branch to call the vision API.

---

## Adding a New AI Feature

1. Create a file in `src/services/ai/` or `src/services/aiVision/`
2. Export an async function that checks `AI_MODE`
3. Return the same shape in both mock and live modes
4. Write tests in `__tests__/` — mock mode must be fully testable

```javascript
// Template
async function myFeature(input) {
  if (process.env.AI_MODE === 'live') {
    // live implementation
  }
  // mock implementation (deterministic)
  return { result: '...', source: 'mock' };
}
module.exports = { myFeature };
```
