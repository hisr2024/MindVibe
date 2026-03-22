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
    '^@kiaan/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|lucide-react-native|@tanstack/.*|zustand|zod|axios)',
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
