const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Route a lead to the best dealer for a given listing.
 * Returns { dealerId, reason, score }
 */
async function routeLead(listingId, lead) {
  const listing = await prisma.vehicleListing.findUnique({
    where: { id: listingId },
    select: { dealerId: true, city: true, region: true },
  });

  if (!listing) throw Object.assign(new Error('Listing not found'), { status: 404 });

  // Ownership-protected: listing is assigned to a dealer
  if (listing.dealerId) {
    const hasCapacity = await dealerHasCapacity(listing.dealerId);
    await prisma.auditLog.create({
      data: {
        action: 'LEAD_ROUTED',
        entityType: 'Lead',
        entityId: listingId,
        details: {
          dealerId: listing.dealerId,
          reason: hasCapacity ? 'listing_owner' : 'listing_owner_over_capacity',
          listingId,
          lead,
        },
      },
    });
    return { dealerId: listing.dealerId, reason: 'listing_owner', score: 100 };
  }

  // No assigned dealer — find best dealer in same city/region
  const candidates = await prisma.dealer.findMany({
    where: {
      OR: [
        { city: listing.city },
        { branches: { some: { city: listing.city } } },
      ],
    },
    select: {
      id: true,
      tier: true,
      avgResponseHours: true,
      dealerMetrics: { select: { performanceScore: true } },
      subscription: { select: { status: true } },
    },
  });

  if (candidates.length === 0) {
    await prisma.auditLog.create({
      data: {
        action: 'LEAD_ROUTE_UNASSIGNED',
        entityType: 'Lead',
        entityId: listingId,
        details: { reason: 'no_dealers_in_area', city: listing.city, region: listing.region },
      },
    });
    return { dealerId: null, reason: 'no_dealers_in_area', score: 0 };
  }

  const TIER_ORDER = { enterprise: 4, verified_pro: 3, verified: 2, basic: 1, free: 0 };

  // Score and rank candidates
  const scored = candidates
    .filter(d => d.subscription?.status === 'active' || !d.subscription)
    .map(d => {
      const tierScore = (TIER_ORDER[d.tier] ?? 0) * 25;
      const perfScore = d.dealerMetrics?.performanceScore ?? 0;
      const responseScore = d.avgResponseHours == null ? 0
        : d.avgResponseHours < 1 ? 30
        : d.avgResponseHours < 4 ? 20
        : d.avgResponseHours < 24 ? 10 : 0;
      return { id: d.id, score: tierScore + perfScore * 0.4 + responseScore };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];

  await prisma.auditLog.create({
    data: {
      action: 'LEAD_ROUTED',
      entityType: 'Lead',
      entityId: listingId,
      details: {
        dealerId: best.id,
        reason: 'best_match_in_area',
        score: best.score,
        candidateCount: scored.length,
        listingId,
      },
    },
  });

  return { dealerId: best.id, reason: 'best_match_in_area', score: best.score };
}

/**
 * Check if a dealer has capacity under their plan limits.
 * Returns true if the dealer can accept more leads/listings.
 */
async function dealerHasCapacity(dealerId) {
  const [dealer, subscription] = await Promise.all([
    prisma.dealer.findUnique({
      where: { id: dealerId },
      select: { _count: { select: { listings: true, leads: true } } },
    }),
    prisma.dealerSubscription.findUnique({
      where: { dealerId },
      select: { plan: true, features: true, status: true },
    }),
  ]);

  if (!dealer) return false;
  if (!subscription || subscription.status !== 'active') return true; // no subscription = free tier, no hard block

  const features = subscription.features ?? {};
  const maxListings = features.maxListings ?? Infinity;

  return dealer._count.listings < maxListings;
}

module.exports = { routeLead, dealerHasCapacity };
