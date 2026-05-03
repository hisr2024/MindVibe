/**
 * React Native autolinker opt-out for @kiaanverse/sakha-voice-native.
 *
 * Same rationale as kiaanverse-mobile/native/kiaan-voice/react-native.config.js.
 * RN autolinking would otherwise create a duplicate
 * `:kiaanverse_sakha-voice-native` gradle project (via the pnpm
 * symlink at apps/mobile/node_modules/@kiaanverse/sakha-voice-native/),
 * conflicting with the manually-registered
 * `:kiaanverse-sakha-voice-native` from the
 * withKiaanSakhaVoicePackages config plugin. Both AARs would carry
 * namespace `com.mindvibe.kiaan.voice.sakha`, AGP would prune one,
 * and :app:compileReleaseKotlin would fail with
 * `Unresolved reference: sakha`.
 *
 * Setting `dependency.platforms.{android,ios}: null` tells RN
 * autolinking that this package has NO native dependencies for those
 * platforms, so it skips them. Combined with the absence of
 * expo-module.config.json, this package is invisible to all
 * autolinkers — registration only happens through the explicit
 * settings.gradle injection in the config plugin.
 */
module.exports = {
  dependency: {
    platforms: {
      android: null,
      ios: null,
    },
  },
};
