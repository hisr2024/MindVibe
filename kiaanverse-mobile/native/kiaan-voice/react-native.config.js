/**
 * React Native autolinker opt-out for @kiaanverse/kiaan-voice-native.
 *
 * RN autolinking (`react-native config`) scans every package under
 * apps/mobile/node_modules/ for an android/build.gradle and registers
 * each match as a gradle subproject — using slash-to-underscore name
 * mangling on scoped packages. Because this workspace lives at
 * `kiaanverse-mobile/native/kiaan-voice/` AND is symlinked into
 * `apps/mobile/node_modules/@kiaanverse/kiaan-voice-native/` by pnpm,
 * the auto-registration would add a duplicate gradle project
 * `:kiaanverse_kiaan-voice-native` alongside the manually-registered
 * `:kiaanverse-kiaan-voice-native` (added by the
 * withKiaanSakhaVoicePackages config plugin in apps/mobile/plugins/).
 *
 * Both AARs would build with namespace `com.mindvibe.kiaan.voice`,
 * AGP would detect the namespace collision, and one set of classes
 * would be pruned from :app's compile classpath — manifesting as
 * `Unresolved reference: sakha` at :app:compileReleaseKotlin.
 *
 * Setting `dependency.platforms.{android,ios}: null` tells RN
 * autolinking that this package has NO native dependencies for those
 * platforms, so it skips them. Combined with the absence of
 * expo-module.config.json (which keeps the Expo autolinker out), this
 * package is invisible to all autolinkers — registration only happens
 * through the explicit settings.gradle injection in the config plugin.
 */
module.exports = {
  dependency: {
    platforms: {
      android: null,
      ios: null,
    },
  },
};
