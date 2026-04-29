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
  // 1.3.1 ships the Relationship Compass Android-release crash fix:
  //   • R8/Proguard keep rules for react-native-svg, react-native-reanimated,
  //     gesture-handler, lottie and the Hermes Intl bridge (without these the
  //     Compass radar + compass-rose chambers crash the JNI bridge with
  //     NoClassDefFoundError on the first render of the screen);
  //   • Hermes-safe date formatting in the Seal + Gita Counsel chambers
  //     (Intl.DateTimeFormat / toLocaleDateString were aborting render);
  //   • numeric-only animated props for the SVG chamber animations in both
  //     Relationship Compass (CompassRose, DharmaRadar) and Karma Reset
  //     (KarmaSealMandala) — animating SVG transform strings via
  //     useAnimatedProps was NPE-ing react-native-svg's ViewManager off
  //     the UI thread;
  //   • Hermes-safe sentence splitter in useCompassWisdom (the previous
  //     regex used lookbehind + Unicode property escapes, both unsupported
  //     by Hermes — every API response was being silently swapped for the
  //     offline fallback because the regex literal threw SyntaxError).
  // 1.3.0 bundled native additions (expo-document-picker, Sakha chat).
  // runtimeVersion: { policy: 'appVersion' } scopes OTAs to `version`, so
  // bumping prevents expo-updates from pushing the new JS to the broken
  // 1.3.0 APK. The matching versionCode bump is required by Play.
  version: '1.3.1',
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
    versionCode: 22,
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
      // Required by SakhaForegroundService.acquireWakeLock() to keep
      // the CPU awake for the duration of a voice session (capped at
      // 30 min). Released on session end or when foreground service stops.
      'android.permission.WAKE_LOCK',
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
    // Sakha Voice Companion — declares the typed mediaPlayback foreground
    // service in the merged manifest and adds Devanagari notification
    // strings so backgrounded voice sessions survive Android 14+'s
    // typed-FGS requirement.
    './plugins/withKiaanForegroundService',
    // Sakha Voice Companion — sets AudioAttributes meta-data
    // (USAGE_ASSISTANCE_SONIFICATION + GAIN_TRANSIENT_MAY_DUCK +
    // routeBluetooth=true) so the native player ducks foreign music
    // and routes through BT headsets without restarting the session.
    './plugins/withKiaanAudioFocus',
    // Sakha Voice Companion — Cobra VAD + optional Porcupine wake word
    // ("Hey Sakha"). ABI splits + BuildConfig.KIAAN_PICOVOICE_ACCESS_KEY
    // injection. Reads extras.picovoice.accessKey at prebuild.
    './plugins/withPicovoice',
    // Sakha + KIAAN voice — register the two ReactPackage classes
    // (KiaanVoicePackage, SakhaVoicePackage) in MainApplication.kt.
    // These are old-style RN bridge packages, NOT new-API Expo Modules,
    // so they can't ride the expo-module.config.json `android.modules`
    // codegen path (which expects `Class<? extends Module>`).
    './plugins/withKiaanSakhaVoicePackages',
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
          // breaks audio output silently in release builds — and, as of
          // 1.3.1, breaks Relationship Compass on Play Store (the SVG +
          // Reanimated chambers crash the JNI bridge when their native
          // classes are stripped, which manifests as instant app shutdown
          // the moment the user taps the tool).
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
            '',
            '# Sakha Voice Companion — Kotlin TurboModule + foreground service.',
            '# Loaded by JS class name through Fabric autolinking, so R8 strips',
            '# them otherwise; the WSS audio.chunk stream then NoClassDefFoundErrors',
            '# on the first appendChunk Promise call.',
            '-keep class com.kiaanverse.sakha.** { *; }',
            '-keep interface com.kiaanverse.sakha.** { *; }',
            '-dontwarn com.kiaanverse.sakha.**',
            '',
            '# react-native-svg (Relationship Compass radar + compass-rose). R8',
            '# strips the Fabric/JSI ViewManager classes because they are loaded',
            '# reflectively from JS — the JS bridge instantiates a native view',
            '# whose class is gone, and the resulting NoClassDefFoundError on',
            '# the UI thread aborts the app.',
            '-keep class com.horcrux.svg.** { *; }',
            '-keep interface com.horcrux.svg.** { *; }',
            '-dontwarn com.horcrux.svg.**',
            '',
            '# react-native-reanimated (worklet runtime + animated props).',
            '# Reanimated registers C++ JSI bindings on a background thread;',
            '# stripping its Java entry points crashes the worklet runtime',
            '# the first time a useSharedValue / useAnimatedProps fires.',
            '-keep class com.swmansion.reanimated.** { *; }',
            '-keep interface com.swmansion.reanimated.** { *; }',
            '-keep class com.facebook.react.turbomodule.** { *; }',
            '-dontwarn com.swmansion.reanimated.**',
            '',
            '# react-native-gesture-handler — wired through Reanimated, same',
            '# reflective lookup pattern.',
            '-keep class com.swmansion.gesturehandler.** { *; }',
            '-keep interface com.swmansion.gesturehandler.** { *; }',
            '',
            '# lottie-react-native — used by arrival + sacred animations,',
            '# loaded by JS class name from JSON specs.',
            '-keep class com.airbnb.android.react.lottie.** { *; }',
            '-keep class com.airbnb.lottie.** { *; }',
            '-dontwarn com.airbnb.lottie.**',
            '',
            '# Hermes Intl ICU bridge — keeps `new Intl.DateTimeFormat(...)`',
            '# from throwing NoClassDefFoundError on stripped builds. Even',
            '# though we replaced our Intl calls with manual formatters in',
            '# 1.3.1, third-party libs (date-fns/intl, RN core) may still',
            '# touch these symbols.',
            '-keep class com.facebook.hermes.intl.** { *; }',
            '-dontwarn com.facebook.hermes.intl.**',
            '',
            '# React Native core — keep ReactPackage / ReactModule / view',
            '# manager metadata so autolinked native modules survive R8.',
            '-keep @com.facebook.react.module.annotations.ReactModule class * { *; }',
            '-keep @com.facebook.react.module.annotations.ReactModuleList class * { *; }',
            '-keep class * implements com.facebook.react.bridge.ReactPackage { *; }',
            '-keep class * extends com.facebook.react.uimanager.ViewManager { *; }',
            '-keepclassmembers,includedescriptorclasses class * { native <methods>; }',
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
    // Sakha Voice Companion FINAL.2 version pinning — both client and
    // backend check these against prompts/persona-version + the WSS
    // subprotocol. Mismatches close the WSS with code 4001
    // (PERSONA_MISMATCH) so a stale APK fails fast on app open.
    personaVersion: '1.2.0',
    schemaVersion: '1.0.0',
    subprotocol: 'kiaan-voice-v1',
    // Picovoice access key (Cobra VAD + optional Porcupine wake-word).
    // Set via EAS Secrets:
    //   eas secret:create --scope project --name PICOVOICE_ACCESS_KEY ...
    // Empty in dev/CI so VAD falls back to energy-threshold detection
    // and the wake-word remains the on-device SpeechRecognizer.
    picovoice: {
      accessKey: process.env.PICOVOICE_ACCESS_KEY ?? '',
    },
    sentryDsn: process.env.SENTRY_DSN ?? '',
    eas: {
      projectId: '1f72d91b-2336-4b58-a641-5589317cc36c',
    },
    autolinking: {
      exclude: ['expo-in-app-purchases'],
    },
  },
});
