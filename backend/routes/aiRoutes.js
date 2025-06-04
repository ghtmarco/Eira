const express = require("express");
const router = express.Router();

// Import Google GenAI with correct package
let GoogleGenAI;
try {
  const genAI = require("@google/genai");
  GoogleGenAI = genAI.GoogleGenAI;
} catch (error) {
  console.error("Failed to import @google/genai:", error);
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in the environment variables.");
}

// Initialize the Google GenAI client
const ai = API_KEY && GoogleGenAI ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Store active chat sessions in memory (in production, use Redis or database)
const chatSessions = new Map();

router.post("/generate-response", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ 
      message: "AI service not available. Please check API configuration.",
      error: "GEMINI_API_KEY not configured or library not installed",
      success: false
    });
  }

  try {
    const { prompt, chatId, history } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        message: "Valid prompt is required.",
        success: false
      });
    }

    // Use the correct format for the new Google GenAI SDK
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt.trim(),
      config: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.9,
        topK: 40
      }
    });

    // Extract the text response correctly
    const generatedText = response?.text || "I apologize, but I couldn't generate a response. Please try again.";

    res.json({ 
      generatedText,
      chatId: chatId || null,
      success: true
    });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    
    // Handle specific API errors
    let errorMessage = "Failed to generate AI response.";
    let statusCode = 500;

    if (error.message?.includes("API_KEY")) {
      errorMessage = "API key configuration error.";
      statusCode = 503;
    } else if (error.message?.includes("quota")) {
      errorMessage = "API quota exceeded. Please try again later.";
      statusCode = 429;
    } else if (error.message?.includes("safety")) {
      errorMessage = "Content filtered for safety reasons.";
      statusCode = 400;
    } else if (error.message?.includes("invalid") || error.message?.includes("400")) {
      errorMessage = "Invalid request parameters.";
      statusCode = 400;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = "Network connection error. Please check your internet connection.";
      statusCode = 503;
    }

    res.status(statusCode).json({ 
      message: errorMessage,
      error: error.message,
      success: false
    });
  }
});

// Endpoint to clear a specific chat session
router.delete("/chat/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    
    if (chatSessions.has(chatId)) {
      chatSessions.delete(chatId);
      res.json({ 
        message: "Chat session cleared successfully.",
        success: true
      });
    } else {
      res.status(404).json({ 
        message: "Chat session not found.",
        success: false
      });
    }
  } catch (error) {
    console.error("Error clearing chat session:", error);
    res.status(500).json({ 
      message: "Failed to clear chat session.",
      error: error.message,
      success: false
    });
  }
});

// Endpoint to get chat session status
router.get("/chat/:chatId/status", async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const exists = chatSessions.has(chatId);
    res.json({ 
      exists,
      chatId,
      success: true
    });
  } catch (error) {
    console.error("Error checking chat session:", error);
    res.status(500).json({ 
      message: "Failed to check chat session status.",
      error: error.message,
      success: false
    });
  }
});

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const isConfigured = !!API_KEY;
    const isReady = !!ai;
    
    res.json({
      status: isReady ? "healthy" : "unhealthy",
      gemini_configured: isConfigured,
      library_loaded: !!GoogleGenAI,
      active_sessions: chatSessions.size,
      success: true
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
      success: false
    });
  }
});

module.exports = router;