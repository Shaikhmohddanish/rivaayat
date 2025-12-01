import { getDatabase } from "@/lib/mongodb-safe"
import type { PaymentRecord } from "@/lib/types"
import { OrderValidationError } from "@/lib/order-service"

const COLLECTION = "payments"

export type PaymentRecordInput = Omit<PaymentRecord, "_id" | "createdAt" | "updatedAt">

export async function createPaymentRecord(record: PaymentRecordInput) {
  const db = await getDatabase()
  if (!db) {
    throw new OrderValidationError("Database connection error", 500)
  }

  const now = new Date()
  const doc: PaymentRecord = {
    ...record,
    createdAt: now,
    updatedAt: now,
  }

  await db.collection<PaymentRecord>(COLLECTION).insertOne(doc)
  return doc
}
