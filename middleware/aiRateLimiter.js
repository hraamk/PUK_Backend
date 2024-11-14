// middleware/aiRateLimiter.js
const rateLimit = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 20, // increased from 10 to 20 requests per minute
  message: {
    error: 'Too many AI requests, please try again later',
    details: 'Rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many AI requests, please try again later',
      details: 'Rate limit exceeded',
      retryAfter: Math.ceil(res.getHeader('X-RateLimit-Reset') / 1000)
    });
  }
});

module.exports = { aiRateLimiter };