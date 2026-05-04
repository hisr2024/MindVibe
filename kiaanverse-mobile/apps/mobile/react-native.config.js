/**
 * Host-side React Native autolinker overrides for apps/mobile.
 *
 * Why this file exists: the workspace voice native packages
 *
 *   @kiaanverse/kiaan-voice-native  (kiaanverse-mobile/native/kiaan-voice)
 *   @kiaanverse/sakha-voice-native  (kiaanverse-mobile/native/sakha-voice)
 *
 * are registered as Gradle modules through the
 * `withKiaanSakhaVoicePackages` Expo config plugin (see
 * apps/mobile/plugins/withKiaanSakhaVoicePackages.js), NOT through
 * autolinking. Each package's own react-native.config.js declares
 * `dependency.platforms.{android,ios}: null` to opt out — but on
 * the EAS build server the per-package opt-out has historically
 * been ignored, producing duplicate Gradle modules:
 *
 *   :kiaanverse-{kiaan,sakha}-voice-native  ← plugin (correct)
 *   :kiaanverse_{kiaan,sakha}-voice-native  ← autolinker (duplicate)
 *
 * Both AARs build with namespace `com.mindvibe.kiaan.voice[.sakha]`,
 * AGP detects the namespace collision, prunes one set of classes
 * from :app's compile classpath, and :app:compileReleaseKotlin
 * fails with "Unresolved reference: sakha" because MainApplication.kt
 * imports `com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage`.
 *
 * Belt-and-braces fix shipped together with the dependency removal
 * from apps/mobile/package.json:
 *
 *   1. Removed both packages from apps/mobile/package.json's
 *      dependencies block so pnpm no longer symlinks them into
 *      apps/mobile/node_modules/@kiaanverse/. The autolinker has
 *      nothing to find.
 *   2. This file ALSO instructs `react-native config` (which Expo
 *      reuses on Android) to skip these packages on every platform.
 *      Anyone who re-adds the deps in the future still cannot
 *      accidentally re-introduce the duplicate gradle module.
 *
 * The plugin's settings.gradle injection still references the
 * workspace path directly (kiaanverse-mobile/native/{X}-voice/android/),
 * so removing the symlinks does not affect the plugin's correct
 * registration path.
 *
 * If you need to add a JS-importable native module in the future,
 * declare it via the @expo/config-plugins API in a config plugin —
 * not by adding it to dependencies — to keep this opt-out invariant.
 */
module.exports = {
  dependencies: {
    '@kiaanverse/kiaan-voice-native': {
      platforms: { android: null, ios: null },
    },
    '@kiaanverse/sakha-voice-native': {
      platforms: { android: null, ios: null },
    },
  },
};
