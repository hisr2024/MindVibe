/**
 * withKiaanSakhaVoicePackages — Expo config plugin.
 *
 * Registers the three ReactPackage classes that ship with the Sakha /
 * Kiaan Voice Companion native surface:
 *
 *   • com.mindvibe.kiaan.voice.KiaanVoicePackage
 *       — Kiaan Voice umbrella package (currently empty; kept so the
 *         plugin's import line resolves at javac time and so we have a
 *         home for future Kiaan-specific native modules).
 *
 *   • com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage
 *       — registers SakhaVoiceModule (NativeModules.SakhaVoice). Used
 *         by useDictation, useSakhaVoice, useSakhaWakeWord, and
 *         lib/sakhaVerseLibrary.ts. Module methods are stubbed today
 *         so the JS side falls back to backend STT/TTS.
 *
 *   • com.kiaanverse.sakha.audio.SakhaForegroundServicePackage
 *       — registers SakhaForegroundServiceModule
 *         (NativeModules.SakhaForegroundService). Bridges the existing
 *         SakhaForegroundService.start/stop static helpers so
 *         voice/hooks/useForegroundService.ts can keep the voice
 *         session alive across Android 14+ background lifecycle.
 *
 * by patching MainApplication.kt during prebuild to call:
 *   packages.add(KiaanVoicePackage())
 *   packages.add(SakhaVoicePackage())
 *   packages.add(SakhaForegroundServicePackage())
 *
 * Why a plugin instead of expo-module.config.json `android.modules`:
 * The `android.modules` field is for the *new* Expo Module API
 * (classes extending `expo.modules.kotlin.modules.Module`). Our two
 * packages are old-style RN bridge `ReactPackage` subclasses. When
 * registered via `android.modules`, the autolinker generates
 * `ExpoModulesPackageList.java` with a strict `Class<? extends Module>`
 * cast that fails at javac time:
 *
 *   error: method asList in class Arrays cannot be applied to given types;
 *   reason: Class<KiaanVoicePackage> cannot be converted to Class<? extends Module>
 *
 * The fix is to register them through MainApplication.kt's `getPackages()`
 * method like any other RN bridge package, which is what this plugin does.
 *
 * The Gradle modules `:kiaanverse-kiaan-voice-native` and
 * `:kiaanverse-sakha-voice-native` are still discovered by the
 * autolinker (because the workspace package has `expo-module.config.json`
 * with `platforms: ["android"]`), so the .aar files still get linked.
 * Only the runtime registration mechanism changes.
 *
 * Idempotent — re-running prebuild does not duplicate imports or
 * package additions.
 */

const { withMainApplication } = require('@expo/config-plugins');

const KIAAN_IMPORT = 'import com.mindvibe.kiaan.voice.KiaanVoicePackage';
const SAKHA_IMPORT = 'import com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage';
const FG_IMPORT =
  'import com.kiaanverse.sakha.audio.SakhaForegroundServicePackage';
const KIAAN_ADD = 'packages.add(KiaanVoicePackage())';
const SAKHA_ADD = 'packages.add(SakhaVoicePackage())';
const FG_ADD = 'packages.add(SakhaForegroundServicePackage())';

function addImport(contents, importLine) {
  if (contents.includes(importLine)) return contents;
  // Insert after the package declaration. Kotlin: `package com.foo`.
  // We append after the first import block to avoid the package line.
  const lastImportMatch = [...contents.matchAll(/^import\s+\S+/gm)].pop();
  if (lastImportMatch) {
    const insertAt = lastImportMatch.index + lastImportMatch[0].length;
    return contents.slice(0, insertAt) + '\n' + importLine + contents.slice(insertAt);
  }
  // Fallback: insert after the package declaration.
  return contents.replace(/^(package\s+\S+)/m, `$1\n\n${importLine}`);
}

function addPackageRegistration(contents, addLine) {
  if (contents.includes(addLine)) return contents;
  // The Expo / RN MainApplication.kt template has:
  //   val packages = PackageList(this).packages
  //   // Packages that cannot be autolinked yet can be added manually here, for example:
  //   // packages.add(MyReactNativePackage())
  //   return packages
  //
  // We insert our add() lines right after `val packages = PackageList(this).packages`.
  return contents.replace(
    /(val\s+packages\s*=\s*PackageList\(this\)\.packages)/,
    `$1\n          ${addLine}`,
  );
}

const withKiaanSakhaVoicePackages = (config) => {
  return withMainApplication(config, (config) => {
    if (config.modResults.language !== 'kt') {
      // Java MainApplication is not what Expo SDK 51 generates by default,
      // so we don't bother handling it. If a future template change reverts
      // to Java, this plugin would no-op and the build would compile but
      // the packages wouldn't be registered.
      return config;
    }
    let contents = config.modResults.contents;
    contents = addImport(contents, KIAAN_IMPORT);
    contents = addImport(contents, SAKHA_IMPORT);
    contents = addImport(contents, FG_IMPORT);
    contents = addPackageRegistration(contents, KIAAN_ADD);
    contents = addPackageRegistration(contents, SAKHA_ADD);
    contents = addPackageRegistration(contents, FG_ADD);
    config.modResults.contents = contents;
    return config;
  });
};

module.exports = withKiaanSakhaVoicePackages;
module.exports.default = withKiaanSakhaVoicePackages;
