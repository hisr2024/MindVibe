/**
 * Babel configuration for @kiaanverse/ui package tests.
 *
 * Uses metro-react-native-babel-preset (via react-native preset) for
 * transforming RN + JSX syntax in the Jest test environment.
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
