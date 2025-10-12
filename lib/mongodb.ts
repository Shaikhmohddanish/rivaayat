import { MongoClient, type Db } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local")
}

const uri = process.env.MONGODB_URI
const options = {
  // Optimized options for serverless environments
  serverSelectionTimeoutMS: 5000, // 5 seconds
  connectTimeoutMS: 5000, // 5 seconds
  maxPoolSize: 10,
  minPoolSize: 0, // Better for serverless - no minimum connections
  maxIdleTimeMS: 10000, // Shorter idle time for serverless
  socketTimeoutMS: 10000, // Set timeout on socket operations
  compressors: "none", // Disable compression to avoid Snappy dependency issues
}

// Use caching for connection reuse between serverless function invocations
let cachedClient: MongoClient | null = null
let cachedPromise: Promise<MongoClient> | null = null

// For development environments, use global caching
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

export function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable to preserve the client across module reloads
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  } else {
    // In production, use module-scoped cache for potential connection reuse
    if (!cachedPromise) {
      cachedClient = new MongoClient(uri, options)
      cachedPromise = cachedClient.connect()
    }
    return cachedPromise
  }
}

// For backwards compatibility with existing code
const clientPromise = getMongoClient()
export default clientPromise

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient()
  return client.db("rivaayat")
}
