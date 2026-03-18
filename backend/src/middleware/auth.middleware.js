const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const protect = async (req, res, next) => {
  try {

    let token;

    // 1️⃣ Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2️⃣ Token missing
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token missing',
      });
    }

    // 3️⃣ Verify token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Find farmer in DB
    const farmer = await prisma.farmer.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        preferredLanguage: true
      }
    });

    if (!farmer) {
      return res.status(401).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    // 5️⃣ Attach farmer to request
    req.farmer = farmer;

    next();

  } catch (error) {

    console.error("Auth Middleware Error:", error);

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

module.exports = {
  protect,
};