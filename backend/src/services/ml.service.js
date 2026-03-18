/**
 * ml_service.js
 * 
 * 🤖 ML Advisory Response Handler
 * 
 * This file is the integration point for the ML model.
 * 
 * FOR ML TEAMMATE:
 * ─────────────────────────────────────────────────────
 * Replace the stub inside `generateAdvisoryResponse`
 * with your actual ML model call.
 * 
 * The function receives:
 *   - cropContext  → { cropName, waterRequirement, climate, growingDuration }
 *   - history      → array of { role: "user" | "assistant", content: string }
 *                    (last 10 messages, in chronological order)
 *   - userMessage  → the farmer's latest message (string)
 * 
 * The function must return:
 *   - A string (the bot's reply to the farmer)
 * 
 * ─────────────────────────────────────────────────────
 * HOW TO CONNECT YOUR ML MODEL:
 * 
 *   1. Replace the stub body below with your model call
 *   2. In chat_controller.js, uncomment this line:
 *      const { generateAdvisoryResponse } = require('../services/ml_service');
 *   3. And remove the temporary stub reply below it
 * ─────────────────────────────────────────────────────
 */

const generateAdvisoryResponse = async (cropContext, history, userMessage) => {

  const { cropName, waterRequirement, climate, growingDuration } = cropContext;

  // ─── Build conversation memory for ML model context ───────────────────────
  // Formats the last N messages into a readable string the model can use
  let conversationMemory = "";
  history.forEach(msg => {
    const speaker = msg.role === "user" ? "Farmer" : "Advisor";
    conversationMemory += `${speaker}: ${msg.content}\n`;
  });

  // ─── Crop context string ───────────────────────────────────────────────────
  // Pass this to your ML model as part of the prompt/input
  const cropContextString = `
Crop: ${cropName}
Climate: ${climate}
Water Requirement: ${waterRequirement}
Growing Duration: ${growingDuration} days
  `.trim();

  // ─── TODO: Replace below with your ML model call ──────────────────────────
  //
  // Example structure (replace with actual implementation):
  //
  // const response = await yourMLModel.predict({
  //   cropContext: cropContextString,
  //   history: conversationMemory,
  //   question: userMessage
  // });
  // return response.answer;
  //
  // ─────────────────────────────────────────────────────────────────────────

  // TEMPORARY STUB — keyword-based fallback until ML model is connected
  const msg = userMessage.toLowerCase();

  if (msg.includes("water") || msg.includes("irrigation")) {
    return `${cropName} requires ${waterRequirement} water. Irrigate based on soil moisture and current season conditions.`;
  }

  if (msg.includes("harvest")) {
    return `${cropName} typically takes ${growingDuration} days to harvest. Watch for maturity signs before cutting.`;
  }

  if (msg.includes("pest") || msg.includes("insect") || msg.includes("bug")) {
    return `Inspect ${cropName} regularly for pest damage. Neem-based spray every 15 days works as a preventive measure.`;
  }

  if (msg.includes("fertilizer") || msg.includes("fertiliser") || msg.includes("urea")) {
    return `For ${cropName} growing in ${climate} climate, apply balanced NPK fertilizer at recommended intervals. Avoid over-fertilizing.`;
  }

  if (msg.includes("weather") || msg.includes("rain") || msg.includes("temperature")) {
    return `${cropName} grows best in ${climate} conditions. Monitor weather forecasts and adjust irrigation accordingly.`;
  }

  // Default fallback
  return `You are growing ${cropName}. Could you describe your issue in more detail so I can give you the best advice?`;
};

module.exports = { generateAdvisoryResponse };