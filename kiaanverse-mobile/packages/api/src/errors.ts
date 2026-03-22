/**
 * Structured error classes for Kiaanverse API.
 *
 * Standalone module with zero internal imports to prevent circular dependencies.
 * All error classes and type guards are exported for use across the API package.
 *
 * FastAPI error shape: { detail: string | object, code?: string, field?: string }
 */

// ---------------------------------------------------------------------------
// Auth Error Codes
// ---------------------------------------------------------------------------

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'EMAIL_TAKEN'
  | 'TOKEN_EXPIRED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'ACCOUNT_LOCKED'
  | 'UNKNOWN';

// ---------------------------------------------------------------------------
// ApiError — base class for all API errors
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly field: string | undefined;

  constructor(message: string, statusCode: number, code: string, field?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
  }
}

// ---------------------------------------------------------------------------
// AuthError — authentication and authorization failures
// ---------------------------------------------------------------------------

export class AuthError extends ApiError {
  readonly authCode: AuthErrorCode;

  constructor(message: string, statusCode: number, code: AuthErrorCode) {
    super(message, statusCode, code);
    this.name = 'AuthError';
    this.authCode = code;
  }
}

// ---------------------------------------------------------------------------
// OfflineError — device is offline or network request failed
// ---------------------------------------------------------------------------

export class OfflineError extends Error {
  constructor(message?: string) {
    super(message ?? 'No internet connection. Please check your network and try again.');
    this.name = 'OfflineError';
  }
}

// ---------------------------------------------------------------------------
// ValidationError — 422 responses with per-field errors
// ---------------------------------------------------------------------------

export class ValidationError extends ApiError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    fieldErrors: Record<string, string[]>,
  ) {
    super(message, statusCode, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isOfflineError(error: unknown): error is OfflineError {
  return error instanceof OfflineError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
