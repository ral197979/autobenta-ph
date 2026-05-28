const { estimatePrice } = require('../ai/priceEstimator');

/**
 * Compare listing price against AI estimate.
 * Returns array of FraudFlag-shaped objects.
 */
async function detectSuspiciousPricing(listing) {
  const flags = [];

  let estimated;
  try {
    const result = await estimatePrice({
      make: listing.make,
      model: listing.model,
      year: listing.year,
      mileage: listing.mileage,
      condition: listing.condition,
    });
    estimated = result.estimatedPrice;
  } catch {
    return flags;
  }

  if (!estimated || estimated <= 0) return flags;

  const price = parseFloat(listing.price);
  const ratio = price / estimated;

  if (ratio < 0.65) {
    flags.push({
      flagType: 'price_too_low',
      severity: 'high',
      title: 'Price Significantly Below Market',
      description: `Listed at ₱${price.toLocaleString()} — ${Math.round((1 - ratio) * 100)}% below estimated market value of ₱${Math.round(estimated).toLocaleString()}.`,
      metadata: { listedPrice: price, estimatedPrice: estimated, ratio },
    });
  } else if (ratio < 0.80) {
    flags.push({
      flagType: 'price_low',
      severity: 'medium',
      title: 'Price Below Market',
      description: `Listed at ₱${price.toLocaleString()} — ${Math.round((1 - ratio) * 100)}% below estimated market value of ₱${Math.round(estimated).toLocaleString()}.`,
      metadata: { listedPrice: price, estimatedPrice: estimated, ratio },
    });
  }

  return flags;
}

module.exports = { detectSuspiciousPricing };
