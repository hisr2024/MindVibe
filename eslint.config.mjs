import nextConfig from 'eslint-config-next'
import eslintConfigPrettier from 'eslint-config-prettier'

const eslintConfig = [
  // Next.js base config (includes React, TypeScript, a11y)
  ...nextConfig,

  // Prettier config to disable conflicting rules
  eslintConfigPrettier,

  // Custom rules for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Custom rules for all files
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      // Downgrade setState-in-effect to warning: most instances are legitimate
      // patterns (localStorage hydration, route change responses, etc.)
      'react-hooks/set-state-in-effect': 'warn',
      // eslint-plugin-react-hooks v7 bundles the react-compiler analysis
      // rules (purity, refs, immutability, etc.). These flag patterns that
      // are VALID at runtime but that the compiler can't auto-memoize, e.g.
      // accessing .current on a ref during render to size an SVG, or
      // reading Date.now() for an animation clock. Downgrading to warnings
      // keeps the feedback signal without breaking CI on pre-existing code
      // that uses these intentional patterns.
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/no-deriving-state-in-effects': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/error-boundaries': 'warn',
      // App Router uses layout.tsx <head> for fonts, not pages/_document.js
      '@next/next/no-page-custom-font': 'off',
    },
  },

  // Relaxed rules for test files
  {
    files: ['tests/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@next/next/no-assign-module-variable': 'off',
      'react/display-name': 'off',
    },
  },

  // Additional ignores
  {
    ignores: [
      'coverage/**',
      'htmlcov/**',
      '*.config.js',
      '*.config.mjs',
      'vendor/**',
      'public/vad/**',
      'scripts/**',
      'mobile/react-native/**',
      'native/**',
      // kiaanverse-mobile is a separate React Native workspace with its own
      // pnpm-workspace.yaml, its own ESLint configs, and its own CI job
      // (.github/workflows/mobile-pr-check.yml). Linting it from the main
      // web-app config triggers react-compiler immutability false-positives
      // on reanimated shared values and duplicates the mobile CI's work.
      'kiaanverse-mobile/**',
    ],
  },
]

export default eslintConfig
