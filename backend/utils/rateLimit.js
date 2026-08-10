const rateLimit = require('express-rate-limit');

const createLimiter = (limit, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    handler: (_req, res) =>
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT',
          message,
        },
      }),
    skip: () => process.env.NODE_ENV === 'test',
  });

module.exports = {
  globalLimiter: createLimiter(
    100,
    'Too many requests. Please try again later.',
  ),
  authLimiter: createLimiter(
    20,
    'Too many authentication attempts. Please try again later.',
  ),
  analysisLimiter: createLimiter(
    10,
    'Too many analysis requests. Please try again later.',
  ),
  quoteLimiter: createLimiter(
    20,
    'Too many exchange-rate requests. Please try again later.',
  ),
};
