const prisma = require('../config/prisma');
const locationService = require('../services/location.service');

class LocationController {

  // =================================
  // FORWARD GEOCODE SEARCH (address → lat/lon results)
  // GET /api/location/search?q=Bhātpāra+West+Bengal
  // Used by the "Enter Manually" flow on LocationScreen.
  // Returns up to 5 candidate locations from Nominatim.
  // =================================
  async searchAddress(req, res) {
    try {
      const { q } = req.query;

      if (!q || !q.trim()) {
        return res.status(400).json({ error: 'Query parameter q is required' });
      }

      const results = await locationService.forwardGeocode(q.trim());

      return res.status(200).json({
        success: true,
        data: results
      });

    } catch (error) {
      console.log('Forward geocode error:', error.message);
      return res.status(400).json({ error: error.message });
    }
  }


  // =================================
  // GEOCODE ONLY (preview, no save)
  // GET /api/location/geocode?lat=xx&lon=yy
  // =================================
  async geocodeOnly(req, res) {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        return res.status(400).json({ error: 'lat and lon query parameters are required' });
      }

      const latitude  = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'lat and lon must be valid numbers' });
      }

      const addressData = await locationService.reverseGeocode(latitude, longitude);

      return res.status(200).json({
        success: true,
        data: {
          city:        addressData.city,
          district:    addressData.district,
          state:       addressData.state,
          country:     'India',
          village:     addressData.village,
          pincode:     addressData.pincode,
          fullAddress: addressData.fullAddress,
          latitude,
          longitude
        }
      });

    } catch (error) {
      console.log('Geocode error:', error.message);
      return res.status(400).json({ error: error.message });
    }
  }


  // =================================
  // ADD LOCATION
  // POST /api/location
  // =================================
  async addLocation(req, res) {
    try {
      const { latitude, longitude, locationName } = req.body;
      const farmerId = req.farmer.id;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'latitude and longitude are required' });
      }

      const location = await locationService.addLocation(
        farmerId,
        parseFloat(latitude),
        parseFloat(longitude),
        locationName?.trim() || "My Farm"
      );

      // Wrapped in { success, location } so frontend can do saved.location
      return res.status(201).json({ success: true, location });

    } catch (error) {
      console.log('Add location error:', error.message);
      return res.status(400).json({ error: error.message });
    }
  }


  // =================================
  // GET ACTIVE LOCATION
  // GET /api/location/active
  // =================================
  async getActiveLocation(req, res) {
    try {
      const farmerId = req.farmer.id;
      const location = await locationService.getActiveLocation(farmerId);

      if (!location) {
        return res.status(404).json({ success: false, message: "No active location found" });
      }

      return res.status(200).json({ success: true, location });

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }


  // =================================
  // GET ALL LOCATIONS
  // GET /api/location
  // Returns a plain array — frontend does response.json() then .map()
  // =================================
  async getAllLocations(req, res) {
    try {
      const farmerId = req.farmer.id;
      const locations = await locationService.getAllLocations(farmerId);
      return res.status(200).json(locations);

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }


  // =================================
  // ACTIVATE LOCATION
  // PATCH /api/location/:locationId/activate
  // =================================
  async activateLocation(req, res) {
    try {
      const farmerId   = req.farmer.id;
      const { locationId } = req.params;

      const location = await locationService.activateLocation(farmerId, locationId);

      // Return full location object so SavedLocationScreen can use it directly
      return res.status(200).json({ success: true, location });

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }


  // =================================
  // DELETE LOCATION
  // DELETE /api/location/:locationId
  //
  // BUG FIXED: Original used deleteMany with no ownership check.
  // Now we verify ownership and block deletion of the active location
  // (deleting it would cascade-delete all weather data, chat history, and
  //  crops linked to it via the schema's onDelete: Cascade relations).
  // =================================
  async deleteLocation(req, res) {
    try {
      const farmerId   = req.farmer.id;
      const { locationId } = req.params;

      const location = await prisma.farmerLocation.findFirst({
        where: { id: locationId, farmerId }
      });

      if (!location) {
        return res.status(404).json({ success: false, message: "Location not found" });
      }

      if (location.isActive) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your active farm. Switch to another farm first, then delete this one."
        });
      }

      await prisma.farmerLocation.delete({ where: { id: locationId } });

      return res.status(200).json({ success: true, message: "Location deleted" });

    } catch (error) {
      console.log('Delete location error:', error.message);
      return res.status(400).json({ error: error.message });
    }
  }

}

module.exports = new LocationController();