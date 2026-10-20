const prisma = require("../../lib/prisma");
const { detectDuplicatePhotos } = require('./duplicatePhotoDetector');
const { detectSuspiciousPricing } = require('./suspiciousPricingDetector');
const { analyzeVehicleFraudSignals } = require('./vehicleFraudAnalyzer');
const { updateSellerRiskProfile } = require('./sellerRiskScorer');


const SEVERITY_SCORES = { low: 5, medium: 15, high: 30, critical: 50 };

/**
 * Run all fraud checks on a listing and persist results.
 * Returns { fraudScore, flags, riskProfile }
 */
async function runFraudRulesEngine(listingId) {
  const listing = await prisma.vehicleListing.findUnique({ where: { id: listingId } });
  if (!listing) throw new Error(`Listing ${listingId} not found`);

  // Run detectors in parallel
  const [pricingFlags, photoFlag] = await Promise.all([
    detectSuspiciousPricing(listing),
    detectDuplicatePhotos(listingId),
  ]);

  const vehicleFlags = analyzeVehicleFraudSignals(listing);

  const allFlagData = [
    ...pricingFlags,
    ...(photoFlag ? [photoFlag] : []),
    ...vehicleFlags,
  ];

  // Persist new flags (skip if same flagType already exists and unresolved)
  const existingFlags = await prisma.fraudFlag.findMany({
    where: { listingId, isResolved: false },
    select: { flagType: true },
  });
  const existingTypes = new Set(existingFlags.map(f => f.flagType));

  const newFlags = allFlagData.filter(f => !existingTypes.has(f.flagType));
  if (newFlags.length > 0) {
    await prisma.fraudFlag.createMany({
      data: newFlags.map(f => ({ ...f, listingId, autoDetected: true })),
    });
  }

  // Compute fraud score from all unresolved flags
  const unresolvedFlags = await prisma.fraudFlag.findMany({
    where: { listingId, isResolved: false },
  });
  const fraudScore = Math.min(
    unresolvedFlags.reduce((sum, f) => sum + (SEVERITY_SCORES[f.severity] || 0), 0),
    100
  );

  // Update listing fraud score
  await prisma.vehicleListing.update({
    where: { id: listingId },
    data: { fraudScore, fraudFlags: unresolvedFlags.map(f => ({ type: f.flagType, severity: f.severity })) },
  });

  // Update seller risk profile
  const riskProfile = await updateSellerRiskProfile(listing.sellerId);

  return { fraudScore, flags: unresolvedFlags, riskProfile };
}

module.exports = { runFraudRulesEngine };
