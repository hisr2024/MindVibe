/**
 * Comprehensive Stripe error message translations.
 *
 * Maps Stripe error codes to user-friendly, compassionate messages
 * appropriate for a spiritual wellness platform. Messages guide the
 * user toward resolution rather than blaming or frightening them.
 */

const STRIPE_ERROR_MAP: Record<string, string> = {
  // Card declined variants
  card_declined: 'Your card was declined. Please try a different payment method.',
  card_declined_insufficient_funds: 'Insufficient funds. Please use a different card.',
  generic_decline: 'Your payment was declined. Please try a different payment method or contact your bank.',

  // Card validation
  expired_card: 'Your card has expired. Please use a current card.',
  incorrect_cvc: 'The security code is incorrect. Please check and try again.',
  incorrect_number: 'The card number is incorrect. Please check and try again.',
  invalid_expiry_month: 'The expiration month is invalid.',
  invalid_expiry_year: 'The expiration year is invalid.',
  card_not_supported: 'This card type is not supported. Please try a different card.',

  // Processing
  processing_error: 'A processing error occurred. Your card has not been charged. Please try again.',
  currency_not_supported: 'This currency is not supported for your selected payment method.',
  duplicate_transaction: 'This appears to be a duplicate transaction. Please wait a moment and try again.',

  // Authentication (3DS / SCA)
  authentication_required: 'Your bank requires additional verification. Please check your banking app.',
  payment_intent_authentication_failure: 'Authentication was not completed. Please try again.',

  // UPI specific
  upi_transaction_declined: 'UPI payment declined. Please try another UPI app or card.',

  // Setup / subscription
  setup_intent_unexpected_state: 'Payment setup failed. Please refresh the page and try again.',
  payment_method_not_available: 'This payment method is not available. Please use a different method.',

  // Network / connectivity
  network_error: 'Connection error. Your card has not been charged. Please check your connection and try again.',
}

/**
 * Translate a Stripe error code to a user-friendly message.
 */
export function translateStripeError(code?: string): string {
  return (
    STRIPE_ERROR_MAP[code ?? ''] ??
    'Payment could not be completed. Please try again or use a different method.'
  )
}
