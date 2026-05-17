/**
 * Plain ts-jest config — no React Native shim. The package is tested
 * with the JS-only adapters so we can run the suite without a
 * device or Metro bundler.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        // The workspace tsconfig sets `noUncheckedIndexedAccess` +
        // `exactOptionalPropertyTypes` which clash with @testing-library
        // type imports under the default ts-jest resolution. Use a
        // jest-specific override that softens both for the test run.
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'Node',
          esModuleInterop: true,
          jsx: 'react-jsx',
          allowSyntheticDefaultImports: true,
          isolatedModules: true,
          strict: true,
          noImplicitAny: true,
          target: 'ES2022',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          ignoreDeprecations: '6.0',
        },
      },
    ],
  },
};
