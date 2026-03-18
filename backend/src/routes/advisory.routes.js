const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const advisoryController = require('../controllers/advisory.controller');

router.get('/', protect, advisoryController.getAdvisory);

module.exports = router;
