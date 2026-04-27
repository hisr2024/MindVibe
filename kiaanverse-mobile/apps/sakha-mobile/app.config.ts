/**
 * Sakha Voice Companion — Expo App Configuration
 *
 * Native Android module of the Kiaanverse / Sakha App, shipped as a signed
 * .aab via Expo EAS Build. This config wires:
 *
 *   • React Native New Architecture (Fabric + TurboModules) via
 *     expo-build-properties — REQUIRED for the KiaanAudioPlayer TurboModule
 *     in Part 8 to register at startup.
 *   • Three Sakha-specific config plugins:
 *       1. withKiaanForegroundService — mediaPlayback foreground service
 *          for Android 14+ (targetSdk 34/35) so the WSS audio session
 *          survives the user backgrounding the app.
 *       2. withKiaanAudioFocus — declarative audio focus
 *          (GAIN_TRANSIENT_MAY_DUCK) + Bluetooth SCO routing.
 *       3. withPicovoice — Cobra VAD + optional Porcupine wake-word.
 *   • Adaptive icon slots for the Shankha (शङ्ख) brand iconography
 *     authored in Part 11. The slot paths exist; the assets land later.
 *   • Permissions that are non-negotiable for the voice WSS:
 *       RECORD_AUDIO, MODIFY_AUDIO_SETTINGS, BLUETOOTH_CONNECT,
 *       FOREGROUND_SERVICE, FOREGROUND_SERVICE_MEDIA_PLAYBACK,
 *       POST_NOTIFICATIONS, WAKE_LOCK, INTERNET.
 *
 * Build:
 *   pnpm --filter @kiaanverse/sakha-mobile run build:android:production
 * Output: signed .aab uploaded to EAS, ready for Play Console submission.
 */

import { type ConfigContext, type ExpoConfig } from 'expo/config';

const VERSION = '1.0.0';
const PERSONA_VERSION = '1.0.0'; // mirrors prompts/persona-version on the server
const SCHEMA_VERSION = '1.0.0'; // mirrors backend.services.voice.wss_frames.SCHEMA_VERSION
const SUBPROTOCOL = 'kiaan-voice-v1';

// COSMIC_VOID — canonical KIAANVERSE cosmic backdrop.
const COSMIC_VOID = '#050714';
// DIVINE_GOLD — canonical KIAANVERSE accent (notification icon tint, splash).
const DIVINE_GOLD = '#D4A017';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Sakha',
  slug: 'sakha-voice-companion',
  version: VERSION,
  orientation: 'portrait',
  icon: './assets/shankha/icon.png',
  scheme: 'sakha',
  userInterfaceStyle: 'automatic',

  splash: {
    image: './assets/shankha/splash.png',
    resizeMode: 'contain',
    backgroundColor: COSMIC_VOID,
  },

  runtimeVersion: {
    policy: 'appVersion' as const,
  },

  android: {
    package: 'com.kiaanverse.sakha',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/shankha/adaptive-icon-foreground.png',
      backgroundImage: './assets/shankha/adaptive-icon-background.png',
      backgroundColor: COSMIC_VOID,
    },
    permissions: [
      // Network
      'android.permission.INTERNET',
      // Audio capture for STT
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      // Bluetooth headset routing for ExoPlayer
      'android.permission.BLUETOOTH_CONNECT',
      // Foreground service for the voice session — Android 14+ requires
      // BOTH the generic and the typed mediaPlayback permissions.
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      // Post-notification (the foreground service publishes a persistent
      // low-priority notification — "सखा सुन रहे हैं").
      'android.permission.POST_NOTIFICATIONS',
      // Keep the CPU awake while the user is mid-utterance and during
      // audio playback — prevents the screen-off doze killing the WSS.
      'android.permission.WAKE_LOCK',
      // Haptic on crisis frame + barge-in cue.
      'android.permission.VIBRATE',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'sakha', host: '*' }],
        category: ['DEFAULT', 'BROWSABLE'],
      },
    ],
  },

  plugins: [
    'expo-router',
    'expo-splash-screen',
    [
      'expo-build-properties',
      {
        android: {
          // Sakha targets Android 14 (API 34) — required for the typed
          // mediaPlayback foreground service. compileSdk 35 keeps us on
          // the latest AndroidX Media3 + ExoPlayer.
          targetSdkVersion: 35,
          compileSdkVersion: 35,
          // New Architecture is REQUIRED — KiaanAudioPlayer (Part 8) is
          // a TurboModule with a JSI bridge. Old arch will fail to
          // register the spec at startup.
          newArchEnabled: true,
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          extraProguardRules: [
            '# KiaanAudioPlayer TurboModule (Part 8) — JSI bridge keep rules.',
            '-keep class com.kiaanverse.audio.** { *; }',
            '-keep interface com.kiaanverse.audio.** { *; }',
            '-keep @com.facebook.react.module.annotations.ReactModule class * { *; }',
            '-keep class * implements com.facebook.react.bridge.ReactPackage { *; }',
            '',
            '# AndroidX Media3 / ExoPlayer — KiaanAudioPlayer wraps these',
            '# and they are loaded reflectively from JNI. Without these',
            '# rules the audio session crashes the first time the WSS',
            '# emits an audio.chunk frame in release builds.',
            '-keep class androidx.media3.** { *; }',
            '-keep interface androidx.media3.** { *; }',
            '-dontwarn androidx.media3.**',
            '',
            '# Picovoice Cobra VAD + optional Porcupine wake-word — both',
            '# load native .so libraries via reflection and break under R8.',
            '-keep class ai.picovoice.** { *; }',
            '-keep interface ai.picovoice.** { *; }',
            '-dontwarn ai.picovoice.**',
            '',
            '# Reanimated 3 worklet runtime (Shankha RMS-driven sound waves).',
            '-keep class com.swmansion.reanimated.** { *; }',
            '-keep interface com.swmansion.reanimated.** { *; }',
            '-dontwarn com.swmansion.reanimated.**',
            '',
            '# Lottie state animations for the Shankha state machine.',
            '-keep class com.airbnb.android.react.lottie.** { *; }',
            '-keep class com.airbnb.lottie.** { *; }',
            '-dontwarn com.airbnb.lottie.**',
            '',
            '# react-native-svg (Shankha vector path + sacred geometry).',
            '-keep class com.horcrux.svg.** { *; }',
            '-keep interface com.horcrux.svg.** { *; }',
            '-dontwarn com.horcrux.svg.**',
            '',
            '# Hermes Intl ICU bridge — Sanskrit + Devanagari rendering',
            '# touches DateTimeFormat / Collator under the hood.',
            '-keep class com.facebook.hermes.intl.** { *; }',
            '-dontwarn com.facebook.hermes.intl.**',
            '',
            '# React Native core',
            '-keepclassmembers,includedescriptorclasses class * { native <methods>; }',
          ].join('\n'),
        },
      },
    ],
    [
      'expo-av',
      {
        microphonePermission:
          'Sakha needs your voice to converse with you. Audio leaves your phone only while you are speaking.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/shankha/notification-icon.png',
        color: DIVINE_GOLD,
      },
    ],
    // ─── Sakha-specific config plugins ─────────────────────────────────
    // Three plugins sequentially patch the Android manifest + Gradle:
    './plugins/withKiaanForegroundService',
    './plugins/withKiaanAudioFocus',
    './plugins/withPicovoice',
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    // Backend WSS endpoint base. EAS injects EXPO_PUBLIC_API_BASE_URL at
    // build time; we read both prefixed + raw forms for symmetry with
    // apps/mobile.
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL ??
      process.env.API_BASE_URL ??
      'https://mindvibe-api.onrender.com',
    // Sakha pins these on the client side too — Part 9 hooks read them
    // before opening the WSS so a stale APK fails fast on app open
    // rather than after the first audio chunk.
    personaVersion: PERSONA_VERSION,
    schemaVersion: SCHEMA_VERSION,
    subprotocol: SUBPROTOCOL,
    sentryDsn: process.env.SENTRY_DSN ?? '',
    eas: {
      // Linked to expo.dev/accounts/kiaanverse/projects/sakha-voice-companion.
      // EAS_PROJECT_ID env var wins so per-environment overrides still work.
      projectId: process.env.EAS_PROJECT_ID ?? '2ca58471-88ee-43fe-98ab-cbe9ac502ac5',
    },
    // Picovoice access keys are runtime-only. Set via EAS Secrets:
    //   eas secret:create --scope project --name PICOVOICE_ACCESS_KEY ...
    picovoice: {
      accessKey: process.env.PICOVOICE_ACCESS_KEY ?? '',
    },
  },
});
