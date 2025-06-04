require('dotenv').config()
const express = require("express")
const cors = require("cors")
const os = require("os")
const connectToDB = require("./config/db")
const userRoutes = require("./routes/userRoutes")

const app = express()

app.use(express.json())
app.use(cors({
  origin: '*',
  credentials: true
}))

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      api: 'active'
    },
    endpoints: {
      users: '/api/users',
      health: '/health'
    }
  })
})

app.use("/api/users", userRoutes)

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    message: 'AI functionality has been moved to frontend. Available routes:',
    availableRoutes: [
      'GET /health',
      'POST /api/users/register',
      'POST /api/users/login',
      'POST /api/users/change-password',
      'POST /api/users/chats',
      'GET /api/users/chats/user/:userId',
      'GET /api/users/chats/:chatId',
      'DELETE /api/users/chats/:chatId'
    ]
  })
})

app.use((err, req, res, next) => {
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  })
})

connectToDB().then(() => {
  const PORT = process.env.PORT || 3000
  
  app.listen(PORT, '0.0.0.0', () => {
  })
}).catch((error) => {
  process.exit(1)
})
