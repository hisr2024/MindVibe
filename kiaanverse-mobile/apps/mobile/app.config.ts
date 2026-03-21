/**
 * Kiaanverse — Expo App Configuration
 *
 * Dynamic config that reads environment variables at build time.
 * All secrets are injected via .env.local, never hardcoded.
 */

import { type ExpoConfig, type ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Kiaanverse',
  slug: 'kiaanverse',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'kiaanverse',
  userInterfaceStyle: 'automatic',

  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#050507',
  },

  ios: {
    bundleIdentifier: 'com.kiaanverse.app',
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription: 'Kiaanverse uses your camera for profile photos and sacred image capture.',
      NSMicrophoneUsageDescription: 'Kiaanverse uses your microphone for voice interactions with Sakha.',
      NSFaceIDUsageDescription: 'Kiaanverse uses biometric authentication to protect your spiritual data.',
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },

  android: {
    package: 'com.kiaanverse.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#050507',
    },
    permissions: [
      'CAMERA',
      'RECORD_AUDIO',
      'NOTIFICATIONS',
      'VIBRATE',
      'INTERNET',
      'USE_BIOMETRIC',
    ],
  },

  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },

  plugins: [
    'expo-router',
    [
      'expo-font',
      {
        fonts: ['./assets/fonts/CrimsonText-Regular.ttf'],
      },
    ],
    'expo-splash-screen',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#d4a44c',
      },
    ],
    [
      'expo-av',
      {
        microphonePermission: 'Kiaanverse needs microphone access for voice features.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Kiaanverse needs camera access for profile photos.',
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Kiaanverse uses Face ID to protect your spiritual data.',
      },
    ],
    'expo-secure-store',
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:8000',
    sentryDsn: process.env.SENTRY_DSN ?? '',
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '',
    },
  },
});
