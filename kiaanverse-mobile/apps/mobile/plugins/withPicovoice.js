/**
 * withPicovoice — Expo config plugin.
 *
 * Wires Cobra (VAD — voice activity detection) and optional Porcupine
 * (wake-word "Hey Sakha") into the Android build.
 *
 * What this fixes:
 *   • Picovoice SDKs ship as native .so libraries that are loaded via
 *     System.loadLibrary(). Without explicit Gradle abi splits +
 *     R8 keep rules they get either:
 *       - stripped from the AAB (UnsatisfiedLinkError on first
 *         provider.start() call), or
 *       - included for every ABI in the universal APK (45MB+ bloat
 *         on Play Store).
 *   • The access-key string MUST be injected at build time as a
 *     BuildConfig field so it is visible to JNI without reading
 *     SharedPreferences. Reading it from JS at runtime hits the JSI
 *     bridge on every Cobra frame and burns 2-3% CPU on mid-tier
 *     devices.
 *
 * What it does:
 *   • dangerous-mod (build.gradle): inject splits.abi for the four
 *     ABIs the Picovoice .so libraries support (arm64-v8a,
 *     armeabi-v7a, x86, x86_64) and a BuildConfig field
 *     `KIAAN_PICOVOICE_ACCESS_KEY`.
 *   • dangerous-mod (AndroidManifest): add the optional wake-word
 *     <meta-data> so the native module knows whether to start
 *     Porcupine alongside Cobra.
 *
 * Plugin API:
 *   - default export = config → config
 *   - takes optional `{ enableWakeWord?: boolean, wakeWordKeyword?: string }`
 *
 * Usage in app.config.ts:
 *   plugins: [
 *     ...,
 *     ['./plugins/withPicovoice', { enableWakeWord: false }],
 *   ]
 */

const {
  withAndroidManifest,
  withAppBuildGradle,
  AndroidConfig,
} = require('@expo/config-plugins');

const META_ENABLE_WAKEWORD = 'com.kiaanverse.sakha.picovoice.enableWakeWord';
const META_WAKEWORD_KEYWORD = 'com.kiaanverse.sakha.picovoice.wakeWordKeyword';

const PICOVOICE_ABI_SPLIT_BLOCK = `
// ─── Picovoice ABI splits — sakha (do not edit by hand) ─────────────
// Reduces AAB size by shipping native .so libraries only for the four
// ABIs Picovoice supports. Removing this block grows the bundle by
// ~30MB.
android {
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk false
        }
    }
}
// ────────────────────────────────────────────────────────────────────
`.trim();

function ensureGradleAbiSplits(buildGradle) {
  if (buildGradle.includes('Picovoice ABI splits — sakha')) {
    return buildGradle; // idempotent — already injected
  }
  // Insert at the very end so it's outside the autolinked `android { ... }`
  // block and Gradle reads our additions LAST. Gradle DSL allows multiple
  // top-level `android` blocks; the last wins for splits config.
  return buildGradle.trimEnd() + '\n\n' + PICOVOICE_ABI_SPLIT_BLOCK + '\n';
}

function ensureBuildConfigField(buildGradle, accessKey, consumeAccessKey) {
  // No-op when:
  //   • no key is provided (dev / CI / EAS Secret unset), or
  //   • Phase 2B Porcupine integration hasn't shipped yet, in which
  //     case no Kotlin code reads BuildConfig.KIAAN_PICOVOICE_ACCESS_KEY
  //     and baking the secret into the AAB just exposes it without
  //     value. The current production wake-word path uses Google
  //     SpeechRecognizer (Android 11+ on-device STT) — see
  //     SakhaWakeWordDetector.kt — and Cobra VAD when present uses a
  //     free non-commercial license that does not require the access
  //     key to initialise the recognizer.
  //
  // Set `consumeAccessKey: true` in app.config.ts to re-enable
  // injection once the native side actually reads the BuildConfig
  // field. Doing this without a consumer is a security smell: any
  // user with a strings dump of the AAB can recover the key.
  if (!accessKey || !consumeAccessKey) {
    return buildGradle;
  }
  const escaped = String(accessKey).replace(/"/g, '\\"');
  const field = `        buildConfigField "String", "KIAAN_PICOVOICE_ACCESS_KEY", "\\"${escaped}\\""`;
  if (buildGradle.includes('KIAAN_PICOVOICE_ACCESS_KEY')) {
    return buildGradle.replace(
      /buildConfigField\s+"String",\s+"KIAAN_PICOVOICE_ACCESS_KEY",\s+"[^"]*"/,
      field.trim(),
    );
  }
  // Inject inside defaultConfig {}. We grep for the closing brace of
  // defaultConfig and prepend the field. If the block is missing the
  // build will fail anyway, so we just no-op rather than corrupt it.
  return buildGradle.replace(
    /defaultConfig\s*{([^}]*)}/m,
    (match, body) => `defaultConfig {${body}\n${field}\n    }`,
  );
}

function ensureManifestMeta(manifest, opts) {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  application['meta-data'] = application['meta-data'] ?? [];

  const upsert = (name, value) => {
    const list = application['meta-data'];
    const idx = list.findIndex((m) => m.$?.['android:name'] === name);
    const entry = {
      $: {
        'android:name': name,
        'android:value': String(value),
      },
    };
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
  };

  upsert(META_ENABLE_WAKEWORD, opts.enableWakeWord ? 'true' : 'false');
  upsert(META_WAKEWORD_KEYWORD, opts.wakeWordKeyword || 'hey sakha');

  return manifest;
}

const withPicovoice = (config, options = {}) => {
  const opts = {
    enableWakeWord: options.enableWakeWord === true,
    wakeWordKeyword: options.wakeWordKeyword || 'hey sakha',
    // Default false — guards the BuildConfig.KIAAN_PICOVOICE_ACCESS_KEY
    // injection. Flip to true once Phase 2B lands a Kotlin reader for
    // the field. See ensureBuildConfigField for the rationale.
    consumeAccessKey: options.consumeAccessKey === true,
  };

  // The access key is read from the resolved app config (extra.picovoice.accessKey).
  // expo-config-plugins evaluates app.config.ts BEFORE plugins run, so
  // config.extra is already populated.
  const accessKey =
    (config.extra && config.extra.picovoice && config.extra.picovoice.accessKey) ||
    process.env.PICOVOICE_ACCESS_KEY ||
    '';

  // Surface a build-time warning when the key is set but nothing
  // consumes it — this caught the post-#1679 audit finding ("Picovoice
  // key wasted: Phase 2B not yet landed; key is injected but unused").
  if (accessKey && !opts.consumeAccessKey) {
    console.warn(
      '[withPicovoice] PICOVOICE_ACCESS_KEY is set but consumeAccessKey=false. ' +
      'Skipping BuildConfig injection so the secret is not baked into the AAB. ' +
      'Pass `consumeAccessKey: true` from app.config.ts once a Kotlin reader exists.',
    );
  }

  config = withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = ensureGradleAbiSplits(cfg.modResults.contents);
    cfg.modResults.contents = ensureBuildConfigField(
      cfg.modResults.contents,
      accessKey,
      opts.consumeAccessKey,
    );
    return cfg;
  });

  config = withAndroidManifest(config, (cfg) => {
    cfg.modResults = ensureManifestMeta(cfg.modResults, opts);
    return cfg;
  });

  return config;
};

module.exports = withPicovoice;
module.exports.default = withPicovoice;
module.exports.META_ENABLE_WAKEWORD = META_ENABLE_WAKEWORD;
module.exports.META_WAKEWORD_KEYWORD = META_WAKEWORD_KEYWORD;
