const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in the environment variables.");
}

// Initialize the Google GenAI client
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Store active chat sessions in memory (in production, use Redis or database)
const chatSessions = new Map();

router.post("/generate-response", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ 
      message: "AI service not available. Please check API configuration.",
      error: "GEMINI_API_KEY not configured"
    });
  }

  try {
    const { prompt, chatId, history } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        message: "Valid prompt is required." 
      });
    }

    let chat;
    
    if (chatId && chatSessions.has(chatId)) {
      // Use existing chat session
      chat = chatSessions.get(chatId);
    } else {
      // Create new chat session
      chat = ai.chats.create({
        model: 'gemini-2.0-flash-001',
        config: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.9,
          topK: 40
        }
      });

      // If chatId is provided, store the session
      if (chatId) {
        chatSessions.set(chatId, chat);
      }
    }

    // If history is provided but no existing session, initialize with history
    if (history && Array.isArray(history) && history.length > 0 && !chatSessions.has(chatId)) {
      // Convert history to Google GenAI format and prefill the conversation
      const formattedHistory = [];
      
      for (const msg of history) {
        if (msg.user && msg.text) {
          formattedHistory.push({
            role: 'user',
            parts: [{ text: msg.text }]
          });
        } else if (!msg.user && msg.text) {
          formattedHistory.push({
            role: 'model',
            parts: [{ text: msg.text }]
          });
        }
      }

      // If we have history, create a new chat with that history
      if (formattedHistory.length > 0) {
        chat = ai.chats.create({
          model: 'gemini-2.0-flash-001',
          config: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.9,
            topK: 40
          },
          history: formattedHistory
        });

        if (chatId) {
          chatSessions.set(chatId, chat);
        }
      }
    }

    // Send message to the chat
    const response = await chat.sendMessage({
      message: prompt.trim()
    });

    // Extract the text response
    const generatedText = response.text || "I apologize, but I couldn't generate a response. Please try again.";

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

    if (error.message.includes("API_KEY")) {
      errorMessage = "API key configuration error.";
      statusCode = 503;
    } else if (error.message.includes("quota")) {
      errorMessage = "API quota exceeded. Please try again later.";
      statusCode = 429;
    } else if (error.message.includes("safety")) {
      errorMessage = "Content filtered for safety reasons.";
      statusCode = 400;
    } else if (error.message.includes("invalid")) {
      errorMessage = "Invalid request parameters.";
      statusCode = 400;
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