const weatherService = require('../services/weather.service');

class WeatherController {

  async getWeather(req, res) {
    try {

      const farmerId = req.farmer.id;

      const data = await weatherService.getWeatherForActiveLocation(farmerId);

      res.json({
        success: true,
        data
      });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

}

module.exports = new WeatherController();
