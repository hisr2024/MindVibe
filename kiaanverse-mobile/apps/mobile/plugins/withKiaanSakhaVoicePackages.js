/**
 * withKiaanSakhaVoicePackages — Expo config plugin (no-op pass-through).
 *
 * STATUS: Disabled / pass-through.
 *
 * Originally this plugin patched MainApplication.kt and app/build.gradle
 * to register three ReactPackage classes:
 *
 *   • com.mindvibe.kiaan.voice.KiaanVoicePackage
 *   • com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage
 *   • com.kiaanverse.sakha.audio.SakhaForegroundServicePackage
 *
 * Both attempts to make :app see the workspace AARs by patching the
 * generated build.gradle failed on EAS — Expo's autolinker re-runs after
 * config plugins and overwrites our injections. We now register the three
 * packages through the supported channel: each module's
 * expo-module.config.json `android.modules` array. The autolinker:
 *
 *   1. Adds `implementation project(':kiaanverse-{kiaan,sakha}-voice-native')`
 *      to apps/mobile/android/app/build.gradle, so :app sees the AARs at
 *      compile time (this is the bit that was missing before).
 *   2. Generates ExpoModulesPackageList.kt with the three class names, so
 *      `PackageList(this).packages` inside MainApplication.kt's getPackages()
 *      returns instances of all three at runtime — no manual packages.add(...)
 *      call needed (KiaanAudioPlayerPackage already proves this works).
 *
 * This file is kept as a pass-through so app.config.ts's `plugins:` array
 * doesn't need changing and so we have a place to land a future patch if
 * we ever need to inject something the autolinker can't.
 */

const withKiaanSakhaVoicePackages = (config) => config;

module.exports = withKiaanSakhaVoicePackages;
module.exports.default = withKiaanSakhaVoicePackages;
