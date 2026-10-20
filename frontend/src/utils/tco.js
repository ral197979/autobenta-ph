// 5-year Total Cost of Ownership estimate, Philippine context.
// All figures are rough planning estimates for comparison — not quotes.

// Pump/charging price and typical efficiency by fuel type (2026 PH averages).
const FUEL = {
  gasoline: { price: 60, kmPerUnit: 10 },
  diesel: { price: 62, kmPerUnit: 13 },
  hybrid: { price: 60, kmPerUnit: 20 },
  electric: { price: 12, kmPerUnit: 6 }, // ₱/kWh, km/kWh
  lpg: { price: 45, kmPerUnit: 9 },
};

export const TCO_YEARS = 5;
export const ANNUAL_KM_OPTIONS = [10000, 15000, 20000, 30000];

export function computeTCO(listing, annualKm = 15000) {
  const price = Number(listing?.price) || 0;
  const fuelKey = (listing?.fuelType || 'gasoline').toLowerCase();
  const fuel = FUEL[fuelKey] || FUEL.gasoline;
  const isEV = fuelKey === 'electric';

  // Depreciation + insurance both track the car's declining value year by year.
  // 10%/yr declining balance; comprehensive insurance ~1.6% of value at year start.
  let value = price;
  let depreciation = 0;
  let insurance = 0;
  for (let y = 0; y < TCO_YEARS; y++) {
    const dep = value * 0.1;
    depreciation += dep;
    insurance += value * 0.016;
    value -= dep;
  }
  const residualValue = Math.round(value);

  const totalKm = annualKm * TCO_YEARS;
  const fuelCost = (totalKm / fuel.kmPerUnit) * fuel.price;

  // Maintenance + consumables (PMS, tires, brakes); EVs run cheaper.
  const maintenance = totalKm * (isEV ? 0.9 : 1.5);

  // LTO registration: MVUC + emission test + plate fees, ~₱2,500/yr.
  const registration = 2500 * TCO_YEARS;

  const items = [
    { key: 'depreciation', label: 'Depreciation', value: Math.round(depreciation), icon: 'trending_down', hint: 'Estimated drop in resale value' },
    { key: 'fuel', label: isEV ? 'Charging' : 'Fuel', value: Math.round(fuelCost), icon: isEV ? 'ev_station' : 'local_gas_station', hint: `${annualKm.toLocaleString()} km/yr driving` },
    { key: 'insurance', label: 'Insurance', value: Math.round(insurance), icon: 'shield', hint: 'Comprehensive, declining value' },
    { key: 'maintenance', label: 'Maintenance', value: Math.round(maintenance), icon: 'build', hint: 'PMS, tires, consumables' },
    { key: 'registration', label: 'LTO Registration', value: registration, icon: 'description', hint: 'MVUC + emission + plates' },
  ];

  const total = items.reduce((s, i) => s + i.value, 0);
  return {
    items,
    total,
    residualValue,
    annualKm,
    totalKm,
    perMonth: Math.round(total / (TCO_YEARS * 12)),
  };
}
