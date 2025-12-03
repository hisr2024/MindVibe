# Motion Design Specification

## Overview

MindVibe's motion design language creates a calming, therapeutic experience through subtle, purposeful animations. All motion is designed to enhance the user experience without distraction.

---

## Core Principles

### 1. Subtle, Never Distracting
- Animations support content, not compete with it
- Reduce cognitive load, not increase it
- Default to subtle over dramatic

### 2. Calming, Therapeutic Rhythm
- Slow, deliberate timing creates calm
- Breathing-inspired pacing (inhale/exhale)
- Natural, organic movement curves

### 3. Responsive & Purposeful
- Immediate feedback on user actions
- Clear state transitions
- Meaningful motion over decorative motion

### 4. Accessible
- Respect `prefers-reduced-motion`
- Provide static alternatives
- No seizure-inducing patterns

---

## Timing Specifications

### Duration Ranges

| Category | Duration | Use Cases |
|----------|----------|-----------|
| Micro-interactions | 150–250ms | Buttons, toggles, hover states |
| Transitions | 300–400ms | Page transitions, modals, drawers |
| Complex animations | 500–800ms | Multi-step reveals, success states |
| Ambient loops | 4000–8000ms | Background animations, breathing guides |

### Specific Durations

| Animation | Duration | Notes |
|-----------|----------|-------|
| Button press | 150ms | Quick tactile feedback |
| Hover state | 200ms | Smooth highlight |
| Modal open | 300ms | Standard transition |
| Modal close | 250ms | Slightly faster exit |
| Page transition | 400ms | Smooth but not slow |
| Toast notification | 300ms in, 200ms out | Quick appearance |
| Loading spinner | 1000ms loop | Continuous |
| Breathing guide | 4000–8000ms cycle | Slow, calming |
| KIAAN feather sway | 4000ms (4s) cycle | Gentle ambient |
| Flute shimmer pass | 1200ms (1.2s) | Subtle highlight |

---

## Easing Curves

### Primary Easings

```css
/* Smooth - Default for most transitions */
--ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);

/* Balanced - Symmetrical ease in/out */
--ease-balanced: cubic-bezier(0.42, 0, 0.58, 1);

/* Dramatic - Strong deceleration for emphasis */
--ease-dramatic: cubic-bezier(0.16, 1, 0.3, 1);

/* Meditation - Extra soft for ambient animations */
--ease-meditation: cubic-bezier(0.4, 0, 0.2, 1);
```

### Use Cases

| Easing | When to Use |
|--------|-------------|
| Smooth | Hover states, simple transitions |
| Balanced | Modals, drawers, equal weight in/out |
| Dramatic | Success states, emphasis reveals |
| Meditation | Breathing animations, ambient loops |

---

## Animation Specifications

### KIAAN Logo Animation

**Feather Sway**
- Duration: 4000ms (4s) cycle
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Rotation: ±2° from center
- Keyframes:
  ```
  0%: rotate(0deg)
  25%: rotate(2deg)
  50%: rotate(0deg)
  75%: rotate(-2deg)
  100%: rotate(0deg)
  ```

**Flute Shimmer**
- Duration: 1200ms (1.2s)
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Effect: Opacity pulse 0.6 → 1.0 → 0.6
- Trigger: On hover or every 8s ambient

**Eye Center Glow**
- Duration: 2500ms cycle
- Easing: `ease-in-out`
- Scale: 1.0 → 1.1 → 1.0
- Opacity: 0.8 → 1.0 → 0.8

### MindVibe Logo Animation

**Circle Pulse**
- Duration: 2500ms cycle
- Easing: `ease-in-out`
- Radius: r → r+0.3 → r
- Subtle, barely perceptible

**M Letterform Float**
- Duration: 2500ms cycle
- Easing: `ease-in-out`
- Y-offset: 0 → -0.3px → 0
- Very subtle vertical movement

### Triangle Flow System

**Idle State**
- Duration: 8000ms (8s) cycle
- Vertices pulse in sequence (80ms offset each)
- Particles circulate around edges
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`

**Hover State**
- Duration: 200ms transition
- Vertex scales to 115%
- Glow intensity increases 50%
- Easing: `cubic-bezier(0.25, 0.1, 0.25, 1)`

**Active State**
- Duration: 300ms transition
- Tab-specific animation triggers
- Color intensity increases
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`

### Tab-Specific Animations

**Inner Peace (Breath Rings)**
- Duration: 8000ms cycle
- Expanding concentric rings
- 3 rings staggered by 40 frames
- Colors: Teal gradient (#00CED1 → #87CEEB → #E0F7FA)

**Mind Control (Focus Beam)**
- Duration: 4000ms cycle
- Linear pulse left → center → right
- Concentrated center point
- Colors: Deep blue (#1E40AF → #3B82F6 → #80B3F6)

**Self Kindness (Heart Bloom)**
- Duration: 6000ms cycle
- Heart-glow with petal bloom
- Fractal expansion pattern
- Colors: Rose-lilac (#FF6B9D → #C77DFF → #E0BBE4)

---

## Glow & Pulse Intensity

### Glow Levels

| Level | Blur | Opacity | Use Case |
|-------|------|---------|----------|
| Subtle | 4px | 0.15 | Resting state |
| Normal | 8px | 0.25 | Hover state |
| Strong | 12px | 0.35 | Focus state |
| Intense | 20px | 0.5 | Active/selected |

### Pulse Patterns

| Pattern | Duration | Intensity Range |
|---------|----------|-----------------|
| Breathing | 4–8s | 70% → 100% → 70% |
| Heartbeat | 1s | 100% → 80% → 100% (double peak) |
| Gentle | 2.5s | 90% → 100% → 90% |

---

## Performance Guidelines

### Frame Rate
- Target: 60fps on all devices
- Minimum: 30fps on low-end devices
- Use `will-change` sparingly

### GPU Optimization
```css
/* Promote to GPU layer */
.animated-element {
  transform: translateZ(0);
  will-change: transform, opacity;
}
```

### Mobile Considerations
- Reduce particle count on mobile
- Simplify gradients where possible
- Use hardware-accelerated properties only:
  - `transform`
  - `opacity`
  - `filter` (with caution)

### Battery Optimization
- Pause animations when tab is not visible
- Use `requestAnimationFrame` for JS animations
- Reduce animation intensity in low-power mode

---

## Reduced Motion Support

### CSS Implementation
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Alternative States
- Replace animations with instant state changes
- Keep essential feedback (success/error indicators)
- Use opacity transitions instead of transforms

---

## Export Formats

### Lottie JSON
- Primary format for complex animations
- Lightweight and scalable
- Supports interactivity
- Use for: Logo animations, tab animations, illustrations

### WebM/MP4
- Video format for complex effects
- Use for: Marketing materials, backgrounds
- Fallback for non-Lottie environments

### SVG + CSS
- For simple animations
- Best performance
- Use for: Hover effects, simple transitions

### Sprite Sheets
- For frame-by-frame animations
- Use for: Complex illustrations, games

---

## Developer Handoff

### Animation Properties Object
```typescript
interface AnimationConfig {
  duration: number;        // milliseconds
  easing: string;          // CSS cubic-bezier
  delay?: number;          // milliseconds
  iterations?: number;     // count or 'infinite'
  direction?: 'normal' | 'reverse' | 'alternate';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}
```

### Common Configurations
```typescript
const animations = {
  microInteraction: {
    duration: 150,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
  transition: {
    duration: 300,
    easing: 'cubic-bezier(0.42, 0, 0.58, 1)',
  },
  ambient: {
    duration: 4000,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    iterations: 'infinite',
  },
};
```

---

*Last Updated: 2024*
*Version: 1.0*
