/**
 * withKiaanSakhaVoicePackages — Expo config plugin (post-PR-#1700).
 *
 * MODEL: comprehensive, autolinker-free in-tree native module registration.
 *
 * After PR #1699 ALL voice native code lives in ONE Android library at
 * `apps/mobile/native/android/` (22 Kotlin files across three packages:
 * com.kiaanverse.sakha.audio, com.mindvibe.kiaan.voice,
 * com.mindvibe.kiaan.voice.sakha).
 *
 * That directory is NOT in `node_modules` and is NOT a pnpm workspace
 * package. Therefore:
 *   • RN's autolinker (@react-native-community/cli-platform-android) does
 *     NOT discover it (it scans node_modules + workspace packages).
 *   • Expo's autolinker (expo-modules-autolinking) does NOT discover it
 *     (it scans node_modules + paths under expo.autolinking.searchPaths,
 *     and even with searchPaths the directory layout doesn't match what
 *     the autolinker expects — config + build.gradle would have to live
 *     at <module-root>/expo-module.config.json + <module-root>/android/
 *     build.gradle, NOT at the same level as they are now).
 *
 * Build #16 proved both: the "Using expo modules" header in the EAS log
 * listed only standard expo-* modules, the merged voice subproject was
 * never compiled into any AAR, and MainApplication.kt failed with
 *   Unresolved reference: KiaanVoicePackage / SakhaVoicePackage /
 *   SakhaForegroundServicePackage / mindvibe / sakha
 * because the imports the plugin injected referenced classes that didn't
 * exist on :app's compile classpath.
 *
 * This plugin therefore does the autolinker's job, manually and
 * deterministically. It patches three files of the prebuild output:
 *
 *   1. android/settings.gradle
 *        Registers a gradle subproject `:kiaan-voice-native` whose
 *        projectDir is `../native/android` (resolved relative to
 *        `rootProject.projectDir`, which is `apps/mobile/android/`).
 *
 *   2. android/app/build.gradle
 *        Adds `implementation project(':kiaan-voice-native')` to :app's
 *        dependencies block, so the subproject's AAR (containing all 22
 *        voice Kotlin classes) lands on :app's compile + runtime
 *        classpath.
 *
 *   3. MainApplication.kt
 *        Adds imports for ALL FOUR voice ReactPackages
 *        (KiaanAudioPlayerPackage, KiaanVoicePackage, SakhaVoicePackage,
 *         SakhaForegroundServicePackage) and `add(...)` calls inside
 *        `PackageList(this).packages.apply { ... }` so the RN bridge
 *        registers them at startup.
 *
 *        NOTE: the previous version of this plugin (post-#1699) only
 *        added 3 packages, silently dropping KiaanAudioPlayerPackage —
 *        which is the package responsible for `NativeModules
 *        .KiaanAudioPlayer` (the Media3 audio backbone Sakha uses for
 *        every TTS chunk). The fourth registration is required.
 *
 * Why this WON'T resurrect the duplicate-registration bug from builds 1-15:
 *
 *   • The pre-#1696 collision was RN autolinker (slash→underscore name
 *     mangling: `:kiaanverse_kiaan-voice-native`) and Expo autolinker
 *     (slash→hyphen name mangling: `:kiaanverse-kiaan-voice-native`)
 *     both registering the SAME workspace package
 *     `kiaanverse-mobile/native/{kiaan,sakha}-voice/` through pnpm
 *     symlinks → AGP namespace collision → unresolved reference.
 *   • PR #1699 deleted those workspace dirs entirely, removed the
 *     `native/*` glob from `pnpm-workspace.yaml`, and `eas-build-{pre,
 *     post}-install.sh` actively nuke any cached @kiaanverse-scoped
 *     voice symlinks pre/post-pnpm-install.
 *   • The new in-tree module at `apps/mobile/native/android/` is
 *     invisible to BOTH autolinkers (proven by build #16's "Using expo
 *     modules" output). This plugin is therefore the ONLY registration
 *     path — there's nothing for it to collide with.
 *
 * All three patches are idempotent — re-running prebuild does not
 * duplicate any line.
 */

const {
  withMainApplication,
  withSettingsGradle,
  withAppBuildGradle,
} = require('@expo/config-plugins');

// ─── Gradle subproject metadata ─────────────────────────────────────────

const GRADLE_MODULE_NAME = ':kiaan-voice-native';
// Path resolved relative to `rootProject.projectDir`, which during
// prebuild is `apps/mobile/android/`. `../native/android` therefore
// points at `apps/mobile/native/android/` — both locally and on EAS.
const GRADLE_MODULE_REL_PATH = '../native/android';

const SETTINGS_INCLUDE = `include '${GRADLE_MODULE_NAME}'`;
const SETTINGS_PROJECT_DIR =
  `project('${GRADLE_MODULE_NAME}').projectDir = new File(rootProject.projectDir, '${GRADLE_MODULE_REL_PATH}')`;
const SETTINGS_MARKER =
  '// kiaan-voice-native (in-tree, manually registered by withKiaanSakhaVoicePackages)';

const APP_DEP_LINE = `    implementation project('${GRADLE_MODULE_NAME}')`;
const APP_DEP_MARKER =
  '    // kiaan-voice-native (in-tree, manually registered by withKiaanSakhaVoicePackages)';

// ─── MainApplication.kt registrations ───────────────────────────────────

const IMPORTS = [
  'import com.kiaanverse.sakha.audio.KiaanAudioPlayerPackage',
  'import com.kiaanverse.sakha.audio.SakhaForegroundServicePackage',
  'import com.mindvibe.kiaan.voice.KiaanVoicePackage',
  'import com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage',
];

const ADD_LINES = [
  'add(KiaanAudioPlayerPackage())',
  'add(KiaanVoicePackage())',
  'add(SakhaVoicePackage())',
  'add(SakhaForegroundServicePackage())',
];

// ─── settings.gradle patch ──────────────────────────────────────────────

function patchSettingsGradle(contents) {
  if (contents.includes(SETTINGS_INCLUDE)) {
    return contents;
  }

  const block =
    '\n' +
    SETTINGS_MARKER + '\n' +
    SETTINGS_INCLUDE + '\n' +
    SETTINGS_PROJECT_DIR + '\n';

  // Inject right after `include ':app'`, which Expo SDK 51 prebuild
  // always emits.
  const appIncludeRe = /(include\s+['"]:app['"][^\n]*\n)/;
  if (appIncludeRe.test(contents)) {
    return contents.replace(appIncludeRe, `$1${block}`);
  }

  // Fallback: append at end. Gradle parses settings.gradle top-to-bottom
  // before evaluating any project, so order doesn't matter for correctness.
  return contents + '\n' + block;
}

// ─── app/build.gradle patch ─────────────────────────────────────────────

function patchAppBuildGradle(contents) {
  if (contents.includes(APP_DEP_LINE)) {
    return contents;
  }

  const block = `\n${APP_DEP_MARKER}\n${APP_DEP_LINE}\n`;

  // Inject as the FIRST line inside the top-level `dependencies { ... }`
  // block of :app. Expo SDK 51 prebuild emits exactly one such block.
  const depRe = /(\bdependencies\s*\{\s*\n)/;
  if (depRe.test(contents)) {
    return contents.replace(depRe, `$1${block}`);
  }

  throw new Error(
    '[withKiaanSakhaVoicePackages] Could not find a `dependencies {` ' +
      'block in app/build.gradle to inject ' +
      `\`implementation project('${GRADLE_MODULE_NAME}')\`. ` +
      'Expo prebuild output may have changed shape.',
  );
}

// ─── MainApplication.kt patch ───────────────────────────────────────────

function addImport(contents, importLine) {
  if (contents.includes(importLine)) return contents;
  const lastImport = [...contents.matchAll(/^import\s+\S+/gm)].pop();
  if (lastImport) {
    const insertAt = lastImport.index + lastImport[0].length;
    return (
      contents.slice(0, insertAt) +
      '\n' +
      importLine +
      contents.slice(insertAt)
    );
  }
  return contents.replace(/^(package\s+\S+)/m, `$1\n\n${importLine}`);
}

function addAllImports(contents) {
  for (const importLine of IMPORTS) {
    contents = addImport(contents, importLine);
  }
  return contents;
}

function addAllPackageRegistrations(contents) {
  if (ADD_LINES.every((l) => contents.includes(l))) return contents;
  const missing = ADD_LINES.filter((l) => !contents.includes(l));

  // Pattern 1 (Expo SDK 51 prebuild default):
  //   return PackageList(this).packages
  const returnRe = /return\s+PackageList\(this\)\.packages\s*$/m;
  if (returnRe.test(contents)) {
    const adds = missing.map((l) => `            ${l}`).join('\n');
    return contents.replace(
      returnRe,
      `return PackageList(this).packages.apply {\n${adds}\n          }`,
    );
  }

  // Pattern 2: existing .apply {} block from a prior plugin run.
  const applyRe = /PackageList\(this\)\.packages\.apply\s*\{\s*\n/;
  const applyMatch = contents.match(applyRe);
  if (applyMatch) {
    const insertAt = applyMatch.index + applyMatch[0].length;
    const adds = missing.map((l) => `            ${l}\n`).join('');
    return contents.slice(0, insertAt) + adds + contents.slice(insertAt);
  }

  // Pattern 3: older `val packages = ...` form.
  const valRe = /val\s+packages\s*=\s*PackageList\(this\)\.packages/;
  const valMatch = contents.match(valRe);
  if (valMatch) {
    const insertAt = valMatch.index + valMatch[0].length;
    const adds = missing.map((l) => `\n          packages.${l}`).join('');
    return contents.slice(0, insertAt) + adds + contents.slice(insertAt);
  }

  throw new Error(
    '[withKiaanSakhaVoicePackages] Could not find an injection point in ' +
      'MainApplication.kt for voice ReactPackage add() calls. Expected ' +
      '`return PackageList(this).packages`, ' +
      '`PackageList(this).packages.apply { ... }`, or ' +
      '`val packages = PackageList(this).packages`.',
  );
}

// ─── Plugin entry ───────────────────────────────────────────────────────

const withKiaanSakhaVoicePackages = (config) => {
  // 1. settings.gradle — register the gradle subproject.
  config = withSettingsGradle(config, (cfg) => {
    cfg.modResults.contents = patchSettingsGradle(cfg.modResults.contents);
    return cfg;
  });

  // 2. app/build.gradle — depend on the subproject so its AAR lands on
  //    :app's compile + runtime classpath.
  config = withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    cfg.modResults.contents = patchAppBuildGradle(cfg.modResults.contents);
    return cfg;
  });

  // 3. MainApplication.kt — import + register all four ReactPackages.
  config = withMainApplication(config, (cfg) => {
    if (cfg.modResults.language !== 'kt') return cfg;
    let contents = cfg.modResults.contents;
    contents = addAllImports(contents);
    contents = addAllPackageRegistrations(contents);
    cfg.modResults.contents = contents;
    return cfg;
  });

  // Visible breadcrumb in the EAS prebuild log so it's obvious this
  // plugin actually fired. If you don't see this line in the build log,
  // the plugin was never invoked and a build will fail with the
  // "Unresolved reference" symptoms from build #16.
  // eslint-disable-next-line no-console
  console.log(
    '[withKiaanSakhaVoicePackages] Registered in-tree gradle subproject ' +
      `${GRADLE_MODULE_NAME} (projectDir=${GRADLE_MODULE_REL_PATH}) and ` +
      `injected ${IMPORTS.length} imports + ${ADD_LINES.length} ReactPackage ` +
      'add() calls into MainApplication.kt.',
  );

  return config;
};

module.exports = withKiaanSakhaVoicePackages;
module.exports.default = withKiaanSakhaVoicePackages;

// Pure patch functions exported for offline validation
// (apps/mobile/scripts/validate-voice-plugin.mjs).
module.exports.__internals = {
  IMPORTS,
  ADD_LINES,
  SETTINGS_INCLUDE,
  SETTINGS_PROJECT_DIR,
  APP_DEP_LINE,
  patchSettingsGradle,
  patchAppBuildGradle,
  addAllImports,
  addAllPackageRegistrations,
};
