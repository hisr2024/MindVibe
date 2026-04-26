# KIAAN Vibe — bundled audio assets

Drop-in folder for **offline-first meditation audio**. Files placed here are
bundled directly into the Android APK / iOS IPA and play with zero network
dependency.

## Why this exists

Meditation usually happens **off the grid** — on retreats, in temples, in
airplane mode, during long flights, in low-signal areas. A meditation app
whose audio breaks the moment the network does is the wrong default for
the use case.

Files in this folder are the *guaranteed* tier of the playback chain:

```
API track audioUrl              ← richest content, ships from backend
   │  fails?
   ▼
bundled asset (this folder)     ← guaranteed to play, even offline
   │  not yet added?
   ▼
SoundHelix HTTPS fallback       ← variety, requires network
```

## Currently bundled (~29 MB total)

| Filename             | Length  | Size   | Category default | Identified as              |
|----------------------|---------|--------|------------------|----------------------------|
| `gayatri.mp3`        | ~7m26s  | 6.9 MB | `mantra`         | Gayatri Mantra (Sounova)   |
| `shanti-mantra.mp3`  | ~2m49s  | 2.6 MB | `chanting`       | Shanti Mantra              |
| `om-hanumate.mp3`    | ~1m15s  | 1.2 MB | `meditation`     | Om Hanumate Namaha (Kals)  |
| `mantra-001.mp3`     | ~4m51s  | 4.5 MB | _(unmapped)_     | _to be identified_         |
| `mantra-002.mp3`     | ~5m37s  | 5.2 MB | _(unmapped)_     | _to be identified_         |
| `mantra-003.mp3`     | ~4m6s   | 3.8 MB | _(unmapped)_     | _to be identified_         |
| `mantra-004.mp3`     | ~4m51s  | 4.5 MB | _(unmapped)_     | _to be identified_         |

The four `mantra-NNN.mp3` files were uploaded with non-ASCII filenames
(Hindi/Sanskrit) that got stripped on transit. They ship inside the APK
and are reachable via explicit `bundledAudioKey`, but no category points
at them yet. Once each is identified, rename to a descriptive filename
(e.g. `mahamrityunjaya.mp3`) and update both `bundledAudioRegistry.ts`
and the `CATEGORY_BUNDLED_KEY` map in `audioFallbacks.ts`.

## Audio specification

- **Format**: MP3, 128 kbps minimum (192 kbps preferred), 44.1 kHz.
- **Channels**: stereo or mono — both work.
- **Length**: 60–180 seconds is ideal because the player loops; longer
  files (like the 7-minute Gayatri included here) are fine but inflate
  the APK without playback benefit.
- **Loop**: seamless. The first 0.5 s and last 0.5 s should match in
  amplitude so the wraparound is inaudible. Audacity → *Effect → Repeat*
  → listen for the click is the cheapest QA pass.
- **Loudness**: target −16 LUFS. Avoid hard limiters.
- **Total budget**: Play Store APK cap is 150 MB; current bundle uses
  ~29 MB across 7 files, leaving plenty of headroom.

## License — IMPORTANT

Use **only** files licensed for unrestricted commercial use **without
attribution requirements**. Recommended sources, in order:

1. **[Pixabay Music](https://pixabay.com/music/)** — Pixabay license,
   commercial use, no attribution required, no signup. **First choice.**
   The `gayatri.mp3` (Sounova Music #493174) and `om-hanumate.mp3` (Kals
   Stock Media #447279) here are from Pixabay.
2. **[Free Music Archive](https://freemusicarchive.org/)** — filter to
   *CC0* (public domain dedication) only. CC-BY-NC tracks are NOT safe
   for a Play Store app that could ever monetize.
3. **[OpenGameArt audio](https://opengameart.org/art-search?keys=&field_art_type_tid%5B%5D=13)**
   — filter to *CC0*.

**Avoid Internet Archive** for music. Most "spiritual" uploads there are
mis-tagged as public domain but are actually copyrighted recordings of
mantras / kirtans. Legal risk is real.

## Adding a new file

1. Drop `<filename>.mp3` into this folder.
2. Add a key to the `BundledAudioKey` union in
   `apps/mobile/components/vibe-player/bundledAudioRegistry.ts`.
3. Add a row to `BUNDLED_AUDIO_REGISTRY` referencing the file.
4. (Optional) Map a category → that key in
   `apps/mobile/components/vibe-player/audioFallbacks.ts:CATEGORY_BUNDLED_KEY`
   so every track in that category prefers the new bundled file.
5. Run `pnpm -r typecheck && pnpm -r test`. Build, ship.

## Renaming an existing file

When `mantra-001.mp3` etc. get identified, update **all three** of:

- The actual filename in this folder.
- The corresponding key in `BundledAudioKey` and `BUNDLED_AUDIO_REGISTRY`.
- Any reference in `CATEGORY_BUNDLED_KEY` or per-track overrides.

TypeScript catches mismatches at compile time, so the rename is safe.
