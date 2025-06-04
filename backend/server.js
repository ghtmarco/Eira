require('dotenv').config()
const express = require("express")
const cors = require("cors")
const connectToDB = require("./config/db")
const userRoutes = require("./routes/userRoutes")
const aiRoutes = require("./routes/aiRoutes")

const app = express()
app.use(express.json())
app.use(cors())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.use("/api/users", userRoutes)
app.use("/api/ai", aiRoutes)
connectToDB().then(() => {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})