// Price estimator — mock mode returns deterministic estimates based on PH market data.
// Swap getMockEstimate for a real LLM call when AI_MODE=live.

const PH_PRICE_BASE = {
  toyota: { vios: 800000, fortuner: 1800000, innova: 1300000, hilux: 1600000 },
  honda: { city: 900000, civic: 1200000, jazz: 750000, crv: 1600000 },
  mitsubishi: { montero: 1700000, xpander: 1200000, strada: 1500000 },
  ford: { ranger: 1500000, everest: 2000000, ecosport: 900000 },
  nissan: { navara: 1400000, terra: 1800000, almera: 750000 },
  suzuki: { ertiga: 900000, vitara: 1100000, jimny: 1200000 },
  hyundai: { starex: 1300000, tucson: 1400000, accent: 800000 },
  isuzu: { dmax: 1500000, crosswind: 700000 },
};

const DEPRECIATION_PER_YEAR = 0.08;
const MILEAGE_PENALTY_PER_10K = 0.01;
const CONDITION_MULTIPLIERS = { excellent: 1.05, good: 1.0, fair: 0.88, poor: 0.75 };

function getMockEstimate({ make, model, year, mileage, condition }) {
  const makeKey = (make || '').toLowerCase();
  const modelKey = (model || '').toLowerCase();
  const currentYear = new Date().getFullYear();
  const age = currentYear - parseInt(year || currentYear);

  const makeData = PH_PRICE_BASE[makeKey];
  let basePrice = makeData?.[modelKey] || 1000000;

  const depreciationFactor = Math.max(0.4, 1 - age * DEPRECIATION_PER_YEAR);
  const mileageFactor = Math.max(0.7, 1 - Math.floor((parseInt(mileage) || 0) / 10000) * MILEAGE_PENALTY_PER_10K);
  const conditionMultiplier = CONDITION_MULTIPLIERS[condition] || 1.0;

  const estimated = Math.round(basePrice * depreciationFactor * mileageFactor * conditionMultiplier / 1000) * 1000;
  const low = Math.round(estimated * 0.9 / 1000) * 1000;
  const high = Math.round(estimated * 1.1 / 1000) * 1000;

  return {
    estimatedPrice: estimated,
    priceLow: low,
    priceHigh: high,
    confidence: makeData?.[modelKey] ? 'high' : 'medium',
    factors: { age, depreciationFactor, mileageFactor, conditionMultiplier },
  };
}

async function estimatePrice(params) {
  if (process.env.AI_MODE === 'live' && process.env.OPENAI_API_KEY) {
    // TODO: replace with real LLM call
  }
  return getMockEstimate(params);
}

module.exports = { estimatePrice };
