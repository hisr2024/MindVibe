# Animation Storyboards

## Overview
Frame-accurate guides for the MindVibe and KIAAN identity animations. All timings assume 60fps; translate proportionally if frame rates change. Camera framing is front-on unless noted.

---

## 1. KIAAN Logo Reveal (Flute + Feather + Ripple)
**Total Duration**: 2400ms — Use for splash, loading, guidance moments.

| Frame | Time | Element | Action | Notes |
|-------|------|---------|--------|-------|
| 1 | 0ms | Canvas | Fade in from 0→100% | Neutral dark surface `#0B0B0F` |
| 2 | 0–400ms | Feather shaft | Stroke draw upward | Slight taper; easing `--ease-meditation` |
| 3 | 400–800ms | Feather barbs | Opacity 0→80%, slight stagger | Left then right, 50ms offset |
| 4 | 800–1200ms | Eye rings | Scale 0.6→1.0, opacity 0→100% | Glow 0.25; color Eye Gold |
| 5 | 1200–1400ms | Eye center | Pulse 0.8→1.1→1.0 scale | Micro sparkle particles (6–8) |
| 6 | 1400–1700ms | Flute underline/K stem | Slide in + shimmer pass | Shimmer duration 1200ms overlaps |
| 7 | 1700–2000ms | Wordmark “KIAAN” | Slide left→center, opacity 0→100% | Embossed gradient |
| 8 | 1800–2200ms | Subtitle | Fade in “MindVibe Companion” | 85% opacity |
| 9 | 2000–2400ms | Micro-tagline | Fade in “KIAAN — Crisp, calm guidance.” | 70% opacity, 0.06em tracking |
| 10 | 2400ms+ | Idle | Feather sway loop, shimmer every 8s, ripple 3s | Reduced-motion: static frame |

**Camera & Glow**: Keep camera locked; apply subtle vignette. Long-exposure trail on shimmer (220ms falloff).

---

## 2. MindVibe Badge Ripple
**Total Duration**: 2500ms loop — Loading states, avatars.

| Frame | Time | Element | Action | Property |
|-------|------|---------|--------|----------|
| 1 | 0ms | Badge base | Opacity 100% | — |
| 2 | 0–625ms | Outer ring | Radius +3%, opacity 0.2→0.35 | Breath-like easing |
| 3 | 625–1250ms | Outer ring | Radius return, opacity 0.35→0.2 | |
| 4 | 0–1250ms | Monogram | Float y 0→-0.4px | |
| 5 | 1250–2500ms | Monogram | Return y -0.4px→0 | |
| 6 | 0–2500ms | Glow halo | Blur 18→28→18px, opacity 0.18→0.32→0.18 | |

**Camera**: 1:1 frame centered; allow 15% padding for glow.

---

## 3. Triangle Flow Energy System (Inner Peace / Mind Control / Self Kindness)
**Modes**: Idle (8s loop), Hover (200ms), Active (320ms). Each vertex is a soft orb connected by luminous edges.

### Idle Sequence (8s)
| Frame | Time | Element | Action | Notes |
|-------|------|---------|--------|-------|
| 1 | 0–2667ms | Top vertex (Inner Peace) | Pulse 100→115→100% | Teal gradient |
| 2 | 2667–5333ms | Right vertex (Mind Control) | Pulse 100→115→100% | Deep blue |
| 3 | 5333–8000ms | Left vertex (Self Kindness) | Pulse 100→115→100% | Rose–Lilac |
| 4 | 0–8000ms | Energy path | Particles orbit clockwise | 3–5 particles per edge |
| 5 | 0–8000ms | Outline | Opacity 0.6→0.8→0.6 | Slow breathing | 

### Hover Transition (200ms)
| Frame | Time | Element | Action | Notes |
|-------|------|---------|--------|-------|
| 1 | 0–100ms | Target node | Scale 1.0→1.08 | Glow +30% |
| 2 | 100–200ms | Target node | Scale 1.08→1.15 | Redirect 60% of particles to hovered node |

### Active Transition (320ms)
| Frame | Time | Element | Action | Notes |
|-------|------|---------|--------|-------|
| 1 | 0–140ms | Node | Scale 1.15→1.22 | Inner light flash 0.5→0.9 |
| 2 | 140–320ms | Node | Settle 1.22→1.12 | Light trail along connected edges |

### Tab-Specific Details
- **Inner Peace**: Rings expand 30–120% with teal gradient; inhale 0–3.5s, exhale 3.5–8s.
- **Mind Control**: Beam sweeps left→center→right in 4.2s; hold 300ms at center; edges sharpen slightly.
- **Self Kindness**: Heart bloom scales 100→112%; petals fade in 0→60% then out; soft fractal glow.

---

## 4. Feather Sway (Ambient)
**Total Duration**: 4000ms loop.

| Frame | Time | Rotation | Eye Scale | Notes |
|-------|------|----------|-----------|-------|
| 1 | 0ms | 0° | 100% | Base state |
| 2 | 500ms | 0.5° | 101% | Micro shimmer on barb tips |
| 3 | 1000ms | 2° | 102% | Aura particles ascend |
| 4 | 2000ms | 0° | 100% | Passes through neutral |
| 5 | 3000ms | -2° | 102% | Aura repeats |
| 6 | 4000ms | 0° | 100% | Loop |

**Long Exposure**: Feather tip leaves a faint trail (opacity 0.08, blur 14px).

---

## 5. Flute Shimmer Pass
**Total Duration**: 1200ms — Hover or ambient every 8s.

| Frame | Time | Element | Opacity | Notes |
|-------|------|---------|---------|-------|
| 1 | 0ms | Flute body | 60% | Resting |
| 2 | 0–200ms | Hole 1 | 60→100% | Shimmer start |
| 3 | 200–400ms | Hole 2 | 60→100% | |
| 4 | 400–600ms | Hole 3 | 60→100% | |
| 5 | 600–900ms | Body | Gradient sweep | Metallic shine |
| 6 | 900–1200ms | All | 100→60% | Fade to rest |

**Camera**: Align shimmer at 30° angle to feel premium; highlight softly blooms beyond edges.

---

## 6. Interaction Responses (Reduced Motion Aware)
- **Hover**: Increase glow only (no scale) when `prefers-reduced-motion` is on.
- **Tap**: Instant opacity bump + focus ring; no bounce.
- **Idle**: Freeze on first frame; retain high-contrast outlines for clarity.

---

*Last Updated: 2024*
*Version: 2.0*
