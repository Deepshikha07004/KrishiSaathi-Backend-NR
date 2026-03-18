const prisma = require('../config/prisma');


// ============================================
// 🌱 GET Crop Recommendations
// GET /api/crops/recommendation
// ============================================
const getCropRecommendations = async (req, res) => {
  try {
    const farmerId = req.farmer.id;

    // 1️⃣ Get active location
    const activeLocation = await prisma.farmerLocation.findFirst({
      where: {
        farmerId,
        isActive: true
      }
    });

    if (!activeLocation) {
      return res.status(400).json({
        success: false,
        message: "No active location found."
      });
    }

    // 2️⃣ Check if active crop exists for this location
    const activeCrop = await prisma.farmerCrop.findFirst({
      where: {
        farmerId,
        locationId: activeLocation.id,
        status: "GROWING"
      }
    });

    if (activeCrop) {
      return res.status(200).json({
        success: true,
        mode: "ACTIVE_CROP_EXISTS",
        message: "You already have an active crop in this location."
      });
    }

    // 3️⃣ Fetch crop master list (later ML filtering here)
    const crops = await prisma.cropMaster.findMany();

    return res.status(200).json({
      success: true,
      mode: "RECOMMENDATION",
      data: crops
    });

  } catch (error) {
    console.error("Crop Recommendation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ============================================
// 🌾 SELECT Crop (Attach to Active Location)
// POST /api/crops/select
// ============================================
const selectCrop = async (req, res) => {
  try {
    const farmerId = req.farmer.id;
    const { cropId } = req.body;

    if (!cropId) {
      return res.status(400).json({
        success: false,
        message: "cropId is required"
      });
    }

    // 1️⃣ Get active location
    const activeLocation = await prisma.farmerLocation.findFirst({
      where: {
        farmerId,
        isActive: true
      }
    });

    if (!activeLocation) {
      return res.status(400).json({
        success: false,
        message: "No active location found."
      });
    }

    // 2️⃣ Check if crop already growing in this location
    const activeCrop = await prisma.farmerCrop.findFirst({
      where: {
        farmerId,
        locationId: activeLocation.id,
        status: "GROWING"
      }
    });

    if (activeCrop) {
      return res.status(400).json({
        success: false,
        message: "You already have an active crop in this location."
      });
    }

    // 3️⃣ Validate crop exists
    const crop = await prisma.cropMaster.findUnique({
      where: { id: cropId }
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: "Crop not found"
      });
    }

    // 4️⃣ Create FarmerCrop entry
    const newFarmerCrop = await prisma.farmerCrop.create({
      data: {
        farmerId,
        locationId: activeLocation.id,
        cropId,
        sowingDate: new Date(),
        status: "GROWING"
      }
    });

    return res.status(201).json({
      success: true,
      message: "Crop selected successfully",
      data: {
        farmerCropId: newFarmerCrop.id,
        location: activeLocation.locationName,
        cropDetails: crop
      }
    });

  } catch (error) {
    console.error("Select Crop Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ============================================
// 🌾 GET Active Crop for Active Location
// GET /api/crops/active
// ============================================
const getActiveCrop = async (req, res) => {
  try {
    const farmerId = req.farmer.id;

    // 1️⃣ Get active location
    const activeLocation = await prisma.farmerLocation.findFirst({
      where: {
        farmerId,
        isActive: true
      }
    });

    if (!activeLocation) {
      return res.status(400).json({
        success: false,
        message: "No active location found."
      });
    }

    // 2️⃣ Get active crop in this location
    const activeCrop = await prisma.farmerCrop.findFirst({
      where: {
        farmerId,
        locationId: activeLocation.id,
        status: "GROWING"
      },
      include: {
        crop: true
      }
    });

    if (!activeCrop) {
      return res.status(404).json({
        success: false,
        message: "No active crop found in this location."
      });
    }

    // 3️⃣ Calculate crop progress
    const sowingDate = new Date(activeCrop.sowingDate);
    const today = new Date();

    const diffTime = today - sowingDate;
    const daysCompleted = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const totalDuration = activeCrop.crop.growingDurationDays;
    const daysRemaining = totalDuration - daysCompleted;

    return res.status(200).json({
      success: true,
      data: {
        location: activeLocation.locationName,
        cropName: activeCrop.crop.cropNameEn,
        sowingDate,
        daysCompleted,
        growingDuration: totalDuration,
        daysRemaining,
        waterRequirement: activeCrop.crop.waterRequirement,
        climate: activeCrop.crop.suitableClimate
      }
    });

  } catch (error) {
    console.error("Active Crop Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// ============================================
// 🌱 SAVE ADVISORY CROP
// POST /api/crops/save-advisory
// Called from CropAdvisoryScreen after form completes
// Creates CropMaster entry if crop name not found, then saves FarmerCrop
// ============================================
const saveAdvisoryCrop = async (req, res) => {
  try {
    const farmerId = req.farmer.id;
    const { cropName, sowingDate } = req.body;

    if (!cropName) {
      return res.status(400).json({
        success: false,
        message: "cropName is required"
      });
    }

    // 1️⃣ Get active location
    const activeLocation = await prisma.farmerLocation.findFirst({
      where: { farmerId, isActive: true }
    });

    if (!activeLocation) {
      return res.status(400).json({
        success: false,
        message: "No active location found."
      });
    }

    // 2️⃣ Check if already has active crop for this location
    const existingCrop = await prisma.farmerCrop.findFirst({
      where: {
        farmerId,
        locationId: activeLocation.id,
        status: "GROWING"
      }
    });

    if (existingCrop) {
      return res.status(200).json({
        success: true,
        message: "Active crop already exists.",
        alreadyExists: true
      });
    }

    // 3️⃣ Find or create CropMaster entry for this crop name
    let crop = await prisma.cropMaster.findFirst({
      where: {
        cropNameEn: {
          equals: cropName,
          mode: "insensitive"
        }
      }
    });

    if (!crop) {
      // Create a basic CropMaster entry with the free-text name
      // waterRequirement and suitableClimate must match the Prisma enums exactly:
      // WaterRequirement: LOW | MEDIUM | HIGH
      // Climate:          SUMMER | WINTER | MONSOON | ALL_SEASON
      crop = await prisma.cropMaster.create({
        data: {
          cropNameEn: cropName,
          cropNameHi: cropName,
          cropNameBn: cropName,
          waterRequirement: "MEDIUM",
          suitableClimate: "ALL_SEASON",
          growingDurationDays: 90
        }
      });
    }

    // 4️⃣ Save FarmerCrop
    // sowingDate is always an ISO string from the date picker (e.g. "2026-01-12T00:00:00.000Z")
    let validSowingDate = new Date();
    if (sowingDate) {
      const parsed = new Date(sowingDate);
      if (!isNaN(parsed.getTime())) {
        validSowingDate = parsed;
      }
    }

    const newFarmerCrop = await prisma.farmerCrop.create({
      data: {
        farmerId,
        locationId: activeLocation.id,
        cropId: crop.id,
        sowingDate: validSowingDate,
        status: "GROWING"
      }
    });

    // 5️⃣ Reset any stuck intake session
    const session = await prisma.farmerSession.findFirst({ where: { farmerId } });
    if (session) {
      await prisma.farmerSession.update({
        where: { id: session.id },
        data: { intakeStep: null, intakeData: {} }
      });
    }

    return res.status(201).json({
      success: true,
      message: "Crop saved successfully",
      data: {
        farmerCropId: newFarmerCrop.id,
        cropName: crop.cropNameEn,
        location: activeLocation.locationName
      }
    });

  } catch (error) {
    console.error("Save Advisory Crop Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ============================================
// 🔄 END Active Crop (farmer wants to start fresh)
// PATCH /api/crops/end
// ============================================
const endActiveCrop = async (req, res) => {
  try {
    const farmerId = req.farmer.id;

    // Get active location
    const activeLocation = await prisma.farmerLocation.findFirst({
      where: { farmerId, isActive: true }
    });

    if (!activeLocation) {
      return res.status(400).json({
        success: false,
        message: "No active location found."
      });
    }

    // Find growing crop for this location
    const activeCrop = await prisma.farmerCrop.findFirst({
      where: {
        farmerId,
        locationId: activeLocation.id,
        status: "GROWING"
      }
    });

    if (!activeCrop) {
      return res.status(404).json({
        success: false,
        message: "No active crop found."
      });
    }

    // Mark as HARVESTED so farmer can start fresh
    await prisma.farmerCrop.update({
      where: { id: activeCrop.id },
      data: { status: "HARVESTED" }
    });

    return res.status(200).json({
      success: true,
      message: "Crop ended. You can now start a new crop."
    });

  } catch (error) {
    console.error("End Crop Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  getCropRecommendations,
  selectCrop,
  getActiveCrop,
  endActiveCrop,
  saveAdvisoryCrop
};