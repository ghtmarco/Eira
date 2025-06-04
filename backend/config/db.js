const { MongoClient, ServerApiVersion } = require('mongodb')
const dotenv = require('dotenv')
dotenv.config()

const uri = process.env.MONGO_URI

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})

async function connectToDB() {
  try {
    await client.connect()
    await client.db("admin").command({ ping: 1 })
    return client
  } catch (error) {
    process.exit(1)
  }
}

module.exports = connectToDB
