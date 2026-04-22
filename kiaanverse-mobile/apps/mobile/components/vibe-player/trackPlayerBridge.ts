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
  type Track as RnTpTrack,
} from 'react-native-track-player';

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
  | { readonly ok: false; readonly reason: 'unavailable'; readonly message: string }
  | { readonly ok: false; readonly reason: 'error'; readonly message: string };

function isPlayableUrl(url: string): boolean {
  // TrackPlayer accepts absolute http(s) URLs and `file://` / `asset://`
  // local schemes. Anything else (relative paths like `/audio/om.mp3`,
  // empty strings) will fail silently at play time, which is the exact
  // bug users hit when the backend shipped unhosted audio.
  return /^(https?:|file:|asset:)/i.test(url);
}

/** Load a single track into TrackPlayer's queue and start playback. */
export async function playTrack(track: BridgeTrack): Promise<PlayResult> {
  if (!isPlayableUrl(track.audioUrl)) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        `[trackPlayerBridge] playTrack skipped — unplayable url="${track.audioUrl}" for id=${track.id}`,
      );
    }
    return {
      ok: false,
      reason: 'unavailable',
      message: `"${track.title}" isn't hosted yet. It'll arrive in a future update.`,
    };
  }

  try {
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
