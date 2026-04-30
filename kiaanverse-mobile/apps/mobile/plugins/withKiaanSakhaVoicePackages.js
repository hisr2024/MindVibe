/**
 * withKiaanSakhaVoicePackages — Expo config plugin.
 *
 * The two workspace voice modules (@kiaanverse/{kiaan,sakha}-voice-native)
 * expose old-style RN bridge `ReactPackage` classes, not new-API Expo
 * `Module` subclasses. That gives us a tight constraint:
 *
 *   • `expo-module.config.json` `android.modules` is strictly typed by
 *     the autolinker as `Class<? extends expo.modules.kotlin.modules.Module>`.
 *     If we list a ReactPackage there, ExpoModulesPackageList.java fails
 *     to compile with:
 *
 *       error: method asList in class Arrays cannot be applied to given types;
 *       reason: Class<KiaanVoicePackage> cannot be converted to Class<? extends Module>
 *
 *   • If we leave `android.modules: []`, the autolinker DOES still add
 *     the workspace package to settings.gradle (via the platforms list)
 *     but does NOT add an `implementation project(...)` line to the
 *     host app's build.gradle. The workspace AAR is built but not on
 *     :app's compile classpath, and `import com.mindvibe.kiaan.voice.*`
 *     fails inside MainApplication.kt with "Unresolved reference: sakha".
 *
 * Neither auto-pathway works on its own. This plugin bridges the gap:
 *
 *   1. withMainApplication — injects the three imports and the matching
 *      `packages.add(...)` calls into MainApplication.kt, so the
 *      registration plumbing exists at runtime.
 *
 *   2. withAppBuildGradle — APPENDS a fresh `dependencies { }` block at
 *      the end of apps/mobile/android/app/build.gradle. Gradle allows
 *      multiple dependencies blocks (they're additive), so this is
 *      bulletproof and doesn't rely on any regex matching the exact
 *      shape of the autolinker's generated block.
 *
 * Three packages are registered:
 *
 *   • com.mindvibe.kiaan.voice.KiaanVoicePackage         (workspace)
 *   • com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage   (workspace)
 *   • com.kiaanverse.sakha.audio.SakhaForegroundServicePackage (local)
 *
 * The third one lives in the local `apps/mobile/native/android/` gradle
 * module, which IS already on :app's classpath via the host app's
 * implicit project dependency (the local module ships
 * KiaanAudioPlayerPackage too and that build phase is green). So we
 * only need to inject `implementation project(...)` for the two
 * workspace modules.
 *
 * Idempotent — re-running prebuild does not duplicate any line.
 */

const { withMainApplication, withAppBuildGradle } = require('@expo/config-plugins');

const KIAAN_IMPORT = 'import com.mindvibe.kiaan.voice.KiaanVoicePackage';
const SAKHA_IMPORT = 'import com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage';
const FG_IMPORT =
  'import com.kiaanverse.sakha.audio.SakhaForegroundServicePackage';
const KIAAN_ADD = 'packages.add(KiaanVoicePackage())';
const SAKHA_ADD = 'packages.add(SakhaVoicePackage())';
const FG_ADD = 'packages.add(SakhaForegroundServicePackage())';

const APP_GRADLE_DEPS = [
  "implementation project(':kiaanverse-kiaan-voice-native')",
  "implementation project(':kiaanverse-sakha-voice-native')",
];

/** Idempotent marker the appended dependencies block is wrapped in.
 *  Detecting it lets us skip re-appending on subsequent prebuilds. */
const APP_GRADLE_MARKER = '// kiaanverse-voice-native-deps:start';
const APP_GRADLE_MARKER_END = '// kiaanverse-voice-native-deps:end';

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
 * Append a fresh `dependencies { ... }` block to the end of
 * apps/mobile/android/app/build.gradle. Gradle merges all dependencies
 * blocks in a single build.gradle, so this safely adds the workspace
 * project deps without touching whatever block(s) the autolinker /
 * Expo template wrote earlier in the file.
 *
 * Idempotent via APP_GRADLE_MARKER. If the block is already there we
 * return contents unchanged.
 */
function appendGradleDependencies(contents) {
  if (contents.includes(APP_GRADLE_MARKER)) return contents;
  const block = [
    '',
    APP_GRADLE_MARKER,
    '// Workspace voice modules expose ReactPackage (not Module) classes,',
    "// so they can't be auto-added via expo-module.config.json's",
    '// android.modules without breaking ExpoModulesPackageList.java',
    '// compilation. Instead we register the gradle project deps here so',
    "// :app's compile classpath sees the workspace AARs at compile time.",
    '// Generated by withKiaanSakhaVoicePackages.js.',
    'dependencies {',
    ...APP_GRADLE_DEPS.map((dep) => `    ${dep}`),
    '}',
    APP_GRADLE_MARKER_END,
    '',
  ].join('\n');
  return contents.replace(/\s*$/, '\n') + block + '\n';
}

const withKiaanSakhaVoicePackages = (config) => {
  // 1. Patch MainApplication.kt with imports + packages.add() calls.
  config = withMainApplication(config, (cfg) => {
    if (cfg.modResults.language !== 'kt') return cfg;
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

  // 2. Append `implementation project(...)` to app/build.gradle.
  config = withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    cfg.modResults.contents = appendGradleDependencies(cfg.modResults.contents);
    return cfg;
  });

  return config;
};

module.exports = withKiaanSakhaVoicePackages;
module.exports.default = withKiaanSakhaVoicePackages;
