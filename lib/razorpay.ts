/**
 * Razorpay Checkout SDK utilities for UPI payments.
 *
 * Loads the Razorpay checkout.js script dynamically from Razorpay's CDN
 * only when a user selects UPI as their payment method. This keeps the
 * default bundle size unchanged for users who pay via card or PayPal.
 */

export interface RazorpayCheckoutOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: {
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: {
    color?: string
  }
  handler: (response: RazorpayPaymentResponse) => void
  modal?: {
    ondismiss?: () => void
  }
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => { open: () => void }
  }
}

/**
 * Load the Razorpay checkout.js script dynamically.
 *
 * Razorpay does not provide an npm package for the checkout SDK.
 * The script is loaded from Razorpay's CDN only when needed (UPI checkout).
 * Subsequent calls return immediately if already loaded.
 *
 * @returns Promise<boolean> - true if script loaded successfully
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    // Already loaded
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout script')
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

/**
 * Open the Razorpay checkout modal with the given options.
 *
 * Must be called after loadRazorpayScript() resolves to true.
 * The modal handles UPI QR code display, payment flow, and callbacks.
 *
 * @param options - Razorpay checkout configuration
 */
export function openRazorpayCheckout(options: RazorpayCheckoutOptions): void {
  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not loaded. Call loadRazorpayScript() first.')
  }
  const rzp = new window.Razorpay(options)
  rzp.open()
}
