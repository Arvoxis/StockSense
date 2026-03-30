const rateLimit = require('express-rate-limit');

// Strict limit for AI routes — 20 req/min per IP
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests, please wait a minute.' },
  keyGenerator: (req) => req.user?.id || req.socket.remoteAddress,
});

// General API limit — 200 req/min per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

module.exports = { aiRateLimiter, generalLimiter };
