/**
 * Jest configuration for the Kiaanverse Expo mobile app.
 * Uses jest-expo preset for React Native + Expo compatibility.
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
    '^@kiaanverse/(.*)$': '<rootDir>/../../packages/$1/src',
    // Skia is ESM-only in its published build and pulls in native Metro shims.
    // Tests don't render the celestial background, so stub it out entirely.
    '^@shopify/react-native-skia$': '<rootDir>/__mocks__/skia.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|lucide-react-native|@tanstack/.*|zustand|immer|zod|axios|@shopify/react-native-skia)',
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
};
