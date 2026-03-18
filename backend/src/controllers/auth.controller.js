const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');

/**
 * @desc    Register Farmer (Phone only)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerFarmer = async (req, res) => {
  try {
    const { name, phoneNumber, language } = req.body;

    // Basic validation
    if (!name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Name and phone number are required",
      });
    }

    // Trim name — removes any leading/trailing spaces so they don't
    // get stored. Unicode-safe: .trim() works on all scripts.
    const cleanName = name.trim();

    // Normalize language input
    let preferredLanguage = "ENGLISH";

    if (language === "bn" || language === "BENGALI") {
      preferredLanguage = "BENGALI";
    }

    if (language === "hi" || language === "HINDI") {
      preferredLanguage = "HINDI";
    }

    // Create farmer directly (Prisma handles unique constraint)
    const farmer = await prisma.farmer.create({
      data: {
        name: cleanName,
        phoneNumber,
        preferredLanguage,
      },
    });

    const token = generateToken(farmer.id);

    res.status(201).json({
      success: true,
      message: "Farmer registered successfully",
      token,
      data: {
        id: farmer.id,
        name: farmer.name,
        phoneNumber: farmer.phoneNumber,
      },
    });

  } catch (error) {

    // Handle duplicate phone number
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Farmer already registered with this phone number",
      });
    }

    console.error("Register Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/**
 * @desc    Login Farmer (Phone only)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginFarmer = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const farmer = await prisma.farmer.findUnique({
      where: { phoneNumber },
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    const token = generateToken(farmer.id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: farmer.id,
        name: farmer.name,
        phoneNumber: farmer.phoneNumber,
      },
    });

  } catch (error) {

    console.error("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/**
 * @desc    Update Farmer Profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {

    const farmerId = req.farmer.id;

    const {
      name,
      preferredLanguage,
      latitude,
      longitude,
      address,
      village,
      city,
      district,
      state,
      pincode,
      isLocationConfirmed
    } = req.body;

    const updatedFarmer = await prisma.farmer.update({
      where: { id: farmerId },
      data: {
        name,
        preferredLanguage,
        latitude,
        longitude,
        address,
        village,
        city,
        district,
        state,
        pincode,
        isLocationConfirmed
      }
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedFarmer,
    });

  } catch (error) {

    console.error("Update Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


module.exports = {
  registerFarmer,
  loginFarmer,
  updateProfile,
};