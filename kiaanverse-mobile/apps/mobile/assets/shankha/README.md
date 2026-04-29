# Shankha (शङ्ख) Asset Bundle — Designer Specification

> Confidential to Kiaanverse / MindVibe — do not distribute outside the team.

Production assets for the Sakha Voice Companion's Shankha icon. The runtime
loader at `voice/components/ShankhaLottie.tsx` consumes this folder. When
files are missing, the Voice Companion gracefully falls back to the inline
SVG Shankha at `voice/components/Shankha.tsx` (no crash, no broken UI),
but the experience is placeholder until the real assets land.

## Hard rules (per FINAL.2 spec — `KIAAN_VOICE_COMPANION_FINAL.md` § ICONOGRAPHY)

- Realistic conch shell rendering — **never flat cartoon**
- Cream/ivory body, warm gold or copper rim accent
- Three-quarter angle with mouth slightly visible
- Optional sacred marking (Om/Sri/tilak) only if legible at 24dp
- Cinematic, realistic, divine
- **No bouncing waveforms. No bulb. No microphone-only icon.**

## What to deliver

### 1. Lottie animations — one per state (7 files)

Place under `assets/shankha/` with these exact filenames. The runtime
imports them by literal path; a typo means a missing-asset fallback.

| State | File | Animation behavior |
|-------|------|---------------------|
| idle | `idle.lottie.json` | Static conch with soft warm glow at mouth (subtle 4s breath loop, ±5% opacity on glow only) |
| listening | `listening.lottie.json` | Slow steady pulse at mouth, like breath. 1.6s cycle, gold rim brightens 70%→100%→70% |
| thinking | `thinking.lottie.json` | Inward shimmer over the body (top→bottom sweep, 2.4s cycle). No external pulse |
| interrupted | `interrupted.lottie.json` | Brief pause animation: existing waves fade to nothing in 300ms, conch dims 15% |
| offline | `offline.lottie.json` | Cool moonlit ivory tint. Near-stillness — only a 6s drift on the ambient glow |
| error | `error.lottie.json` | Dimmed conch, no animation, 80% opacity, slight cool gray cast |
| **speaking** | _(no Lottie file)_ | **DO NOT PRODUCE.** Sound waves are rendered in React Native via Reanimated 3 worklets driven by ExoPlayer RMS metering. The Lottie can't sync to real audio. |
| **crisis** | _(no Lottie file)_ | **DO NOT PRODUCE.** Crisis state is steady warm light, no animation — grounding by stillness. |

### Lottie format requirements

- **Format**: bodymovin JSON (After Effects export via Bodymovin or Lottie Files)
- **Frame rate**: 60fps for `listening` and `thinking`; 30fps for `idle`, `offline`, `error`, `interrupted`
- **Canvas**: 512×512px (native renders at 24/48/96/192/384dp; Lottie is vector so one file fits all)
- **Color depth**: full color, no palette limitation
- **Alpha**: full alpha channel, transparent background
- **Max file size**: 80KB per `.lottie.json`. If larger, simplify the path/keyframes
- **No raster layers**: pure vector. Embedded PNGs disqualify the asset
- **Loop behavior**: all stateful animations must loop seamlessly (last frame interpolates back to first)

### 2. Adaptive launcher icon — 2 layers

Android adaptive icons have a foreground + background layer that the
launcher composites with system masks (round, rounded square, etc.).

| Layer | File | Spec |
|-------|------|------|
| Foreground | `adaptive-icon-shankha-foreground.png` | Shankha at center, **108×108dp safe zone in a 432×432px image** (4× density). Transparent outside the safe zone — Android crops dynamically. |
| Background | `adaptive-icon-shankha-background.png` | Sacred-geometry mandala (very subtle, low contrast — must read at 48dp from a launcher grid). 432×432px, opaque, no transparency. |

Replace the existing `assets/adaptive-icon.png` at `app.config.ts` with the
foreground layer. The background layer is already declared in
`app.config.ts:android.adaptiveIcon.backgroundImage`.

### 3. Notification icon — foreground service

The voice companion runs a foreground service while the WSS session is
active (`mediaPlayback` type) and shows a persistent notification:
*"सखा सुन रहे हैं"* (Sakha is listening). Android requires a
**monochrome silhouette** for status-bar notifications.

| File | Spec |
|------|------|
| `notification-icon-shankha.png` | Pure-white silhouette of the Shankha on transparent background. 96×96px. Android tints it via `android:tint` to the brand gold at runtime. **Single layer. No anti-aliased outlines.** |

Replace `assets/notification-icon.png`.

### 4. Splash screen

Existing `assets/splash.png` is a generic placeholder. Replace with a
cinematic Shankha against the cosmic-void backdrop.

| File | Spec |
|------|------|
| `splash.png` | 1080×1920px (portrait), Shankha centered with sacred-geometry pulse overlay. Cosmic-void (#050714) backdrop. The Sakha word-mark in Cormorant Garamond LightItalic appears below the conch. |

### 5. Density variants for any raster you can't avoid

Lottie removes most density concerns, but the launcher icon, notification
icon, and splash are raster. Provide:

| Density | Suffix | Pixel scale |
|---------|--------|-------------|
| mdpi | (none) | 1× |
| hdpi | (none) | 1.5× |
| xhdpi | (none) | 2× |
| xxhdpi | (none) | 3× |
| xxxhdpi | (none) | 4× |

Expo handles density bucketing automatically when you provide a single
4× source — leave the `@1x`/`@2x` workflow to Expo's asset hashing.

### 6. Dark mode variants (optional but encouraged)

Android 10+ supports per-resource dark mode. If the Shankha looks washed
out on a dark theme, ship dark variants:

| Light mode | Dark mode |
|-----------|-----------|
| `idle.lottie.json` | `idle.dark.lottie.json` |
| `adaptive-icon-shankha-foreground.png` | `adaptive-icon-shankha-foreground.dark.png` |
| `splash.png` | `splash.dark.png` |

If absent, the light versions are used in both modes (acceptable but
visually slightly weaker on AMOLED displays).

## Drop-in workflow

Once the bundle is ready:

1. Place `*.lottie.json` files into this folder
2. Replace `assets/adaptive-icon.png` with the new foreground layer
3. Add `assets/adaptive-icon-shankha-background.png`
4. Replace `assets/notification-icon.png`
5. Replace `assets/splash.png`
6. Run `pnpm --filter @kiaanverse/sakha-mobile run validate-assets` — script lints
   sizes, formats, and Lottie file integrity
7. `eas build --profile production --platform android` — APK now ships the
   real Shankha
8. Sideload + walk through every voice state in the canvas to confirm
   visual quality on real OLED hardware (some color hex values look
   different on the device vs the design tool)

## Manifest

The runtime loader checks `manifest.json` in this folder before loading
any Lottie file. If you ship more states or alternate variants, add them
there — the loader picks them up automatically.

See `manifest.json` for the current schema.
