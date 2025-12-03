# Typography System

## Overview

MindVibe's typography system is designed for readability, emotional warmth, and accessibility. The system uses modern sans-serif fonts that convey professionalism while maintaining approachability.

---

## Font Stack

### Primary Font: Inter
```css
font-family: 'Inter', 'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

**Usage**: Body text, UI elements, general content

**Characteristics**:
- Highly legible at all sizes
- Excellent x-height for screen readability
- Professional yet friendly appearance
- Variable font support for fine-tuned weights

### Secondary Font: Manrope
```css
font-family: 'Manrope', 'Outfit', system-ui, sans-serif;
```

**Usage**: Display headings, marketing materials, emphasis

**Characteristics**:
- Distinctive character shapes
- Slightly more personality than Inter
- Excellent for large display text
- Modern, geometric design

---

## Type Scale

### Size Specifications

| Level | Size (Desktop) | Size (Mobile) | Line Height | Letter Spacing |
|-------|----------------|---------------|-------------|----------------|
| Display XL | 64px | 40px | 1.1 | -0.02em |
| Display | 56px | 36px | 1.1 | -0.02em |
| H1 | 48px | 32px | 1.2 | -0.01em |
| H2 | 36px | 28px | 1.25 | -0.01em |
| H3 | 28px | 24px | 1.3 | 0 |
| H4 | 24px | 20px | 1.35 | 0 |
| H5 | 20px | 18px | 1.4 | 0.01em |
| H6 | 18px | 16px | 1.4 | 0.02em |
| Body Large | 18px | 17px | 1.5 | 0 |
| Body | 16px | 16px | 1.5 | 0 |
| Body Small | 14px | 14px | 1.5 | 0.01em |
| Caption | 12px | 12px | 1.4 | 0.02em |
| Micro | 10px | 10px | 1.3 | 0.04em |

### Weight Specifications

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text, descriptions |
| Medium | 500 | Emphasis, labels, captions |
| Semibold | 600 | Subheadings, buttons |
| Bold | 700 | Headings, strong emphasis |

---

## Semantic Typography

### Headings

```css
.heading-display-xl {
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 64px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.heading-display {
  font-family: 'Manrope', system-ui, sans-serif;
  font-size: 56px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.heading-1 {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.heading-2 {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 36px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.heading-3 {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.3;
}

.heading-4 {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.35;
}
```

### Body Text

```css
.body-large {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.5;
}

.body {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}

.body-small {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.01em;
}
```

### UI Text

```css
.ui-label {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.02em;
}

.ui-button {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.01em;
}

.ui-caption {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.02em;
}

.ui-micro {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
```

---

## Brand Typography

### Logo Text: KIAAN

```css
.brand-kiaan {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #FFD6A0 0%, #FFB347 50%, #FF8C42 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 8px rgba(255, 163, 94, 0.35);
}
```

### Logo Text: MindVibe

```css
.brand-mindvibe {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Taglines

```css
.tagline-primary {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: rgba(255, 179, 71, 0.7);
}

.tagline-secondary {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.05em;
  opacity: 0.6;
}
```

---

## Responsive Typography

### Fluid Type Scale

```css
/* Fluid typography using clamp() */
.heading-1 {
  font-size: clamp(32px, 5vw, 48px);
}

.heading-2 {
  font-size: clamp(28px, 4vw, 36px);
}

.heading-3 {
  font-size: clamp(24px, 3.5vw, 28px);
}

.body-large {
  font-size: clamp(17px, 2vw, 18px);
}
```

### Breakpoints

| Breakpoint | Typography Adjustments |
|------------|------------------------|
| Mobile (< 640px) | Reduce heading sizes by 25-30% |
| Tablet (640-1024px) | Reduce heading sizes by 10-15% |
| Desktop (> 1024px) | Full size specifications |

---

## Text Colors

### Dark Mode

| Element | Color | Opacity |
|---------|-------|---------|
| Primary Text | `#FEFEFE` | 100% |
| Secondary Text | `#A0A0A0` | — |
| Tertiary Text | `#707070` | — |
| Disabled Text | `#404040` | — |
| Link | `#FF9933` | — |
| Link Hover | `#FFB84D` | — |

### Light Mode

| Element | Color | Opacity |
|---------|-------|---------|
| Primary Text | `#1E293B` | 100% |
| Secondary Text | `#475569` | — |
| Tertiary Text | `#64748B` | — |
| Disabled Text | `#94A3B8` | — |
| Link | `#FF6B35` | — |
| Link Hover | `#F7931E` | — |

---

## Line Length & Readability

### Optimal Line Length
- **Body text**: 60-75 characters per line
- **Headings**: 30-50 characters per line
- **Maximum width**: 680px for body content

### Paragraph Spacing
- **Default**: 1em (16px)
- **Tight**: 0.75em (12px)
- **Loose**: 1.5em (24px)

---

## Accessibility

### Minimum Sizes
- Body text: 16px minimum
- UI labels: 12px minimum
- Never use font-size below 10px

### Contrast Requirements
- Normal text (< 18px): 4.5:1 contrast ratio
- Large text (≥ 18px or 14px bold): 3:1 contrast ratio

### Font Features
```css
/* Enable OpenType features for better readability */
.readable-text {
  font-feature-settings: 
    "kern" 1,  /* Kerning */
    "liga" 1,  /* Ligatures */
    "calt" 1;  /* Contextual alternates */
  
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

---

## CSS Custom Properties

```css
:root {
  /* Font Families */
  --font-primary: 'Inter', 'SF Pro Display', system-ui, sans-serif;
  --font-secondary: 'Manrope', 'Outfit', sans-serif;
  
  /* Font Sizes */
  --text-display-xl: 64px;
  --text-display: 56px;
  --text-h1: 48px;
  --text-h2: 36px;
  --text-h3: 28px;
  --text-h4: 24px;
  --text-h5: 20px;
  --text-h6: 18px;
  --text-body-lg: 18px;
  --text-body: 16px;
  --text-body-sm: 14px;
  --text-caption: 12px;
  --text-micro: 10px;
  
  /* Font Weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.1;
  --leading-snug: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* Letter Spacing */
  --tracking-tighter: -0.02em;
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.02em;
  --tracking-wider: 0.04em;
  --tracking-widest: 0.08em;
}
```

---

## Font Loading

### Performance Optimization

```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/Manrope-Variable.woff2" as="font" type="font/woff2" crossorigin>
```

### Font Display Strategy

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
```

---

*Last Updated: 2024*
*Version: 1.0*
