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
  // 1.3.0 bundles native additions that landed after the 1.2.0 Play build:
  // expo-document-picker (Vibe Player "My Music" import) and the transitive
  // native pieces pulled in by the Sacred Reflections / Sakha chat PRs. With
  // runtimeVersion: { policy: 'appVersion' } every OTA is scoped to the
  // `version` string, so bumping from 1.2.0 → 1.3.0 prevents expo-updates
  // from pushing JS that imports new native modules to APKs compiled before
  // those modules existed. The matching versionCode bump is required by Play.
  version: '1.3.0',
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
    // COSMIC_VOID — canonical KIAANVERSE cosmic backdrop
    backgroundColor: '#050714',
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
    versionCode: 21,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      // COSMIC_VOID — canonical KIAANVERSE cosmic backdrop
      backgroundColor: '#050714',
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
    // Fixes silent audio in Android AAB builds: injects R8 keep rules for
    // react-native-track-player + ExoPlayer / Media3 and ensures the
    // MusicService declares foregroundServiceType="mediaPlayback" (required
    // by Android 14+ targeting SDK 34/35; without it the foreground service
    // is killed before the first audio buffer is decoded). See the plugin's
    // header comment for the full failure analysis.
    './plugins/with-track-player-android',
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
          // Primary path for keep rules — `expo-build-properties` writes
          // these into `android/app/proguard-rules.pro` during prebuild
          // before any other plugin's dangerous-mod runs. The
          // `with-track-player-android` plugin appends the same block as
          // a fail-safe in case this property is ignored by an older
          // expo-build-properties version. Stripping any of these classes
          // breaks audio output silently in release builds.
          extraProguardRules: [
            '# react-native-track-player audio pipeline (keep — see app.config.ts)',
            '-keep class com.doublesymmetry.** { *; }',
            '-keep interface com.doublesymmetry.** { *; }',
            '-keep class com.guichaguri.trackplayer.** { *; }',
            '-keep interface com.guichaguri.trackplayer.** { *; }',
            '-keep class com.doublesymmetry.kotlinaudio.** { *; }',
            '-keep interface com.doublesymmetry.kotlinaudio.** { *; }',
            '-keep class androidx.media.** { *; }',
            '-keep class androidx.media3.** { *; }',
            '-keep interface androidx.media3.** { *; }',
            '-keep class com.google.android.exoplayer2.** { *; }',
            '-keep interface com.google.android.exoplayer2.** { *; }',
            '-dontwarn com.google.android.exoplayer2.**',
            '-dontwarn androidx.media3.**',
            '-keep class * extends androidx.media.session.MediaButtonReceiver { *; }',
          ].join('\n'),
        },
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        // DIVINE_GOLD — canonical KIAANVERSE gold accent
        color: '#D4A017',
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
