# Color Palette System

## Overview
MindVibe’s palette balances warmth, clarity, and compassion across three gradient themes plus a precision blue accent. All values include Hex / RGB / HSL and are AA-ready against the prescribed backgrounds.

---

## Primary Theme: Orange–Gold (Warmth & Optimism)
The hero spectrum for the MindVibe badge and core CTAs.

| Name | Hex | RGB | HSL | Usage |
|------|-----|-----|-----|-------|
| Orange Primary | `#FF6B35` | 255, 107, 53 | 18°, 100%, 60% | Primary actions, halo core |
| Orange Mid | `#F7931E` | 247, 147, 30 | 32°, 92%, 54% | Gradient midpoint |
| Gold Primary | `#FFD700` | 255, 215, 0 | 51°, 100%, 50% | Highlights, success |
| Amber Glow | `#FFC680` | 255, 198, 128 | 35°, 100%, 75% | Soft overlays |
| Warm Light | `#FFE8CC` | 255, 232, 204 | 33°, 100%, 90% | Light surfaces |

**Gradient Recipes**
```css
/* Badge Core */
background: linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%);
/* Halo */
background: radial-gradient(circle, rgba(255, 215, 0, 0.35) 0%, rgba(255, 107, 53, 0.18) 55%, transparent 100%);
```

---

## Secondary Theme: Teal–Sky (Inner Peace)
Optimized for breathing flows and tranquil UI states.

| Name | Hex | RGB | HSL | Usage |
|------|-----|-----|-----|-------|
| Teal Core | `#0FB5C9` | 15, 181, 201 | 186°, 87%, 42% | Inner Peace primary |
| Sky Lift | `#43D3E8` | 67, 211, 232 | 189°, 76%, 59% | Gradient midpoint |
| Cloud Light | `#A8E8FF` | 168, 232, 255 | 200°, 100%, 83% | Soft rings, backgrounds |
| Mist | `#D9F6FF` | 217, 246, 255 | 198°, 100%, 92% | Cards, overlays |

**Gradient Recipes**
```css
/* Breath Gradient */
background: linear-gradient(135deg, #0FB5C9 0%, #43D3E8 55%, #A8E8FF 100%);
/* Ring Glow */
background: radial-gradient(circle, rgba(15, 181, 201, 0.45) 0%, rgba(67, 211, 232, 0.2) 65%, transparent 100%);
```

---

## Tertiary Theme: Rose–Lilac (Self Kindness)
A compassionate palette for journaling, kindness, and reflective spaces.

| Name | Hex | RGB | HSL | Usage |
|------|-----|-----|-----|-------|
| Rose Core | `#FF6B9D` | 255, 107, 157 | 342°, 100%, 71% | Self Kindness primary |
| Lilac Beam | `#C77DFF` | 199, 125, 255 | 276°, 100%, 74% | Gradient midpoint |
| Blush Light | `#E6C9FF` | 230, 201, 255 | 274°, 100%, 89% | Blooms, overlays |
| Petal Mist | `#F6E9FF` | 246, 233, 255 | 280°, 100%, 95% | Backgrounds |

**Gradient Recipes**
```css
/* Compassion Gradient */
background: linear-gradient(135deg, #FF6B9D 0%, #C77DFF 55%, #E6C9FF 100%);
/* Heart Bloom */
background: radial-gradient(circle, rgba(255, 107, 157, 0.45) 0%, rgba(199, 125, 255, 0.22) 70%, transparent 100%);
```

---

## Focus Theme: Deep Blue (Mind Control)

| Name | Hex | RGB | HSL | Usage |
|------|-----|-----|-----|-------|
| Focus Deep | `#1E40AF` | 30, 64, 175 | 227°, 71%, 40% | Mind Control anchor |
| Focus Primary | `#3B82F6` | 59, 130, 246 | 217°, 91%, 60% | Beam core |
| Focus Mist | `#80B3F6` | 128, 179, 246 | 216°, 84%, 73% | Trails, accents |

**Gradient Recipe**
```css
background: linear-gradient(90deg, #1E40AF 0%, #3B82F6 55%, #80B3F6 100%);
```

---

## Light & Dark Mode Foundations

### Dark Mode
| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| Background | `#050505` | 0°, 0%, 2% | Canvas |
| Surface | `#0B0B0F` | 240°, 15%, 4% | Cards |
| Surface Elevated | `#121218` | 240°, 22%, 8% | Modals |
| Border | `#1E1E24` | 240°, 11%, 13% | Dividers |
| Text Primary | `#FEFEFE` | 0°, 0%, 100% | Headlines |
| Text Secondary | `#A0A0A0` | 0°, 0%, 63% | Body |

### Light Mode
| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| Background | `#FEFEFE` | 0°, 0%, 100% | Canvas |
| Surface | `#F8FAFC` | 210°, 40%, 97% | Cards |
| Surface Warm | `#FFF7ED` | 32°, 100%, 96% | Warm sections |
| Border | `#E2E8F0` | 210°, 29%, 89% | Dividers |
| Text Primary | `#1E293B` | 215°, 33%, 17% | Headlines |
| Text Secondary | `#475569` | 213°, 24%, 34% | Body |

---

## Glow & Shadow Tokens
- **Subtle Glow**: `0 0 20px rgba(255, 215, 0, 0.18)` (light) or `rgba(67, 211, 232, 0.18)` (teal).
- **Ambient Glow**: `0 0 32px rgba(199, 125, 255, 0.25)` for Rose–Lilac or `rgba(59, 130, 246, 0.22)` for Focus Blue.
- **Shadow (Elevated)**: `0 10px 40px rgba(0,0,0,0.25)` on dark; `0 16px 48px rgba(17, 24, 39, 0.18)` on light.

---

## Accessibility
- Target **WCAG 2.1 AA/AAA**; all text on dark surfaces uses ≥4.5:1 contrast, large text ≥3:1.
- Color is never the only indicator; pair hues with icons, labels, or patterns.
- Provide desaturated variants for color-blind safe charts and ensure glows do not mask focus rings.

---

## CSS Custom Properties
```css
:root {
  /* Orange–Gold */
  --color-orange-primary: #FF6B35;
  --color-orange-mid: #F7931E;
  --color-gold-primary: #FFD700;
  --color-amber-glow: #FFC680;
  --color-warm-light: #FFE8CC;

  /* Teal–Sky */
  --color-teal-core: #0FB5C9;
  --color-sky-lift: #43D3E8;
  --color-cloud-light: #A8E8FF;
  --color-mist: #D9F6FF;

  /* Rose–Lilac */
  --color-rose-core: #FF6B9D;
  --color-lilac-beam: #C77DFF;
  --color-blush-light: #E6C9FF;
  --color-petal-mist: #F6E9FF;

  /* Focus Blue */
  --color-focus-deep: #1E40AF;
  --color-focus-primary: #3B82F6;
  --color-focus-mist: #80B3F6;

  /* Semantics */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Base surfaces */
  --color-bg-dark: #050505;
  --color-surface-dark: #0B0B0F;
  --color-text-dark: #FEFEFE;
  --color-muted-dark: #A0A0A0;
  --color-bg-light: #FEFEFE;
  --color-surface-light: #F8FAFC;
  --color-text-light: #1E293B;
  --color-muted-light: #475569;
}
```

---

*Last Updated: 2024*
*Version: 2.0*
