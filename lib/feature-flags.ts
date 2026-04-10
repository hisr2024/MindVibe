/**
 * Payment method feature flags — toggle methods without code changes.
 *
 * Set environment variables to 'false' to disable a method instantly.
 * Default is enabled (true) when the variable is absent or any value
 * other than 'false'.
 *
 * Usage in Vercel / Fly.io:
 *   NEXT_PUBLIC_ENABLE_GOOGLE_PAY=false  → disables Google Pay
 *   (remove the variable or set to 'true' to re-enable)
 *
 * These are client-side flags only — server-side payment_method_types
 * are controlled in backend/services/stripe_service.py.
 */

export const PAYMENT_FLAGS = {
  googlePay: process.env.NEXT_PUBLIC_ENABLE_GOOGLE_PAY !== 'false',
  applePay: process.env.NEXT_PUBLIC_ENABLE_APPLE_PAY !== 'false',
  paypal: process.env.NEXT_PUBLIC_ENABLE_PAYPAL !== 'false',
  upi: process.env.NEXT_PUBLIC_ENABLE_UPI !== 'false',
  sepa: process.env.NEXT_PUBLIC_ENABLE_SEPA !== 'false',
} as const
