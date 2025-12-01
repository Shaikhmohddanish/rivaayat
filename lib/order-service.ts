import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb-safe"
import type { CartItem, PaymentInfo, SiteSettings } from "@/lib/types"

const DEFAULT_SHIPPING_THRESHOLD = 1500
const DEFAULT_SHIPPING_FEE = 200
const SITE_SETTINGS_COLLECTION = "site_settings"
const SITE_SETTINGS_ID = "default"

export class OrderValidationError extends Error {
  status: number
  details?: string[]

  constructor(message: string, status = 400, details?: string[]) {
    super(message)
    this.status = status
    this.details = details
  }
}

interface CouponInput {
  code: string
  discountPercent: number
  minOrderValue?: number
}

interface PreparedOrderData {
  subtotal: number
  discountAmount: number
  shipping: number
  total: number
  validatedCoupon: CouponInput | null
  bulkOps: any[]
  db: NonNullable<Awaited<ReturnType<typeof getDatabase>>>
}

type CartItemWithVariant = CartItem & { variant: { color: string; size: string } }

async function getShippingSettings(db: NonNullable<Awaited<ReturnType<typeof getDatabase>>>) {
  const settings = await db
    .collection<SiteSettings>(SITE_SETTINGS_COLLECTION)
    .findOne({ _id: SITE_SETTINGS_ID }, { projection: { freeShippingThreshold: 1, flatShippingFee: 1 } })

  return {
    freeShippingThreshold: settings?.freeShippingThreshold ?? DEFAULT_SHIPPING_THRESHOLD,
    flatShippingFee: settings?.flatShippingFee ?? DEFAULT_SHIPPING_FEE,
  }
}

function validateItemsStructure(items: CartItem[]): asserts items is CartItemWithVariant[] {
  if (!items || items.length === 0) {
    throw new OrderValidationError("Cart is empty")
  }

  for (const item of items) {
    if (
      !item.productId ||
      !item.name ||
      typeof item.price !== "number" ||
      !item.quantity ||
      !item.variant?.color ||
      !item.variant?.size
    ) {
      throw new OrderValidationError("Invalid item structure")
    }
  }
}

async function validateCoupon(db: NonNullable<Awaited<ReturnType<typeof getDatabase>>>, coupon: CouponInput | null, subtotal: number) {
  if (!coupon?.code) {
    return null
  }

  const couponDoc = await db.collection("coupons").findOne({ code: coupon.code, isActive: true })

  if (!couponDoc) {
    throw new OrderValidationError("Invalid or expired coupon")
  }

  if (couponDoc.minOrderValue && subtotal < couponDoc.minOrderValue) {
    throw new OrderValidationError(`This coupon requires a minimum order of ₹${couponDoc.minOrderValue}`)
  }

  return {
    code: couponDoc.code,
    discountPercent: couponDoc.discountPercent,
    minOrderValue: couponDoc.minOrderValue,
  }
}

export async function prepareOrderPricing(items: CartItem[], coupon: CouponInput | null): Promise<PreparedOrderData> {
  validateItemsStructure(items)

  const db = await getDatabase()
  if (!db) {
    throw new OrderValidationError("Database connection error", 500)
  }

  const shippingSettings = await getShippingSettings(db)

  const productIds = items.map((item) => new ObjectId(item.productId))
  const products = await db.collection("products").find({ _id: { $in: productIds } }).toArray()
  const productMap = new Map(products.map((product) => [product._id.toString(), product]))

  const insufficientStock: string[] = []
  const bulkOps: any[] = []
  let subtotal = 0

  for (const item of items) {
    const product = productMap.get(item.productId)

    if (!product) {
      throw new OrderValidationError(`Product "${item.name}" not found`)
    }

    const variant = product.variations?.variants?.find(
      (v: any) => v.color === item.variant?.color && v.size === item.variant?.size
    )

    if (!variant) {
      throw new OrderValidationError(
        `Variant ${item.variant?.color}/${item.variant?.size} not found for "${item.name}"`
      )
    }

    if (variant.stock < item.quantity) {
      insufficientStock.push(
        `${item.name} (${item.variant.color}/${item.variant.size}): Only ${variant.stock} available, but ${item.quantity} requested`
      )
    } else {
      bulkOps.push({
        updateOne: {
          filter: {
            _id: new ObjectId(item.productId),
            "variations.variants": {
              $elemMatch: {
                color: item.variant.color,
                size: item.variant.size,
              },
            },
          },
          update: {
            $inc: {
              "variations.variants.$.stock": -item.quantity,
            },
          },
        },
      })
    }

    subtotal += item.price * item.quantity
  }

  if (insufficientStock.length > 0) {
    throw new OrderValidationError("Insufficient stock", 400, insufficientStock)
  }

  const validatedCoupon = await validateCoupon(db, coupon, subtotal)
  const discountAmount = validatedCoupon ? (subtotal * validatedCoupon.discountPercent) / 100 : 0
  const discountedSubtotal = subtotal - discountAmount
  const shipping = discountedSubtotal > shippingSettings.freeShippingThreshold ? 0 : shippingSettings.flatShippingFee
  const total = discountedSubtotal + shipping

  return {
    subtotal,
    discountAmount,
    shipping,
    total,
    validatedCoupon,
    bulkOps,
    db,
  }
}

interface FinalizeOrderParams {
  userId: string
  items: CartItem[]
  shippingAddress: any
  coupon: CouponInput | null
  bulkOps: any[]
  db: NonNullable<Awaited<ReturnType<typeof getDatabase>>>
  payment?: PaymentInfo
}

export async function finalizeOrder({
  userId,
  items,
  shippingAddress,
  coupon,
  bulkOps,
  db,
  payment,
}: FinalizeOrderParams) {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  const randomPart = Math.floor(1000 + Math.random() * 9000)
  const trackingNumber = `RIV-${dateStr}-${randomPart}`

  const orderData = {
    userId,
    items,
    status: "placed" as const,
    trackingNumber,
    shippingAddress,
    ...(coupon ? { coupon } : {}),
    ...(payment ? { payment } : {}),
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection("orders").insertOne(orderData)

  if (!result.acknowledged) {
    throw new OrderValidationError("Failed to create order", 500)
  }

  const orderId = result.insertedId.toString()
  const initialTrackingEvent = {
    status: "placed" as const,
    timestamp: now,
    message: "Your order has been placed and is being prepared.",
  }

  await db.collection("order_tracking").insertOne({
    orderId,
    trackingNumber,
    userId,
    events: [initialTrackingEvent],
    currentStatus: "placed" as const,
    createdAt: now,
    updatedAt: now,
  })

  if (bulkOps.length > 0) {
    await db.collection("products").bulkWrite(bulkOps)
  }

  await db.collection("carts").deleteOne({ userId })

  return {
    orderId,
    trackingNumber,
    order: {
      _id: orderId,
      ...orderData,
    },
  }
}
