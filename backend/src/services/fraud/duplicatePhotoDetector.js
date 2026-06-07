const prisma = require("../../lib/prisma");

/**
 * Check if a listing's photos reuse storage keys that appear in other listings.
 * Returns a FraudFlag-shaped object or null.
 */
async function detectDuplicatePhotos(listingId) {
  const photos = await prisma.vehiclePhoto.findMany({
    where: { listingId },
    select: { storageKey: true, url: true },
  });

  if (!photos.length) return null;

  const keys = photos.map(p => p.storageKey).filter(Boolean);
  if (!keys.length) return null;

  // Look for other listings using the same storage keys
  const duplicates = await prisma.vehiclePhoto.findMany({
    where: {
      storageKey: { in: keys },
      listingId: { not: listingId },
    },
    select: { listingId: true, storageKey: true },
    distinct: ['listingId'],
  });

  if (!duplicates.length) return null;

  return {
    flagType: 'duplicate_photos',
    severity: 'high',
    title: 'Duplicate Photos Detected',
    description: `Photos from this listing appear in ${duplicates.length} other listing(s). Possible duplicate or scam listing.`,
    metadata: { duplicateListingIds: [...new Set(duplicates.map(d => d.listingId))] },
  };
}

module.exports = { detectDuplicatePhotos };
