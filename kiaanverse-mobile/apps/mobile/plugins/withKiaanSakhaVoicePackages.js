/**
 * withKiaanSakhaVoicePackages — Expo config plugin.
 *
 * MODEL: pure manual gradle library registration (post-PR-#1698).
 *
 * The voice native modules at kiaanverse-mobile/native/{kiaan,sakha}-voice/
 * are NO LONGER pnpm workspace packages (PR #1698 removed `native/*` from
 * pnpm-workspace.yaml). This means:
 *
 *   • pnpm does not hoist them anywhere — no symlinks in node_modules
 *   • RN autolinker cannot find them (it scans node_modules)
 *   • Expo autolinker cannot find them either (no expo-module.config.json
 *     in their workspace dirs, and not in node_modules anyway)
 *
 * This plugin is therefore the SOLE registrant of the voice gradle modules
 * AND the SOLE registrant of their ReactPackage classes in MainApplication.
 *
 * Three injections per build:
 *
 *   1. withSettingsGradle — appends:
 *        include ':kiaanverse-kiaan-voice-native', ':kiaanverse-sakha-voice-native'
 *        project(':kiaanverse-kiaan-voice-native').projectDir = file(...)
 *        project(':kiaanverse-sakha-voice-native').projectDir = file(...)
 *      The relative path is resolved from the host android/ folder
 *      (apps/mobile/android/), going up three levels to the kiaanverse-mobile
 *      root and then into native/{X}-voice/android/.
 *
 *   2. withAppBuildGradle — appends a fresh `dependencies { ... }` block
 *      with `implementation project(':kiaanverse-{kiaan,sakha}-voice-native')`
 *      so :app sees the two AARs at compile time. Multiple `dependencies { }`
 *      blocks in one build.gradle are additive in Gradle, so this never
 *      collides with the autolinker's block (which doesn't include voice
 *      anyway since the autolinker can't see them).
 *
 *   3. withMainApplication — injects three imports and matching
 *      `add(...)` calls inside `PackageList(this).packages.apply { ... }`
 *      so the host app instantiates the ReactPackage classes at runtime:
 *        com.mindvibe.kiaan.voice.KiaanVoicePackage
 *        com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage
 *        com.kiaanverse.sakha.audio.SakhaForegroundServicePackage
 *
 *      The third package (SakhaForegroundServicePackage) lives in the
 *      LOCAL gradle module at apps/mobile/native/android/, which IS still
 *      autolinked through that module's expo-module.config.json (which
 *      ships KiaanAudioPlayerPackage as an Expo Module). We need the
 *      add() line for the foreground-service package because it's a
 *      regular ReactPackage, not an Expo Module — the autolinker's
 *      generated PackageList doesn't auto-instantiate it.
 *
 * MainApplication.kt template handling: Expo SDK 51's prebuild generates
 *
 *   override fun getPackages(): List<ReactPackage> {
 *     // ...comment...
 *     return PackageList(this).packages
 *   }
 *
 * (no .apply{} block, no `val packages = ...`). We rewrite the return
 * to wrap in `.apply { add(...) }` so all three add() calls land inside
 * the closure where the receiver is the MutableList<ReactPackage>.
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
const FG_IMPORT = 'import com.kiaanverse.sakha.audio.SakhaForegroundServicePackage';
const KIAAN_ADD = 'add(KiaanVoicePackage())';
const SAKHA_ADD = 'add(SakhaVoicePackage())';
const FG_ADD = 'add(SakhaForegroundServicePackage())';

/** Gradle module entries we register. `name` is the gradle project name
 *  (used in `:<name>` references), `dir` is the relative path from the
 *  host app's android/ folder (where settings.gradle lives) to the
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
  const lastImportMatch = [...contents.matchAll(/^import\s+\S+/gm)].pop();
  if (lastImportMatch) {
    const insertAt = lastImportMatch.index + lastImportMatch[0].length;
    return contents.slice(0, insertAt) + '\n' + importLine + contents.slice(insertAt);
  }
  return contents.replace(/^(package\s+\S+)/m, `$1\n\n${importLine}`);
}

function addAllPackageRegistrations(contents, addLines) {
  // Skip if all already present.
  if (addLines.every((line) => contents.includes(line))) return contents;

  // Pattern 1: SDK 51 form — `return PackageList(this).packages`
  // Wrap in .apply{ add(...); add(...); ... }
  const returnMatch = contents.match(/return\s+PackageList\(this\)\.packages\s*$/m);
  if (returnMatch) {
    const adds = addLines
      .filter((line) => !contents.includes(line))
      .map((line) => `            ${line}`)
      .join('\n');
    return contents.replace(
      /return\s+PackageList\(this\)\.packages\s*$/m,
      `return PackageList(this).packages.apply {\n${adds}\n          }`,
    );
  }

  // Pattern 2: existing .apply{} block — inject inside it.
  const applyMatch = contents.match(/PackageList\(this\)\.packages\.apply\s*\{\s*\n/);
  if (applyMatch) {
    const insertAt = applyMatch.index + applyMatch[0].length;
    const adds = addLines
      .filter((line) => !contents.includes(line))
      .map((line) => `            ${line}\n`)
      .join('');
    return contents.slice(0, insertAt) + adds + contents.slice(insertAt);
  }

  // Pattern 3: older `val packages = ...` form.
  const valMatch = contents.match(/val\s+packages\s*=\s*PackageList\(this\)\.packages/);
  if (valMatch) {
    const insertAt = valMatch.index + valMatch[0].length;
    const adds = addLines
      .filter((line) => !contents.includes(line))
      .map((line) => `\n          packages.${line}`)
      .join('');
    return contents.slice(0, insertAt) + adds + contents.slice(insertAt);
  }

  throw new Error(
    '[withKiaanSakhaVoicePackages] Could not find an injection point in ' +
    'MainApplication.kt for voice ReactPackage add() calls. ' +
    'Expected `return PackageList(this).packages`, ' +
    '`PackageList(this).packages.apply { ... }`, or ' +
    '`val packages = PackageList(this).packages`. Inspect the prebuild ' +
    'output and update this plugin if Expo changed the template.',
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
    '// Voice native modules (kiaanverse-mobile/native/{kiaan,sakha}-voice/)',
    '// are NOT pnpm workspace packages and NOT autolinked by anything.',
    '// We register them here as pure gradle library modules. Sources are',
    '// at the workspace path; gradle reads them directly via projectDir.',
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
 * project deps. Gradle merges multiple dependencies blocks additively.
 * Idempotent via APP_GRADLE_MARKER.
 */
function appendGradleDependencies(contents) {
  if (contents.includes(APP_GRADLE_MARKER)) return contents;
  const lines = [
    '',
    APP_GRADLE_MARKER,
    '// Voice native modules registered manually by',
    '// withKiaanSakhaVoicePackages.js — see settings.gradle injection above.',
    'dependencies {',
    ...WORKSPACE_MODULES.map((m) => `    implementation project(':${m.name}')`),
    '}',
    APP_GRADLE_MARKER_END,
    '',
  ];
  return contents.replace(/\s*$/, '\n') + lines.join('\n') + '\n';
}

const withKiaanSakhaVoicePackages = (config) => {
  // 1. settings.gradle — register the two voice gradle modules.
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

  // 3. MainApplication.kt — inject imports + add() calls.
  config = withMainApplication(config, (cfg) => {
    if (cfg.modResults.language !== 'kt') return cfg;
    let contents = cfg.modResults.contents;
    contents = addImport(contents, KIAAN_IMPORT);
    contents = addImport(contents, SAKHA_IMPORT);
    contents = addImport(contents, FG_IMPORT);
    contents = addAllPackageRegistrations(contents, [KIAAN_ADD, SAKHA_ADD, FG_ADD]);
    cfg.modResults.contents = contents;
    return cfg;
  });

  return config;
};

module.exports = withKiaanSakhaVoicePackages;
module.exports.default = withKiaanSakhaVoicePackages;
