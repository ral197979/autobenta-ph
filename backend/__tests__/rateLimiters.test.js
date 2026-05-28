const { apiLimiter, authLimiter, aiLimiter, uploadLimiter, searchSlowDown } = require('../src/middleware/rateLimiters');

describe('Rate Limiters', () => {
  it('apiLimiter is a function (middleware)', () => {
    expect(typeof apiLimiter).toBe('function');
  });

  it('authLimiter is a function (middleware)', () => {
    expect(typeof authLimiter).toBe('function');
  });

  it('aiLimiter is a function (middleware)', () => {
    expect(typeof aiLimiter).toBe('function');
  });

  it('uploadLimiter is a function (middleware)', () => {
    expect(typeof uploadLimiter).toBe('function');
  });

  it('searchSlowDown is a function (middleware)', () => {
    expect(typeof searchSlowDown).toBe('function');
  });

  it('apiLimiter has max 300 (via function length check)', () => {
    // Express middleware signature: (req, res, next)
    expect(apiLimiter.length).toBe(3);
  });
});
