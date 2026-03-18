const prisma = require('../config/prisma');

class AdvisoryService {

  async getAdvisoryForActiveCrop(farmerId) {

    // 1️⃣ Get farmer preferred language
    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId }
    });

    if (!farmer) {
      throw new Error("Farmer not found");
    }

    // 2️⃣ Get active location
    const activeLocation = await prisma.farmerLocation.findFirst({
      where: {
        farmerId,
        isActive: true
      }
    });

    if (!activeLocation) {
      throw new Error("No active location found");
    }

    // 3️⃣ Get active crop
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
      throw new Error("No active crop found");
    }

    // 4️⃣ Get latest weather for this location
    const latestWeather = await prisma.weatherData.findFirst({
      where: {
        locationId: activeLocation.id
      },
      orderBy: {
        fetchedAt: 'desc'
      }
    });

    if (!latestWeather) {
      throw new Error("Weather data not available");
    }

    // 5️⃣ Determine weather condition enum
    const weatherCondition = this.mapWeatherCondition(
      latestWeather.weatherMain,
      latestWeather.temperature
    );

    // 6️⃣ Fetch precaution for this crop + weather condition
    const precaution = await prisma.weatherPrecaution.findFirst({
      where: {
        cropId: activeCrop.cropId,
        weatherCondition: weatherCondition
      }
    });

    if (!precaution) {
      return {
        crop: activeCrop.crop.cropNameEn,
        weather: weatherCondition,
        message: "No specific precaution available for this condition."
      };
    }

    // 7️⃣ Return language-specific precaution
    let precautionText;

    switch (farmer.preferredLanguage) {
      case "HINDI":
        precautionText = precaution.precautionTextHi || precaution.precautionTextEn;
        break;
      case "BENGALI":
        precautionText = precaution.precautionTextBn || precaution.precautionTextEn;
        break;
      default:
        precautionText = precaution.precautionTextEn;
    }

    return {
      location: activeLocation.locationName,
      crop: activeCrop.crop.cropNameEn,
      weatherCondition,
      advisory: precautionText
    };
  }


  // 🔥 Weather → Enum Mapping Logic
  mapWeatherCondition(weatherMain, temperature) {

    const main = weatherMain.toLowerCase();

    if (main.includes("rain") || main.includes("drizzle")) {
      return "RAIN";
    }

    if (main.includes("storm") || main.includes("thunder")) {
      return "STORM";
    }

    if (main.includes("cloud")) {
      return "CLOUDY";
    }

    if (temperature > 38) {
      return "HEATWAVE";
    }

    if (temperature < 8) {
      return "COLD";
    }

    return "CLEAR";
  }

}

module.exports = new AdvisoryService();
