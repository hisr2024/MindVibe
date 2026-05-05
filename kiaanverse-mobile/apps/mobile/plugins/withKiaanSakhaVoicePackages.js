/**
 * withKiaanSakhaVoicePackages — Expo config plugin.
 *
 * MODEL: minimal MainApplication.kt patch for ONE non-autolinked package.
 *
 * Registration topology (post the long native-build saga, builds 1–9):
 *
 *   • @kiaanverse/kiaan-voice-native (workspace at native/kiaan-voice/)
 *     - Hoisted by pnpm to apps/mobile/node_modules/@kiaanverse/kiaan-voice-native
 *     - RN autolinker scans node_modules, finds android/build.gradle,
 *       registers `:kiaanverse_kiaan-voice-native` as a gradle subproject,
 *       auto-detects `KiaanVoicePackage` via cli-platform-android's
 *       findPackageClassName regex, and adds it to PackageList.java.
 *     - Runtime registration: handled by `PackageList(this).packages` in
 *       MainApplication.kt template — NO plugin patch needed.
 *
 *   • @kiaanverse/sakha-voice-native (workspace at native/sakha-voice/)
 *     - Same as above. Autolinker registers `:kiaanverse_sakha-voice-native`
 *       and adds `SakhaVoicePackage` to PackageList.java.
 *     - Runtime registration: handled by PackageList — NO plugin patch.
 *
 *   • SakhaForegroundServicePackage (local module at apps/mobile/native/android/)
 *     - This module ships an `expo-module.config.json` declaring only
 *       `KiaanAudioPlayerPackage` as an Expo module. It does NOT live in
 *       node_modules, so RN autolinker never sees it. Expo's autolinker
 *       only auto-registers what's listed in expo-module.config.json.
 *     - SakhaForegroundServicePackage is a regular ReactPackage in the
 *       same source tree but not declared as an Expo module → no
 *       autolinker finds it.
 *     - Runtime registration: this plugin manually adds
 *       `add(SakhaForegroundServicePackage())` to MainApplication.kt.
 *
 * Why we DON'T inject KiaanVoicePackage / SakhaVoicePackage here anymore:
 *
 *   We tried a long sequence of variants (PRs #1676, #1686, #1687, #1688,
 *   #1689) chasing the "Unresolved reference: sakha" / namespace-collision
 *   build failure. The terminal mistake was dual-registration — both the
 *   plugin and the autolinker registering the SAME source as different
 *   gradle modules pointing at the SAME directory through pnpm's symlink,
 *   which produced AGP namespace collision and processReleaseJavaRes races.
 *
 *   PR #1689 fixed half of it (removed the plugin's gradle module
 *   injection) but left the per-package react-native.config.js
 *   `platforms.android: null` opt-outs in place — those make
 *   cli-platform-android's `dependencyConfig` return `null` for the
 *   package (verified in node_modules/@react-native-community/
 *   cli-platform-android/build/config/index.js), which means the
 *   autolinker ALSO skips registration. Net result post-PR-#1689: NO
 *   gradle module is registered, the AAR is never compiled, and
 *   MainApplication.kt's manual `import com.mindvibe.kiaan.voice.
 *   KiaanVoicePackage` fails to resolve.
 *
 *   The fix (this PR) is to delete the per-package `react-native.config.js`
 *   files, let RN autolinker do its job (register gradle module + add to
 *   PackageList.java), and stop having the plugin add manual `add()`
 *   calls — those would now duplicate what's already in PackageList.
 *
 * Idempotent — re-running prebuild does not duplicate any line.
 */

const { withMainApplication } = require('@expo/config-plugins');

const FG_IMPORT =
  'import com.kiaanverse.sakha.audio.SakhaForegroundServicePackage';
const FG_ADD = 'add(SakhaForegroundServicePackage())';

function addImport(contents, importLine) {
  if (contents.includes(importLine)) return contents;
  const lastImportMatch = [...contents.matchAll(/^import\s+\S+/gm)].pop();
  if (lastImportMatch) {
    const insertAt = lastImportMatch.index + lastImportMatch[0].length;
    return contents.slice(0, insertAt) + '\n' + importLine + contents.slice(insertAt);
  }
  return contents.replace(/^(package\s+\S+)/m, `$1\n\n${importLine}`);
}

function addPackageRegistration(contents, addLine) {
  if (contents.includes(addLine)) return contents;
  // Expo SDK 51's MainApplication.kt template (post the ReactNativeHostWrapper
  // injection that Expo prebuild applies on top of the RN 0.74 template) has
  // the following getPackages body shape:
  //
  //   override fun getPackages(): List<ReactPackage> {
  //     // Packages that cannot be autolinked yet can be added manually here, for example:
  //     // packages.add(new MyReactNativePackage());
  //     return PackageList(this).packages
  //   }
  //
  // We need to convert `return PackageList(this).packages` into a form that
  // lets us insert `add(...)` calls — wrap it in `.apply { ... }`:
  //
  //   return PackageList(this).packages.apply {
  //     add(SakhaForegroundServicePackage())
  //   }
  //
  // The .apply{} closure receiver is the MutableList<ReactPackage>, so bare
  // `add(...)` resolves to the list's add method.
  //
  // We support three patterns to be resilient to Expo template changes:
  //   1. Plain `return PackageList(this).packages` (SDK 51 actual)
  //   2. Existing `PackageList(this).packages.apply { ... }` (RN 0.74 plain)
  //   3. Older `val packages = PackageList(this).packages` (pre-0.74)
  // If none match, throw — better to fail prebuild than ship an APK without
  // SakhaForegroundService registered.

  // Pattern 1: SDK 51 form — `return PackageList(this).packages` (no .apply, no val)
  // Wrap the return in .apply{ add(...) }
  const returnMatch = contents.match(/return\s+PackageList\(this\)\.packages\s*$/m);
  if (returnMatch) {
    return contents.replace(
      /return\s+PackageList\(this\)\.packages\s*$/m,
      `return PackageList(this).packages.apply {\n            ${addLine}\n          }`,
    );
  }
  // Pattern 2: existing .apply{} block — inject inside it
  const applyMatch = contents.match(/PackageList\(this\)\.packages\.apply\s*\{\s*\n/);
  if (applyMatch) {
    const insertAt = applyMatch.index + applyMatch[0].length;
    return contents.slice(0, insertAt) + `            ${addLine}\n` + contents.slice(insertAt);
  }
  // Pattern 3: older `val packages = ...` form — inject after the val
  const valMatch = contents.match(/val\s+packages\s*=\s*PackageList\(this\)\.packages/);
  if (valMatch) {
    const insertAt = valMatch.index + valMatch[0].length;
    return contents.slice(0, insertAt) + `\n          packages.${addLine}` + contents.slice(insertAt);
  }
  throw new Error(
    '[withKiaanSakhaVoicePackages] Could not find an injection point in ' +
    'MainApplication.kt for `add(SakhaForegroundServicePackage())`. ' +
    'Expected `return PackageList(this).packages`, ' +
    '`PackageList(this).packages.apply { ... }`, or ' +
    '`val packages = PackageList(this).packages`. Inspect the prebuild ' +
    'output and update this plugin if Expo changed the template.',
  );
}

const withKiaanSakhaVoicePackages = (config) => {
  config = withMainApplication(config, (cfg) => {
    if (cfg.modResults.language !== 'kt') return cfg;
    let contents = cfg.modResults.contents;
    contents = addImport(contents, FG_IMPORT);
    contents = addPackageRegistration(contents, FG_ADD);
    cfg.modResults.contents = contents;
    return cfg;
  });

  return config;
};

module.exports = withKiaanSakhaVoicePackages;
module.exports.default = withKiaanSakhaVoicePackages;
