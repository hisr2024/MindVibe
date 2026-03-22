/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@kiaanverse/api$': '<rootDir>/../api/src',
  },
  // Mock React Native modules that aren't available in test environment
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
};
