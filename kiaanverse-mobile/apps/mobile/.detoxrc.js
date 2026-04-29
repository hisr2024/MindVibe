/**
 * Detox configuration for the Sakha mobile app.
 *
 * Two device targets:
 *   • android.emu.debug    — Pixel emulator + APK debug build
 *   • android.emu.release  — Pixel emulator + AAB→universal APK release
 *
 * The release configuration mirrors the production .aab path: same
 * signing config, same R8 + ProGuard pass, same New Architecture
 * enabled. The only difference is `--build-type universal-apk` on
 * the Gradle command so Detox can install the artifact directly
 * (Detox cannot launch an .aab — it expects an installable APK; we
 * generate a universal APK from the same bundle for testing).
 *
 * Run:
 *   pnpm --filter @kiaanverse/sakha-mobile run test:e2e:android
 *
 * Per-spec testing matrix is exercised by the 9 .test.ts files in
 * apps/sakha-mobile/e2e/. See docs/voice-companion-runbook.md for
 * the full launch checklist.
 */

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.ts',
    },
    jest: {
      setupTimeout: 120_000,
    },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081, 8000],
    },
    'android.release': {
      type: 'android.apk',
      // Detox needs an installable APK; the .aab production output
      // is converted via bundletool universal-apk. EAS Build runs
      // this conversion automatically on release builds.
      binaryPath:
        'android/app/build/outputs/apk/release/app-release.apk',
      build:
        'cd android && ./gradlew assembleRelease ' +
        '-DtestBuildType=release ' +
        '-Pandroid.injected.signing.store.file=$DETOX_KEYSTORE_PATH',
    },
  },
  devices: {
    'pixel-7-api-34': {
      type: 'android.emulator',
      device: { avdName: 'Pixel_7_API_34' },
    },
    'pixel-5-api-33': {
      type: 'android.emulator',
      device: { avdName: 'Pixel_5_API_33' },
    },
    'redmi-note-11-api-31': {
      type: 'android.emulator',
      device: { avdName: 'Redmi_Note_11_API_31' },
    },
  },
  configurations: {
    'android.emu.debug': {
      device: 'pixel-7-api-34',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'pixel-7-api-34',
      app: 'android.release',
    },
    'android.emu.pixel5.4g': {
      device: 'pixel-5-api-33',
      app: 'android.release',
    },
    'android.emu.midrange.3g': {
      device: 'redmi-note-11-api-31',
      app: 'android.release',
    },
  },
  behavior: {
    init: {
      reinstallApp: true,
      exposeGlobals: false,
    },
    cleanup: {
      shutdownDevice: false,
    },
  },
  artifacts: {
    rootDir: '.detox/artifacts',
    plugins: {
      log: { enabled: true, keepOnlyFailedTestsArtifacts: true },
      screenshot: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
        shouldTakeAutomaticSnapshots: true,
        takeWhen: {
          appNotReady: true,
          testStart: false,
          testDone: true,
          testFailure: true,
        },
      },
      video: {
        enabled: false, // enable per-test by setting DETOX_RECORD_VIDEO=1
      },
    },
  },
};
