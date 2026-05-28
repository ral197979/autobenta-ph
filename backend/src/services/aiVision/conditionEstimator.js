/**
 * Mock: estimate vehicle condition from image analysis results.
 * Returns { condition, score, notes, source }
 */
async function estimateCondition({ hasDamage, damageAreas, severity, mileage, year }) {
  if (process.env.AI_MODE === 'live') {
    throw new Error('Live condition estimation not yet implemented. Set AI_MODE=mock.');
  }

  const age = new Date().getFullYear() - (year || 2020);
  const highMileage = (mileage || 0) > 100000;

  let condition = 'good';
  let score = 75;

  if (hasDamage && severity === 'high') {
    condition = 'poor';
    score = 40;
  } else if (hasDamage && severity === 'medium') {
    condition = 'fair';
    score = 58;
  } else if (age > 10 || highMileage) {
    condition = 'fair';
    score = 60;
  } else if (age <= 3 && !hasDamage) {
    condition = 'excellent';
    score = 90;
  }

  return { condition, score, notes: 'AI condition estimate (mock)', source: 'mock' };
}

module.exports = { estimateCondition };
