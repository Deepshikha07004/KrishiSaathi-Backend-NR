const advisoryService = require('../services/advisory.service');

const getAdvisory = async (req, res) => {
  try {
    const farmerId = req.farmer.id;

    const advisory = await advisoryService.getAdvisoryForActiveCrop(farmerId);

    return res.status(200).json({
      success: true,
      data: advisory
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAdvisory
};
