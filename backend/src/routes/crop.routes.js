const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth.middleware');
const { 
    getCropRecommendations, 
    selectCrop,
    getActiveCrop,
    endActiveCrop,
    saveAdvisoryCrop
} = require('../controllers/crop.controller');

// 🌱 Get Crop Recommendation
router.get('/recommendation', protect, getCropRecommendations);

// 🌾 Select Crop
router.post('/select', protect, selectCrop);

// 🌱 Get Crop Advisory (Active Crop)
router.get('/active', protect, getActiveCrop);

// 🔄 End Active Crop (start fresh)
router.patch('/end', protect, endActiveCrop);

// 🌱 Save Advisory Crop (free-text name from advisory form)
router.post('/save-advisory', protect, saveAdvisoryCrop);

module.exports = router;