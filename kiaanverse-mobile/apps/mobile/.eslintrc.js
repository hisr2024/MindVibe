/**
 * ESLint configuration for the Kiaanverse Expo mobile app.
 * Extends the Expo preset and monorepo root config.
 */
module.exports = {
  extends: ['expo', '../../.eslintrc.js', 'prettier'],
  rules: {
    'import/order': 'off',
  },
};
