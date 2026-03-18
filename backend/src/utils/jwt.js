const jwt = require('jsonwebtoken');

const generateToken = (farmerId) => {
  return jwt.sign(
    { id: farmerId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

module.exports = {
  generateToken,
};
