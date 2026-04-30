/**
 * withKiaanForegroundService — Expo config plugin.
 *
 * Registers the mediaPlayback foreground service that keeps the Sakha
 * voice WSS audio session alive when the user backgrounds the app.
 *
 * Without this plugin, Android 14+ (targetSdk 34/35) kills the
 * AudioFocus + ExoPlayer session within 30 seconds of the screen
 * going off, cutting Sakha mid-sentence.
 *
 * What it does, by phase:
 *
 *   • dangerous-mod (AndroidManifest.xml):
 *       - declares the foreground service permission with the typed
 *         "mediaPlayback" service type.
 *       - registers a <service> entry pointing at
 *         com.kiaanverse.sakha.audio.SakhaForegroundService (Kotlin
 *         class lives in Part 8 alongside KiaanAudioPlayer).
 *       - declares the persistent low-priority notification channel.
 *
 *   • dangerous-mod (strings.xml):
 *       - injects "Sakha is listening" / "सखा सुन रहे हैं" notification
 *         strings so the channel can be localized at runtime.
 *
 * Plugin API (Expo):
 *   default export = (config: ExpoConfig) => ExpoConfig
 *
 * The plugin runs at `expo prebuild` time. EAS Build runs prebuild
 * implicitly before Gradle so this fires on every `eas build --platform
 * android` invocation.
 */

const {
  withAndroidManifest,
  withStringsXml,
  AndroidConfig,
} = require('@expo/config-plugins');

const SERVICE_NAME = 'com.kiaanverse.sakha.audio.SakhaForegroundService';
const NOTIFICATION_CHANNEL_ID = 'sakha_voice_session';
const NOTIFICATION_TITLE_KEY = 'sakha_notification_title';
const NOTIFICATION_TITLE_DEFAULT = 'सखा सुन रहे हैं'; // Sakha is listening
const NOTIFICATION_BODY_KEY = 'sakha_notification_body';
const NOTIFICATION_BODY_DEFAULT = 'Voice companion active';

/** Add or update a <service> child of the AndroidManifest <application>. */
function ensureServiceEntry(manifest) {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  application.service = application.service ?? [];

  const existing = application.service.find(
    (s) => s.$?.['android:name'] === SERVICE_NAME,
  );
  const entry = existing ?? { $: {} };
  entry.$['android:name'] = SERVICE_NAME;
  entry.$['android:exported'] = 'false';
  // Sakha holds the mic AND streams TTS audio. Android 14+ (API 34, S_V2)
  // accepts a pipe-separated list of foregroundServiceType values; the
  // service will satisfy both the FOREGROUND_SERVICE_MICROPHONE and
  // FOREGROUND_SERVICE_MEDIA_PLAYBACK permission gates declared in
  // app.config.ts. Without "microphone" the OS throws
  // MissingForegroundServiceTypeException the moment the user backgrounds
  // the app while Sakha is listening.
  entry.$['android:foregroundServiceType'] = 'microphone|mediaPlayback';

  if (!existing) {
    application.service.push(entry);
  }
  return manifest;
}

/** Inject Sakha-specific notification strings into strings.xml. */
function ensureStrings(stringsResource) {
  stringsResource.resources = stringsResource.resources ?? {};
  stringsResource.resources.string = stringsResource.resources.string ?? [];

  const upsert = (name, value) => {
    const arr = stringsResource.resources.string;
    const idx = arr.findIndex((s) => s.$?.name === name);
    const item = { $: { name }, _: value };
    if (idx >= 0) arr[idx] = item;
    else arr.push(item);
  };

  upsert(NOTIFICATION_TITLE_KEY, NOTIFICATION_TITLE_DEFAULT);
  upsert(NOTIFICATION_BODY_KEY, NOTIFICATION_BODY_DEFAULT);

  return stringsResource;
}

const withKiaanForegroundService = (config) => {
  config = withAndroidManifest(config, (cfg) => {
    cfg.modResults = ensureServiceEntry(cfg.modResults);
    return cfg;
  });

  config = withStringsXml(config, (cfg) => {
    cfg.modResults = ensureStrings(cfg.modResults);
    return cfg;
  });

  return config;
};

module.exports = withKiaanForegroundService;
module.exports.default = withKiaanForegroundService;
module.exports.SERVICE_NAME = SERVICE_NAME;
module.exports.NOTIFICATION_CHANNEL_ID = NOTIFICATION_CHANNEL_ID;
