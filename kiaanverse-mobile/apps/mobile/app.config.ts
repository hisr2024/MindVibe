/**
 * Kiaanverse — Expo App Configuration
 *
 * Dynamic config that reads environment variables at build time.
 * All secrets are injected via .env.local, never hardcoded.
 *
 * Native permissions configured per-platform:
 *
 * Android permissions:
 *   INTERNET         — API calls, push token registration, verse fetching
 *   VIBRATE          — Haptic feedback on interactions, notification vibration
 *   RECORD_AUDIO     — Voice input for Sakha AI companion conversations
 *   CAMERA           — Profile photos and sacred image capture
 *   USE_BIOMETRIC    — Fingerprint / face unlock for secure login
 *   USE_FINGERPRINT  — Legacy fingerprint API (pre-Android 9 devices)
 *   RECEIVE_BOOT_COMPLETED — Re-register background tasks after device reboot
 *   POST_NOTIFICATIONS — Required for Android 13+ (API 33) to show notifications
 *
 * iOS permissions (infoPlist):
 *   NSMicrophoneUsageDescription — Voice input for Sakha conversations
 *   NSFaceIDUsageDescription     — Biometric login with Face ID
 *   NSCameraUsageDescription     — Camera access for future profile features
 *   UIBackgroundModes            — Background fetch + remote notifications
 *
 * Deep linking:
 *   scheme: kiaanverse — handles kiaanverse:// URLs
 *   Android intentFilters — Universal deep link support
 *   iOS associatedDomains — App Links for verified domains
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

  // ---------------------------------------------------------------------------
  // iOS Configuration
  // ---------------------------------------------------------------------------
  ios: {
    bundleIdentifier: 'com.kiaanverse.app',
    supportsTablet: true,
    infoPlist: {
      // Microphone — Sakha voice conversations
      NSMicrophoneUsageDescription:
        'Sakha uses your microphone for voice conversations.',
      // Face ID — Biometric authentication
      NSFaceIDUsageDescription:
        'Kiaanverse uses Face ID for secure, quick login.',
      // Camera — Future profile photo and sacred image features
      NSCameraUsageDescription:
        'Kiaanverse may use your camera for future features.',
      // Background modes — background fetch (verse prefetch, sync) + remote push
      UIBackgroundModes: ['fetch', 'remote-notification'],
    },
    config: {
      usesNonExemptEncryption: false,
    },
    // Entitlements for push notifications and universal links
    entitlements: {
      'aps-environment': 'production',
      'com.apple.developer.associated-domains': [
        'applinks:kiaanverse.com',
        'applinks:*.kiaanverse.com',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Android Configuration
  // ---------------------------------------------------------------------------
  android: {
    package: 'com.kiaanverse.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#050507',
    },
    permissions: [
      // Network — all API calls, push token registration, content fetching
      'android.permission.INTERNET',
      // Haptics — haptic feedback on UI interactions, notification vibration patterns
      'android.permission.VIBRATE',
      // Audio — voice input for Sakha AI companion conversations
      'android.permission.RECORD_AUDIO',
      // Camera — profile photos and sacred image capture (future)
      'android.permission.CAMERA',
      // Biometric — fingerprint / face unlock for secure login (Android 9+)
      'android.permission.USE_BIOMETRIC',
      // Fingerprint — legacy fingerprint API for pre-Android 9 devices
      'android.permission.USE_FINGERPRINT',
      // Boot — re-register background tasks (verse prefetch, sync) after reboot
      'android.permission.RECEIVE_BOOT_COMPLETED',
      // Notifications — required for Android 13+ (API 33) to post notifications
      'android.permission.POST_NOTIFICATIONS',
    ],
    // Deep link intent filter — handles kiaanverse:// URLs from notifications,
    // external links, and other apps
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'kiaanverse',
            host: '*',
          },
        ],
        category: ['DEFAULT', 'BROWSABLE'],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Web Configuration
  // ---------------------------------------------------------------------------
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },

  // ---------------------------------------------------------------------------
  // Expo Plugins
  // ---------------------------------------------------------------------------
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
        microphonePermission:
          'Sakha uses your microphone for voice conversations.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'Kiaanverse may use your camera for future features.',
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'Kiaanverse uses Face ID for secure, quick login.',
      },
    ],
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
