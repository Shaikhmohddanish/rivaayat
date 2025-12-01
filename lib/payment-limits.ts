export const RAZORPAY_ORDER_AMOUNT_HARD_LIMIT = 500000 // Razorpay platform cap per order (~INR 5 lakh)
export const DEFAULT_MAX_ONLINE_PAYMENT_AMOUNT = 100000

export function clampOnlinePaymentLimit(rawAmount?: number | null): number {
  const fallback = DEFAULT_MAX_ONLINE_PAYMENT_AMOUNT
  const parsed = typeof rawAmount === "number" ? rawAmount : Number(rawAmount)
  const safeValue = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  return Math.min(safeValue, RAZORPAY_ORDER_AMOUNT_HARD_LIMIT)
}
