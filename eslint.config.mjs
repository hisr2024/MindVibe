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
      'scripts/**',
      'mobile/react-native/**',
      'native/**',
    ],
  },
]

export default eslintConfig
