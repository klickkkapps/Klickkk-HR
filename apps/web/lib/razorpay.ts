import Razorpay from 'razorpay'
import crypto from 'crypto'

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export const PLAN_PRICES = {
  STARTER: {
    amount: 99900, // ₹999 in paise
    employeeLimit: 25,
    razorpayPlanId: process.env.RAZORPAY_PLAN_STARTER!,
  },
  GROWTH: {
    amount: 199900, // ₹1,999 in paise
    employeeLimit: 75,
    razorpayPlanId: process.env.RAZORPAY_PLAN_GROWTH!,
  },
  ENTERPRISE: {
    amount: 0,
    employeeLimit: 999999,
    razorpayPlanId: null,
  },
} as const

export const EXTRA_SLOT_PRICE_PAISE = 4900 // ₹49

export type PlanKey = keyof typeof PLAN_PRICES

/** Verify Razorpay payment signature for one-time Orders */
export function verifyPaymentSignature(params: {
  orderId: string
  paymentId: string
  signature: string
}): boolean {
  const body = `${params.orderId}|${params.paymentId}`
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')
  return expected === params.signature
}

/** Verify Razorpay subscription payment signature */
export function verifySubscriptionSignature(params: {
  subscriptionId: string
  paymentId: string
  signature: string
}): boolean {
  const body = `${params.paymentId}|${params.subscriptionId}`
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')
  return expected === params.signature
}

/** Verify Razorpay webhook signature */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  return expected === signature
}
