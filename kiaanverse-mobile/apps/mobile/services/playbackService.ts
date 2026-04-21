/**
 * TrackPlayer Playback Service — runs in a background JS context.
 *
 * This module is registered at app startup via TrackPlayer.registerPlaybackService.
 * The function returned here is invoked by react-native-track-player in a
 * dedicated headless JS task that survives when the React tree unmounts
 * (background, lock screen, killed UI). It MUST only attach event handlers —
 * never render React, never read Zustand/React Query state.
 *
 * Why a separate file: registerPlaybackService receives a factory that the
 * native module re-invokes after the JS bridge is torn down (e.g. when iOS
 * resumes audio from a lock-screen tap on a killed app). Putting handler logic
 * inside a screen component means the handlers are gone the moment the
 * component unmounts, which is exactly when the user needs them.
 *
 * Remote events handled (sources: lock screen, Control Center, Bluetooth,
 * AirPods, car CarPlay/Android Auto, headphone in-line buttons):
 *   - RemotePlay        → resume playback
 *   - RemotePause       → pause playback
 *   - RemoteStop        → stop and clear; the OS hides the now-playing card
 *   - RemoteNext        → skip to next track in TrackPlayer's internal queue
 *   - RemotePrevious    → skip to previous track
 *   - RemoteSeek        → seek to position (in seconds, comes from the OS)
 *   - RemoteJumpForward → jump forward by the configured forwardJumpInterval
 *   - RemoteJumpBackward→ jump backward by the configured backwardJumpInterval
 *   - RemoteDuck        → audio focus interruption (call, Siri, alarm) —
 *                         iOS sends paused=true and the playback engine
 *                         already pauses; we honor permanent=true by stopping
 *                         so we don't silently resume after the interruption
 *
 * App-state cleanup (Android only):
 *   When the user dismisses the app from the recents tray, Play Store policy
 *   requires the foreground service to terminate. AppKilledPlaybackBehavior
 *   is set during setupPlayer() — this service still needs to be registered
 *   for the OS notification controls to function while playback is alive.
 */

import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * Register all remote control event handlers.
 * Exported as the default so it matches the registerPlaybackService contract:
 *   TrackPlayer.registerPlaybackService(() => require('./playbackService'))
 */
module.exports = async function playbackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    void TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    void TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    // Stop and reset the queue position so the OS dismisses the now-playing
    // card. We deliberately do NOT clear the queue — the user may resume
    // from the in-app library without re-fetching.
    void TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    void TrackPlayer.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    void TrackPlayer.skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    // event.position is in seconds, native-side validated to be ≥ 0
    void TrackPlayer.seekTo(event.position);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpForward, async (event) => {
    // event.interval is in seconds; iOS supplies the configured interval,
    // Android supplies the value from the notification "+15s" button
    const position = await TrackPlayer.getProgress().then((p) => p.position);
    void TrackPlayer.seekTo(position + (event.interval ?? 15));
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async (event) => {
    const position = await TrackPlayer.getProgress().then((p) => p.position);
    void TrackPlayer.seekTo(Math.max(0, position - (event.interval ?? 15)));
  });

  TrackPlayer.addEventListener(Event.RemoteDuck, (event) => {
    // iOS only — phone call / Siri / alarm interrupted playback.
    // permanent=true means the interruption ended without resume permission
    // (e.g. user accepted the call). We stop so we don't auto-resume into
    // the user's ear when the call ends.
    if (event.permanent === true) {
      void TrackPlayer.stop();
      return;
    }

    if (event.paused === true) {
      void TrackPlayer.pause();
    } else {
      void TrackPlayer.play();
    }
  });
};
