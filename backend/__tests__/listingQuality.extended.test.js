const { analyzeListingQuality } = require('../src/services/ai/listingQualityAnalyzer');

describe('Listing Quality Analyzer (Extended)', () => {
  it('maximum score for fully complete listing', async () => {
    const listing = {
      description: 'Casa-maintained Toyota Vios 1.3 XLE CVT with complete service records. Only one owner. Never flooded. Complete OR/CR. Negotiable.',
      color: 'Silver',
      bodyType: 'Sedan',
      variant: '1.3 XLE CVT',
      ownerCount: 1,
      serviceHistory: true,
      hasAccident: false,
      hasFlood: false,
      hasOrCr: true,
    };
    const result = await analyzeListingQuality(listing, 15);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.quality).toBe('excellent');
  });

  it('minimum score listing is poor quality', async () => {
    const listing = {
      description: '',
      color: null,
      bodyType: null,
      variant: null,
      ownerCount: null,
      serviceHistory: false,
      hasAccident: null,
      hasFlood: null,
      hasOrCr: false,
    };
    const result = await analyzeListingQuality(listing, 0);
    expect(result.quality).toMatch(/fair|poor/);
    expect(result.score).toBeLessThan(60);
  });

  it('suggestions are returned for incomplete listing', async () => {
    const listing = {
      description: 'Car for sale',
      color: null,
      bodyType: null,
      variant: null,
      ownerCount: 1,
      serviceHistory: false,
      hasAccident: null,
      hasFlood: null,
      hasOrCr: true,
    };
    const result = await analyzeListingQuality(listing, 1);
    expect(Array.isArray(result.suggestions)).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('more photos increases score', async () => {
    const listing = {
      description: 'Good car',
      color: 'White',
      bodyType: 'SUV',
      variant: null,
      ownerCount: 1,
      serviceHistory: false,
      hasOrCr: true,
    };
    const lowPhotos = await analyzeListingQuality(listing, 1);
    const highPhotos = await analyzeListingQuality(listing, 10);
    expect(highPhotos.score).toBeGreaterThanOrEqual(lowPhotos.score);
  });

  it('quality is one of expected values', async () => {
    const listing = { description: 'Test car', color: 'Red', bodyType: 'Sedan', variant: null, ownerCount: 1, serviceHistory: true, hasOrCr: true };
    const result = await analyzeListingQuality(listing, 5);
    expect(['excellent', 'good', 'fair', 'poor']).toContain(result.quality);
  });

  it('score is a number between 0 and 100', async () => {
    const listing = { description: 'Test', color: null, bodyType: null, variant: null, ownerCount: 1, serviceHistory: false, hasOrCr: false };
    const result = await analyzeListingQuality(listing, 2);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
