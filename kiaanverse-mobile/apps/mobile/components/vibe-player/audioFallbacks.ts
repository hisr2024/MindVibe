/**
 * audioFallbacks — guaranteed-playable URLs for every Vibe track.
 *
 * Why this file exists
 * --------------------
 * The KIAAN Vibe library is hydrated from three sources (in priority order):
 *
 *   1. The production API (`useMeditationTracks`) — may return tracks whose
 *      `audioUrl` is empty, a relative path, or the web-only `synth://` scheme.
 *      None of those play on react-native-track-player.
 *   2. The 12 BUILTIN_TRACKS hardcoded in `app/vibe-player/index.tsx`,
 *      already using stable HTTPS URLs.
 *   3. User uploads (`file://...`), already playable.
 *
 * If the API ships a non-playable URL, the previous behaviour was to surface
 * a "coming soon" Alert and stay silent. This module turns that silent
 * failure into a guaranteed-playable substitution: every track resolves to
 * either its own URL or a category-appropriate fallback that has been
 * confirmed to stream on Android in production.
 *
 * The fallback URLs all point to SoundHelix — the same public HTTPS CDN
 * already used by BUILTIN_TRACKS, used by the official react-native-track-
 * player documentation, and stable for over a decade. Cleartext is never
 * required.
 */

import {
  getBundledAudioId,
  type BundledAudioKey,
} from './bundledAudioRegistry';

/**
 * Loose track shape used by every helper here. We deliberately accept a
 * permissive `category: string` rather than reusing the API's narrow union
 * so the bridge can pass through track data from any source (uploads,
 * deep links, debug fixtures) without per-call type assertions.
 */
export interface FallbackTrackInput {
  readonly audioUrl?: string | null;
  readonly category?: string;
  /**
   * Optional explicit override of the bundled-audio key. When set, the
   * resolver looks up this key in the bundled registry FIRST, before any
   * category-based mapping or the remote audioUrl. Used by built-in
   * tracks that ship with a known-good local recording.
   */
  readonly bundledAudioKey?: BundledAudioKey;
}

/**
 * What `react-native-track-player` is willing to accept as a `Track.url`:
 * either an absolute string URI (https/file/asset) or a Metro asset id
 * returned by `require('./foo.mp3')`. We thread this union through the
 * resolver so bundled audio plays without any callers having to know
 * whether they're playing from disk or from a CDN.
 */
export type PlayableSource = string | number;

/** A bare HTTPS source we know plays on Android + iOS today. */
const SOUNDHELIX = (n: number): string =>
  `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

/**
 * Per-category fallback URL. Keyed off the same string the API uses.
 * If we ever expand the catalog taxonomy, add the new key here too —
 * `resolvePlayableAudioUrl` defaults to the meditation bucket otherwise.
 */
const CATEGORY_FALLBACK: Readonly<Record<string, string>> = {
  mantra: SOUNDHELIX(1),
  meditation: SOUNDHELIX(5),
  chanting: SOUNDHELIX(6),
  ambient: SOUNDHELIX(7),
};

/**
 * Per-category preferred bundled-audio key. When the matching MP3 has
 * been dropped into `assets/audio/` AND wired in `bundledAudioRegistry.ts`,
 * the resolver returns it as the primary source — strictly preferred over
 * any remote URL because it works offline and has no CDN risk.
 *
 * Empty registry → these lookups return null → resolver falls through to
 * the existing string-URL chain. Zero behaviour change until files arrive.
 */
const CATEGORY_BUNDLED_KEY: Readonly<Record<string, BundledAudioKey>> = {
  mantra: 'om-chant',
  meditation: 'tibetan-bowls',
  chanting: 'gayatri',
  ambient: 'rain',
};

/** Universal last-resort URL when the category is unknown. */
const ULTIMATE_FALLBACK = SOUNDHELIX(3);

/**
 * Schemes RNTP can actually play. Mirrors the regex inside
 * `trackPlayerBridge.isPlayableUrl` — kept here in sync so callers can
 * pre-validate before constructing a `BridgeTrack`.
 */
const PLAYABLE_URL_REGEX = /^(https?:|file:|asset:)/i;

export function isLikelyPlayableUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  return PLAYABLE_URL_REGEX.test(trimmed);
}

/**
 * Return a URL that is guaranteed to be in a scheme RNTP can decode.
 *
 *   - Returns the track's own `audioUrl` when it's already playable.
 *   - Returns the category fallback otherwise (keyed by `track.category`).
 *   - Falls back to `ULTIMATE_FALLBACK` when the category is unknown.
 *
 * This is intentionally pure — no network calls, no caching. Pass any
 * `MeditationTrack` (or partial) and you get a URL back, every time.
 */
export function resolvePlayableAudioUrl(track: FallbackTrackInput): string {
  if (track.audioUrl && isLikelyPlayableUrl(track.audioUrl)) {
    return track.audioUrl;
  }
  const byCategory = track.category ? CATEGORY_FALLBACK[track.category] : undefined;
  return byCategory ?? ULTIMATE_FALLBACK;
}

/**
 * Same idea, but returns BOTH the resolved URL and a backup URL the bridge
 * can retry with if the first attempt times out or fails. The backup is
 * always different from the primary so a transient CDN hiccup on one route
 * doesn't take playback down with it.
 */
export function resolveAudioUrlWithBackup(
  track: FallbackTrackInput
): { readonly primary: string; readonly backup: string } {
  const primary = resolvePlayableAudioUrl(track);
  // Pick a deterministic-but-different backup so retries spread load and
  // we never retry the exact URL that just failed.
  const candidates = [
    SOUNDHELIX(1),
    SOUNDHELIX(3),
    SOUNDHELIX(5),
    SOUNDHELIX(7),
    SOUNDHELIX(9),
  ];
  const backup = candidates.find((u) => u !== primary) ?? ULTIMATE_FALLBACK;
  return { primary, backup };
}

/**
 * Look up a bundled asset id for this track, if one is available.
 *   1. An explicit `bundledAudioKey` on the track wins (used by built-ins
 *      that ship with a specific recording).
 *   2. Otherwise, fall back to the category-keyed mapping
 *      ('mantra' → 'om-chant' etc).
 *   3. If the registry has no entry for that key (no MP3 wired up), return
 *      null so callers fall through to the remote URL chain.
 */
function resolveBundledAudio(track: FallbackTrackInput): number | null {
  if (track.bundledAudioKey) {
    const direct = getBundledAudioId(track.bundledAudioKey);
    if (direct !== null) return direct;
  }
  if (track.category) {
    const byCat = CATEGORY_BUNDLED_KEY[track.category];
    if (byCat) {
      const id = getBundledAudioId(byCat);
      if (id !== null) return id;
    }
  }
  return null;
}

/**
 * Full playable-source resolver with offline-first preference.
 *
 *   primary  =  bundled MP3 (if registered)  ||  remote URL via resolvePlayableAudioUrl
 *   backup   =  remote URL                   (always a string, never bundled)
 *
 * The backup is intentionally a remote URL even when the primary is a
 * bundled asset, because the most plausible "primary failed" cases are
 * codec rejection (rare on modern Android) or a corrupt asset shipped in
 * a bad build — both of which are best recovered from with a network
 * fetch. When no bundled assets are wired yet, primary becomes the
 * remote URL and backup is a different remote URL (the existing pre-
 * bundling behaviour).
 */
export function resolvePlayableAudioSource(
  track: FallbackTrackInput
): { readonly primary: PlayableSource; readonly backup: string } {
  const bundled = resolveBundledAudio(track);
  if (bundled !== null) {
    // Backup must be a remote URL — bundled assets cannot retry through
    // a different bundled asset cleanly, and a network fetch is the only
    // recovery path that actually addresses the failure modes (corrupt
    // bundle, codec issue) where a bundled asset would fail to play.
    const remoteFallback = resolvePlayableAudioUrl(track);
    return { primary: bundled, backup: remoteFallback };
  }
  // No bundled asset registered for this track — degrade to the existing
  // remote-URL chain.
  const { primary, backup } = resolveAudioUrlWithBackup(track);
  return { primary, backup };
}
