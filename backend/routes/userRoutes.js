const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { ObjectId } = require("mongodb")
const connectToDB = require("../config/db")
const authenticateToken = require("../middleware/auth")

const router = express.Router()

const SYSTEM_INSTRUCTION = `You are Eira, a supportive AI companion for mental well-being. Your goal is to offer empathetic conversations and general guidance. You should:
- Be empathetic, understanding, and non-judgmental
- Provide emotional support and general wellness tips
- Remind users you're not a substitute for professional therapy
- If topics seem beyond general support, gently suggest consulting a healthcare professional
- Maintain a calm, supportive tone
- Ask follow-up questions to show genuine interest
- Provide practical coping strategies when appropriate`

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getUsersCollection = async () => {
  const client = await connectToDB()
  return client.db("soft_eng").collection("users")
}

const getChatsCollection = async () => {
  const client = await connectToDB()
  return client.db("soft_eng").collection("chats")
}

const isValidObjectId = (id) => ObjectId.isValid(id) && String(new ObjectId(id)) === id

// ─── Chat routes (protected) ──────────────────────────────────────────────────

// PROTECTED: Create or update chat
router.post("/chats", authenticateToken, async (req, res) => {
  try {
    const { userId, chatId, message, sender } = req.body

    if (!userId || !message || !sender) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized access to user data" })
    }

    const chatsCollection = await getChatsCollection()

    if (chatId) {
      if (!isValidObjectId(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" })
      }

      // Fetch first to verify ownership and existence separately
      const chatDoc = await chatsCollection.findOne({ _id: new ObjectId(chatId) })
      if (!chatDoc) {
        return res.status(404).json({ message: "Chat not found" })
      }
      if (chatDoc.userId.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Unauthorized access" })
      }

      await chatsCollection.updateOne(
        { _id: new ObjectId(chatId) },
        {
          $push: { messages: { message, sender, timestamp: new Date() } },
          $set:  { updatedAt: new Date() }
        }
      )

      return res.status(200).json({ message: "Chat updated successfully", chatId })
    }

    const newChat = {
      userId: new ObjectId(userId),
      messages: [{ message, sender, timestamp: new Date() }],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const result = await chatsCollection.insertOne(newChat)
    res.status(201).json({ message: "Chat created successfully", chatId: result.insertedId })

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

// PROTECTED: Get all chats for a user
router.get("/chats/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" })
    }

    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized access" })
    }

    const chatsCollection = await getChatsCollection()
    const chatDocs = await chatsCollection.find({ userId: new ObjectId(userId) }).toArray()

    if (!chatDocs || chatDocs.length === 0) {
      return res.status(404).json({ message: "Chat not found" })
    }

    res.json(chatDocs)
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

// PROTECTED: Get specific chat detail
router.get("/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params

    if (!isValidObjectId(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID" })
    }

    const chatsCollection = await getChatsCollection()
    const chatDoc = await chatsCollection.findOne({ _id: new ObjectId(chatId) })

    if (!chatDoc) {
      return res.status(404).json({ message: "Chat not found" })
    }

    if (chatDoc.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized access" })
    }

    res.json(chatDoc)
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

// PROTECTED: Delete chat
router.delete("/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params

    if (!isValidObjectId(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID" })
    }

    const chatsCollection = await getChatsCollection()
    const chatDoc = await chatsCollection.findOne({ _id: new ObjectId(chatId) })

    if (!chatDoc) {
      return res.status(404).json({ message: "Chat not found" })
    }

    if (chatDoc.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized access" })
    }

    await chatsCollection.deleteOne({ _id: new ObjectId(chatId) })
    res.status(200).json({ message: "Chat deleted successfully" })

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

// PROTECTED: AI chat proxy — Gemini API key stays on the server
router.post("/chat/ai", authenticateToken, async (req, res) => {
  try {
    const { message, history } = req.body

    if (!message) {
      return res.status(400).json({ message: "Message is required" })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: "AI service not configured" })
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      systemInstruction: SYSTEM_INSTRUCTION,
    })

    const chat = model.startChat({
      history: Array.isArray(history) ? history : [],
      generationConfig: { maxOutputTokens: 1000 },
    })

    const result = await chat.sendMessage(message)
    const text = result.response.text()

    res.json({ response: text || "I apologize, but I couldn't generate a response. Please try again." })

  } catch (error) {
    res.status(500).json({ message: "AI service error" })
  }
})

// ─── Auth routes (public) ─────────────────────────────────────────────────────

// PUBLIC: Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const usersCollection = await getUsersCollection()
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date()
    }
    const result = await usersCollection.insertOne(newUser)
    res.status(201).json({ message: "User created", userId: result.insertedId })

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

// PUBLIC: Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const usersCollection = await getUsersCollection()
    const user = await usersCollection.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h', algorithm: 'HS256' }
    )

    res.json({
      message: "Login successful",
      token,
      name: user.username,
      id: user._id
    })
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" })
  }
})

// PROTECTED: Change password
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" })
    }

    const usersCollection = await getUsersCollection()
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: { password: hashedPassword } }
    )

    res.status(200).json({ message: "Password updated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
