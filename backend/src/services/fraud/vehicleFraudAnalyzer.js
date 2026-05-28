/**
 * Listing-level fraud signal analysis (non-pricing signals).
 * Returns array of FraudFlag-shaped objects.
 */
function analyzeVehicleFraudSignals(listing) {
  const flags = [];

  if (!listing.hasOrCr) {
    flags.push({
      flagType: 'no_or_cr',
      severity: 'high',
      title: 'No OR/CR',
      description: 'Seller indicates no Official Receipt or Certificate of Registration. Title transfer may be problematic.',
      metadata: {},
    });
  }

  if (listing.hasFlood && (!listing.floodNotes || listing.floodNotes.trim().length < 10)) {
    flags.push({
      flagType: 'flood_undisclosed',
      severity: 'high',
      title: 'Flood History Not Adequately Disclosed',
      description: 'Seller marked flood history but provided no details. Buyers cannot assess the extent of damage.',
      metadata: {},
    });
  }

  if (listing.hasAccident && (!listing.accidentNotes || listing.accidentNotes.trim().length < 10)) {
    flags.push({
      flagType: 'accident_undisclosed',
      severity: 'medium',
      title: 'Accident History Not Adequately Disclosed',
      description: 'Seller marked accident history but provided no details.',
      metadata: {},
    });
  }

  const desc = listing.description || '';
  if (desc.trim().length < 30) {
    flags.push({
      flagType: 'minimal_description',
      severity: 'low',
      title: 'Minimal Description',
      description: 'Listing has very little information. Legitimate sellers typically provide detailed descriptions.',
      metadata: { descriptionLength: desc.trim().length },
    });
  }

  // Suspiciously high mileage for recent year
  const currentYear = new Date().getFullYear();
  const age = currentYear - listing.year;
  if (age < 5 && listing.mileage > age * 40000) {
    flags.push({
      flagType: 'high_mileage_for_age',
      severity: 'medium',
      title: 'Unusually High Mileage',
      description: `${listing.mileage.toLocaleString()} km on a ${listing.year} vehicle is above average for its age.`,
      metadata: { mileage: listing.mileage, year: listing.year },
    });
  }

  return flags;
}

module.exports = { analyzeVehicleFraudSignals };
