const { computeHash, verifyChain } = require('../src/services/audit/tamperHash');

describe('Audit Hash Chain', () => {
  const baseRecord = {
    userId: 'user-1',
    action: 'listing.create',
    entityType: 'VehicleListing',
    entityId: 'listing-1',
    details: { make: 'Toyota', model: 'Vios' },
    ipAddress: '127.0.0.1',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  it('computes a SHA-256 hash string', () => {
    const hash = computeHash(baseRecord, null);
    expect(typeof hash).toBe('string');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it('different prevHash produces different hash', () => {
    const h1 = computeHash(baseRecord, null);
    const h2 = computeHash(baseRecord, 'previous-hash-value');
    expect(h1).not.toBe(h2);
  });

  it('same inputs produce same hash (deterministic)', () => {
    const h1 = computeHash(baseRecord, 'prev');
    const h2 = computeHash(baseRecord, 'prev');
    expect(h1).toBe(h2);
  });

  it('changing record content changes hash', () => {
    const h1 = computeHash(baseRecord, null);
    const h2 = computeHash({ ...baseRecord, action: 'listing.delete' }, null);
    expect(h1).not.toBe(h2);
  });

  it('verifyChain returns valid for correct chain', () => {
    const r1 = { ...baseRecord, createdAt: new Date('2024-01-01') };
    const h1 = computeHash(r1, null);
    const r2 = { ...baseRecord, action: 'listing.update', createdAt: new Date('2024-01-02') };
    const h2 = computeHash(r2, h1);

    const chain = [
      { ...r1, hash: h1, prevHash: null },
      { ...r2, hash: h2, prevHash: h1 },
    ];
    const result = verifyChain(chain);
    expect(result.valid).toBe(true);
    expect(result.brokenAt).toBeNull();
  });

  it('verifyChain detects tampered record', () => {
    const r1 = { ...baseRecord, createdAt: new Date('2024-01-01') };
    const h1 = computeHash(r1, null);
    const r2 = { ...baseRecord, action: 'listing.update', createdAt: new Date('2024-01-02') };
    const h2 = computeHash(r2, h1);

    const chain = [
      { ...r1, hash: h1, prevHash: null },
      { ...r2, action: 'listing.delete', hash: h2, prevHash: h1 }, // tampered: action changed
    ];
    const result = verifyChain(chain);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).not.toBeNull();
  });

  it('verifyChain handles empty chain', () => {
    const result = verifyChain([]);
    expect(result.valid).toBe(true);
  });

  it('verifyChain handles single entry', () => {
    const r1 = { ...baseRecord, createdAt: new Date('2024-01-01') };
    const h1 = computeHash(r1, null);
    const result = verifyChain([{ ...r1, hash: h1, prevHash: null }]);
    expect(result.valid).toBe(true);
  });
});
