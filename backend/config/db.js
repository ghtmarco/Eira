const { MongoClient, ServerApiVersion } = require('mongodb')
const dotenv = require('dotenv')
dotenv.config()

const uri = process.env.MONGO_URI

if (!uri) {
  throw new Error('MONGO_URI environment variable is not defined')
}

const client = new MongoClient(uri, {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
})

let isConnected = false

async function connectToDB() {
  try {
    if (isConnected) {
      return client
    }

    console.log('🔄 Connecting to MongoDB...')
    const startTime = Date.now()

    await client.connect()
    await client.db('admin').command({ ping: 1 })

    const connectionTime = Date.now() - startTime
    console.log(`✅ MongoDB connected successfully in ${connectionTime}ms`)

    isConnected = true

    client.on('connectionPoolCreated', (event) => {
      console.log('📊 MongoDB connection pool created')
    })

    client.on('connectionCreated', (event) => {
      console.log('🔗 New MongoDB connection created')
    })

    client.on('connectionReady', (event) => {
      console.log('✅ MongoDB connection ready')
    })

    client.on('connectionClosed', (event) => {
      console.log('🔌 MongoDB connection closed')
    })

    client.on('connectionPoolCleared', (event) => {
      console.log('🧹 MongoDB connection pool cleared')
      isConnected = false
    })

    return client

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    isConnected = false
    process.exit(1)
  }
}

const gracefulShutdown = async () => {
  try {
    if (isConnected) {
      console.log('🔄 Closing MongoDB connections...')
      await client.close()
      isConnected = false
      console.log('✅ MongoDB connections closed successfully')
    }
  } catch (error) {
    console.error('❌ Error closing MongoDB connections:', error.message)
  }
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

module.exports = connectToDB
