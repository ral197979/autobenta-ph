/**
 * Mock: classify vehicle from an image.
 * In live mode this would call a vision API (GPT-4o or similar).
 * Returns { make, model, year, bodyType, color, confidence }
 */
async function classifyVehicle(imageUrl) {
  if (process.env.AI_MODE === 'live') {
    throw new Error('Live vision not yet implemented. Set AI_MODE=mock.');
  }

  // Mock: return plausible PH market defaults
  return {
    make: 'Toyota',
    model: 'Vios',
    year: 2020,
    bodyType: 'Sedan',
    color: 'Silver',
    confidence: 0.75,
    source: 'mock',
  };
}

module.exports = { classifyVehicle };
