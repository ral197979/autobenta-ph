/**
 * Mock: detect visible damage from a vehicle image.
 * Returns { hasDamage, damageAreas, severity, confidence, source }
 */
async function detectDamage(imageUrl) {
  if (process.env.AI_MODE === 'live') {
    throw new Error('Live damage detection not yet implemented. Set AI_MODE=mock.');
  }

  return {
    hasDamage: false,
    damageAreas: [],
    severity: 'none',
    confidence: 0.70,
    source: 'mock',
  };
}

module.exports = { detectDamage };
