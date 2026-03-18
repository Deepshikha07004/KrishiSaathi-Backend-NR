const prisma = require('../config/prisma');
const axios = require('axios');

class LocationService {

  // =====================================
  // REVERSE GEOCODING (Nominatim)
  //
  // IMPORTANT: This is now BEST-EFFORT.
  // If Nominatim is unavailable, misconfigured, or times out,
  // we return empty strings instead of throwing.
  // The location ALWAYS saves — lat/lon is what matters for weather/advisory.
  // Address fields will just be blank and can be populated later.
  // =====================================
  async reverseGeocode(latitude, longitude) {
    const empty = {
      fullAddress: "",
      village:     "",
      city:        "",
      district:    "",
      state:       "",
      pincode:     ""
    };

    // If env var not configured, skip silently instead of crashing
    if (!process.env.NOMINATIM_BASE_URL) {
      console.log("NOMINATIM_BASE_URL not set — skipping reverse geocode");
      return empty;
    }

    try {
      const response = await axios.get(
        `${process.env.NOMINATIM_BASE_URL}/reverse`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json',
            addressdetails: 1,
            'accept-language': 'en'
          },
          headers: {
            'User-Agent': process.env.NOMINATIM_USER_AGENT || 'KrishiSaathi-App'
          },
          timeout: 8000
        }
      );

      const addr = response.data.address || {};

      return {
        fullAddress: response.data.display_name || "",
        village:     addr.village || addr.hamlet || "",
        city:        addr.city || addr.town || addr.suburb || "",
        district:    addr.state_district || addr.county || "",
        state:       addr.state || "",
        pincode:     addr.postcode || ""
      };

    } catch (error) {
      // Non-fatal — log and return empty so save still works
      console.log("Reverse geocode failed (non-fatal):", error.message);
      return empty;
    }
  }


  // =====================================
  // FORWARD GEOCODING — Multi-Strategy
  //
  // Handles everything from simple village names to full Indian postal
  // addresses with house numbers, street names, landmarks, and pincodes.
  //
  // Strategy order (tries each until results are found):
  //   1. Structured search  — splits address into road/city/state/postcode
  //   2. Pincode-first      — if a 6-digit PIN is present, anchor on that
  //   3. Cleaned free-text  — strips noise words (near, opp, flat, etc.)
  //   4. Locality + state   — last two meaningful tokens only
  // =====================================
  async forwardGeocode(query) {
    if (!process.env.NOMINATIM_BASE_URL) {
      throw new Error("Geocoding service is not configured on this server.");
    }

    const axiosConfig = {
      headers: { 'User-Agent': process.env.NOMINATIM_USER_AGENT || 'KrishiSaathi-App' },
      timeout: 12000
    };

    const baseParams = {
      format:          'json',
      addressdetails:  1,
      limit:           5,
      countrycodes:    'in',
      'accept-language': 'en'
    };

    // ─── Helpers ────────────────────────────────────────────────────────────

    // Convert Nominatim result → app's flat shape
    const formatResult = (r) => {
      const addr = r.address || {};
      return {
        displayName: r.display_name || "",
        latitude:    parseFloat(r.lat),
        longitude:   parseFloat(r.lon),
        fullAddress: r.display_name || "",
        village:     addr.village || addr.hamlet || addr.suburb || "",
        city:        addr.city || addr.town || addr.municipality || addr.suburb || "",
        district:    addr.state_district || addr.county || addr.district || "",
        state:       addr.state || "",
        pincode:     addr.postcode || "",
        country:     addr.country || "India"
      };
    };

    // Hit Nominatim and return formatted array (empty array on failure/no results)
    const search = async (params) => {
      try {
        const res = await axios.get(
          `${process.env.NOMINATIM_BASE_URL}/search`,
          { params: { ...baseParams, ...params }, ...axiosConfig }
        );
        return (res.data || []).map(formatResult);
      } catch {
        return [];
      }
    };

    // Parse a raw address string into components
    const parse = (raw) => {
      // Extract 6-digit Indian pincode
      const pinMatch = raw.match(/\b(\d{6})\b/);
      const pincode  = pinMatch ? pinMatch[1] : null;

      // Remove pincode from the working string
      let work = raw.replace(/\b\d{6}\b/, '').trim();

      // Known Indian states (enough to detect the state token reliably)
      const STATES = [
        'West Bengal','Maharashtra','Uttar Pradesh','Tamil Nadu','Karnataka',
        'Rajasthan','Gujarat','Madhya Pradesh','Bihar','Andhra Pradesh',
        'Telangana','Kerala','Odisha','Jharkhand','Assam','Punjab','Haryana',
        'Chhattisgarh','Uttarakhand','Himachal Pradesh','Goa','Tripura',
        'Meghalaya','Manipur','Nagaland','Arunachal Pradesh','Mizoram',
        'Sikkim','Delhi','Jammu and Kashmir','Ladakh'
      ];

      let state = "";
      for (const s of STATES) {
        const re = new RegExp(s, 'i');
        if (re.test(work)) {
          state = s;
          work  = work.replace(re, '').trim();
          break;
        }
      }

      // Noise words to strip for cleaner searches
      const NOISE = /\b(near|opp|opposite|behind|beside|next\s+to|flat\s+no|house\s+no|plot\s+no|door\s+no|h\.no|s\.no|ward|block|sector|phase|gali|lane|road|rd|street|st|nagar|colony|society|apartment|apt|floor|building|bldg|complex|tower|residency|enclave|layout|extension|ext|circle|chowk|crossing|junction|main|by-pass|bypass|national\s+highway|nh|sh)\b\.?/gi;

      // Tokens after removing noise
      const cleanWork    = work.replace(NOISE, ' ').replace(/\s{2,}/g, ' ').trim();
      const tokens       = cleanWork.split(/[,\s]+/).filter(t => t.length > 2);
      const lastTwo      = tokens.slice(-2).join(', ');
      const lastThree    = tokens.slice(-3).join(', ');

      return { pincode, state, cleanWork, lastTwo, lastThree, tokens };
    };

    // ─── Strategy 1: Structured search ─────────────────────────────────────
    // Best for addresses that have a recognisable locality + city + state
    const { pincode, state, cleanWork, lastTwo, lastThree, tokens } = parse(query);

    // Build structured params — Nominatim accepts street/city/state/postalcode
    const structuredParams = {};
    if (pincode)      structuredParams.postalcode = pincode;
    if (state)        structuredParams.state       = state;

    // Use the last 2–3 meaningful tokens as the city/locality hint
    if (lastThree)    structuredParams.city        = lastThree;
    else if (lastTwo) structuredParams.city        = lastTwo;

    // Also pass a cleaned street if we have enough tokens
    if (tokens.length > 3) {
      structuredParams.street = tokens.slice(0, Math.ceil(tokens.length / 2)).join(' ');
    }

    let results = await search(structuredParams);
    if (results.length > 0) return results;

    // ─── Strategy 2: Pincode-anchored free-text ─────────────────────────────
    // If a PIN was found, search just "PIN state" — this is very reliable
    if (pincode) {
      results = await search({ q: `${pincode}${state ? ', ' + state : ''}` });
      if (results.length > 0) return results;
    }

    // ─── Strategy 3: Cleaned free-text (noise removed) ──────────────────────
    const cleanQuery = [cleanWork, state].filter(Boolean).join(', ');
    if (cleanQuery !== query) {
      results = await search({ q: cleanQuery });
      if (results.length > 0) return results;
    }

    // ─── Strategy 4: Last 2–3 tokens + state (pure locality fallback) ───────
    const localityQuery = [lastThree || lastTwo, state].filter(Boolean).join(', ');
    if (localityQuery) {
      results = await search({ q: localityQuery });
      if (results.length > 0) return results;
    }

    // ─── Strategy 5: Raw free-text as-is (last resort) ──────────────────────
    results = await search({ q: query });
    if (results.length > 0) return results;

    throw new Error(
      "No location found. Try simplifying — e.g. 'Ballygunge, Kolkata, West Bengal' instead of the full street address."
    );
  }


  // =====================================
  // SHARED FORMATTER
  // Every method returns this same flat shape.
  // =====================================
  _format(loc) {
    return {
      id:           loc.id,
      name:         loc.locationName,
      locationName: loc.locationName,
      latitude:     loc.latitude,
      longitude:    loc.longitude,
      address:      loc.address  || "",
      village:      loc.village  || "",
      city:         loc.city     || "",
      district:     loc.district || "",
      state:        loc.state    || "",
      pincode:      loc.pincode  || "",
      country:      "India",
      isActive:     loc.isActive,
      createdAt:    loc.createdAt
    };
  }


  // =====================================
  // ADD LOCATION
  // =====================================
  async addLocation(farmerId, latitude, longitude, locationName) {

    // Geocode is best-effort — failure never blocks the save
    const addressData = await this.reverseGeocode(latitude, longitude);

    await prisma.farmerLocation.updateMany({
      where: { farmerId },
      data:  { isActive: false }
    });

    const location = await prisma.farmerLocation.create({
      data: {
        farmerId,
        locationName,
        latitude,
        longitude,
        address:  addressData.fullAddress,
        village:  addressData.village,
        city:     addressData.city,
        district: addressData.district,
        state:    addressData.state,
        pincode:  addressData.pincode,
        isActive: true
      }
    });

    return this._format(location);
  }


  // =====================================
  // GET ACTIVE LOCATION
  // =====================================
  async getActiveLocation(farmerId) {
    const location = await prisma.farmerLocation.findFirst({
      where: { farmerId, isActive: true }
    });
    if (!location) return null;
    return this._format(location);
  }


  // =====================================
  // GET ALL LOCATIONS
  // =====================================
  async getAllLocations(farmerId) {
    const locations = await prisma.farmerLocation.findMany({
      where:   { farmerId },
      orderBy: { createdAt: 'desc' }
    });
    return locations.map(loc => this._format(loc));
  }


  // =====================================
  // ACTIVATE LOCATION
  // =====================================
  async activateLocation(farmerId, locationId) {

    const existing = await prisma.farmerLocation.findFirst({
      where: { id: locationId, farmerId }
    });

    if (!existing) {
      throw new Error("Location not found or does not belong to this farmer.");
    }

    await prisma.farmerLocation.updateMany({
      where: { farmerId },
      data:  { isActive: false }
    });

    const location = await prisma.farmerLocation.update({
      where: { id: locationId },
      data:  { isActive: true }
    });

    return this._format(location);
  }

}

module.exports = new LocationService();