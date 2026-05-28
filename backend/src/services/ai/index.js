const { estimatePrice } = require('./priceEstimator');
const { checkFraud } = require('./fraudRiskScorer');
const { analyzeListingQuality } = require('./listingQualityAnalyzer');
const { buyerAssistant } = require('./buyerAssistant');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeListingWithAI(listingId) {
  const listing = await prisma.vehicleListing.findUnique({
    where: { id: listingId },
    include: { _count: { select: { photos: true } } },
  });
  if (!listing) return null;

  const [priceEst, fraudResult, qualityResult] = await Promise.all([
    estimatePrice({ make: listing.make, model: listing.model, year: listing.year, mileage: listing.mileage, condition: listing.condition }),
    checkFraud(listing),
    analyzeListingQuality(listing, listing._count.photos),
  ]);

  const analysis = await prisma.aIAnalysis.create({
    data: {
      listingId,
      estimatedPrice: priceEst.estimatedPrice,
      priceLow: priceEst.priceLow,
      priceHigh: priceEst.priceHigh,
      listingScore: qualityResult.score,
      fraudScore: fraudResult.riskScore,
      fraudFlags: fraudResult.flags,
      qualityFlags: qualityResult.suggestions,
      summary: `${listing.year} ${listing.make} ${listing.model} — Fair market value: ₱${priceEst.estimatedPrice.toLocaleString()}. Listing quality: ${qualityResult.quality}. Fraud risk: ${fraudResult.riskLevel}.`,
    },
  });

  if (fraudResult.flags.length > 0) {
    await prisma.vehicleListing.update({
      where: { id: listingId },
      data: { fraudFlags: fraudResult.flags },
    });
  }

  return analysis;
}

module.exports = { estimatePrice, checkFraud, analyzeListingQuality, buyerAssistant, analyzeListingWithAI };
