/**
 * PayPal JS SDK utilities for direct PayPal payments.
 *
 * Used for INR payments where Stripe's PayPal integration is unavailable.
 * The PayPal checkout flow redirects the user to PayPal for approval,
 * then back to our success page where we capture the payment.
 *
 * Flow:
 * 1. Backend creates PayPal order → returns approve_url
 * 2. Frontend redirects user to approve_url (PayPal checkout)
 * 3. User approves on PayPal → redirected to success page with token
 * 4. Frontend calls /capture-paypal-payment with the order ID
 * 5. Backend captures payment and activates subscription
 */

/**
 * Redirect the user to PayPal for payment approval.
 *
 * Unlike Razorpay (which uses an in-page modal), PayPal uses a full
 * page redirect to their checkout experience. After approval, the user
 * is redirected back to our return_url with token and PayerID params.
 *
 * @param approveUrl - The PayPal approval URL from the backend
 */
export function redirectToPayPal(approveUrl: string): void {
  if (typeof window === 'undefined') {
    throw new Error('Cannot redirect to PayPal in server context')
  }
  window.location.href = approveUrl
}

/**
 * Extract PayPal order token from URL query parameters.
 *
 * After PayPal approval, the user is redirected back with:
 * ?token=ORDER_ID&PayerID=PAYER_ID
 *
 * @returns The PayPal order ID (token) or null if not present
 */
export function getPayPalTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('token')
}

/**
 * Capture a PayPal payment after buyer approval.
 *
 * Called on the success page when provider=paypal is detected.
 * Makes a POST to the backend capture endpoint which finalizes
 * the payment with PayPal and activates the subscription.
 *
 * @param orderIdOrToken - The PayPal order ID (from URL token param or checkout response)
 * @param apiFetch - The authenticated fetch function
 * @returns Capture result from the backend
 */
export async function capturePayPalPayment(
  orderIdOrToken: string,
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>,
): Promise<{ success: boolean; message: string; order_id?: string }> {
  const response = await apiFetch('/api/subscriptions/capture-paypal-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paypal_order_id: orderIdOrToken }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const detail = error.detail
    const message =
      typeof detail === 'object' && detail?.message
        ? detail.message
        : typeof detail === 'string'
          ? detail
          : 'PayPal payment capture failed. Please contact support.'
    return { success: false, message }
  }

  return response.json()
}
