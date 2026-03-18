const express = require('express');
const router = express.Router();

const { registerFarmer, loginFarmer} = require('../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const { validate } = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');


// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  registerValidator,
  validate,
  registerFarmer
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  loginValidator,
  validate,
  loginFarmer
);

module.exports = router;
