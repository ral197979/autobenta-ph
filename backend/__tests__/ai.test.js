const { estimatePrice } = require('../src/services/ai/priceEstimator');
const { checkFraud } = require('../src/services/ai/fraudRiskScorer');
const { analyzeListingQuality } = require('../src/services/ai/listingQualityAnalyzer');
const { buyerAssistant } = require('../src/services/ai/buyerAssistant');

describe('AI Services', () => {
  describe('priceEstimator', () => {
    it('estimates price for known PH car', async () => {
      const result = await estimatePrice({ make: 'Toyota', model: 'Vios', year: 2020, mileage: 50000, condition: 'good' });
      expect(result.estimatedPrice).toBeGreaterThan(0);
      expect(result.priceLow).toBeLessThan(result.estimatedPrice);
      expect(result.priceHigh).toBeGreaterThan(result.estimatedPrice);
    });

    it('returns medium confidence for unknown car', async () => {
      const result = await estimatePrice({ make: 'Unknown', model: 'Brand', year: 2019, mileage: 30000, condition: 'good' });
      expect(result.confidence).toBe('medium');
    });

    it('applies depreciation for older cars', async () => {
      const newCar = await estimatePrice({ make: 'Honda', model: 'City', year: 2023, mileage: 5000, condition: 'excellent' });
      const oldCar = await estimatePrice({ make: 'Honda', model: 'City', year: 2015, mileage: 80000, condition: 'fair' });
      expect(newCar.estimatedPrice).toBeGreaterThan(oldCar.estimatedPrice);
    });
  });

  describe('fraudRiskScorer', () => {
    it('flags price too low', async () => {
      const listing = {
        make: 'Toyota', model: 'Fortuner', year: 2022, mileage: 10000,
        condition: 'excellent', price: '300000', hasOrCr: true,
        hasFlood: false, hasAccident: false, description: 'Good car for sale with complete documents',
      };
      const result = await checkFraud(listing);
      const priceFlag = result.flags.find(f => f.type === 'price_too_low');
      expect(priceFlag).toBeDefined();
      expect(['medium', 'high']).toContain(result.riskLevel);
    });

    it('flags missing OR/CR', async () => {
      const listing = {
        make: 'Toyota', model: 'Vios', year: 2020, mileage: 40000,
        condition: 'good', price: '650000', hasOrCr: false,
        hasFlood: false, hasAccident: false, description: 'Good condition unit',
      };
      const result = await checkFraud(listing);
      expect(result.flags.some(f => f.type === 'no_or_cr')).toBe(true);
    });

    it('passes clean listing', async () => {
      const listing = {
        make: 'Toyota', model: 'Vios', year: 2020, mileage: 40000,
        condition: 'good', price: '650000', hasOrCr: true,
        hasFlood: false, hasAccident: false, description: 'Casa-maintained Toyota Vios 1.3 XLE CVT with complete service records',
      };
      const result = await checkFraud(listing);
      expect(result.riskLevel).toBe('low');
    });
  });

  describe('listingQualityAnalyzer', () => {
    it('scores high quality listing', async () => {
      const listing = {
        description: 'This is a very detailed description of the car with more than one hundred characters to test the scoring system.',
        color: 'Silver', bodyType: 'Sedan', variant: '1.3 XLE CVT', ownerCount: 1,
        serviceHistory: true, hasAccident: false, hasFlood: false, hasOrCr: true,
      };
      const result = await analyzeListingQuality(listing, 8);
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it('scores low quality listing', async () => {
      const listing = { description: null, color: null, bodyType: null, variant: null, ownerCount: 1, serviceHistory: false, hasAccident: null, hasFlood: null, hasOrCr: false };
      const result = await analyzeListingQuality(listing, 0);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.quality).toMatch(/fair|poor/);
    });
  });

  describe('buyerAssistant', () => {
    it('answers good deal question', async () => {
      const listing = { year: 2020, make: 'Toyota', model: 'Vios', price: '650000', mileage: 40000, condition: 'good' };
      const result = await buyerAssistant({ question: 'Is this a good deal?', listing });
      expect(result.answer).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(10);
    });

    it('returns flood check advice', async () => {
      const result = await buyerAssistant({ question: 'How do I check for flood damage?' });
      expect(result.checklist?.length).toBeGreaterThan(0);
    });

    it('compares cars when given compareListings', async () => {
      const compare = [
        { year: 2020, make: 'Toyota', model: 'Vios', price: '650000', mileage: 40000, condition: 'good' },
        { year: 2021, make: 'Honda', model: 'City', price: '750000', mileage: 20000, condition: 'excellent' },
      ];
      const result = await buyerAssistant({ question: 'Compare these cars', compareListings: compare });
      expect(result.answer).toContain('Toyota');
    });

    it('returns general help for unknown question', async () => {
      const result = await buyerAssistant({ question: 'xyz123???' });
      expect(result.answer).toBeDefined();
      expect(result.checklist).toBeDefined();
    });
  });
});
