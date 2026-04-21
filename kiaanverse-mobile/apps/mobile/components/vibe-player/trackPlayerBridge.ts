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
 * Errors are swallowed in production and logged in __DEV__. Failing to
 * start playback is never fatal — the listener still sees the store
 * state update and the UI can retry.
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

/** Load a single track into TrackPlayer's queue and start playback. */
export async function playTrack(track: BridgeTrack): Promise<void> {
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
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[trackPlayerBridge] playTrack failed:', err);
    }
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
