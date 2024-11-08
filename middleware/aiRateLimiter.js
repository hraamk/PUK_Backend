const rateLimit = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: { message: 'Too many AI requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { aiRateLimiter };