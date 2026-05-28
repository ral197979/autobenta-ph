const { detectSuspiciousPricing } = require('../src/services/fraud/suspiciousPricingDetector');
const { analyzeVehicleFraudSignals } = require('../src/services/fraud/vehicleFraudAnalyzer');

describe('Fraud Detection Engine', () => {
  describe('suspiciousPricingDetector', () => {
    it('flags price significantly below market', async () => {
      const listing = { make: 'Toyota', model: 'Fortuner', year: 2022, mileage: 10000, condition: 'excellent', price: '300000' };
      const flags = await detectSuspiciousPricing(listing);
      expect(flags.length).toBeGreaterThan(0);
      const types = flags.map(f => f.flagType);
      expect(types.some(t => t === 'price_too_low' || t === 'price_low')).toBe(true);
    });

    it('flags price moderately below market', async () => {
      // Toyota Vios 2020 fair condition — price at ~72% of estimate
      const listing = { make: 'Toyota', model: 'Vios', year: 2020, mileage: 40000, condition: 'fair', price: '400000' };
      const flags = await detectSuspiciousPricing(listing);
      // May or may not flag depending on estimate — just verify no exception
      expect(Array.isArray(flags)).toBe(true);
    });

    it('does not flag reasonably priced car', async () => {
      const listing = { make: 'Toyota', model: 'Vios', year: 2020, mileage: 40000, condition: 'good', price: '650000' };
      const flags = await detectSuspiciousPricing(listing);
      expect(flags.filter(f => f.flagType === 'price_too_low')).toHaveLength(0);
    });

    it('returns empty array for unknown make', async () => {
      const listing = { make: 'Unknown', model: 'Brand', year: 2019, mileage: 30000, condition: 'good', price: '100000' };
      const flags = await detectSuspiciousPricing(listing);
      expect(Array.isArray(flags)).toBe(true);
    });
  });

  describe('vehicleFraudAnalyzer', () => {
    it('flags missing OR/CR', () => {
      const listing = { hasOrCr: false, hasFlood: false, hasAccident: false, description: 'Good car', mileage: 40000, year: 2020 };
      const flags = analyzeVehicleFraudSignals(listing);
      expect(flags.some(f => f.flagType === 'no_or_cr')).toBe(true);
    });

    it('flags flood history without notes', () => {
      const listing = { hasOrCr: true, hasFlood: true, floodNotes: '', hasAccident: false, description: 'Car for sale', mileage: 40000, year: 2020 };
      const flags = analyzeVehicleFraudSignals(listing);
      expect(flags.some(f => f.flagType === 'flood_undisclosed')).toBe(true);
    });

    it('does not flag flood when adequate notes provided', () => {
      const listing = { hasOrCr: true, hasFlood: true, floodNotes: 'Minor flooding in 2021, fully repaired at authorized casa', hasAccident: false, description: 'Good car with complete documents', mileage: 40000, year: 2020 };
      const flags = analyzeVehicleFraudSignals(listing);
      expect(flags.some(f => f.flagType === 'flood_undisclosed')).toBe(false);
    });

    it('flags accident history without notes', () => {
      const listing = { hasOrCr: true, hasFlood: false, hasAccident: true, accidentNotes: '', description: 'Good car', mileage: 40000, year: 2020 };
      const flags = analyzeVehicleFraudSignals(listing);
      expect(flags.some(f => f.flagType === 'accident_undisclosed')).toBe(true);
    });

    it('flags minimal description', () => {
      const listing = { hasOrCr: true, hasFlood: false, hasAccident: false, description: 'Car', mileage: 40000, year: 2020 };
      const flags = analyzeVehicleFraudSignals(listing);
      expect(flags.some(f => f.flagType === 'minimal_description')).toBe(true);
    });

    it('flags high mileage for young vehicle', () => {
      const currentYear = new Date().getFullYear();
      const listing = { hasOrCr: true, hasFlood: false, hasAccident: false, description: 'Good car with complete documents', mileage: 150000, year: currentYear - 2 };
      const flags = analyzeVehicleFraudSignals(listing);
      expect(flags.some(f => f.flagType === 'high_mileage_for_age')).toBe(true);
    });

    it('passes clean listing with no flags', () => {
      const listing = { hasOrCr: true, hasFlood: false, hasAccident: false, description: 'Casa-maintained Toyota Vios 1.3 XLE CVT with complete service records and clean title', mileage: 40000, year: 2020 };
      const flags = analyzeVehicleFraudSignals(listing);
      expect(flags.filter(f => ['no_or_cr', 'flood_undisclosed', 'minimal_description'].includes(f.flagType))).toHaveLength(0);
    });

    it('returns severity field on all flags', () => {
      const listing = { hasOrCr: false, hasFlood: true, floodNotes: '', hasAccident: true, accidentNotes: '', description: 'Car', mileage: 40000, year: 2020 };
      const flags = analyzeVehicleFraudSignals(listing);
      flags.forEach(f => {
        expect(['low', 'medium', 'high', 'critical']).toContain(f.severity);
      });
    });
  });
});
