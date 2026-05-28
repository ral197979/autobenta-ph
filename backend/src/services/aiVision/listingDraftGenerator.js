const { classifyVehicle } = require('./imageVehicleClassifier');
const { readMileage } = require('./ocrMileageReader');
const { detectDamage } = require('./damageDetector');
const { estimateCondition } = require('./conditionEstimator');

/**
 * Generate a listing draft from an array of image URLs.
 * Runs all vision pipeline stages and assembles a pre-filled listing object.
 *
 * @param {string[]} imageUrls
 * @returns {object} aiDraftData — can be spread into a listing create payload
 */
async function generateListingDraft(imageUrls) {
  if (!imageUrls || imageUrls.length === 0) {
    return { source: 'mock', confidence: 0, partial: true };
  }

  const primaryImage = imageUrls[0];

  const [vehicle, mileageResult, damageResult] = await Promise.all([
    classifyVehicle(primaryImage),
    readMileage(primaryImage),
    detectDamage(primaryImage),
  ]);

  const conditionResult = await estimateCondition({
    hasDamage: damageResult.hasDamage,
    damageAreas: damageResult.damageAreas,
    severity: damageResult.severity,
    mileage: mileageResult.mileage,
    year: vehicle.year,
  });

  const overallConfidence = (
    vehicle.confidence * 0.4 +
    mileageResult.confidence * 0.3 +
    damageResult.confidence * 0.3
  );

  return {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    bodyType: vehicle.bodyType,
    color: vehicle.color,
    mileage: mileageResult.mileage,
    condition: conditionResult.condition,
    hasAccident: damageResult.hasDamage && damageResult.severity !== 'none',
    accidentNotes: damageResult.hasDamage ? `AI detected: ${damageResult.damageAreas.join(', ')}` : null,
    aiConfidence: Math.round(overallConfidence * 100),
    source: 'ai_vision_mock',
    partial: overallConfidence < 0.7,
  };
}

module.exports = { generateListingDraft };
