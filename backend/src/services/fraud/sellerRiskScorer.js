const prisma = require("../../lib/prisma");

/**
 * Calculate or update the SellerRiskProfile for a user based on their listing history.
 * Returns the upserted SellerRiskProfile record.
 */
async function updateSellerRiskProfile(userId) {
  const [totalListings, flaggedListings] = await Promise.all([
    prisma.vehicleListing.count({ where: { sellerId: userId } }),
    prisma.vehicleListing.count({ where: { sellerId: userId, fraudScore: { gte: 25 } } }),
  ]);

  // Check rapid listing (>5 in 24h)
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await prisma.vehicleListing.count({
    where: { sellerId: userId, createdAt: { gte: since24h } },
  });
  const rapidListings = recentCount > 5;

  // Check for duplicate listing history
  const duplicateFlagCount = await prisma.fraudFlag.count({
    where: {
      listing: { sellerId: userId },
      flagType: { in: ['duplicate_photos', 'duplicate_listing'] },
    },
  });
  const duplicateHistory = duplicateFlagCount > 0;

  // Score calculation
  let riskScore = 0;
  if (flaggedListings > 0) riskScore += Math.min(flaggedListings * 10, 40);
  if (rapidListings) riskScore += 20;
  if (duplicateHistory) riskScore += 25;
  if (totalListings > 0) {
    const flagRatio = flaggedListings / totalListings;
    if (flagRatio > 0.5) riskScore += 15;
  }
  riskScore = Math.min(riskScore, 100);

  const riskLevel =
    riskScore >= 70 ? 'critical' :
    riskScore >= 50 ? 'high' :
    riskScore >= 25 ? 'medium' : 'low';

  return prisma.sellerRiskProfile.upsert({
    where: { userId },
    update: {
      riskScore,
      riskLevel,
      totalListings,
      flaggedListings,
      rapidListings,
      duplicateHistory,
      lastCalculated: new Date(),
    },
    create: {
      userId,
      riskScore,
      riskLevel,
      totalListings,
      flaggedListings,
      rapidListings,
      duplicateHistory,
    },
  });
}

module.exports = { updateSellerRiskProfile };
