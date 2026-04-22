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
  version: '1.2.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'kiaanverse',
  userInterfaceStyle: 'automatic',

  updates: {
    url: 'https://u.expo.dev/1f72d91b-2336-4b58-a641-5589317cc36c',
  },

  runtimeVersion: {
    policy: 'appVersion' as const,
  },

  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#050507',
  },

  ios: {
    bundleIdentifier: 'com.kiaanverse.app',
    supportsTablet: true,
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Sakha uses your microphone for voice conversations.',
      NSFaceIDUsageDescription:
        'Kiaanverse uses Face ID for secure, quick login.',
      NSCameraUsageDescription:
        'Kiaanverse may use your camera for future features.',
      // 'audio' keeps the AVAudioSession alive when the screen locks or the
      // user backgrounds the app — required for Vibe Player lock-screen
      // controls and for audio to continue during meditation sessions.
      UIBackgroundModes: ['fetch', 'remote-notification', 'audio'],
    },
    config: {
      usesNonExemptEncryption: false,
    },
    entitlements: {
      'aps-environment': 'production',
      'com.apple.developer.associated-domains': [
        'applinks:kiaanverse.com',
        'applinks:*.kiaanverse.com',
      ],
    },
  },

  android: {
    package: 'com.kiaanverse.app',
    versionCode: 20,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#050507',
    },
    permissions: [
      'android.permission.INTERNET',
      'android.permission.VIBRATE',
      'android.permission.RECORD_AUDIO',
      'android.permission.CAMERA',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.POST_NOTIFICATIONS',
      'com.android.vending.BILLING',
      // Required by react-native-track-player to run the media-playback
      // foreground service on Android 14+ (targetSdk 34). Without this the
      // audio session is killed the moment the user leaves the app.
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    ],
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

  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },

  plugins: [
    './plugins/with-expo-modules-core-patch',
    'expo-router',
    'expo-splash-screen',
    [
      'expo-build-properties',
      {
        android: {
          targetSdkVersion: 35,
          compileSdkVersion: 35,
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
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
    [
      'react-native-iap',
      {
        paymentProvider: 'Play Store',
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    // EAS injects EXPO_PUBLIC_API_BASE_URL at build time; the unprefixed
    // API_BASE_URL is only visible during config evaluation, not at runtime.
    // Read both so `Constants.expoConfig.extra.apiBaseUrl` is usable as a
    // diagnostic if anything ever reads from it. Production fallback is the
    // Render deployment rather than localhost, so a misconfigured build still
    // hits a real backend.
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL ??
      process.env.API_BASE_URL ??
      'https://mindvibe-api.onrender.com',
    sentryDsn: process.env.SENTRY_DSN ?? '',
    eas: {
      projectId: '1f72d91b-2336-4b58-a641-5589317cc36c',
    },
    autolinking: {
      exclude: ['expo-in-app-purchases'],
    },
  },
});
