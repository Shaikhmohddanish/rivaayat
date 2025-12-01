import Razorpay from "razorpay"

let razorpayClient: Razorpay | null = null

export function getRazorpayClient() {
  if (razorpayClient) {
    return razorpayClient
  }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.")
  }

  razorpayClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })

  return razorpayClient
}
