/**
 * withKiaanSakhaVoicePackages — Expo config plugin.
 *
 * Registers the two ReactPackage classes from
 *   @kiaanverse/kiaan-voice-native  (com.mindvibe.kiaan.voice.KiaanVoicePackage)
 *   @kiaanverse/sakha-voice-native  (com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage)
 *
 * by patching MainApplication.kt during prebuild to call:
 *   packages.add(KiaanVoicePackage())
 *   packages.add(SakhaVoicePackage())
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
const KIAAN_ADD = 'packages.add(KiaanVoicePackage())';
const SAKHA_ADD = 'packages.add(SakhaVoicePackage())';

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
    contents = addPackageRegistration(contents, KIAAN_ADD);
    contents = addPackageRegistration(contents, SAKHA_ADD);
    config.modResults.contents = contents;
    return config;
  });
};

module.exports = withKiaanSakhaVoicePackages;
module.exports.default = withKiaanSakhaVoicePackages;
