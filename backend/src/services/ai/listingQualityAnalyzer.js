// Listing quality analyzer — scores completeness and marketability.

async function analyzeListingQuality(listing, photoCount = 0) {
  let score = 0;
  const suggestions = [];

  // Description
  if (listing.description?.length > 100) score += 20;
  else if (listing.description?.length > 30) score += 10;
  else suggestions.push('Add a detailed description to attract more buyers.');

  // Photos
  if (photoCount >= 8) score += 25;
  else if (photoCount >= 4) score += 15;
  else if (photoCount >= 1) score += 5;
  else suggestions.push('Upload at least 6 photos (exterior, interior, engine, odometer).');

  if (photoCount < 8) suggestions.push(`Add ${8 - photoCount} more photos for maximum visibility.`);

  // Key fields
  if (listing.color) score += 5;
  else suggestions.push('Include the vehicle color.');

  if (listing.bodyType) score += 5;
  else suggestions.push('Specify the body type (sedan, SUV, etc.).');

  if (listing.variant) score += 5;
  else suggestions.push('Add the specific variant/trim level.');

  if (listing.ownerCount > 0) score += 5;

  // Service history
  if (listing.serviceHistory) score += 10;
  else suggestions.push('Mention service history or maintenance records if available.');

  // Transparency disclosures
  if (listing.hasAccident !== null) score += 5;
  if (listing.hasFlood !== null) score += 5;
  if (listing.hasOrCr) score += 10;

  const quality = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';
  return { score: Math.min(100, score), quality, suggestions: suggestions.slice(0, 5) };
}

module.exports = { analyzeListingQuality };
