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

import TrackPlayer, { State } from 'react-native-track-player';
import { setupTrackPlayer } from '../../services/trackPlayerSetup';
import {
  isLikelyPlayableUrl,
  resolvePlayableAudioSource,
  type PlayableSource,
} from './audioFallbacks';
import type { BundledAudioKey } from './bundledAudioRegistry';

/**
 * Shape of the object we hand to `TrackPlayer.add()`. RNTP's published
 * type for `AddTrack.url` is `string | ResourceObject` (where
 * `ResourceObject = number`, the Metro asset id), but its `Track.url` is
 * narrowed to `string` and the intersection collapses back. We declare
 * the shape we actually pass — RNTP accepts numeric urls at runtime, the
 * narrowing is only a published-type quirk.
 */
interface RnTpAddTrackInput {
  readonly id: string;
  readonly url: string | number;
  readonly title: string;
  readonly artist: string;
  readonly duration: number;
  readonly artwork?: string;
}

declare const __DEV__: boolean;

export interface BridgeTrack {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly audioUrl: string;
  readonly duration: number;
  readonly artworkUrl?: string | null;
  /**
   * Optional category hint — used by the bridge to pick a known-good
   * substitute URL when `audioUrl` is empty/non-playable, instead of
   * surfacing an "isn't hosted yet" alert and going silent.
   */
  readonly category?: string;
  /**
   * Optional caller-provided backup URL. When set, the bridge retries
   * playback with this URL if the primary one fails to start within the
   * watchdog window. Useful for testing on flaky networks.
   */
  readonly fallbackAudioUrl?: string;
  /**
   * Optional bundled-audio key. When the matching MP3 has been wired in
   * `bundledAudioRegistry.ts`, the bridge prefers the local asset over
   * any remote URL — so meditation playback works offline.
   */
  readonly bundledAudioKey?: BundledAudioKey;
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

/**
 * Build the RNTP track entry for a given source. `source` is either an
 * absolute URI string or a Metro asset id (number) returned by
 * `require('./foo.mp3')`. RNTP's `AddTrack.url` accepts both natively, so
 * bundled-asset playback works without any caller knowing it's local.
 */
function buildRnTrack(track: BridgeTrack, source: PlayableSource): RnTpAddTrackInput {
  return {
    id: track.id,
    url: source,
    title: track.title,
    artist: track.artist,
    duration: track.duration,
    ...(track.artworkUrl ? { artwork: track.artworkUrl } : {}),
  };
}

/**
 * Defensive volume reset. Audio-focus duck events on Android occasionally
 * leave RNTP's internal volume at 0 even after the OS hands focus back.
 * Without this, every subsequent `play()` looks "successful" but the user
 * hears silence — exactly the failure mode the Play Store APK was hitting.
 *
 * Wrapped in try/catch because `setVolume` is a no-op on iOS in some RNTP
 * versions and we don't want a benign rejection to fail playback.
 */
async function ensureAudible(): Promise<void> {
  try {
    await TrackPlayer.setVolume(1);
  } catch {
    // ignore — best-effort
  }
}

/** Load a single track into TrackPlayer's queue and start playback.
 *
 *  Robustness:
 *    - We `await setupTrackPlayer()` first so the native audio session is
 *      always ready. This is a no-op when setup already completed in
 *      `_layout.tsx`, but covers the deep-link / cold-start path where the
 *      Vibe Player screen mounts before the layout effect has finished.
 *    - We coerce `track.audioUrl` through `resolveAudioUrlWithBackup` so a
 *      bad value from the API (empty, relative, `synth://`) is automatically
 *      replaced with a known-good HTTPS URL keyed off the track's category.
 *      Earlier versions surfaced a "coming soon" Alert here and stayed
 *      silent — that was the user-visible "no sound" bug on the Play
 *      Store APK whenever the backend shipped sparse track metadata.
 *    - We force `setVolume(1)` before `play()` to recover from stuck-at-zero
 *      volume after audio-focus duck events.
 *    - After `play()` we poll the State for ~1.5 s. If RNTP never reaches
 *      Playing/Buffering/Loading, the URL is unreachable on this network
 *      (Android often returns no error in that case — it just sits silent).
 *      We retry ONCE with the backup URL before giving up. Only if BOTH
 *      attempts fail do we report `error` to the caller.
 */
export async function playTrack(track: BridgeTrack): Promise<PlayResult> {
  // Resolve to a guaranteed-playable source up front. `primary` may be a
  // bundled asset id (number) when an MP3 has been wired up locally, or
  // an HTTPS URL otherwise. `backup` is always a remote URL so a retry
  // can recover from any local-asset issue.
  const explicitFallback = isLikelyPlayableUrl(track.fallbackAudioUrl)
    ? (track.fallbackAudioUrl as string)
    : undefined;
  const { primary, backup } = resolvePlayableAudioSource({
    audioUrl: track.audioUrl,
    ...(track.category ? { category: track.category } : {}),
    ...(track.bundledAudioKey ? { bundledAudioKey: track.bundledAudioKey } : {}),
  });

  if (__DEV__) {
    const desc = typeof primary === 'number'
      ? `bundled-asset:${primary}`
      : primary;
    if (desc !== track.audioUrl) {
      // eslint-disable-next-line no-console
      console.warn(
        `[trackPlayerBridge] resolved track id=${track.id} → "${desc}" (original audioUrl="${track.audioUrl}")`
      );
    }
  }

  try {
    // Ensure native is initialised even on deep-link cold start where
    // _layout's setup effect may not have completed yet.
    await setupTrackPlayer();
    await ensureAudible();

    // ── Attempt 1: primary URL ──
    await TrackPlayer.reset();
    // The structural cast unblocks RNTP's overly-narrow .d.ts; numeric
    // urls are handled correctly at runtime (used by every RN audio
    // tutorial that loads `require('./foo.mp3')`).
    await TrackPlayer.add(buildRnTrack(track, primary) as unknown as Parameters<typeof TrackPlayer.add>[0]);
    await TrackPlayer.play();

    if (await waitForPlayableState(1500)) {
      return { ok: true };
    }

    // ── Attempt 2: caller-supplied fallback (if any), then category backup ──
    const retryUrl = explicitFallback ?? backup;
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        `[trackPlayerBridge] primary url did not engage — retrying with "${retryUrl}"`
      );
    }
    try {
      await TrackPlayer.reset();
      await ensureAudible();
      await TrackPlayer.add(buildRnTrack(track, retryUrl) as unknown as Parameters<typeof TrackPlayer.add>[0]);
      await TrackPlayer.play();
      if (await waitForPlayableState(2500)) {
        return { ok: true };
      }
    } catch (retryErr) {
      // eslint-disable-next-line no-console
      console.warn('[trackPlayerBridge] retry failed:', retryErr);
    }

    return {
      ok: false,
      reason: 'error',
      message:
        'The audio source did not respond. Check your internet connection and try again — or tap "Add your music" to play a track from your device.',
    };
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
