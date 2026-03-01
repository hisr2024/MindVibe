/**
 * Babel configuration for MindVibe Mobile.
 *
 * Configures module-resolver for @-prefixed path aliases and
 * enables Reanimated's Babel plugin for worklet compilation.
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@hooks': './src/hooks',
          '@services': './src/services',
          '@state': './src/state',
          '@theme': './src/theme',
          '@utils': './src/utils',
          '@config': './src/config',
          '@app-types': './src/types',
        },
      },
    ],
    'react-native-reanimated/plugin', // Must be listed last
  ],
};
