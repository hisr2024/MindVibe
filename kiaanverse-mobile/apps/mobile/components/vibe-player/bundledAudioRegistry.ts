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
 * Stable identifiers for every bundled track.
 *
 * Only tracks with VERIFIED LICENSED PROVENANCE may be added here. The two
 * currently bundled tracks are documented in
 * `apps/mobile/assets/audio/README.md`:
 *   - 'gayatri'      — Sounova Music Gayatri Mantra (Pixabay #493174, CC0)
 *   - 'om-hanumate'  — Om Hanumate Namaha (Pixabay Kals #447279, CC0)
 *
 * Earlier drafts of this registry referenced 5 additional tracks
 * ('shanti-mantra', 'mantra-001'..'mantra-004') that lacked licensed
 * source records. They were removed in Phase 1N IP-hygiene to avoid
 * shipping audio whose copyright posture cannot be defended. To re-add
 * any track:
 *   1. Source it from a CC0/PD origin (Pixabay, Free Music Archive)
 *   2. Record the source URL + license in `assets/audio/README.md`
 *   3. Add the key here AND a matching `bundledAudioKey` in
 *      `audioFallbacks.ts`
 */
export type BundledAudioKey =
  | 'gayatri'
  | 'om-hanumate';

/**
 * Metro asset ids for every bundled audio file.
 *
 * Each `require()` resolves to a `number` (the Metro asset id) at bundle
 * time. The `as number` cast is structural — it satisfies TypeScript
 * without leaking `require`'s loose `any` typing into the registry.
 *
 * `require()` (rather than `import`) is the React Native-canonical way to
 * reference binary asset bundles — Metro inlines the asset id at build
 * time and there is no ESM equivalent. The rule is disabled for this
 * block only.
 */
/* eslint-disable @typescript-eslint/no-var-requires, global-require */
export const BUNDLED_AUDIO_REGISTRY: Readonly<
  Partial<Record<BundledAudioKey, number>>
> = {
  'gayatri': require('../../assets/audio/gayatri.mp3') as number,
  'om-hanumate': require('../../assets/audio/om-hanumate.mp3') as number,
};
/* eslint-enable @typescript-eslint/no-var-requires, global-require */

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
