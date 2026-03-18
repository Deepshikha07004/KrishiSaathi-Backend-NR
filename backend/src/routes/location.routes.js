const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const { protect } = require('../middleware/auth.middleware');

// Forward geocode search (address text → lat/lon candidates)
router.get('/search', protect, locationController.searchAddress);

// NEW: Geocode only (no save) — used by frontend to preview location details
router.get('/geocode', protect, locationController.geocodeOnly);

router.post('/', protect, locationController.addLocation);
router.get('/active', protect, locationController.getActiveLocation);
router.get('/', protect, locationController.getAllLocations);
router.patch('/:locationId/activate', protect, locationController.activateLocation);
router.delete('/:locationId', protect, locationController.deleteLocation);

module.exports = router;