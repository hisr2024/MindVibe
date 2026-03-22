/**
 * Tests for errorMessages — verifies every API error code maps to a
 * user-friendly message and that raw errors never leak through.
 */

import { ApiError, AuthError, OfflineError, ValidationError } from '@kiaanverse/api';
import { getErrorMessage, getErrorToastType, isSessionExpired } from '../utils/errorMessages';

// ---------------------------------------------------------------------------
// getErrorMessage
// ---------------------------------------------------------------------------

describe('getErrorMessage', () => {
  it('returns network message for OfflineError', () => {
    const error = new OfflineError();
    expect(getErrorMessage(error)).toBe(
      'Could not connect to the divine — please check your connection.',
    );
  });

  it('returns session message for TOKEN_EXPIRED', () => {
    const error = new AuthError('expired', 401, 'TOKEN_EXPIRED');
    expect(getErrorMessage(error)).toBe(
      'Your session has ended — please sign in again.',
    );
  });

  it('returns credentials message for INVALID_CREDENTIALS', () => {
    const error = new AuthError('bad creds', 401, 'INVALID_CREDENTIALS');
    expect(getErrorMessage(error)).toBe(
      'The email or password is incorrect. Please try again.',
    );
  });

  it('returns locked message for ACCOUNT_LOCKED', () => {
    const error = new AuthError('locked', 403, 'ACCOUNT_LOCKED');
    expect(getErrorMessage(error)).toBe(
      'Your account has been temporarily locked. Please try again later.',
    );
  });

  it('returns email taken message for EMAIL_TAKEN', () => {
    const error = new AuthError('taken', 409, 'EMAIL_TAKEN');
    expect(getErrorMessage(error)).toBe(
      'This email is already registered. Try signing in instead.',
    );
  });

  it('returns verify message for EMAIL_NOT_VERIFIED', () => {
    const error = new AuthError('unverified', 403, 'EMAIL_NOT_VERIFIED');
    expect(getErrorMessage(error)).toBe(
      'Please verify your email before signing in. Check your inbox.',
    );
  });

  it('returns generic for UNKNOWN auth code', () => {
    const error = new AuthError('unknown', 500, 'UNKNOWN');
    expect(getErrorMessage(error)).toBe(
      'Something unexpected happened. Sakha will be back soon.',
    );
  });

  it('returns first field error for single-field ValidationError', () => {
    const error = new ValidationError('invalid', 422, {
      email: ['Email is required'],
    });
    expect(getErrorMessage(error)).toBe('Email is required');
  });

  it('returns generic message for multi-field ValidationError', () => {
    const error = new ValidationError('invalid', 422, {
      email: ['Invalid email'],
      password: ['Too short'],
    });
    expect(getErrorMessage(error)).toBe('Please check your input and try again.');
  });

  it('returns server error for ApiError 500', () => {
    const error = new ApiError('oops', 500, 'SERVER_ERROR');
    expect(getErrorMessage(error)).toBe(
      'Something unexpected happened. Sakha will be back soon.',
    );
  });

  it('returns rate limit message for ApiError 429', () => {
    const error = new ApiError('slow down', 429, 'RATE_LIMIT');
    expect(getErrorMessage(error)).toBe(
      'You are moving too quickly. Take a breath and try again in a moment.',
    );
  });

  it('returns not found for ApiError 404', () => {
    const error = new ApiError('missing', 404, 'NOT_FOUND');
    expect(getErrorMessage(error)).toBe(
      'We could not find what you were looking for.',
    );
  });

  it('returns generic fallback for unknown ApiError status', () => {
    const error = new ApiError('weird', 418, 'TEAPOT');
    expect(getErrorMessage(error)).toBe(
      'Something unexpected happened. Sakha will be back soon.',
    );
  });

  it('returns generic fallback for plain Error', () => {
    expect(getErrorMessage(new Error('kaboom'))).toBe(
      'Something unexpected happened. Sakha will be back soon.',
    );
  });

  it('returns generic fallback for non-error values', () => {
    expect(getErrorMessage('string error')).toBe(
      'Something unexpected happened. Sakha will be back soon.',
    );
    expect(getErrorMessage(null)).toBe(
      'Something unexpected happened. Sakha will be back soon.',
    );
  });
});

// ---------------------------------------------------------------------------
// getErrorToastType
// ---------------------------------------------------------------------------

describe('getErrorToastType', () => {
  it('returns warning for OfflineError', () => {
    expect(getErrorToastType(new OfflineError())).toBe('warning');
  });

  it('returns warning for TOKEN_EXPIRED', () => {
    expect(getErrorToastType(new AuthError('expired', 401, 'TOKEN_EXPIRED'))).toBe('warning');
  });

  it('returns error for other AuthErrors', () => {
    expect(getErrorToastType(new AuthError('bad', 401, 'INVALID_CREDENTIALS'))).toBe('error');
  });

  it('returns error for ApiError', () => {
    expect(getErrorToastType(new ApiError('oops', 500, 'SERVER'))).toBe('error');
  });

  it('returns error for plain Error', () => {
    expect(getErrorToastType(new Error('boom'))).toBe('error');
  });
});

// ---------------------------------------------------------------------------
// isSessionExpired
// ---------------------------------------------------------------------------

describe('isSessionExpired', () => {
  it('returns true for TOKEN_EXPIRED AuthError', () => {
    expect(isSessionExpired(new AuthError('expired', 401, 'TOKEN_EXPIRED'))).toBe(true);
  });

  it('returns false for other AuthErrors', () => {
    expect(isSessionExpired(new AuthError('bad', 401, 'INVALID_CREDENTIALS'))).toBe(false);
  });

  it('returns false for non-auth errors', () => {
    expect(isSessionExpired(new ApiError('oops', 500, 'SERVER'))).toBe(false);
    expect(isSessionExpired(new Error('boom'))).toBe(false);
    expect(isSessionExpired(null)).toBe(false);
  });
});
