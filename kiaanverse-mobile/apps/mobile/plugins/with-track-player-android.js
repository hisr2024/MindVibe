/**
 * with-track-player-android.js
 *
 * Expo Config Plugin — fixes audio playback for `react-native-track-player`
 * in production AAB / signed-APK builds on Android 14+ (targetSdk 34/35).
 *
 * Why this exists
 * ---------------
 * AAB release builds were shipping silent: the JS layer reported tracks
 * loading and `TrackPlayer.play()` resolving to Playing, but no audio ever
 * reached the speaker. Debug builds worked. Two production-only failures
 * compound:
 *
 *   (1) R8/Proguard strips ExoPlayer / Media3 / kotlin-audio classes that
 *       are loaded reflectively by the playback service. The service
 *       initialises, the JS bridge sees state changes, but the underlying
 *       audio pipeline is half-built so no PCM ever reaches AudioTrack.
 *
 *   (2) Targeting Android 14+ (SDK 34/35) requires the media-playback
 *       foreground service to declare `foregroundServiceType="mediaPlayback"`.
 *       Without it, ServiceCompat.startForeground throws
 *       `MissingForegroundServiceTypeException`, the OS terminates the
 *       service immediately after start, and audio output never engages
 *       even though `play()` returned successfully on the JS side.
 *
 * What this plugin does
 * ---------------------
 *   • Injects keep rules for react-native-track-player, kotlin-audio,
 *     androidx.media3 (ExoPlayer + Session), and Guichaguri's RNTP fork
 *     so R8 can't strip the audio pipeline.
 *
 *   • Locates `<service android:name="com.doublesymmetry.trackplayer.service.MusicService" />`
 *     in the merged AndroidManifest and ensures it has both
 *     `android:foregroundServiceType="mediaPlayback"` and
 *     `android:exported="false"`. If RNTP's library manifest already sets
 *     them this is a no-op; if a different RNTP version omits them or a
 *     manifest merge conflict drops them, we restore the correct values.
 *
 * Failure mode
 * ------------
 * Any error is swallowed and logged — never throws, never breaks
 * `expo prebuild`. If we can't find the manifest or the proguard file we
 * log and return the config unchanged. The other layer (extraProguardRules
 * in expo-build-properties) is the primary defense; this plugin is the
 * manifest-side counterpart.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const LOG_PREFIX = '[with-track-player-android]';

let withAndroidManifest;
let withDangerousMod;
try {
  ({ withAndroidManifest, withDangerousMod } = require('@expo/config-plugins'));
} catch (_err) {
  withAndroidManifest = null;
  withDangerousMod = null;
}

const MUSIC_SERVICE = 'com.doublesymmetry.trackplayer.service.MusicService';

// Proguard keep rules. Kept in one constant so the dangerous-mod can append
// them to proguard-rules.pro after prebuild (in addition to the
// extraProguardRules path through expo-build-properties — belt + braces, since
// either path alone has been observed to be missed by EAS depending on plugin
// evaluation order).
const PROGUARD_RULES = [
  '# === react-native-track-player + audio pipeline (added by with-track-player-android.js) ===',
  '-keep class com.doublesymmetry.** { *; }',
  '-keep interface com.doublesymmetry.** { *; }',
  '-keep class com.guichaguri.trackplayer.** { *; }',
  '-keep interface com.guichaguri.trackplayer.** { *; }',
  '-keep class androidx.media.** { *; }',
  '-keep class androidx.media3.** { *; }',
  '-keep interface androidx.media3.** { *; }',
  '-keep class com.google.android.exoplayer2.** { *; }',
  '-keep interface com.google.android.exoplayer2.** { *; }',
  '-dontwarn com.google.android.exoplayer2.**',
  '-dontwarn androidx.media3.**',
  '# kotlin-audio (RNTP\'s playback engine) loads ExoPlayer extensions reflectively',
  '-keep class com.doublesymmetry.kotlinaudio.** { *; }',
  '-keep interface com.doublesymmetry.kotlinaudio.** { *; }',
  '# Media session callbacks — Android binds these via name',
  '-keep class * extends android.support.v4.media.session.MediaSessionCompat$Callback { *; }',
  '-keep class * extends androidx.media.session.MediaButtonReceiver { *; }',
  '# === end react-native-track-player ===',
].join('\n');

/**
 * Walk the merged AndroidManifest's <application> children and ensure the
 * MusicService node carries the attributes Android 14+ requires. Returns
 * true if any change was made, false if the manifest already had them.
 */
function patchManifestServiceEntry(application) {
  if (!application || !Array.isArray(application.service)) return false;
  let changed = false;

  for (const service of application.service) {
    const attrs = service && service.$;
    if (!attrs) continue;
    if (attrs['android:name'] !== MUSIC_SERVICE) continue;

    if (attrs['android:foregroundServiceType'] !== 'mediaPlayback') {
      attrs['android:foregroundServiceType'] = 'mediaPlayback';
      changed = true;
    }
    if (attrs['android:exported'] !== 'false') {
      attrs['android:exported'] = 'false';
      changed = true;
    }
  }

  return changed;
}

/**
 * Append PROGUARD_RULES to android/app/proguard-rules.pro after prebuild has
 * generated the native project. Idempotent — checks for the marker comment
 * before appending so re-running prebuild doesn't duplicate the block.
 */
function appendProguardRules(projectRoot) {
  const proguardPath = path.join(
    projectRoot,
    'android',
    'app',
    'proguard-rules.pro'
  );

  if (!fs.existsSync(proguardPath)) {
    console.log(
      `${LOG_PREFIX} proguard-rules.pro not found at ${proguardPath} — skipping (prebuild may not have run yet, expo-build-properties extraProguardRules will still apply)`
    );
    return;
  }

  let existing;
  try {
    existing = fs.readFileSync(proguardPath, 'utf8');
  } catch (err) {
    console.log(
      `${LOG_PREFIX} read failed for ${proguardPath}: ${err && err.message}`
    );
    return;
  }

  if (existing.includes('with-track-player-android.js')) {
    console.log(`${LOG_PREFIX} proguard-rules.pro already patched`);
    return;
  }

  try {
    fs.writeFileSync(
      proguardPath,
      `${existing.trimEnd()}\n\n${PROGUARD_RULES}\n`,
      'utf8'
    );
    console.log(`${LOG_PREFIX} appended keep rules to ${proguardPath}`);
  } catch (err) {
    console.log(
      `${LOG_PREFIX} write failed for ${proguardPath}: ${err && err.message}`
    );
  }
}

function withTrackPlayerAndroid(config) {
  if (!withAndroidManifest || !withDangerousMod) {
    console.log(
      `${LOG_PREFIX} @expo/config-plugins not available — skipping (extraProguardRules in expo-build-properties remains as primary defense)`
    );
    return config;
  }

  // Pass 1 — manifest patch: ensures the MusicService has
  // foregroundServiceType="mediaPlayback" so Android 14+ allows
  // startForeground() to succeed.
  let next = withAndroidManifest(config, async (modConfig) => {
    try {
      const application =
        modConfig.modResults &&
        modConfig.modResults.manifest &&
        Array.isArray(modConfig.modResults.manifest.application)
          ? modConfig.modResults.manifest.application[0]
          : null;

      const changed = patchManifestServiceEntry(application);
      if (changed) {
        console.log(
          `${LOG_PREFIX} patched MusicService with foregroundServiceType="mediaPlayback"`
        );
      }
    } catch (err) {
      console.log(
        `${LOG_PREFIX} manifest mod error (ignored): ${err && err.stack ? err.stack : err}`
      );
    }
    return modConfig;
  });

  // Pass 2 — append proguard rules to android/app/proguard-rules.pro after
  // prebuild has materialised the native project.
  next = withDangerousMod(next, [
    'android',
    async (modConfig) => {
      try {
        const projectRoot =
          (modConfig.modRequest && modConfig.modRequest.projectRoot) ||
          process.cwd();
        appendProguardRules(projectRoot);
      } catch (err) {
        console.log(
          `${LOG_PREFIX} dangerous-mod error (ignored): ${err && err.stack ? err.stack : err}`
        );
      }
      return modConfig;
    },
  ]);

  return next;
}

module.exports = withTrackPlayerAndroid;
module.exports.PROGUARD_RULES = PROGUARD_RULES;
