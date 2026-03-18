const prisma = require('../config/prisma');

class CropService {

  // =============================================
  // ADD CROP TO ACTIVE LOCATION
  // =============================================
  async addCropToActiveLocation(farmerId, cropId, sowingDate) {

    // Step 1: Find the farmer's currently active location
    const activeLocation = await prisma.farmerLocation.findFirst({
      where: {
        farmerId,
        isActive: true   // ← correct field on FarmerLocation
      }
    });

    if (!activeLocation) {
      throw new Error("No active location found. Please set a farm location first.");
    }

    // Step 2: Check if a GROWING crop already exists at this location
    const existingCrop = await prisma.farmerCrop.findFirst({
      where: {
        farmerId,
        locationId: activeLocation.id,
        status: "GROWING"
      }
    });

    if (existingCrop) {
      throw new Error("An active crop already exists for this location.");
    }

    // Step 3: Create the crop entry
    const farmerCrop = await prisma.farmerCrop.create({
      data: {
        farmerId,
        locationId: activeLocation.id,  // ← was missing entirely before
        cropId,
        sowingDate: new Date(sowingDate),
        status: "GROWING"
      }
    });

    return farmerCrop;
  }


  // =============================================
  // GET ALL CROPS FOR ACTIVE LOCATION
  // =============================================
  async getCropsForActiveLocation(farmerId) {

    const activeLocation = await prisma.farmerLocation.findFirst({
      where: {
        farmerId,
        isActive: true
      }
    });

    if (!activeLocation) {
      throw new Error("No active location found.");
    }

    return await prisma.farmerCrop.findMany({
      where: {
        farmerId,
        locationId: activeLocation.id
      },
      include: {
        crop: true
      }
    });
  }

}

module.exports = new CropService();