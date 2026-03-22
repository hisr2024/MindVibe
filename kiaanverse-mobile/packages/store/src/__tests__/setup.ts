/**
 * Jest Setup — Mock React Native and Expo modules.
 *
 * These mocks allow store tests to run in a Node environment
 * without actual native module dependencies.
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
        return Promise.resolve();
      }),
    },
  };
});

// Mock expo-secure-store
jest.mock('expo-secure-store', () => {
  const secureStore: Record<string, string> = {};
  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(secureStore[key] ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      secureStore[key] = value;
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      delete secureStore[key];
      return Promise.resolve();
    }),
  };
});

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock react-native AppState
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    currentState: 'active',
  },
}));

// Mock @kiaanverse/api
jest.mock('@kiaanverse/api', () => ({
  setTokenManager: jest.fn(),
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshTokens: jest.fn(),
    mapLoginResponseToUser: jest.fn(),
  },
  AuthError: class AuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthError';
    }
  },
}));
