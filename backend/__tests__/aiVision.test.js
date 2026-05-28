const { classifyVehicle } = require('../src/services/aiVision/imageVehicleClassifier');
const { readMileage } = require('../src/services/aiVision/ocrMileageReader');
const { detectDamage } = require('../src/services/aiVision/damageDetector');
const { estimateCondition } = require('../src/services/aiVision/conditionEstimator');
const { generateListingDraft } = require('../src/services/aiVision/listingDraftGenerator');

describe('AI Vision Pipeline', () => {
  beforeAll(() => { process.env.AI_MODE = 'mock'; });

  describe('imageVehicleClassifier', () => {
    it('classifies vehicle from image URL', async () => {
      const result = await classifyVehicle('https://example.com/car.jpg');
      expect(result.make).toBeDefined();
      expect(result.model).toBeDefined();
      expect(result.year).toBeGreaterThan(2000);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.source).toBe('mock');
    });

    it('returns bodyType and color', async () => {
      const result = await classifyVehicle('url');
      expect(result.bodyType).toBeDefined();
      expect(result.color).toBeDefined();
    });
  });

  describe('ocrMileageReader', () => {
    it('reads mileage from image', async () => {
      const result = await readMileage('url');
      expect(result.mileage).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.source).toBe('mock');
    });
  });

  describe('damageDetector', () => {
    it('returns damage assessment', async () => {
      const result = await detectDamage('url');
      expect(typeof result.hasDamage).toBe('boolean');
      expect(Array.isArray(result.damageAreas)).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.source).toBe('mock');
    });
  });

  describe('conditionEstimator', () => {
    it('estimates excellent condition for new undamaged car', async () => {
      const result = await estimateCondition({ hasDamage: false, damageAreas: [], severity: 'none', mileage: 5000, year: new Date().getFullYear() - 1 });
      expect(['excellent', 'good']).toContain(result.condition);
      expect(result.score).toBeGreaterThan(70);
    });

    it('estimates poor condition for heavily damaged car', async () => {
      const result = await estimateCondition({ hasDamage: true, damageAreas: ['front', 'rear'], severity: 'high', mileage: 120000, year: 2010 });
      expect(['poor', 'fair']).toContain(result.condition);
      expect(result.score).toBeLessThan(70);
    });

    it('returns condition string', async () => {
      const result = await estimateCondition({ hasDamage: false, severity: 'none', mileage: 40000, year: 2020 });
      expect(['excellent', 'good', 'fair', 'poor']).toContain(result.condition);
    });
  });

  describe('listingDraftGenerator', () => {
    it('generates a draft from image URLs', async () => {
      const draft = await generateListingDraft(['url1.jpg', 'url2.jpg']);
      expect(draft.make).toBeDefined();
      expect(draft.model).toBeDefined();
      expect(draft.year).toBeGreaterThan(2000);
      expect(draft.mileage).toBeGreaterThan(0);
      expect(draft.aiConfidence).toBeGreaterThanOrEqual(0);
      expect(draft.source).toContain('mock');
    });

    it('returns partial flag for empty image array', async () => {
      const draft = await generateListingDraft([]);
      expect(draft.partial).toBe(true);
    });

    it('returns condition in draft', async () => {
      const draft = await generateListingDraft(['url.jpg']);
      expect(['excellent', 'good', 'fair', 'poor']).toContain(draft.condition);
    });

    it('draft has hasAccident boolean', async () => {
      const draft = await generateListingDraft(['url.jpg']);
      expect(typeof draft.hasAccident).toBe('boolean');
    });
  });
});
