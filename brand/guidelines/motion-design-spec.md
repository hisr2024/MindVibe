# Motion Design Specification

## Overview
MindVibe motion is subtle, therapeutic, and performance-focused. It favors soft pacing, glowing trails, and breathable timing while staying accessible (respects `prefers-reduced-motion`).

---

## Core Principles
1. **Subtle, Never Distracting** — motion supports comprehension and calm.
2. **Calming Rhythm** — breath-inspired pacing, smooth arcs, low jitter.
3. **Responsive & Purposeful** — every animation communicates state change.
4. **Accessible** — reduced-motion fallbacks, no flashes >3Hz.

---

## Timing & Easing Library
### Duration Ranges
| Category | Duration | Use Cases |
|----------|----------|-----------|
| Micro-interactions | 150–250ms | Buttons, toggles, hover |
| Transitions | 280–420ms | Modals, drawers, page shifts |
| Complex reveals | 500–900ms | Logo reveals, multi-step flows |
| Ambient loops | 4000–9000ms | Breathing, background energy |

### Key Curves (CSS cubic-bezier)
```css
--ease-soft: cubic-bezier(0.25, 0.1, 0.25, 1);          /* default UI */
--ease-balanced: cubic-bezier(0.42, 0, 0.58, 1);        /* equal in/out */
--ease-emphasis: cubic-bezier(0.16, 1, 0.3, 1);         /* dramatic settle */
--ease-meditation: cubic-bezier(0.4, 0, 0.2, 1);        /* ambient breath */
--ease-focus: cubic-bezier(0.33, 0, 0.67, 1);           /* Mind Control beam */
```

---

## Animation Specifications
### KIAAN Logo (Flute + Feather + Ripple)
- **Total reveal**: 2400ms; feather draw 0–400ms, barbs 400–800ms, eye bloom 800–1400ms, wordmark slide 1400–2000ms, subtitle fade 1800–2200ms, micro-tagline 2000–2400ms.
- **Flute shimmer**: 1200ms pass, triggers on hover or every 8s; shimmer gradient travels left→right with 0.6→1→0.6 opacity.
- **Feather sway**: 4000ms loop, ±2° rotation, `--ease-meditation`, `transform-origin: center bottom`; add 6–10 light particles at 20% opacity drifting upward.
- **Energy ripple**: 3000ms concentric ripple (scale 1→1.12→1), opacity 0.35→0.1; runs behind the lockup.
- **Final lockup**: “KIAAN” embossed gradient, subtitle **MindVibe Companion**, tagline “KIAAN — Crisp, calm guidance.” at 70–80% opacity.

### MindVibe Badge Icon
- **Ripple**: 2500ms loop, `--ease-meditation`; ring radius +3% then return; opacity 0.2→0.35→0.2.
- **Monogram float**: 2500ms y-offset 0→-0.4px→0; opacity remains 1 for clarity.
- **Glow**: 6000ms slow pulse, blur 18px→28px→18px; opacity 0.18→0.32→0.18.

### Triangle Flow Energy System (Tabs)
- **Idle loop**: 8000ms; particles orbit edges clockwise; vertices pulse sequentially (top, right, left) with 80ms offsets; outline opacity 0.6→0.8→0.6.
- **Hover**: 200ms, `--ease-soft`; scale vertex to 1.15, glow +40%, redirect 60% of particles toward hovered node.
- **Tap/Active**: 320ms, `--ease-emphasis`; vertex scales to 1.22 then settles 1.12; inner light flash (opacity 0.5→0.9→0.6).
- **Color mapping**: Inner Peace teal; Mind Control deep blue; Self Kindness rose-lilac. Energy lines blend colors where paths meet.

### Tab-Specific Motions
- **Inner Peace (Breath Rings)**: 8000ms loop; 3 staggered rings expand 30%→120%; opacity 0.35→0; gradient `Teal–Sky`.
- **Mind Control (Focus Beam)**: 4200ms loop; beam sweeps left→center→right with 300ms holds; core width 4→6px at center; uses `--ease-focus`.
- **Self Kindness (Heart Bloom)**: 6200ms loop; heart scales 100%→112%→100%; petal bloom fades in 0→60%; gradient `Rose–Lilac` with glow 0.22–0.35 opacity.

---

## Glow & Pulse Intensity
| Level | Blur | Opacity | Use |
|-------|------|---------|-----|
| Subtle | 6px | 0.15 | Resting nodes |
| Normal | 12px | 0.25 | Hover states |
| Strong | 18px | 0.35 | Active tabs |
| Intense | 26px | 0.48 | Logo reveals / confirmations |

Pulse patterns: **Breathing** 4–8s (70→100→70%), **Heartbeat** 1s double-peak (100→80→100%), **Gentle** 2.5s (90→100→90%).

---

## Performance & Accessibility
- Target 60fps; avoid layout-thrashing properties. Prefer `transform` + `opacity`; sparingly use `filter`.
- Promote animated elements to GPU: `transform: translateZ(0); will-change: transform, opacity;`.
- Reduce particle count and blur radii on low-power/mobile; pause ambient loops when tab not visible.
- **Reduced Motion**: replace loops with single-step fades (duration 10ms); keep focus/hover feedback via opacity only.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Export & Delivery
- **Lottie (JSON)**: primary for app (logo, triangle tabs). Keep vector shapes, avoid excessive masks; set markers for states.
- **SVG + CSS**: hover/tap micro-interactions; ideal for low footprint icons.
- **WebM/MP4 (alpha)**: marketing hero and social; cap at 12–15s, 24–30fps.
- **Sprite Sheets**: optional for offline; 8–12 frames for shimmer and sway sequences.

**Markers Examples (Lottie)**
```json
{
  "markers": [
    { "tm": 0, "cm": "start" },
    { "tm": 30, "cm": "hover" },
    { "tm": 70, "cm": "active" }
  ]
}
```

---

*Last Updated: 2024*
*Version: 2.0*
