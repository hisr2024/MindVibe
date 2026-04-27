/**
 * withKiaanAudioFocus — Expo config plugin.
 *
 * Configures Android audio focus + Bluetooth SCO routing so that the
 * Sakha voice session ducks under (rather than fights with) other
 * audio streams (music, navigation prompts, notifications), and so
 * that BT headsets work transparently.
 *
 * Without this plugin:
 *   • If the user is playing music, Sakha's voice frames either get
 *     mixed cacophonously or are rejected by the audio system.
 *   • If a BT headset is connected, audio still goes to the phone
 *     speaker because we never request SCO routing.
 *   • The system "media volume" key may not affect Sakha's volume
 *     because we never declare the right usage attributes.
 *
 * What it does:
 *
 *   • injects audio attributes into AndroidManifest <meta-data>:
 *       audio.usage = USAGE_ASSISTANCE_SONIFICATION (matches Sakha's
 *         role — system-level guidance audio)
 *       audio.contentType = CONTENT_TYPE_SPEECH
 *       audio.focusGain = AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
 *
 *   • the KiaanAudioPlayer TurboModule (Part 8) reads these meta-data
 *     entries at startup so the policy is consistent across the
 *     player, foreground service, and notification.
 *
 * Plugin API (Expo): default export = config → config
 */

const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const META = {
  USAGE: 'com.kiaanverse.sakha.audio.usage',
  CONTENT_TYPE: 'com.kiaanverse.sakha.audio.contentType',
  FOCUS_GAIN: 'com.kiaanverse.sakha.audio.focusGain',
  ROUTE_BLUETOOTH: 'com.kiaanverse.sakha.audio.routeBluetooth',
};

const VALUES = {
  // Per AudioAttributes.USAGE_*:
  // 17 = USAGE_ASSISTANCE_SONIFICATION (system-level guidance audio)
  // Sakha is closer to ASSISTANT (16) but ASSISTANCE_SONIFICATION ducks
  // music more politely without taking full focus.
  USAGE: 'assistance_sonification',
  // Per AudioAttributes.CONTENT_TYPE_*:
  // 1 = CONTENT_TYPE_SPEECH
  CONTENT_TYPE: 'speech',
  // Per AudioManager.AUDIOFOCUS_GAIN_*:
  // 3 = AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
  FOCUS_GAIN: 'gain_transient_may_duck',
  // We want to route to BT SCO whenever a headset is connected. The
  // KiaanAudioPlayer reads this and calls AudioManager.startBluetoothSco().
  ROUTE_BLUETOOTH: 'true',
};

function ensureMetaData(manifest) {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  application['meta-data'] = application['meta-data'] ?? [];

  const upsert = (name, value) => {
    const list = application['meta-data'];
    const idx = list.findIndex((m) => m.$?.['android:name'] === name);
    const entry = {
      $: {
        'android:name': name,
        'android:value': value,
      },
    };
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
  };

  upsert(META.USAGE, VALUES.USAGE);
  upsert(META.CONTENT_TYPE, VALUES.CONTENT_TYPE);
  upsert(META.FOCUS_GAIN, VALUES.FOCUS_GAIN);
  upsert(META.ROUTE_BLUETOOTH, VALUES.ROUTE_BLUETOOTH);

  return manifest;
}

const withKiaanAudioFocus = (config) => {
  return withAndroidManifest(config, (cfg) => {
    cfg.modResults = ensureMetaData(cfg.modResults);
    return cfg;
  });
};

module.exports = withKiaanAudioFocus;
module.exports.default = withKiaanAudioFocus;
module.exports.META = META;
module.exports.VALUES = VALUES;
