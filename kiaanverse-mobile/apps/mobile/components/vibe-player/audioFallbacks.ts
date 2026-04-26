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

/**
 * Loose track shape used by every helper here. We deliberately accept a
 * permissive `category: string` rather than reusing the API's narrow union
 * so the bridge can pass through track data from any source (uploads,
 * deep links, debug fixtures) without per-call type assertions.
 */
export interface FallbackTrackInput {
  readonly audioUrl?: string | null;
  readonly category?: string;
}

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
