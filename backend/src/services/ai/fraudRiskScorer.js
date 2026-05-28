// Fraud risk scorer — checks common PH used car scam patterns.

const { estimatePrice } = require('./priceEstimator');

async function checkFraud(listing) {
  const flags = [];
  let riskScore = 0;

  const estimate = await estimatePrice({
    make: listing.make,
    model: listing.model,
    year: listing.year,
    mileage: listing.mileage,
    condition: listing.condition,
  });

  const price = parseFloat(listing.price);
  const ratio = price / estimate.estimatedPrice;

  if (ratio < 0.65) {
    flags.push({ type: 'price_too_low', severity: 'high', message: 'Price is significantly below market value — possible scam.' });
    riskScore += 40;
  } else if (ratio < 0.8) {
    flags.push({ type: 'price_low', severity: 'medium', message: 'Price is below market value. Verify before transacting.' });
    riskScore += 20;
  }

  if (!listing.hasOrCr) {
    flags.push({ type: 'no_or_cr', severity: 'high', message: 'No OR/CR — title transfer may be problematic.' });
    riskScore += 25;
  }

  if (listing.hasFlood && !listing.floodNotes) {
    flags.push({ type: 'flood_undisclosed', severity: 'high', message: 'Flood damage indicated but no details provided.' });
    riskScore += 30;
  }

  if (listing.hasAccident && !listing.accidentNotes) {
    flags.push({ type: 'accident_undisclosed', severity: 'medium', message: 'Accident history marked but no details given.' });
    riskScore += 15;
  }

  if (!listing.description || listing.description.length < 30) {
    flags.push({ type: 'minimal_description', severity: 'low', message: 'Very little information provided about the vehicle.' });
    riskScore += 5;
  }

  const riskLevel = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

  return { riskScore: Math.min(100, riskScore), riskLevel, flags, estimatedFairPrice: estimate.estimatedPrice };
}

module.exports = { checkFraud };
