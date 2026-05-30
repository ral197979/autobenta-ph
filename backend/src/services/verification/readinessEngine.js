// Backend readiness score — single source of truth for trust score computation.
// Frontend ReadinessScore component should consume GET /api/verifications/listing/:id/readiness-score

const CRITERIA = [
  {
    key: 'seller_verified',
    label: 'Seller identity verified',
    points: 20,
    check: (l) => !!(l.sellerVerified || l.seller?.isVerified || l.dealer?.isVerified),
  },
  {
    key: 'ownership_verified',
    label: 'Ownership verified',
    points: 25,
    check: (l) => !!l.ownershipVerified,
  },
  {
    key: 'history_available',
    label: 'Vehicle history available',
    points: 15,
    check: (l) => !!l.vehicleHistoryAvailable,
  },
  {
    key: 'transfer_docs',
    label: 'Transfer documents complete',
    points: 20,
    check: (l) => !!(l.hasOrCr && l.ownershipVerified),
  },
  {
    key: 'inspection_completed',
    label: 'Inspection completed',
    points: 10,
    check: (l) => !!(l.inspectionRequests?.length > 0),
  },
  {
    key: 'financing_eligible',
    label: 'Financing eligible',
    points: 10,
    check: (l) => !!l.financingEligible,
  },
];

function computeReadinessScore(listing) {
  let total = 0;
  const criteria = CRITERIA.map((c) => {
    const passed = c.check(listing);
    if (passed) total += c.points;
    return {
      key: c.key,
      label: c.label,
      points: c.points,
      passed,
    };
  });

  let band, color;
  if (total >= 70) { band = 'Excellent'; color = 'green'; }
  else if (total >= 40) { band = 'Good'; color = 'blue'; }
  else { band = 'Fair'; color = 'amber'; }

  return { total, band, color, criteria, evaluatedAt: new Date().toISOString() };
}

module.exports = { computeReadinessScore, CRITERIA };
