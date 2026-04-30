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

const { withMainApplication, withAppBuildGradle } = require('@expo/config-plugins');

const KIAAN_IMPORT = 'import com.mindvibe.kiaan.voice.KiaanVoicePackage';
const SAKHA_IMPORT = 'import com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage';
const FG_IMPORT =
  'import com.kiaanverse.sakha.audio.SakhaForegroundServicePackage';
const KIAAN_ADD = 'packages.add(KiaanVoicePackage())';
const SAKHA_ADD = 'packages.add(SakhaVoicePackage())';
const FG_ADD = 'packages.add(SakhaForegroundServicePackage())';

/**
 * Gradle module names for the workspace packages — derived from the
 * settings.gradle convention `@kiaanverse/foo-bar` -> `:kiaanverse-foo-bar`.
 *
 * The Expo autolinker adds these to settings.gradle automatically because
 * each package ships an expo-module.config.json with platforms:["android"].
 * It does NOT, however, write `implementation project(...)` into
 * apps/mobile/android/app/build.gradle, because both packages declare
 * `android.modules: []` (they expose old-style ReactPackage classes, not
 * new-style Expo Module classes — see the file header for why). Without
 * the implementation declaration, the workspace AARs are built but never
 * land on :app's compile classpath, and `import com.mindvibe.kiaan.voice.*`
 * inside MainApplication.kt fails with "Unresolved reference: sakha".
 *
 * We patch them in here so :app sees the AARs at compile time.
 */
const APP_GRADLE_DEPS = [
  "implementation project(':kiaanverse-kiaan-voice-native')",
  "implementation project(':kiaanverse-sakha-voice-native')",
];

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

/**
 * Inject `implementation project(':...')` lines into the host app's
 * `dependencies { ... }` block. Idempotent — re-running prebuild does
 * not duplicate the lines.
 */
function addGradleDependency(contents, dependencyLine) {
  if (contents.includes(dependencyLine)) return contents;
  // The Expo SDK 51 app/build.gradle template has a `dependencies {` block
  // near the top of which lives `implementation("com.facebook.react:react-android")`.
  // We insert our project-dependency right before the closing brace of
  // the FIRST dependencies block to land alongside the autolinked deps.
  const match = contents.match(/dependencies\s*\{[\s\S]*?\n\}/);
  if (!match) {
    // Defensive fallback: append a fresh dependencies block at end of file.
    return `${contents}\n\ndependencies {\n    ${dependencyLine}\n}\n`;
  }
  const insertAt = match.index + match[0].lastIndexOf('}');
  return (
    contents.slice(0, insertAt) +
    `    ${dependencyLine}\n` +
    contents.slice(insertAt)
  );
}

const withKiaanSakhaVoicePackages = (config) => {
  // 1. Patch MainApplication.kt — adds imports and packages.add() calls
  //    so the registration plumbing is present at runtime.
  config = withMainApplication(config, (cfg) => {
    if (cfg.modResults.language !== 'kt') {
      // Java MainApplication is not what Expo SDK 51 generates by default,
      // so we don't bother handling it. If a future template change reverts
      // to Java, this plugin would no-op and the build would compile but
      // the packages wouldn't be registered.
      return cfg;
    }
    let contents = cfg.modResults.contents;
    contents = addImport(contents, KIAAN_IMPORT);
    contents = addImport(contents, SAKHA_IMPORT);
    contents = addImport(contents, FG_IMPORT);
    contents = addPackageRegistration(contents, KIAAN_ADD);
    contents = addPackageRegistration(contents, SAKHA_ADD);
    contents = addPackageRegistration(contents, FG_ADD);
    cfg.modResults.contents = contents;
    return cfg;
  });

  // 2. Patch app/build.gradle — adds `implementation project(...)` so
  //    :app sees the workspace AARs on its compile classpath. Without
  //    this the imports above resolve to "Unresolved reference: sakha"
  //    even though the workspace modules build their own AARs cleanly.
  config = withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      return cfg;
    }
    let contents = cfg.modResults.contents;
    for (const dep of APP_GRADLE_DEPS) {
      contents = addGradleDependency(contents, dep);
    }
    cfg.modResults.contents = contents;
    return cfg;
  });

  return config;
};

module.exports = withKiaanSakhaVoicePackages;
module.exports.default = withKiaanSakhaVoicePackages;
