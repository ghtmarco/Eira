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

// Promise singleton — concurrent callers share the same connection attempt
let connectionPromise = null

async function connectToDB() {
  if (!connectionPromise) {
    connectionPromise = (async () => {
      console.log('🔄 Connecting to MongoDB...')
      const startTime = Date.now()
      await client.connect()
      await client.db('admin').command({ ping: 1 })
      console.log(`✅ MongoDB connected successfully in ${Date.now() - startTime}ms`)

      // Reset so a reconnect is attempted after pool is cleared
      client.on('connectionPoolCleared', () => {
        console.log('🧹 MongoDB connection pool cleared')
        connectionPromise = null
      })
    })().catch((err) => {
      connectionPromise = null
      throw err
    })
  }

  await connectionPromise
  return client
}

const gracefulShutdown = async () => {
  try {
    console.log('🔄 Closing MongoDB connections...')
    await client.close()
    connectionPromise = null
    console.log('✅ MongoDB connections closed successfully')
  } catch (error) {
    console.error('❌ Error closing MongoDB connections:', error.message)
  }
}

module.exports = connectToDB
module.exports.gracefulShutdown = gracefulShutdown
