const prisma = require('../config/prisma');
const axios = require('axios');

class WeatherService {

  // ===============================
  // Fetch current weather from OpenWeather
  // ===============================
  async getCurrentWeather(latitude, longitude) {
  try {

    const response = await axios.get(
      `${process.env.OPENWEATHER_BASE_URL}/weather`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: process.env.OPENWEATHER_API_KEY,
          units: 'metric',
          lang: 'en'
        }
      }
    );

    const data = response.data;

    return {
      success: true,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      weatherMain: data.weather[0].main,
      weatherDesc: data.weather[0].description,
      weatherIcon: data.weather[0].icon,
      pressure: data.main.pressure,
      visibility: data.visibility,
      cloudiness: data.clouds.all,
      sunrise: new Date(data.sys.sunrise * 1000),
      sunset: new Date(data.sys.sunset * 1000)
    };

  } catch (error) {

    return {
      success: false,
      error: "Failed to fetch current weather"
    };

  }
}


  // ===============================
  // Fetch 5-Day Forecast
  // ===============================
  async getWeatherForecast(latitude, longitude) {

    const response = await axios.get(
      `${process.env.OPENWEATHER_BASE_URL}/forecast`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: process.env.OPENWEATHER_API_KEY,
          units: 'metric',
          lang: 'en'
        }
      }
    );

    const forecastList = response.data.list;

    const dailyForecasts = [];
    const processedDates = new Set();

    forecastList.forEach(item => {

      const date = new Date(item.dt * 1000);
      const dateString = date.toISOString().split('T')[0];

      if (!processedDates.has(dateString) && date.getHours() === 12) {
        processedDates.add(dateString);

        dailyForecasts.push({
          date: date,
          tempMin: Math.round(item.main.temp_min),
          tempMax: Math.round(item.main.temp_max),
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
          weatherMain: item.weather[0].main,
          weatherDesc: item.weather[0].description,
          weatherIcon: item.weather[0].icon,
          chanceOfRain: item.pop || 0
        });
      }

    });

    return dailyForecasts.slice(0, 5);
  }


  // ===============================
  // Save current weather
  // ===============================
  async saveWeather(locationId, weatherData) {

    return await prisma.weatherData.create({
      data: {
        locationId,
        temperature: weatherData.temperature,
        feelsLike: weatherData.feelsLike,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        weatherMain: weatherData.weatherMain,
        weatherDesc: weatherData.weatherDesc,
        weatherIcon: weatherData.weatherIcon,
        pressure: weatherData.pressure,
        visibility: weatherData.visibility,
        cloudiness: weatherData.cloudiness,
        sunrise: weatherData.sunrise,
        sunset: weatherData.sunset
      }
    });

  }


  // ===============================
  // Save forecast
  // ===============================
  async saveForecast(locationId, forecastList) {

    return await prisma.weatherForecast.createMany({
      data: forecastList.map(forecast => ({
        locationId,
        date: forecast.date,
        tempMin: forecast.tempMin,
        tempMax: forecast.tempMax,
        humidity: forecast.humidity,
        windSpeed: forecast.windSpeed,
        weatherMain: forecast.weatherMain,
        weatherDesc: forecast.weatherDesc,
        weatherIcon: forecast.weatherIcon,
        chanceOfRain: forecast.chanceOfRain
      }))
    });

  }


  // ===============================
  // Get weather for active location
  // ===============================
  async getWeatherForActiveLocation(farmerId) {

    const activeLocation = await prisma.farmerLocation.findFirst({
      where: {
        farmerId,
        isActive: true
      }
    });

    if (!activeLocation) {
      throw new Error("No active location found");
    }

    const current = await this.getCurrentWeather(
      activeLocation.latitude,
      activeLocation.longitude
    );

    if (!current.success) {
      throw new Error(current.error || "Failed to fetch current weather");
    }

    const forecast = await this.getWeatherForecast(
      activeLocation.latitude,
      activeLocation.longitude
    );

    if (!forecast.success) {
      throw new Error(forecast.error || "Failed to fetch forecast");
    }

    await this.saveWeather(activeLocation.id, current);
    await this.saveForecast(activeLocation.id, forecast);

    return {
      location: activeLocation,
      current,
      forecast
    };
  }


  // ===============================
  // Get latest weather from DB
  // ===============================
  async getLatestWeather(locationId) {

    return await prisma.weatherData.findFirst({
      where: { locationId },
      orderBy: { fetchedAt: 'desc' }
    });

  }

}

module.exports = new WeatherService();
