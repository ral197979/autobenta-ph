/**
 * Mock: extract odometer reading from an image via OCR.
 * Returns { mileage, confidence, source }
 */
async function readMileage(imageUrl) {
  if (process.env.AI_MODE === 'live') {
    throw new Error('Live OCR not yet implemented. Set AI_MODE=mock.');
  }

  return {
    mileage: 45000,
    confidence: 0.65,
    source: 'mock',
  };
}

module.exports = { readMileage };
