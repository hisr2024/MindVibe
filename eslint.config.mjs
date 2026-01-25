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
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Custom rules for all files
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Additional ignores
  {
    ignores: [
      'coverage/**',
      '*.config.js',
      '*.config.mjs',
      'vendor/**',
    ],
  },
]

export default eslintConfig
