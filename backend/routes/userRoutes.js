const express = require("express")
const bcrypt = require("bcryptjs")
const { ObjectId } = require("mongodb")
const connectToDB = require("../config/db")

const router = express.Router()

router.post("/chats", async (req, res) => {
  try {
    const { userId, chatId, message, sender } = req.body
    if (!userId || !message || !sender) {
      return res.status(400).json({ message: "All fields are required" })
    }
    const client = await connectToDB()
    const db = client.db("soft_eng")
    const chatsCollection = db.collection("chats")

    if (chatId) {
      await chatsCollection.updateOne(
        { _id: new ObjectId(chatId) },
        { $push: { messages: { message, sender, timestamp: new Date() } } }
      )
      res.status(201).json({ message: "Chat updated successfully", chatId })
    } else {
      const newChat = {
        userId: new ObjectId(userId),
        messages: [{ message, sender, timestamp: new Date() }]
      }
      const result = await chatsCollection.insertOne(newChat)
      res.status(201).json({ message: "Chat created successfully", chatId: result.insertedId })
    }
  } catch (error) {
    console.error("Chat save error:", error)
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
})

router.get("/chats/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const client = await connectToDB()
    const db = client.db("soft_eng")
    const chatsCollection = db.collection("chats")

    const chatDocs = await chatsCollection.find({ userId: new ObjectId(userId) }).toArray()

    if (!chatDocs || chatDocs.length === 0) {
      return res.status(404).json({ message: "Chat not found" })
    }

    res.json(chatDocs)
  } catch (error) {
    console.error("Chat retrieval error:", error)
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
})

router.get("/chats/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params
    const client = await connectToDB()
    const db = client.db("soft_eng")
    const chatsCollection = db.collection("chats")
    const chatDoc = await chatsCollection.findOne({ _id: new ObjectId(chatId) })
    if (!chatDoc) {
      return res.status(404).json({ message: "Chat not found" })
    }
    res.json(chatDoc)
  } catch (error) {
    console.error("Chat retrieval error:", error)
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
})

router.post("/register", async (req, res) => {
  try {
    const client = await connectToDB()
    const db = client.db("soft_eng")
    const usersCollection = db.collection("users")

    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = { username, email, password: hashedPassword }
    const result = await usersCollection.insertOne(newUser)

    res.status(201).json({ message: "User created", userId: result.insertedId })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
})

router.post("/login", async (req, res) => {
  try {
    const client = await connectToDB()
    const db = client.db("soft_eng")
    const usersCollection = db.collection("users")

    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const user = await usersCollection.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } })

    if (!user) {
      return res.status(401).json({ message: "User Does Not Exist" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect Password" })
    }

    res.json({ message: "Login successful", name: user.username, id: user._id })
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error })
  }
})

router.post("/change-password", async (req, res) => {
  try {
      const { email, newPassword } = req.body
      const client = await connectToDB()
      const db = client.db("soft_eng")
      const usersCollection = db.collection("users")
      const user = await usersCollection.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } })
      if (!user) {
          return res.status(404).json({ message: "User not found" })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)

      await usersCollection.updateOne(
        { email },
        { $set: { password: hashedPassword } }
      )

      res.status(200).json({ message: "Password updated successfully" })
  } catch (error) {
      console.error("Error in /change-password:", error)
      res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router