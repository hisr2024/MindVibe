/**
 * trackPlayerBridge — thin wrapper around react-native-track-player.
 *
 * The zustand `vibePlayerStore` is the source of truth for UI state
 * (current track + isPlaying + queue), but the actual audio pipeline is
 * owned by react-native-track-player, which also handles:
 *
 *   - Lock-screen / notification controls (via the playback service).
 *   - Background / headless audio continuation.
 *   - AirPods + CarPlay transport events.
 *
 * These helpers are small intentionally — each is a single source-of-
 * responsibility. Callers invoke them from effects/event handlers; the
 * store stays UI-facing and doesn't import RNTP directly.
 *
 * `playTrack` returns a result tag so the caller can surface a real
 * failure to the user (missing audioUrl, network error) instead of a
 * silent dead tap. Earlier versions swallowed every error and the play
 * button appeared broken whenever the backend shipped a relative /
 * missing `audioUrl`.
 */

import TrackPlayer, {
  State,
  type Track as RnTpTrack,
} from 'react-native-track-player';
import { setupTrackPlayer } from '../../services/trackPlayerSetup';

declare const __DEV__: boolean;

export interface BridgeTrack {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly audioUrl: string;
  readonly duration: number;
  readonly artworkUrl?: string | null;
}

/** Outcome of a play attempt. `unavailable` = no hosted audio yet; the UI
 *  should tell the user "coming soon" rather than "retry". `error` = RNTP
 *  rejected the add/play calls; suggest retry. */
export type PlayResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: 'unavailable';
      readonly message: string;
    }
  | { readonly ok: false; readonly reason: 'error'; readonly message: string };

function isPlayableUrl(url: string): boolean {
  // TrackPlayer accepts absolute http(s) URLs and `file://` / `asset://`
  // local schemes. Anything else (relative paths like `/audio/om.mp3`,
  // empty strings) will fail silently at play time, which is the exact
  // bug users hit when the backend shipped unhosted audio.
  return /^(https?:|file:|asset:)/i.test(url);
}

/** Load a single track into TrackPlayer's queue and start playback.
 *
 *  Robustness:
 *    - We `await setupTrackPlayer()` first so the native audio session is
 *      always ready. This is a no-op when setup already completed in
 *      `_layout.tsx`, but covers the deep-link / cold-start path where the
 *      Vibe Player screen mounts before the layout effect has finished.
 *    - After `play()` we poll the State for ~1.5 s. If RNTP never reaches
 *      Playing/Buffering/Loading, the URL is unreachable on this network
 *      (Android often returns no error in that case — it just sits silent).
 *      We surface that as an `error` so the user gets actionable feedback
 *      instead of a UI that claims "playing" with no sound.
 */
export async function playTrack(track: BridgeTrack): Promise<PlayResult> {
  if (!isPlayableUrl(track.audioUrl)) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        `[trackPlayerBridge] playTrack skipped — unplayable url="${track.audioUrl}" for id=${track.id}`
      );
    }
    return {
      ok: false,
      reason: 'unavailable',
      message: `"${track.title}" isn't hosted yet. It'll arrive in a future update.`,
    };
  }

  try {
    // Ensure native is initialised even on deep-link cold start where
    // _layout's setup effect may not have completed yet.
    await setupTrackPlayer();

    await TrackPlayer.reset();
    const rnTrack: RnTpTrack = {
      id: track.id,
      url: track.audioUrl,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      ...(track.artworkUrl ? { artwork: track.artworkUrl } : {}),
    };
    await TrackPlayer.add(rnTrack);
    await TrackPlayer.play();

    // Confirm playback actually engaged (poll up to ~1.5 s). Catches the
    // silent-failure mode where Android resolves play() but never buffers.
    const playable = await waitForPlayableState(1500);
    if (!playable) {
      return {
        ok: false,
        reason: 'error',
        message:
          'The audio source did not respond. Check your internet connection and try again.',
      };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Always log — production users hitting this would otherwise see a
    // silent no-op. The message is also returned so the caller can put
    // it in an Alert.
    // eslint-disable-next-line no-console
    console.error('[trackPlayerBridge] playTrack failed:', err);
    return {
      ok: false,
      reason: 'error',
      message: `Could not play this track: ${message}`,
    };
  }
}

/** Poll TrackPlayer.getState() until it reports a non-idle state or timeout. */
async function waitForPlayableState(timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const state = await TrackPlayer.getState();
      if (
        state === State.Playing ||
        state === State.Buffering ||
        state === State.Loading ||
        state === State.Ready
      ) {
        return true;
      }
    } catch {
      // Native not ready yet — keep polling until deadline.
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

/** Resume playback (no-op if nothing loaded). */
export async function resume(): Promise<void> {
  try {
    await TrackPlayer.play();
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[trackPlayerBridge] resume failed:', err);
    }
  }
}

/** Pause playback. */
export async function pause(): Promise<void> {
  try {
    await TrackPlayer.pause();
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[trackPlayerBridge] pause failed:', err);
    }
  }
}

/** Seek to an absolute second position. */
export async function seekTo(seconds: number): Promise<void> {
  try {
    await TrackPlayer.seekTo(Math.max(0, seconds));
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[trackPlayerBridge] seekTo failed:', err);
    }
  }
}
