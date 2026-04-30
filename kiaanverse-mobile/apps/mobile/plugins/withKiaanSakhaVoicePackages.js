/**
 * withKiaanSakhaVoicePackages — Expo config plugin.
 *
 * MODEL: pure manual gradle library registration.
 *
 * The two workspace voice modules
 * (kiaanverse-mobile/native/{kiaan,sakha}-voice/android/) are deliberately
 * NOT discoverable by Expo's autolinker — there is no
 * `expo-module.config.json` at either workspace path. This is the
 * fix for the dual-registration bug:
 *
 *   In a pnpm workspace, the autolinker finds each module twice:
 *     1. via the workspace path (kiaanverse-mobile/native/{X}-voice/)
 *     2. via the pnpm symlink (apps/mobile/node_modules/@kiaanverse/{X}-voice-native/)
 *   Both paths point at the same source tree, but the autolinker mangles
 *   the gradle project name differently for each (slash→`-` vs slash→`_`),
 *   so settings.gradle ends up with TWO entries per module:
 *     :kiaanverse-{X}-voice-native   AND   :kiaanverse_{X}-voice-native
 *   Both AARs build with the same Android `namespace`, AGP detects the
 *   namespace collision, and one set of classes gets pruned from :app's
 *   compile classpath. The result was the persistent
 *   `Unresolved reference: sakha` failure at :app:compileReleaseKotlin
 *   across builds #1 through #7.
 *
 * Removing the autolinker hook (deleting `expo-module.config.json` from
 * both workspace dirs) eliminates double-discovery at the source. This
 * plugin then takes over the three registration responsibilities the
 * autolinker would otherwise have done:
 *
 *   1. withSettingsGradle — appends
 *        include ':kiaanverse-kiaan-voice-native', ':kiaanverse-sakha-voice-native'
 *        project(':kiaanverse-kiaan-voice-native').projectDir = file(...)
 *        project(':kiaanverse-sakha-voice-native').projectDir = file(...)
 *      so gradle knows about the two library modules. The relative path
 *      is resolved from the host android/ folder — which on EAS Build is
 *      `apps/mobile/android/`, so we go up three levels to the
 *      kiaanverse-mobile root and then into native/{X}-voice/android/.
 *
 *   2. withAppBuildGradle — appends a fresh `dependencies { ... }` block
 *      with `implementation project(':kiaanverse-{kiaan,sakha}-voice-native')`
 *      so :app sees the two AARs at compile time. Multiple
 *      `dependencies { }` blocks in one build.gradle are additive in
 *      Gradle, so this never collides with the autolinker's block.
 *
 *   3. withMainApplication — injects three imports and matching
 *      `packages.add(...)` calls so the host app instantiates the
 *      ReactPackage classes at runtime:
 *        com.mindvibe.kiaan.voice.KiaanVoicePackage         (workspace)
 *        com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage   (workspace)
 *        com.kiaanverse.sakha.audio.SakhaForegroundServicePackage (local)
 *
 * The third package (SakhaForegroundServicePackage) lives in the local
 * gradle module at `apps/mobile/native/android/`, which IS still
 * autolinked through `apps/mobile/native/android/expo-module.config.json`
 * (that one ships KiaanAudioPlayerPackage as an Expo Module). We only
 * need the `packages.add(...)` line for the foreground-service package
 * because it's a ReactPackage, not a Module — the autolinker's
 * `PackageList(this).packages` doesn't auto-instantiate it.
 *
 * Idempotent — re-running prebuild does not duplicate any line.
 */

const {
  withMainApplication,
  withAppBuildGradle,
  withSettingsGradle,
} = require('@expo/config-plugins');

const KIAAN_IMPORT = 'import com.mindvibe.kiaan.voice.KiaanVoicePackage';
const SAKHA_IMPORT = 'import com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage';
const FG_IMPORT =
  'import com.kiaanverse.sakha.audio.SakhaForegroundServicePackage';
const KIAAN_ADD = 'packages.add(KiaanVoicePackage())';
const SAKHA_ADD = 'packages.add(SakhaVoicePackage())';
const FG_ADD = 'packages.add(SakhaForegroundServicePackage())';

/** Gradle module entries we register. Each `name` is the gradle project
 *  name (used in `:<name>` references), `dir` is the relative path from
 *  the host app's android/ folder (where settings.gradle lives) to the
 *  workspace module's android/ folder. */
const WORKSPACE_MODULES = [
  {
    name: 'kiaanverse-kiaan-voice-native',
    dir: '../../../native/kiaan-voice/android',
  },
  {
    name: 'kiaanverse-sakha-voice-native',
    dir: '../../../native/sakha-voice/android',
  },
];

/** Idempotent markers so re-running prebuild doesn't duplicate lines. */
const SETTINGS_MARKER = '// kiaanverse-voice-native-modules:start';
const SETTINGS_MARKER_END = '// kiaanverse-voice-native-modules:end';
const APP_GRADLE_MARKER = '// kiaanverse-voice-native-deps:start';
const APP_GRADLE_MARKER_END = '// kiaanverse-voice-native-deps:end';

function addImport(contents, importLine) {
  if (contents.includes(importLine)) return contents;
  // Insert after the last existing import. The plugin runs three
  // addImport calls; each new import becomes the "last", so subsequent
  // imports are appended in order.
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
  // Expo SDK 51's MainApplication.kt template has:
  //   val packages = PackageList(this).packages
  //   // Packages that cannot be autolinked yet can be added manually here, ...
  //   return packages
  // We insert our packages.add(...) call right after the val declaration.
  return contents.replace(
    /(val\s+packages\s*=\s*PackageList\(this\)\.packages)/,
    `$1\n          ${addLine}`,
  );
}

/**
 * Append `include ':...'` and `project(':...').projectDir = file('...')`
 * to settings.gradle. Idempotent via SETTINGS_MARKER.
 */
function appendSettingsGradleIncludes(contents) {
  if (contents.includes(SETTINGS_MARKER)) return contents;
  const lines = [
    '',
    SETTINGS_MARKER,
    '// Workspace voice modules (kiaanverse-mobile/native/{kiaan,sakha}-voice/)',
    '// are NOT autolinked — they have no expo-module.config.json. We',
    '// register them here as pure gradle library modules so the autolinker',
    '// cannot double-register them via the pnpm symlink path. See',
    '// withKiaanSakhaVoicePackages.js header for the full failure mode.',
    `include ${WORKSPACE_MODULES.map((m) => `':${m.name}'`).join(', ')}`,
    ...WORKSPACE_MODULES.map(
      (m) => `project(':${m.name}').projectDir = new File(rootProject.projectDir, '${m.dir}')`,
    ),
    SETTINGS_MARKER_END,
    '',
  ];
  return contents.replace(/\s*$/, '\n') + lines.join('\n') + '\n';
}

/**
 * Append a fresh `dependencies { ... }` block with the workspace
 * project deps. Gradle merges multiple dependencies blocks additively,
 * so this is safe alongside whatever the autolinker / Expo template
 * wrote earlier in the file. Idempotent via APP_GRADLE_MARKER.
 */
function appendGradleDependencies(contents) {
  if (contents.includes(APP_GRADLE_MARKER)) return contents;
  const lines = [
    '',
    APP_GRADLE_MARKER,
    '// Workspace voice ReactPackage modules registered manually (see',
    '// settings.gradle injection above and withKiaanSakhaVoicePackages.js',
    '// header for why autolinker is bypassed).',
    'dependencies {',
    ...WORKSPACE_MODULES.map((m) => `    implementation project(':${m.name}')`),
    '}',
    APP_GRADLE_MARKER_END,
    '',
  ];
  return contents.replace(/\s*$/, '\n') + lines.join('\n') + '\n';
}

const withKiaanSakhaVoicePackages = (config) => {
  // 1. settings.gradle — add the two workspace modules as gradle subprojects.
  config = withSettingsGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    cfg.modResults.contents = appendSettingsGradleIncludes(cfg.modResults.contents);
    return cfg;
  });

  // 2. app/build.gradle — add `implementation project(...)` deps.
  config = withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    cfg.modResults.contents = appendGradleDependencies(cfg.modResults.contents);
    return cfg;
  });

  // 3. MainApplication.kt — inject imports + packages.add() calls so the
  //    three ReactPackage classes get registered at runtime.
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

  return config;
};

module.exports = withKiaanSakhaVoicePackages;
module.exports.default = withKiaanSakhaVoicePackages;
