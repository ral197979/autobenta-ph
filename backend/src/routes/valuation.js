const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require("../lib/prisma");

const router = express.Router();

const CONDITION_MULT = { excellent: 1.06, good: 1.0, fair: 0.9, poor: 0.8 };
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const round1k = (n) => Math.round(n / 1000) * 1000;
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Estimate a vehicle's market value from comparable active listings (public).
router.post('/', [body('make').trim().notEmpty(), body('year').isInt(), body('mileage').isInt({ min: 0 })], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { make, model, year, mileage, condition = 'good', transmission } = req.body;
    const yr = parseInt(year);
    const mi = parseInt(mileage);

    const baseWhere = { status: 'active', make: { equals: make, mode: 'insensitive' } };
    const select = { price: true, mileage: true, year: true };

    // Prefer same make+model; fall back to make-only if too few comps.
    let comps = [];
    let matched = 'make_model';
    if (model) comps = await prisma.vehicleListing.findMany({ where: { ...baseWhere, model: { equals: model, mode: 'insensitive' } }, select, take: 50 });
    if (comps.length < 3) { comps = await prisma.vehicleListing.findMany({ where: baseWhere, select, take: 50 }); matched = 'make'; }

    if (comps.length === 0) {
      return res.json({ estimate: null, sampleSize: 0, confidence: 'none', message: 'Not enough market data for this vehicle yet.' });
    }

    const prices = comps.map((c) => Number(c.price));
    const base = median(prices);
    const avgMileage = comps.reduce((s, c) => s + (c.mileage || 0), 0) / comps.length;
    const avgYear = comps.reduce((s, c) => s + c.year, 0) / comps.length;

    const mileageFactor = clamp(1 - ((mi - avgMileage) / 10000) * 0.015, 0.7, 1.15);
    const yearFactor = clamp(1 + (yr - avgYear) * 0.04, 0.8, 1.25);
    const conditionFactor = CONDITION_MULT[condition] ?? 1.0;

    const estimate = round1k(base * mileageFactor * yearFactor * conditionFactor);
    const confidence = matched === 'make_model' && comps.length >= 5 ? 'high' : comps.length >= 3 ? 'medium' : 'low';

    res.json({
      estimate,
      low: round1k(estimate * 0.93),
      high: round1k(estimate * 1.07),
      sampleSize: comps.length,
      matched,
      confidence,
      tradeInEstimate: round1k(estimate * 0.88), // dealers typically pay ~10-15% below private sale
    });
  } catch (e) { next(e); }
});

module.exports = router;
