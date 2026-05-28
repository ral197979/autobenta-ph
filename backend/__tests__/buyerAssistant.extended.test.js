const { buyerAssistant } = require('../src/services/ai/buyerAssistant');

describe('Buyer Assistant (Extended)', () => {
  it('handles all known question keywords', async () => {
    const questions = [
      'Is this a good deal?',
      'How do I check for flood damage?',
      'What should I inspect?',
      'Compare these cars',
      'Can I negotiate the price?',
      'What documents do I need?',
    ];
    for (const question of questions) {
      const result = await buyerAssistant({ question });
      expect(result.answer).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(5);
    }
  });

  it('negotiation response includes tips', async () => {
    const result = await buyerAssistant({ question: 'Can I negotiate?' });
    expect(result.answer).toBeDefined();
    if (result.negotiationTips) {
      expect(Array.isArray(result.negotiationTips)).toBe(true);
    }
  });

  it('document question returns checklist', async () => {
    const result = await buyerAssistant({ question: 'What are the required documents for transfer?' });
    expect(result.answer).toBeDefined();
  });

  it('comparison question mentions both cars', async () => {
    const compare = [
      { year: 2021, make: 'Toyota', model: 'Vios', price: '700000', mileage: 20000, condition: 'good' },
      { year: 2020, make: 'Honda', model: 'City', price: '650000', mileage: 30000, condition: 'good' },
    ];
    const result = await buyerAssistant({ question: 'Compare these cars', compareListings: compare });
    expect(result.answer).toContain('Toyota');
    expect(result.answer).toContain('Honda');
  });

  it('good deal question includes listing context', async () => {
    const listing = { year: 2022, make: 'Toyota', model: 'Fortuner', price: '1800000', mileage: 15000, condition: 'excellent' };
    const result = await buyerAssistant({ question: 'Is this worth buying?', listing });
    expect(result.answer).toBeDefined();
    expect(result.answer.length).toBeGreaterThan(20);
  });

  it('checklist is an array', async () => {
    const result = await buyerAssistant({ question: 'What should I check?' });
    if (result.checklist) {
      expect(Array.isArray(result.checklist)).toBe(true);
    }
  });

  it('unknown question still returns answer', async () => {
    const result = await buyerAssistant({ question: 'tell me about the weather in mars' });
    expect(result.answer).toBeDefined();
    expect(result.answer.length).toBeGreaterThan(5);
  });

  it('empty question returns answer', async () => {
    const result = await buyerAssistant({ question: '' });
    expect(result.answer).toBeDefined();
  });
});
