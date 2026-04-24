/**
 * Error Message Map — translates API error codes into user-friendly messages.
 *
 * Every message a user sees must come through this module. Raw error strings,
 * stack traces, and technical details must NEVER reach the UI.
 *
 * Message philosophy: Compassionate, actionable, and spiritually grounded.
 * The user is on a wellness journey — errors should guide, not frighten.
 *
 * Usage:
 *   import { getErrorMessage } from '../utils/errorMessages';
 *   const friendly = getErrorMessage(error);
 *   uiStore.addToast({ message: friendly, type: 'error' });
 */

import {
  isApiError,
  isAuthError,
  isOfflineError,
  isValidationError,
  type AuthErrorCode,
} from '@kiaanverse/api';

// ---------------------------------------------------------------------------
// Auth Error Code → Friendly Message
// ---------------------------------------------------------------------------

const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: 'The email or password is incorrect. Please try again.',
  EMAIL_NOT_VERIFIED:
    'Please verify your email before signing in. Check your inbox.',
  EMAIL_TAKEN: 'This email is already registered. Try signing in instead.',
  TOKEN_EXPIRED: 'Your session has ended — please sign in again.',
  NETWORK_ERROR:
    'Could not connect to the divine — please check your connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  ACCOUNT_LOCKED:
    'Your account has been temporarily locked. Please try again later.',
  UNKNOWN: 'Something unexpected happened. Sakha will be back soon.',
};

// ---------------------------------------------------------------------------
// HTTP Status → Friendly Message (fallback when no specific code is available)
// ---------------------------------------------------------------------------

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Something was not quite right with that request. Please try again.',
  401: 'Your session has ended — please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  408: 'The request took too long. Please check your connection.',
  409: 'That action has already been completed.',
  422: 'Please check your input and try again.',
  429: 'You are moving too quickly. Take a breath and try again in a moment.',
  500: 'Something unexpected happened. Sakha will be back soon.',
  502: 'Our servers are taking a moment to breathe. Please try again shortly.',
  503: 'Sakha is resting for maintenance. Please try again in a few minutes.',
  504: 'The connection timed out. Please try again.',
};

// ---------------------------------------------------------------------------
// Generic Fallback
// ---------------------------------------------------------------------------

const GENERIC_ERROR = 'Something unexpected happened. Sakha will be back soon.';
const OFFLINE_ERROR =
  'Could not connect to the divine — please check your connection.';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert any error into a user-friendly message.
 *
 * Priority:
 * 1. OfflineError → network-specific message
 * 2. AuthError → mapped from authCode
 * 3. ValidationError → generic validation message
 * 4. ApiError → mapped from HTTP status code
 * 5. Unknown → generic fallback
 *
 * NEVER returns raw error.message — always a curated string.
 */
export function getErrorMessage(error: unknown): string {
  if (isOfflineError(error)) {
    return OFFLINE_ERROR;
  }

  if (isAuthError(error)) {
    return AUTH_ERROR_MESSAGES[error.authCode] ?? GENERIC_ERROR;
  }

  if (isValidationError(error)) {
    // Collect per-field errors into a single message
    const fields = Object.keys(error.fieldErrors);
    if (fields.length === 1) {
      const fieldErrors = error.fieldErrors[fields[0]!];
      if (fieldErrors && fieldErrors.length > 0) {
        return fieldErrors[0]!;
      }
    }
    return 'Please check your input and try again.';
  }

  if (isApiError(error)) {
    return STATUS_MESSAGES[error.statusCode] ?? GENERIC_ERROR;
  }

  return GENERIC_ERROR;
}

/**
 * Determine the toast type (severity) for an error.
 *
 * Offline and auth errors get 'warning' (actionable by user).
 * Everything else gets 'error' (something broke).
 */
export function getErrorToastType(error: unknown): 'error' | 'warning' {
  if (isOfflineError(error)) return 'warning';
  if (isAuthError(error) && error.authCode === 'TOKEN_EXPIRED')
    return 'warning';
  return 'error';
}

/**
 * Check if an error is a session expiry that requires re-authentication.
 *
 * Callers can use this to trigger navigation to the login screen
 * instead of just showing a toast.
 */
export function isSessionExpired(error: unknown): boolean {
  return isAuthError(error) && error.authCode === 'TOKEN_EXPIRED';
}
