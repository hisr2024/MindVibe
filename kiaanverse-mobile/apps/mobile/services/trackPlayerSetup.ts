/**
 * TrackPlayer Bootstrap — setupPlayer + service registration.
 *
 * Two things happen here and both are load-order sensitive:
 *
 *   1. `TrackPlayer.registerPlaybackService` — must run at module load, before
 *      React mounts. The native module invokes the returned factory to spin up
 *      a headless JS task whenever the OS needs to dispatch a remote control
 *      event (lock screen / Bluetooth / AirPods / CarPlay). If registration
 *      happens inside a component, the handlers disappear when the component
 *      unmounts — which is exactly when the user taps the lock-screen play
 *      button.
 *
 *   2. `TrackPlayer.setupPlayer` — allocates the native audio session and must
 *      be called exactly once per process. Calling it a second time throws
 *      "The player has already been initialized via setupPlayer." We guard
 *      with `isSetup` so hot-reloads in dev don't crash.
 *
 * Capabilities advertised here are what will render on the lock screen /
 * notification. We expose Play, Pause, SkipToNext, SkipToPrevious, SeekTo,
 * and JumpForward/Backward (15 s). Stop is deliberately omitted from the
 * compact-view list — users don't need a "kill" button on the lock screen,
 * and including it crowds out the seek controls on small watches.
 *
 * Android AppKilledPlaybackBehavior:
 *   - `StopPlaybackAndRemoveNotification` — when the user dismisses the app
 *     from recents, playback stops and the notification clears. This matches
 *     Play Store policy (post-2024 foreground-service rules).
 */

import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  type ServiceHandler,
} from 'react-native-track-player';

let isSetup = false;
let isServiceRegistered = false;

/**
 * Register the playback service. Must run at module load, before React mounts.
 * Safe to call multiple times — the flag prevents double registration in
 * Fast Refresh.
 *
 * The factory is passed as a function because react-native-track-player
 * re-invokes it in a detached JS context; a direct reference would be GC'd
 * after the original JS tree tears down.
 */
export function registerPlaybackService(): void {
  if (isServiceRegistered) return;
  isServiceRegistered = true;
  // Require at call time so the service module is loaded into the headless
  // JS task, not the main bundle. This is the pattern the RNTPlayer docs
  // prescribe — eager import would cache handlers against the main JS
  // context and lose them on kill.
  TrackPlayer.registerPlaybackService(
    // `require` inside the factory is required by RNTrackPlayer — eager
    // import caches handlers against the main JS context and loses them
    // when the OS spins up a new headless JS task post-kill. The service
    // module uses `module.exports = async function …`, so the CommonJS
    // require returns the ServiceHandler directly; the cast documents the
    // contract (Metro's `require` is typed as `any`).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    () => require('./playbackService') as unknown as ServiceHandler,
  );
}

/**
 * Initialize the native audio session. Idempotent — subsequent calls resolve
 * without touching native. Must be awaited before any TrackPlayer.add / play
 * call, otherwise native throws "The player is not initialized. Call
 * setupPlayer first."
 *
 * Errors are swallowed and logged in __DEV__ only. Failing to set up the
 * player is non-fatal — the in-app UI remains usable; only audio playback
 * is disabled. The alternative (throwing) would crash the root layout on
 * every cold start if the OS denies the audio session (rare, but happens
 * on tvOS simulators and during CI).
 */
export async function setupTrackPlayer(): Promise<void> {
  if (isSetup) return;

  try {
    await TrackPlayer.setupPlayer({
      // Keep the default auto-update cadence (1 Hz) — UI subscribers use
      // useProgress() which runs on a separate fast timer.
      autoHandleInterruptions: true,
    });

    await TrackPlayer.updateOptions({
      // Android: stop the foreground service when the task is swiped away.
      // Required by Play Store foreground-service policy since SDK 34.
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      // Enable the subset of OS controls we actually implement. Advertising
      // a capability the service doesn't handle would surface a dead button
      // on the lock screen, which is worse than hiding it.
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.JumpForward,
        Capability.JumpBackward,
      ],
      // Subset shown in the compact lock-screen / notification view.
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      // The ±15 s skip is the de-facto podcast/meditation default.
      forwardJumpInterval: 15,
      backwardJumpInterval: 15,
    });

    isSetup = true;
  } catch (err) {
    if (__DEV__) {
      // "The player has already been initialized" is benign — the user hit
      // Fast Refresh. Any other error means audio won't work but the app
      // otherwise functions normally.
      console.warn('[trackPlayerSetup] setupPlayer failed:', err);
    }
  }
}
