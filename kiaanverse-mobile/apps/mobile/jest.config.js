/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest-setup.ts'],
  moduleNameMapper: {
    '^@kiaanverse/api$': '<rootDir>/../../packages/api/src',
    '^@kiaanverse/store$': '<rootDir>/../../packages/store/src',
    '^@kiaanverse/ui$': '<rootDir>/../../packages/ui/src',
    '^@kiaanverse/i18n$': '<rootDir>/../../packages/i18n/src',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'react-native|' +
      '@react-native|' +
      'expo|' +
      '@expo|' +
      'expo-.*|' +
      '@react-native-async-storage/async-storage|' +
      '@react-native-community/netinfo|' +
      'react-native-reanimated|' +
      'react-native-gesture-handler|' +
      'react-native-screens|' +
      'react-native-safe-area-context|' +
      'react-native-svg|' +
      'lucide-react-native' +
    ')/)',
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
