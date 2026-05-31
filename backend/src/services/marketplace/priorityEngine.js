/**
 * Priority Engine — pure ranking functions, no Prisma dependency.
 * Takes data in, returns ranked data out.
 *
 * Ranking factors (matches DEALER_SCORECARD_SYSTEM.md):
 *   tierScore:      enterprise=100, pro=75, verified=50, basic=25, free=0
 *   dealerScore:    0-100 (A/B/C/D rank)
 *   responseScore:  based on avgResponseHours
 *   listingQuality: based on trust badges / readiness score
 */

function calcTierScore(tier) {
  const scores = { enterprise: 100, pro: 75, verified_pro: 75, verified: 50, basic: 25, free: 0 };
  return scores[tier] ?? 0;
}

function calcResponseScore(avgResponseHours) {
  if (avgResponseHours == null) return 0;
  if (avgResponseHours < 1) return 100;
  if (avgResponseHours < 4) return 75;
  if (avgResponseHours < 24) return 50;
  return 0;
}

/**
 * rankDealers — rank an array of dealer objects by priority score.
 *
 * Each dealer must have: { id, tier, dealerScore (0-100), avgResponseHours, isVerified }
 * Returns the array sorted descending, with `priorityScore` attached to each dealer.
 */
function rankDealers(dealers) {
  return dealers
    .map(dealer => {
      const tierScore = calcTierScore(dealer.tier);
      const responseScore = calcResponseScore(dealer.avgResponseHours);
      const verifiedBonus = dealer.isVerified ? 10 : 0;
      const priorityScore = tierScore * 0.4 + (dealer.dealerScore ?? 0) * 0.35 + responseScore * 0.15 + verifiedBonus * 0.1;
      return { ...dealer, priorityScore: Math.round(priorityScore) };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * rankListings — rank an array of listing objects.
 *
 * Each listing must have: { id, dealer: { tier, dealerScore, avgResponseHours }, isSponsored, readinessScore }
 * Sponsored listings are always first, then sorted by priority score.
 */
function rankListings(listings) {
  const scored = listings.map(listing => {
    const dealer = listing.dealer ?? {};
    const tierScore = calcTierScore(dealer.tier);
    const responseScore = calcResponseScore(dealer.avgResponseHours);
    const readiness = listing.readinessScore ?? 0;
    const priorityScore = tierScore * 0.35 + (dealer.dealerScore ?? 0) * 0.30 + responseScore * 0.15 + readiness * 0.20;
    return { ...listing, priorityScore: Math.round(priorityScore) };
  });

  const sponsored = scored.filter(l => l.isSponsored).sort((a, b) => b.priorityScore - a.priorityScore);
  const organic = scored.filter(l => !l.isSponsored).sort((a, b) => b.priorityScore - a.priorityScore);

  return [...sponsored, ...organic];
}

module.exports = { rankDealers, rankListings, calcTierScore, calcResponseScore };
