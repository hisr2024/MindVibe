/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/src/__tests__/setup.tsx'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    'lucide-react-native': '<rootDir>/src/__tests__/__mocks__/lucide.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'react-native|' +
      '@react-native|' +
      'react-native-reanimated|' +
      'react-native-gesture-handler|' +
      'react-native-safe-area-context|' +
      'react-native-svg|' +
      '@testing-library/react-native|' +
      'expo-haptics|' +
      'expo-av|' +
      'expo-speech' +
    ')/)',
  ],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
};
