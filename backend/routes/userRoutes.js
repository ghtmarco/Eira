const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { ObjectId } = require("mongodb")
const connectToDB = require("../config/db")
const authenticateToken = require("../middleware/auth")

const router = express.Router()

// Utility to get user collection
const getUsersCollection = async () => {
  const client = await connectToDB()
  return client.db("soft_eng").collection("users")
}

// Utility to get chat collection
const getChatsCollection = async () => {
  const client = await connectToDB()
  return client.db("soft_eng").collection("chats")
}

// PROTECTED: Create or update chat
router.post("/chats", authenticateToken, async (req, res) => {
  try {
    const { userId, chatId, message, sender } = req.body
    
    if (!userId || !message || !sender) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Authorization check: User can only create/update chats for themselves
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized access to user data" })
    }

    const chatsCollection = await getChatsCollection()

    if (chatId) {
      const result = await chatsCollection.updateOne(
        { _id: new ObjectId(chatId), userId: new ObjectId(userId) },
        { $push: { messages: { message, sender, timestamp: new Date() } } }
      )
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Chat not found" })
      }
      
      res.status(201).json({ message: "Chat updated successfully", chatId })
    } else {
      const newChat = {
        userId: new ObjectId(userId),
        messages: [{ message, sender, timestamp: new Date() }],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = await chatsCollection.insertOne(newChat)
      res.status(201).json({ message: "Chat created successfully", chatId: result.insertedId })
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
})

// PROTECTED: Get all chats for a user
router.get("/chats/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params

    // Authorization check
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
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
})

// PROTECTED: Get specific chat detail
router.get("/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params
    const chatsCollection = await getChatsCollection()
    
    const chatDoc = await chatsCollection.findOne({ _id: new ObjectId(chatId) })
    
    if (!chatDoc) {
      return res.status(404).json({ message: "Chat not found" })
    }

    // Authorization check
    if (chatDoc.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized access" })
    }

    res.json(chatDoc)
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
})

// PUBLIC: Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const usersCollection = await getUsersCollection()

    // FIX: Avoid regex for exact lookup to prevent ReDoS
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
    res.status(500).json({ message: "Internal Server Error", error: error.message })
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
    
    // FIX: Avoid regex for exact lookup to prevent ReDoS
    const user = await usersCollection.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({ 
      message: "Login successful", 
      token,
      name: user.username, 
      id: user._id 
    })
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
})

// PROTECTED: Change password — requires valid JWT and current password verification
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
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// PROTECTED: Delete chat
router.delete("/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params
    const chatsCollection = await getChatsCollection()
    
    // Authorization check: find the chat first to verify ownership
    const chatDoc = await chatsCollection.findOne({ _id: new ObjectId(chatId) })
    
    if (!chatDoc) {
      return res.status(404).json({ message: "Chat not found" })
    }

    if (chatDoc.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized access" })
    }
    
    const result = await chatsCollection.deleteOne({ _id: new ObjectId(chatId) })
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Chat not found" })
    }
    
    res.status(200).json({ message: "Chat deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
})

module.exports = router

