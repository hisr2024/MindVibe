/**
 * Tests for errorTracking — verifies the Sentry facade logs in __DEV__
 * and delegates to Sentry when available.
 */

// Mock Sentry before importing the module under test
const mockInit = jest.fn();
const mockCaptureException = jest.fn();
const mockCaptureMessage = jest.fn();
const mockSetUser = jest.fn();
const mockAddBreadcrumb = jest.fn();
const mockWithScope = jest.fn((cb: (scope: unknown) => void) => {
  cb({
    setTag: jest.fn(),
    setExtra: jest.fn(),
    setLevel: jest.fn(),
  });
});

jest.mock('@sentry/react-native', () => ({
  init: mockInit,
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
  setUser: mockSetUser,
  addBreadcrumb: mockAddBreadcrumb,
  withScope: mockWithScope,
}));

import {
  initErrorTracking,
  captureError,
  captureMessage,
  setUserContext,
  clearUserContext,
  breadcrumb,
} from '../services/errorTracking';

// Suppress console output during tests
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// initErrorTracking
// ---------------------------------------------------------------------------

describe('initErrorTracking', () => {
  it('does not throw when called (Sentry available, no DSN)', () => {
    // In jest-expo, EXPO_PUBLIC_* env vars are inlined at build time,
    // so runtime assignment has no effect. We verify init is safe to call.
    expect(() => initErrorTracking()).not.toThrow();
  });

  it('warns or no-ops when DSN is not configured', () => {
    initErrorTracking();

    // Either warns in __DEV__ or silently returns — both are valid
    // The important thing is no crash
    expect(mockInit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// captureError
// ---------------------------------------------------------------------------

describe('captureError', () => {
  it('logs to console.error in __DEV__', () => {
    const error = new Error('test error');
    captureError(error);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('captureError'),
      error,
      undefined,
    );
  });

  it('calls Sentry.captureException for error without context', () => {
    const error = new Error('test');
    captureError(error);

    expect(mockCaptureException).toHaveBeenCalledWith(error);
  });

  it('calls Sentry.withScope when context is provided', () => {
    const error = new Error('with context');
    const ctx = { screen: 'Home', journeyId: '123' };

    captureError(error, ctx);

    expect(mockWithScope).toHaveBeenCalledWith(expect.any(Function));
    expect(mockCaptureException).toHaveBeenCalledWith(error);
  });
});

// ---------------------------------------------------------------------------
// captureMessage
// ---------------------------------------------------------------------------

describe('captureMessage', () => {
  it('logs to console.log in __DEV__', () => {
    captureMessage('degraded service', 'warning');

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[warning]'),
      'degraded service',
    );
  });

  it('calls Sentry.captureMessage', () => {
    captureMessage('test message', 'info');

    expect(mockCaptureMessage).toHaveBeenCalledWith('test message', 'info');
  });

  it('defaults to info level', () => {
    captureMessage('default level');

    expect(mockCaptureMessage).toHaveBeenCalledWith('default level', 'info');
  });
});

// ---------------------------------------------------------------------------
// setUserContext / clearUserContext
// ---------------------------------------------------------------------------

describe('setUserContext', () => {
  it('sets user with id and email only', () => {
    const user = {
      id: 'u-123',
      email: 'test@kiaanverse.com',
      name: 'Test User',
      avatar_url: null,
      subscription_tier: 'free' as const,
      is_verified: true,
      created_at: '2024-01-01',
      streak_days: 0,
      karma_points: 0,
      onboarding_completed: true,
    };

    setUserContext(user);

    expect(mockSetUser).toHaveBeenCalledWith({
      id: 'u-123',
      email: 'test@kiaanverse.com',
    });
  });
});

describe('clearUserContext', () => {
  it('sets user to null', () => {
    clearUserContext();
    expect(mockSetUser).toHaveBeenCalledWith(null);
  });
});

// ---------------------------------------------------------------------------
// breadcrumb
// ---------------------------------------------------------------------------

describe('breadcrumb', () => {
  it('calls Sentry.addBreadcrumb with message and data', () => {
    breadcrumb('navigated to journey', { journeyId: 'j-456' });

    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'navigated to journey',
        data: { journeyId: 'j-456' },
        level: 'info',
      }),
    );
  });

  it('works without data', () => {
    breadcrumb('app foregrounded');

    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'app foregrounded',
        level: 'info',
      }),
    );
  });
});
