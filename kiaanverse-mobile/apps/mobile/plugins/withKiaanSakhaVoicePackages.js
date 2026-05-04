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
  // Expo SDK 51's MainApplication.kt template (inherited from React Native
  // 0.74's template) generates:
  //
  //   override fun getPackages(): List<ReactPackage> =
  //       PackageList(this).packages.apply {
  //         // Packages that cannot be autolinked yet can be added manually here, for example:
  //         // add(MyReactNativePackage())
  //       }
  //
  // We inject `add(SakhaForegroundServicePackage())` inside that .apply{}
  // block, right after the opening brace and before the placeholder
  // comment line. The closure receiver in `.apply { ... }` is the
  // MutableList<ReactPackage>, so `add(...)` resolves to its `add` method.
  //
  // The previous regex looked for `val packages = PackageList(this).packages`
  // which was a different style — that style does NOT appear in the SDK 51
  // template, so the previous regex silently matched nothing and the
  // SakhaForegroundServicePackage was never registered. This regex matches
  // the actual template form.
  const applyMatch = contents.match(/PackageList\(this\)\.packages\.apply\s*\{\s*\n/);
  if (applyMatch) {
    const insertAt = applyMatch.index + applyMatch[0].length;
    const indent = '          ';
    return contents.slice(0, insertAt) + `${indent}${addLine}\n` + contents.slice(insertAt);
  }
  // Fallback for the older `val packages = ...` style (e.g. if Expo
  // changes the template in a future SDK or a developer customized
  // MainApplication.kt manually):
  const valMatch = contents.match(/val\s+packages\s*=\s*PackageList\(this\)\.packages/);
  if (valMatch) {
    const insertAt = valMatch.index + valMatch[0].length;
    return contents.slice(0, insertAt) + `\n          packages.${addLine}` + contents.slice(insertAt);
  }
  // If neither pattern matches, we cannot proceed silently — fail loudly
  // so the build surfaces the problem instead of producing an APK that
  // boots without SakhaForegroundService registered.
  throw new Error(
    '[withKiaanSakhaVoicePackages] Could not find an injection point in ' +
    'MainApplication.kt for `add(SakhaForegroundServicePackage())`. ' +
    'Expected either `PackageList(this).packages.apply { ... }` or ' +
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
