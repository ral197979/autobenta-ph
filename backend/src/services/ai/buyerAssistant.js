// Buyer assistant — answers common used car buying questions for PH market.

const CHECKLIST = {
  general: [
    'Check OR/CR and ensure it matches the vehicle details.',
    'Verify the engine number and chassis number match the OR/CR.',
    'Run a LTO verification to check for encumbrance or stolen status.',
    'Ask for complete maintenance records.',
    'Inspect for rust, especially under the car and wheel arches.',
    'Test all electronics: windows, A/C, headlights, wipers.',
    'Request a mechanic inspection before purchase.',
  ],
  flood: [
    'Check for water stains on the seat fabric and carpet.',
    'Inspect under the dashboard for mud or rust deposits.',
    'Check if electronic components short out or malfunction.',
    'Smell the interior for musty odors.',
    'Inspect the engine bay for dried sediment.',
  ],
  engine: [
    'Start the engine cold and listen for unusual knocking.',
    'Check for smoke from the exhaust (blue smoke = oil burn, white = coolant).',
    'Inspect the oil dipstick — milky oil indicates a head gasket issue.',
    'Check for leaks around the engine bay.',
    'Verify the timing belt/chain service record.',
  ],
};

const NEGOTIATION_TIPS = [
  'Research the fair market value before negotiating.',
  'Point out any issues found during inspection as leverage.',
  'Ask if the price is negotiable — many sellers expect an offer.',
  'Bring a mechanic to the viewing — it signals you are serious and informed.',
  'Offer a fair price; lowballing can offend serious sellers.',
  'Check how long the listing has been active — longer = more room to negotiate.',
];

function generateAnswer({ question, listing, compareListings }) {
  const q = (question || '').toLowerCase();

  if (q.includes('good deal') || q.includes('fair price') || q.includes('overpriced')) {
    if (!listing) return { answer: 'Please specify a listing to evaluate.', checklist: [] };
    const price = parseFloat(listing.price);
    return {
      answer: `Based on the ${listing.year} ${listing.make} ${listing.model} at ₱${price.toLocaleString()}, this appears to be within the typical range for a ${listing.condition}-condition unit with ${listing.mileage?.toLocaleString()} km. Always compare with similar listings in your area and consider a pre-purchase inspection.`,
      checklist: CHECKLIST.general.slice(0, 4),
      negotiationTips: NEGOTIATION_TIPS.slice(0, 3),
    };
  }

  if (q.includes('flood') || q.includes('baha')) {
    return {
      answer: 'To check for flood damage in a used car, inspect the following areas carefully:',
      checklist: CHECKLIST.flood,
      tip: 'A pre-purchase inspection by a certified mechanic is highly recommended for flood-prone PH market.',
    };
  }

  if (q.includes('check') || q.includes('inspect') || q.includes('what should i look')) {
    return {
      answer: 'Here is a complete inspection checklist for buying a used car in the Philippines:',
      checklist: [...CHECKLIST.general, ...CHECKLIST.engine],
      negotiationTips: NEGOTIATION_TIPS,
    };
  }

  if (q.includes('compare') || q.includes('which is better') || compareListings?.length > 0) {
    if (compareListings?.length >= 2) {
      const summaries = compareListings.map(l =>
        `${l.year} ${l.make} ${l.model}: ₱${parseFloat(l.price).toLocaleString()}, ${l.mileage?.toLocaleString()} km, ${l.condition} condition`
      );
      return {
        answer: `Here is a comparison:\n${summaries.join('\n')}\n\nConsider: lower mileage, full OR/CR, service history, and seller reputation when deciding.`,
        checklist: CHECKLIST.general.slice(0, 3),
      };
    }
    return { answer: 'Please add at least 2 cars to compare.', checklist: [] };
  }

  if (q.includes('negotiate') || q.includes('haggle') || q.includes('offer')) {
    return {
      answer: 'Here are tips for negotiating the price of a used car in the Philippines:',
      checklist: [],
      negotiationTips: NEGOTIATION_TIPS,
    };
  }

  if (q.includes('or/cr') || q.includes('documents') || q.includes('papers')) {
    return {
      answer: 'For a used car purchase in the Philippines, you need: OR (Official Receipt), CR (Certificate of Registration), Deed of Sale, and a valid government ID from both buyer and seller. Check the LTO for any existing mortgage or hold order.',
      checklist: ['Verify OR/CR matches the engine and chassis number.', 'Check for encumbrance at the LTO.', 'Get a signed and notarized Deed of Sale.', 'Update the registration to your name within 30 days.'],
    };
  }

  return {
    answer: `I can help you with questions about used car buying in the Philippines. Try asking: "Is this a good deal?", "What should I check before buying?", "How do I check for flood damage?", or "Help me compare these cars."`,
    checklist: CHECKLIST.general,
  };
}

async function buyerAssistant(params) {
  if (process.env.AI_MODE === 'live' && process.env.OPENAI_API_KEY) {
    // TODO: replace with real LLM call
  }
  return generateAnswer(params);
}

module.exports = { buyerAssistant };
