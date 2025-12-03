# Animation Storyboards

## Overview

This document provides frame-by-frame breakdowns for all MindVibe brand animations. Each storyboard includes timing, keyframes, easing specifications, and technical notes for implementation.

---

## 1. KIAAN Logo Reveal Sequence

### Sequence Overview
- **Total Duration**: 2400ms (2.4s)
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (dramatic)
- **Use Case**: Splash screen, first-time app launch

### Frame-by-Frame Breakdown

| Frame | Time | Element | Action | Opacity | Scale | Notes |
|-------|------|---------|--------|---------|-------|-------|
| 1 | 0ms | All | Initial state | 0% | 0.8 | Nothing visible |
| 2 | 0-400ms | Feather shaft | Draws from base to tip | 0→100% | 1.0 | SVG stroke animation |
| 3 | 400-800ms | Feather barbs | Fade in from shaft | 0→80% | 0.9→1.0 | Left then right, 50ms stagger |
| 4 | 800-1200ms | Eye rings | Expand from center | 0→100% | 0.5→1.0 | Outer ring first |
| 5 | 1200-1400ms | Eye center | Glow pulse | 0→100% | 0.8→1.1→1.0 | Dramatic entrance |
| 6 | 1400-1800ms | "KIAAN" text | Fade + slide left | 0→100% | — | x: +20→0 |
| 7 | 1800-2100ms | "— MindVibe Companion" | Fade in | 0→90% | — | Slower, softer |
| 8 | 2100-2400ms | "Crisp, calm guidance" | Subtle fade | 0→70% | — | Completes sequence |

### Keyframe CSS

```css
@keyframes kiaan-reveal {
  0% { opacity: 0; transform: scale(0.8); }
  17% { opacity: 1; } /* 400ms - shaft complete */
  33% { } /* 800ms - barbs complete */
  50% { } /* 1200ms - eye rings complete */
  58% { } /* 1400ms - eye center complete */
  75% { } /* 1800ms - KIAAN text complete */
  87% { } /* 2100ms - tagline complete */
  100% { opacity: 1; transform: scale(1); }
}
```

---

## 2. MindVibe Icon Ripple Animation

### Sequence Overview
- **Total Duration**: 2500ms (2.5s) loop
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (meditation)
- **Use Case**: Ambient logo animation, loading states

### Frame-by-Frame Breakdown

| Frame | Time | Element | Action | Property | Values |
|-------|------|---------|--------|----------|--------|
| 1 | 0ms | Circle | Resting state | radius | 18 |
| 2 | 0-625ms | Circle | Expand phase | radius | 18→18.3 |
| 3 | 625-1250ms | Circle | Peak + contract | radius | 18.3→18 |
| 4 | 1250-1875ms | M letterform | Subtle float | y | 0→-0.3 |
| 5 | 1875-2500ms | M letterform | Return | y | -0.3→0 |
| 6 | 0-2500ms | Highlight arc | Opacity pulse | opacity | 0.2→0.35→0.2 |

### Lottie Markers

```json
{
  "markers": [
    { "tm": 0, "cm": "Start", "dr": 0 },
    { "tm": 38, "cm": "Peak Expand", "dr": 0 },
    { "tm": 75, "cm": "Loop", "dr": 0 }
  ]
}
```

---

## 3. Triangle Flow System

### A. Idle State Animation

**Duration**: 8000ms (8s) loop
**Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`

| Frame | Time | Element | Action | Notes |
|-------|------|---------|--------|-------|
| 1 | 0-2667ms | Top vertex | Pulse | Scale 100%→115%→100% |
| 2 | 2667-5333ms | Right vertex | Pulse | Staggered from top |
| 3 | 5333-8000ms | Left vertex | Pulse | Staggered from right |
| 4 | 0-8000ms | Particles (3x) | Circulate | Around triangle edges |
| 5 | 0-8000ms | Triangle outline | Opacity pulse | 60%→80%→60% |

### B. Hover State Transition

**Duration**: 200ms
**Easing**: `cubic-bezier(0.25, 0.1, 0.25, 1)`

| Frame | Time | Property | From | To |
|-------|------|----------|------|-----|
| 1 | 0ms | scale | 1.0 | 1.0 |
| 2 | 100ms | scale | 1.0 | 1.08 |
| 3 | 200ms | scale | 1.08 | 1.15 |
| 4 | 0-200ms | glow | 0 | 50% intensity |

### C. Active State Transition

**Duration**: 300ms
**Easing**: `cubic-bezier(0.16, 1, 0.3, 1)`

| Frame | Time | Property | Action |
|-------|------|----------|--------|
| 1 | 0ms | vertex | Begin expansion |
| 2 | 150ms | tab animation | Trigger specific animation |
| 3 | 300ms | settled | Active state complete |

---

## 4. Feather Sway Sequence

### Sequence Overview
- **Total Duration**: 4000ms (4s) loop
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (meditation)
- **Use Case**: Ambient KIAAN animation

### Frame-by-Frame Breakdown

| Frame | Time | Rotation | Barb Opacity | Eye Scale |
|-------|------|----------|--------------|-----------|
| 1 | 0ms | 0° | 80% | 100% |
| 2 | 500ms | 0.5° | 82% | 100% |
| 3 | 1000ms | 2° | 90% | 102% |
| 4 | 1500ms | 1.5° | 88% | 101% |
| 5 | 2000ms | 0° | 80% | 100% |
| 6 | 2500ms | -0.5° | 82% | 100% |
| 7 | 3000ms | -2° | 90% | 102% |
| 8 | 3500ms | -1.5° | 88% | 101% |
| 9 | 4000ms | 0° | 80% | 100% |

### Pivot Point
- Origin: Bottom center of feather shaft
- CSS: `transform-origin: center bottom;`

---

## 5. Flute Shimmer Pass

### Sequence Overview
- **Total Duration**: 1200ms (1.2s)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Trigger**: On hover or every 8s ambient

### Frame-by-Frame Breakdown

| Frame | Time | Element | Opacity | Notes |
|-------|------|---------|---------|-------|
| 1 | 0ms | Flute body | 60% | Resting state |
| 2 | 0-200ms | Hole 1 | 60%→100% | Leftmost hole |
| 3 | 200-400ms | Hole 2 | 60%→100% | Center hole |
| 4 | 400-600ms | Hole 3 | 60%→100% | Rightmost hole |
| 5 | 600-900ms | All holes | 100%→100% | Hold peak |
| 6 | 900-1200ms | All | 100%→60% | Fade back |

### Shimmer Gradient

```css
@keyframes flute-shimmer {
  0% { 
    background-position: -100% 0;
    opacity: 0.6;
  }
  50% { 
    background-position: 100% 0;
    opacity: 1;
  }
  100% { 
    background-position: 200% 0;
    opacity: 0.6;
  }
}
```

---

## 6. Inner Peace Breath Rings

### Sequence Overview
- **Total Duration**: 8000ms (8s) loop
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Use Case**: Inner Peace tab animation

### Frame-by-Frame Breakdown

| Frame | Time | Ring 1 | Ring 2 | Ring 3 | Notes |
|-------|------|--------|--------|--------|-------|
| 1 | 0ms | Scale 30% | — | — | Inhale begins |
| 2 | 0-1333ms | 30%→60% | — | — | First ring expands |
| 3 | 1333ms | — | Scale 30% | — | Second ring starts |
| 4 | 1333-2667ms | 60%→90% | 30%→60% | — | Both expanding |
| 5 | 2667ms | — | — | Scale 30% | Third ring starts |
| 6 | 2667-4000ms | 90%→120% | 60%→90% | 30%→60% | All expanding |
| 7 | 4000ms | Fade out | — | — | Peak expansion |
| 8 | 4000-8000ms | — | Continue | Continue | Exhale phase |

### Color Transition

```css
Ring 1: #00CED1 (Teal Primary)
Ring 2: #4DD0E1 (Teal Secondary) 
Ring 3: #87CEEB (Sky Primary)
```

---

## 7. Mind Control Focus Beam

### Sequence Overview
- **Total Duration**: 4000ms (4s) loop
- **Easing**: `cubic-bezier(0.42, 0, 0.58, 1)` (balanced)
- **Use Case**: Mind Control tab animation

### Frame-by-Frame Breakdown

| Frame | Time | Pulse Position | Core Width | Center Scale |
|-------|------|----------------|------------|--------------|
| 1 | 0ms | Left edge | 4px | 100% |
| 2 | 0-500ms | Left→25% | 4px | 100% |
| 3 | 500-1000ms | 25%→Center | 4→6px | 100%→130% |
| 4 | 1000-1500ms | Center (hold) | 6px | 130% (peak) |
| 5 | 1500-2000ms | Center→75% | 6→4px | 130%→100% |
| 6 | 2000-2500ms | 75%→Right | 4px | 100% |
| 7 | 2500-3000ms | Right (hold) | 4px | 100% |
| 8 | 3000-4000ms | Right→Left | 4px | 100% |

---

## 8. Self Kindness Heart Bloom

### Sequence Overview
- **Total Duration**: 6000ms (6s) loop
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Use Case**: Self Kindness tab animation

### Frame-by-Frame Breakdown

| Frame | Time | Heart Scale | Glow Ring 1 | Petals |
|-------|------|-------------|-------------|--------|
| 1 | 0ms | 100% | 50% scale | Hidden |
| 2 | 0-750ms | 100%→105% | 50%→75% | Fade in 0%→30% |
| 3 | 750-1500ms | 105%→110% | 75%→100% | 30%→60% |
| 4 | 1500-2250ms | 110%→105% | Fade: 80%→40% | Hold 60% |
| 5 | 2250-3000ms | 105%→100% | 100%→50% | Fade 60%→0% |
| 6 | 3000-6000ms | Repeat | Repeat | Repeat |

### Petal Positions (Fractal Bloom)

```
Petal 1: Top (0°)
Petal 2: Top-Right (60°)
Petal 3: Top-Left (-60°)
```

---

## Technical Implementation Notes

### Performance Optimization

1. **Use transform and opacity only**
   ```css
   /* Good - GPU accelerated */
   transform: scale(1.1);
   opacity: 0.8;
   
   /* Avoid - triggers layout */
   width: 110%;
   top: -10px;
   ```

2. **Promote to GPU layer**
   ```css
   .animated-element {
     transform: translateZ(0);
     will-change: transform, opacity;
   }
   ```

3. **Request Animation Frame for JS**
   ```javascript
   function animate() {
     // Animation logic
     requestAnimationFrame(animate);
   }
   ```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .kiaan-feather {
    animation: none;
  }
  
  .triangle-particle {
    animation: none;
    opacity: 0.5; /* Static fallback */
  }
}
```

### Lottie Implementation

```javascript
import lottie from 'lottie-web';

const animation = lottie.loadAnimation({
  container: element,
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: '/brand/animations/kiaan-animated.json'
});

// Respect reduced motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  animation.stop();
  animation.goToAndStop(0, true);
}
```

---

*Last Updated: 2024*
*Version: 1.0*
