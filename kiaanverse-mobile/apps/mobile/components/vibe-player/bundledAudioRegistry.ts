/**
 * bundledAudioRegistry — offline-first audio shipped inside the APK.
 *
 * `require('./foo.mp3')` returns a Metro asset id (a `number`) that
 * react-native-track-player accepts as a `Track.url`. The registry maps a
 * stable string key to that asset id; `audioFallbacks.ts` consults it
 * before falling back to remote URLs.
 *
 * Adding a track is a TWO-STEP move:
 *   1. Drop the MP3 into `apps/mobile/assets/audio/<filename>.mp3`.
 *      Specs and licensing rules live in that folder's README.md.
 *   2. Uncomment the matching line below.
 *
 * That's it. The fallback chain (`resolvePlayableAudioSource`) prefers
 * any bundled asset whose key matches the active track's category, with
 * SoundHelix HTTPS URLs as the network-only fallback.
 *
 * Why each row is commented out today
 * -----------------------------------
 * Metro evaluates `require()` at bundle time. Wiring a require for a
 * file that does not exist would fail the production build. Keeping the
 * lines commented means the registry compiles cleanly with zero MP3s,
 * and the offline tier silently activates the moment a file is added.
 *
 * Each key here MUST match a `bundledAudioKey` value used somewhere in
 * `audioFallbacks.ts`. Adding new keys without claiming them in the
 * fallback map gives you a track that is bundled but never selected.
 */

/**
 * Stable category-keyed identifiers. Mirrors the suggested filenames in
 * `assets/audio/README.md`.
 */
export type BundledAudioKey =
  | 'om-chant'
  | 'gayatri'
  | 'tibetan-bowls'
  | 'rain'
  | 'forest'
  | 'solfeggio-528hz';

/**
 * Metro asset ids for every bundled audio file. Empty until MP3s are
 * added to `assets/audio/`.
 *
 * To activate a row: drop the matching MP3 in `assets/audio/` and remove
 * the `// ` from the start of its line.
 */
export const BUNDLED_AUDIO_REGISTRY: Readonly<
  Partial<Record<BundledAudioKey, number>>
> = {
  // 'om-chant': require('../../assets/audio/om-chant.mp3') as number,
  // 'gayatri': require('../../assets/audio/gayatri.mp3') as number,
  // 'tibetan-bowls': require('../../assets/audio/tibetan-bowls.mp3') as number,
  // 'rain': require('../../assets/audio/rain.mp3') as number,
  // 'forest': require('../../assets/audio/forest.mp3') as number,
  // 'solfeggio-528hz': require('../../assets/audio/solfeggio-528hz.mp3') as number,
};

/**
 * Look up a bundled asset id by key. Returns `null` when no MP3 has been
 * dropped in for that key yet — callers MUST handle null and fall back
 * to a remote URL.
 */
export function getBundledAudioId(key: BundledAudioKey): number | null {
  return BUNDLED_AUDIO_REGISTRY[key] ?? null;
}

/** True when at least one bundled track has been wired up. */
export function hasAnyBundledAudio(): boolean {
  return Object.keys(BUNDLED_AUDIO_REGISTRY).length > 0;
}
