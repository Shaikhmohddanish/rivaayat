import { MongoClient, type Db } from "mongodb"

let isMongoAvailable = false
let connectionError: string | null = null

// Make MongoDB connection optional for development
const mongoUri = process.env.MONGODB_URI
const useMongoDb = process.env.USE_MONGODB !== 'false'

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true,
}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

if (mongoUri && useMongoDb) {
  try {
    if (process.env.NODE_ENV === "development") {
      // In development mode, use a global variable to preserve the client across module reloads
      if (!(global as any)._mongoClientPromise) {
        client = new MongoClient(mongoUri, options)
        ;(global as any)._mongoClientPromise = client.connect()
      }
      clientPromise = (global as any)._mongoClientPromise
    } else {
      // In production mode, create a new client
      client = new MongoClient(mongoUri, options)
      clientPromise = client.connect()
    }
  } catch (error) {
    console.warn('MongoDB client initialization failed:', error)
    connectionError = error instanceof Error ? error.message : 'Unknown error'
  }
} else {
  console.log('MongoDB disabled via environment configuration or missing URI')
}

export default clientPromise

export async function getDatabase(): Promise<Db | null> {
  if (!clientPromise) {
    console.warn('MongoDB not configured or connection failed')
    return null
  }

  try {
    const client = await clientPromise
    isMongoAvailable = true
    return client.db("rivaayat")
  } catch (error) {
    console.warn('MongoDB connection failed:', error)
    isMongoAvailable = false
    connectionError = error instanceof Error ? error.message : 'Unknown error'
    return null
  }
}

export function isMongoDBAvailable(): boolean {
  return isMongoAvailable
}

export function getConnectionError(): string | null {
  return connectionError
}