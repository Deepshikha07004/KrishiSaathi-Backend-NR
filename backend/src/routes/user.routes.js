const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth.middleware');
const { updateProfile } = require('../controllers/auth.controller');


// GET /api/users/me
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.farmer.id,
      name: req.farmer.name,
      phoneNumber: req.farmer.phoneNumber,
      preferredLanguage: req.farmer.preferredLanguage,
    },
  });
});

// PUT /api/users/profile
router.put('/profile', protect, updateProfile);

module.exports = router;
