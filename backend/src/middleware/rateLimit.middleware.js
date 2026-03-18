const rateLimit = require('express-rate-limit');

// 🔐 Auth Rate Limit (Login / Register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per IP
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter
};
