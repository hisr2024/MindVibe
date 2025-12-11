# Typography System

## Overview
MindVibe typography delivers calm clarity and inclusive readability. It pairs a warm humanist body face with a rounded display for logo lockups, ensuring the system feels premium yet approachable.

---

## Font Stack
### Primary Font: Inter
```css
font-family: 'Inter', 'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```
**Usage**: Body text, UI elements, captions.

### Secondary Font: Manrope
```css
font-family: 'Manrope', 'Outfit', system-ui, sans-serif;
```
**Usage**: Display headings, hero text, key marketing headlines.

### Wordmarks
- **MindVibe**: Inter or custom variant, 700 weight, +0.02em tracking; gradient fill `Orange–Gold`.
- **KIAAN**: Manrope uppercase, 700 weight, +0.12–0.15em tracking; gradient fill `Teal → Gold`, metallic shimmer allowed for animation.
- **Micro-tagline**: 12–14px Inter Medium, +0.06–0.08em tracking: “Your Guide to Inner Peace”

---

## Type Scale
| Level | Desktop | Mobile | Line Height | Letter Spacing | Usage |
|-------|---------|--------|-------------|----------------|-------|
| Display XL | 64px | 40px | 1.1 | -0.02em | Hero, launch splash |
| Display | 56px | 36px | 1.1 | -0.02em | Marketing hero |
| H1 | 48px | 32px | 1.2 | -0.01em | Page titles |
| H2 | 36px | 28px | 1.25 | -0.01em | Section heads |
| H3 | 28px | 24px | 1.3 | 0 | Sub-sections |
| H4 | 24px | 20px | 1.35 | 0 | Cards |
| H5 | 20px | 18px | 1.4 | 0.01em | Labels, highlights |
| Body L | 18px | 17px | 1.5 | 0 | Lead paragraphs |
| Body | 16px | 16px | 1.5 | 0 | Default copy |
| Body S | 14px | 14px | 1.5 | 0.01em | Secondary text |
| Caption | 12px | 12px | 1.4 | 0.02em | Metadata |
| Micro | 10px | 10px | 1.3 | 0.04em | Pills, UI tags |

---

## Semantic Styles
### Headings
```css
.heading-display-xl { font-family: 'Manrope', system-ui, sans-serif; font-size: 64px; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
.heading-display { font-family: 'Manrope', system-ui, sans-serif; font-size: 56px; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
.heading-1 { font-family: 'Inter', system-ui, sans-serif; font-size: 48px; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; }
.heading-2 { font-family: 'Inter', system-ui, sans-serif; font-size: 36px; font-weight: 600; line-height: 1.25; letter-spacing: -0.01em; }
.heading-3 { font-family: 'Inter', system-ui, sans-serif; font-size: 28px; font-weight: 600; line-height: 1.3; }
.heading-4 { font-family: 'Inter', system-ui, sans-serif; font-size: 24px; font-weight: 600; line-height: 1.35; }
```

### Body & UI
```css
.body-large { font-family: 'Inter'; font-size: 18px; font-weight: 400; line-height: 1.5; }
.body { font-family: 'Inter'; font-size: 16px; font-weight: 400; line-height: 1.5; }
.body-small { font-family: 'Inter'; font-size: 14px; font-weight: 400; line-height: 1.5; letter-spacing: 0.01em; }
.ui-label { font-family: 'Inter'; font-size: 14px; font-weight: 500; line-height: 1.4; letter-spacing: 0.02em; text-transform: none; }
.ui-button { font-family: 'Inter'; font-size: 16px; font-weight: 600; line-height: 1; letter-spacing: 0.01em; }
.ui-caption { font-family: 'Inter'; font-size: 12px; font-weight: 500; line-height: 1.4; letter-spacing: 0.02em; }
.ui-micro { font-family: 'Inter'; font-size: 10px; font-weight: 500; line-height: 1.3; letter-spacing: 0.04em; text-transform: uppercase; }
```

### Interaction & Motion Labels
- Hover/Focus labels should maintain 0.02em tracking to remain crisp in motion states.
- Numbers in breathing timers use tabular lining figures for calm rhythm.

---

## Responsive & Fluid Type
```css
.heading-1 { font-size: clamp(32px, 5vw, 48px); }
.heading-2 { font-size: clamp(28px, 4vw, 36px); }
.heading-3 { font-size: clamp(24px, 3.5vw, 28px); }
.body-large { font-size: clamp(17px, 2vw, 18px); }
```
**Breakpoints**: Mobile <640px (reduce headings 25–30%), Tablet 640–1024px (reduce 10–15%), Desktop >1024px (full scale).

---

## Text Colors
### Dark Mode
| Element | Color |
|---------|-------|
| Primary | `#FEFEFE` |
| Secondary | `#A0A0A0` |
| Tertiary | `#707070` |
| Disabled | `#404040` |
| Link | `#FF9933` / hover `#FFB84D` |

### Light Mode
| Element | Color |
|---------|-------|
| Primary | `#1E293B` |
| Secondary | `#475569` |
| Tertiary | `#64748B` |
| Disabled | `#94A3B8` |
| Link | `#FF6B35` / hover `#F7931E` |

---

## Readability & Accessibility
- Optimal line length: 60–75 characters for body, 30–50 for headings; max body width 680px.
- Minimum sizes: body 16px, labels 12px, never below 10px.
- Contrast: ≥4.5:1 for normal text, ≥3:1 for large text; maintain clear focus outlines with 2px ring.
- Respect `prefers-reduced-motion`; avoid text shimmer when reduced motion is active.

---

## CSS Custom Properties
```css
:root {
  --font-primary: 'Inter', 'SF Pro Display', system-ui, sans-serif;
  --font-secondary: 'Manrope', 'Outfit', sans-serif;
  --text-display-xl: 64px; --text-display: 56px; --text-h1: 48px; --text-h2: 36px; --text-h3: 28px; --text-h4: 24px; --text-h5: 20px; --text-h6: 18px;
  --text-body-lg: 18px; --text-body: 16px; --text-body-sm: 14px; --text-caption: 12px; --text-micro: 10px;
  --weight-regular: 400; --weight-medium: 500; --weight-semibold: 600; --weight-bold: 700;
  --leading-tight: 1.1; --leading-snug: 1.25; --leading-normal: 1.5; --leading-relaxed: 1.625;
  --tracking-tighter: -0.02em; --tracking-tight: -0.01em; --tracking-normal: 0; --tracking-wide: 0.02em; --tracking-wider: 0.04em; --tracking-widest: 0.08em;
}
```

---

## Font Loading & Performance
```html
<link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/Manrope-Variable.woff2" as="font" type="font/woff2" crossorigin>
```
```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
  font-style: normal;
}
@font-face {
  font-family: 'Manrope';
  src: url('/fonts/Manrope-Variable.woff2') format('woff2');
  font-weight: 200 800;
  font-display: swap;
  font-style: normal;
}
.readable-text {
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

---

*Last Updated: 2024*
*Version: 2.0*
