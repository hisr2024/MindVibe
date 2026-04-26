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

Until you drop MP3s in this folder, the registry is empty and the player
silently skips this tier — current SoundHelix-based playback continues.
The moment you add a file **and** wire it in `bundledAudioRegistry.ts`,
the player picks it up automatically with no further code changes.

## What to add

Six short, seamlessly-looping tracks. The Vibe Player uses
`repeatMode = 'one'` so a 60–180 second loop fills any session length:

| Filename                | Category   | Suggested length | Source/search keyword       |
|-------------------------|------------|------------------|-----------------------------|
| `om-chant.mp3`          | mantra     | 60–180 s         | "Om mantra" / "Om chant"    |
| `gayatri.mp3`           | mantra     | 60–180 s         | "Gayatri Mantra"            |
| `tibetan-bowls.mp3`     | meditation | 60–180 s         | "Tibetan singing bowls"     |
| `rain.mp3`              | ambient    | 60–180 s         | "rain ambient" / "rainfall" |
| `forest.mp3`            | ambient    | 60–180 s         | "forest birds" / "morning"  |
| `solfeggio-528hz.mp3`   | meditation | 60–180 s         | "528Hz" / "solfeggio drone" |

## Audio specification

- **Format**: MP3, 128 kbps minimum (192 kbps preferred), 44.1 kHz.
- **Channels**: stereo or mono — both work.
- **Length**: 60–180 seconds. Longer files inflate the APK without benefit
  because the looper handles repetition for free.
- **Loop**: seamless. The first 0.5 s and last 0.5 s should match in
  amplitude so the wraparound is inaudible. Audacity → *Effect → Repeat*
  → listen for the click is the cheapest QA pass.
- **Loudness**: target −16 LUFS. Avoid hard limiters; meditation audio
  should breathe.
- **Total budget**: ~10–12 MB across all 6 files. Play Store APK cap is
  150 MB single APK; we have plenty of headroom.

## License — IMPORTANT

Use **only** files licensed for unrestricted commercial use **without
attribution requirements**. Recommended sources, in order:

1. **[Pixabay Music](https://pixabay.com/music/)** — Pixabay license,
   commercial use, no attribution required, no signup. **First choice.**
2. **[Free Music Archive](https://freemusicarchive.org/)** — filter to
   *CC0* (public domain dedication) only. CC-BY-NC tracks are NOT safe
   for a Play Store app that could ever monetize.
3. **[OpenGameArt audio](https://opengameart.org/art-search?keys=&field_art_type_tid%5B%5D=13)**
   — filter to *CC0*.

**Avoid Internet Archive** for music. Most "spiritual" uploads there are
mis-tagged as public domain but are actually copyrighted recordings of
mantras / kirtans. Legal risk is real.

## Wiring the files in

Once a file lives in this folder, add **one line** to
`apps/mobile/components/vibe-player/bundledAudioRegistry.ts`:

```ts
export const BUNDLED_AUDIO_REGISTRY: Readonly<Record<string, number>> = {
  // After dropping om-chant.mp3 into assets/audio/, uncomment:
  // 'om-chant': require('../../assets/audio/om-chant.mp3'),
  // 'gayatri': require('../../assets/audio/gayatri.mp3'),
  // 'tibetan-bowls': require('../../assets/audio/tibetan-bowls.mp3'),
  // 'rain': require('../../assets/audio/rain.mp3'),
  // 'forest': require('../../assets/audio/forest.mp3'),
  // 'solfeggio-528hz': require('../../assets/audio/solfeggio-528hz.mp3'),
};
```

That's it. The fallback chain in `audioFallbacks.ts` consults this
registry first — bundled assets immediately become the preferred source
for every track in their category. Run `pnpm typecheck && pnpm lint`,
build, ship.

## Why this is empty today

I (the engineer wiring this up) cannot legally source and commit the audio
files myself. The runway is laid; whoever owns the Play Store release
adds the files when ready. Current behaviour — SoundHelix HTTPS fallback —
continues until then, so users always hear *something* when they tap a
track.
