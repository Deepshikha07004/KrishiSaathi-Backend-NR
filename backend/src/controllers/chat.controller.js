const crypto = require("crypto");
const prisma = require('../config/prisma');
// const { generateAdvisoryResponse } = require('../services/ml.service');

/**
 * 🤖 Advisory Chatbot
 * POST /api/chat/advisory
 */
const advisoryChat = async (req, res) => {
  try {
    const farmerId = req.farmer.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    // 1️⃣ Get active location for this farmer
    const activeLocation = await prisma.farmerLocation.findFirst({
      where: { farmerId, isActive: true }
    });

    // locationId is REQUIRED in ChatHistory schema — if no active location exists,
    // we cannot save chat messages. Return a clear error so the farmer knows
    // they need to set a farm location first.
    if (!activeLocation) {
      return res.status(400).json({
        success: false,
        message: "Please set an active farm location before using the chat."
      });
    }

    const locationId = activeLocation.id;

    // 2️⃣ Check if active crop exists for this location
    let activeCrop = await prisma.farmerCrop.findFirst({
      where: {
        farmerId,
        locationId,
        status: "GROWING"
      },
      include: {
        crop: true
      }
    });

    // 2️⃣ Get or create session
    let session = await prisma.farmerSession.findFirst({
      where: { farmerId }
    });

    if (!session) {
      session = await prisma.farmerSession.create({
        data: {
          farmerId,
          sessionId: crypto.randomUUID(),
          intakeStep: null,
          intakeData: {}
        }
      });
    }

    // 🟢 CASE B — No active crop → Start intake flow
    if (!activeCrop) {

      let step = session.intakeStep || 1;
      let intakeData = session.intakeData || {};

      // Start intake
      if (!session.intakeStep) {
        await prisma.farmerSession.update({
          where: { id: session.id },
          data: { intakeStep: 1 }
        });

        return res.status(200).json({
          success: true,
          reply: "What crop have you sown?"
        });
      }

      // Step 1 → Crop name
      if (step === 1) {
        intakeData.cropName = message;

        await prisma.farmerSession.update({
          where: { id: session.id },
          data: {
            intakeStep: 2,
            intakeData
          }
        });

        return res.status(200).json({
          success: true,
          reply: "When did you sow it? (YYYY-MM-DD)"
        });
      }

      // Step 2 → Sowing date
      if (step === 2) {
        intakeData.sowingDate = message;

        await prisma.farmerSession.update({
          where: { id: session.id },
          data: {
            intakeStep: 3,
            intakeData
          }
        });

        return res.status(200).json({
          success: true,
          reply: "What fertilizer have you used?"
        });
      }

      // Step 3 → Fertilizer
      if (step === 3) {
        intakeData.fertilizer = message;

        await prisma.farmerSession.update({
          where: { id: session.id },
          data: {
            intakeStep: 4,
            intakeData
          }
        });

        return res.status(200).json({
          success: true,
          reply: "How often did you apply it?"
        });
      }

      // Step 4 → Frequency
      if (step === 4) {
        intakeData.frequency = message;

        await prisma.farmerSession.update({
          where: { id: session.id },
          data: {
            intakeStep: 5,
            intakeData
          }
        });

        return res.status(200).json({
          success: true,
          reply: "Any pest issues observed?"
        });
      }

      // Step 5 → Finalize & create crop
      if (step === 5) {
        intakeData.pestIssue = message;

        // Find crop in CropMaster
        const crop = await prisma.cropMaster.findFirst({
          where: {
            cropNameEn: {
              equals: intakeData.cropName,
              mode: "insensitive"
            }
          }
        });

        if (!crop) {
          return res.status(400).json({
            success: false,
            reply: "Crop not found in system. Please check spelling."
          });
        }

        // Create FarmerCrop
        await prisma.farmerCrop.create({
          data: {
            farmerId,
            cropId: crop.id,
            sowingDate: new Date(intakeData.sowingDate),
            status: "GROWING"
          }
        });

        // Reset intake session
        await prisma.farmerSession.update({
          where: { id: session.id },
          data: {
            intakeStep: null,
            intakeData: {}
          }
        });

        return res.status(200).json({
          success: true,
          reply:
            `📌 Active Crop: ${crop.cropNameEn}\n` +
            `✔ Growing Duration: ${crop.growingDurationDays} days\n` +
            `✔ Water Requirement: ${crop.waterRequirement}\n` +
            `✔ Climate: ${crop.suitableClimate}`
        });
      }
    }

    // 🔵 NORMAL ADVISORY MODE (Active crop exists)

    const cropContext = {
      cropName: activeCrop.crop.cropNameEn,
      waterRequirement: activeCrop.crop.waterRequirement,
      climate: activeCrop.crop.suitableClimate,
      growingDuration: activeCrop.crop.growingDurationDays
    };

    // 🧠 Fetch last 10 chat messages for THIS farm only
    const previousMessages = await prisma.chatHistory.findMany({
      where: {
        farmerId,
        locationId
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    // Reverse to chronological order
    const orderedMessages = previousMessages.reverse();

    // Convert to conversation format
    const conversationHistory = orderedMessages.map(msg => ({
      role: msg.isFarmerMessage ? "user" : "assistant",
      content: msg.messageText
    }));


    // 🤖 ML teammate: uncomment below and implement ml.service.js
    // const botReply = await generateAdvisoryResponse(cropContext, conversationHistory, message);

    // Temporary stub reply until ML service is ready
    const botReply = `I can see your crop details. Our farming expert will provide detailed advice soon. In the meantime, make sure your ${cropContext.cropName} gets adequate water (${cropContext.waterRequirement}) and monitor for any pest issues.`;


    // Save farmer message WITH locationId so history is per-farm
    await prisma.chatHistory.create({
      data: {
        farmerId,
        locationId,
        messageText: message,
        messageLanguage: "ENGLISH",
        isFarmerMessage: true
      }
    });

    // Save bot reply WITH locationId
    await prisma.chatHistory.create({
      data: {
        farmerId,
        locationId,
        messageText: botReply,
        messageLanguage: "ENGLISH",
        isFarmerMessage: false
      }
    });

    return res.status(200).json({
      success: true,
      reply: botReply
    });

  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * 📜 Get Full Chat History
 * GET /api/chat/history
 */
const getChatHistory = async (req, res) => {
  try {
    const farmerId = req.farmer.id;
    const { locationId } = req.query; // frontend passes ?locationId=xxx

    const history = await prisma.chatHistory.findMany({
      where: {
        farmerId,
        locationId
      },
      orderBy: { timestamp: "asc" }
    });

    return res.status(200).json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error("Chat History Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


module.exports = {
  advisoryChat,
  getChatHistory
};