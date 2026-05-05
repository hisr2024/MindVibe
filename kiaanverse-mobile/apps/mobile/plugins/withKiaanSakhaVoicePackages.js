/**
 * withKiaanSakhaVoicePackages — Expo config plugin (post-PR-#1699).
 *
 * MODEL: minimal MainApplication.kt patch only.
 *
 * After PR #1699 ALL voice native code lives in the SINGLE local Expo
 * module at `apps/mobile/native/android/`:
 *
 *   apps/mobile/native/android/src/main/java/
 *     com/kiaanverse/sakha/audio/      ← KiaanAudioPlayerPackage,
 *                                         SakhaForegroundServicePackage,
 *                                         + Modules + Service
 *     com/mindvibe/kiaan/voice/        ← KiaanVoicePackage + Manager + ML
 *     com/mindvibe/kiaan/voice/sakha/  ← SakhaVoicePackage + Manager + SSE
 *
 * The local module's `expo-module.config.json` registers
 * `com.kiaanverse.sakha.audio.KiaanAudioPlayerPackage` as an Expo Module,
 * which causes the Expo autolinker to:
 *   • Compile the module's gradle subproject (one project, one AAR with
 *     all voice Kotlin classes inside)
 *   • Add KiaanAudioPlayerPackage to the generated ExpoModulesPackageList
 *
 * The other three voice ReactPackages (KiaanVoicePackage, SakhaVoicePackage,
 * SakhaForegroundServicePackage) are regular RN-style ReactPackages, NOT
 * Expo Modules. The autolinker ignores them. This plugin patches
 * MainApplication.kt to add the three `add(...)` calls inside
 * `PackageList(this).packages.apply { ... }` so they get registered at
 * runtime alongside everything else in PackageList.
 *
 * No more workspace-package gradle module registration:
 *
 *   • PR #1699 deleted `kiaanverse-mobile/native/{kiaan,sakha}-voice/`
 *   • No more `:kiaanverse-{kiaan,sakha}-voice-native` gradle modules
 *   • No more `:kiaanverse_{kiaan,sakha}-voice-native` (autolinker name
 *     for cached @kiaanverse-scoped pre-#1696 symlinks) — even if EAS's
 *     cache resurrects that symlink, RN autolinker would find a broken
 *     link (no target dir) and skip it
 *   • The plugin no longer needs `withSettingsGradle` or
 *     `withAppBuildGradle` — those PRs (#1689, #1698) restored and removed
 *     them several times chasing the duplicate-registration bug. With the
 *     workspace dirs physically gone, there's nothing to register.
 *
 * MainApplication.kt template handling: Expo SDK 51's prebuild generates
 *
 *   override fun getPackages(): List<ReactPackage> {
 *     // ...comment...
 *     return PackageList(this).packages
 *   }
 *
 * (no .apply{} block). We rewrite the return to wrap in
 * `.apply { add(...) }` for all three voice ReactPackages.
 *
 * Idempotent — re-running prebuild does not duplicate any line.
 */

const { withMainApplication } = require('@expo/config-plugins');

const KIAAN_IMPORT = 'import com.mindvibe.kiaan.voice.KiaanVoicePackage';
const SAKHA_IMPORT = 'import com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage';
const FG_IMPORT = 'import com.kiaanverse.sakha.audio.SakhaForegroundServicePackage';
const KIAAN_ADD = 'add(KiaanVoicePackage())';
const SAKHA_ADD = 'add(SakhaVoicePackage())';
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

function addAllPackageRegistrations(contents, addLines) {
  if (addLines.every((line) => contents.includes(line))) return contents;

  // Pattern 1: SDK 51 form — `return PackageList(this).packages`
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

  // Pattern 2: existing .apply{} block.
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
    '`val packages = PackageList(this).packages`.',
  );
}

const withKiaanSakhaVoicePackages = (config) => {
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
