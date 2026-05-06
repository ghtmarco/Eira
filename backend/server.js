require('dotenv').config()
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const connectToDB = require("./config/db")
const userRoutes = require("./routes/userRoutes")

const app = express()
const PORT = process.env.PORT || 5000

// 1. Request Timer Middleware (Must be first)
const requestTimer = (req, res, next) => {
  req.startTime = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - req.startTime
    const color = duration > 1000 ? '\x1b[31m' : duration > 500 ? '\x1b[33m' : '\x1b[32m'
    console.log(`${color}${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms\x1b[0m`)
  })
  next()
}
app.use(requestTimer)

// 2. Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// 4. Standard Middleware
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 5. Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 6. Routes
app.use("/api/users", userRoutes)

// 7. 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl
  })
})

// 8. Global Error Handler
app.use((err, req, res, next) => {
  console.error(`❌ Error ${req.method} ${req.path}:`, err.message)
  
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  })
})

// Server Startup
const startServer = async () => {
  try {
    await connectToDB()
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://0.0.0.0:${PORT}`)
    })

    const gracefulShutdown = (signal) => {
      console.log(`\n🔄 Received ${signal}. Closing HTTP server...`)
      server.close(() => {
        console.log('✅ HTTP server closed')
        process.exit(0)
      })
    }

    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

// Support running via tests (don't auto-start if required)
if (require.main === module) {
  startServer()
}

module.exports = app
