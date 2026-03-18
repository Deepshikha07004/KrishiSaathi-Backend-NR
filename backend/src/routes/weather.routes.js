const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, weatherController.getWeather);


module.exports = router;
