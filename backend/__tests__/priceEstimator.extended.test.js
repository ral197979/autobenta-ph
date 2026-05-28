const { estimatePrice } = require('../src/services/ai/priceEstimator');

describe('Price Estimator (Extended)', () => {
  it('all PH known makes return positive estimate', async () => {
    const knownCars = [
      { make: 'Toyota', model: 'Vios', year: 2021, mileage: 20000, condition: 'good' },
      { make: 'Toyota', model: 'Innova', year: 2020, mileage: 30000, condition: 'good' },
      { make: 'Toyota', model: 'Fortuner', year: 2022, mileage: 10000, condition: 'excellent' },
      { make: 'Honda', model: 'City', year: 2021, mileage: 15000, condition: 'good' },
      { make: 'Honda', model: 'Civic', year: 2020, mileage: 25000, condition: 'good' },
      { make: 'Mitsubishi', model: 'Montero Sport', year: 2021, mileage: 20000, condition: 'good' },
      { make: 'Mitsubishi', model: 'Xpander', year: 2021, mileage: 15000, condition: 'good' },
      { make: 'Ford', model: 'Ranger', year: 2021, mileage: 25000, condition: 'good' },
    ];
    for (const car of knownCars) {
      const result = await estimatePrice(car);
      expect(result.estimatedPrice).toBeGreaterThan(0);
    }
  });

  it('price range: priceLow < estimatedPrice < priceHigh', async () => {
    const result = await estimatePrice({ make: 'Toyota', model: 'Vios', year: 2022, mileage: 10000, condition: 'good' });
    expect(result.priceLow).toBeLessThan(result.estimatedPrice);
    expect(result.priceHigh).toBeGreaterThan(result.estimatedPrice);
  });

  it('excellent condition beats good condition price', async () => {
    const excellent = await estimatePrice({ make: 'Honda', model: 'City', year: 2022, mileage: 10000, condition: 'excellent' });
    const good = await estimatePrice({ make: 'Honda', model: 'City', year: 2022, mileage: 10000, condition: 'good' });
    expect(excellent.estimatedPrice).toBeGreaterThanOrEqual(good.estimatedPrice);
  });

  it('poor condition is lowest priced', async () => {
    const good = await estimatePrice({ make: 'Honda', model: 'City', year: 2022, mileage: 10000, condition: 'good' });
    const poor = await estimatePrice({ make: 'Honda', model: 'City', year: 2022, mileage: 10000, condition: 'poor' });
    expect(poor.estimatedPrice).toBeLessThan(good.estimatedPrice);
  });

  it('higher mileage reduces price', async () => {
    const low = await estimatePrice({ make: 'Toyota', model: 'Vios', year: 2020, mileage: 10000, condition: 'good' });
    const high = await estimatePrice({ make: 'Toyota', model: 'Vios', year: 2020, mileage: 100000, condition: 'good' });
    expect(high.estimatedPrice).toBeLessThan(low.estimatedPrice);
  });

  it('confidence is one of expected values', async () => {
    const result = await estimatePrice({ make: 'Toyota', model: 'Vios', year: 2020, mileage: 40000, condition: 'good' });
    expect(['high', 'medium', 'low']).toContain(result.confidence);
  });

  it('factors object is returned', async () => {
    const result = await estimatePrice({ make: 'Toyota', model: 'Vios', year: 2020, mileage: 40000, condition: 'good' });
    expect(result.factors).toBeDefined();
    expect(typeof result.factors).toBe('object');
    expect(result.factors.age).toBeDefined();
  });

  it('2000 year car gets strong depreciation', async () => {
    const old = await estimatePrice({ make: 'Toyota', model: 'Vios', year: 2000, mileage: 200000, condition: 'fair' });
    const newCar = await estimatePrice({ make: 'Toyota', model: 'Vios', year: 2023, mileage: 5000, condition: 'excellent' });
    expect(newCar.estimatedPrice).toBeGreaterThan(old.estimatedPrice);
  });
});
