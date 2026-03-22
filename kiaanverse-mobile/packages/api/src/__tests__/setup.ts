/**
 * Jest Setup — API Package
 *
 * Mocks the axios-based API client so authService tests run without
 * a real HTTP server. Each test controls mock responses via jest.Mock.
 */

// Define __DEV__ global (used by client.ts)
(globalThis as Record<string, unknown>).__DEV__ = false;

// Mock the internal apiClient module — all HTTP calls go through this
jest.mock('../client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
  setTokenManager: jest.fn(),
}));
