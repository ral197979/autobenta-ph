// Shared financing estimate: 30% down, 60-month term, ~7.5%/yr flat add-on.
// Mirrors the calculator on the listing detail page so the whole app agrees.
export const FINANCE = { down: 0.30, months: 60, ratePerYear: 0.075 };

const factor = (1 - FINANCE.down) * (1 + FINANCE.ratePerYear * (FINANCE.months / 12));

// Estimated monthly amortization for a given sticker price.
export function monthlyPayment(price) {
  const p = Number(price) || 0;
  return Math.round((p * factor) / FINANCE.months);
}

// Inverse: the highest sticker price affordable at a given monthly budget.
export function priceFromMonthly(monthly) {
  const m = Number(monthly) || 0;
  return Math.round((m * FINANCE.months) / factor);
}
