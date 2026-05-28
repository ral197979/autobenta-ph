const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const windowMs = 15 * 60 * 1000; // 15 minutes

// General API rate limit
const apiLimiter = rateLimit({
  windowMs,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

// Slow down repeated requests to search/browse (anti-scrape)
const searchSlowDown = slowDown({
  windowMs,
  delayAfter: 60,
  delayMs: (hits) => (hits - 60) * 100,
});

// Tighter limit for AI endpoints (expensive calls)
const aiLimiter = rateLimit({
  windowMs,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please try again later.' },
});

// Limit photo uploads per listing creation session
const uploadLimiter = rateLimit({
  windowMs,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many upload requests.' },
});

module.exports = { apiLimiter, authLimiter, searchSlowDown, aiLimiter, uploadLimiter };
