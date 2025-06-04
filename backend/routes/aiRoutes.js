const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in the environment variables.");
}
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" }) : null;

router.post("/generate-response", async (req, res) => {
  if (!model) {
    return res.status(500).json({ message: "AI model not initialized. Check API Key." });
  }

  const { prompt, history, instruction } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required." });
  }
  let fullPrompt = instruction || 'You are a helpful assistant.';
  if (history && Array.isArray(history)) {
      fullPrompt += "\n\n" + history.map(msg => `${msg.user ? "User" : "Bot"}: ${msg.text}`).join("\n");
  }
  fullPrompt += "\nUser: " + prompt;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = await response.text();
    res.json({ generatedText: text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ message: "Failed to generate AI response.", error: error.message });
  }
});

module.exports = router;