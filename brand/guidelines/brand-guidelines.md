# MindVibe & KIAAN — Brand Guidelines

## Brand Overview

**MindVibe** is a world-class mental wellness platform designed to be modern, calming, universal, inclusive, emotionally intelligent, and timeless — comparable to Calm, Headspace, and Insight Timer.

**KIAAN** is the AI companion within MindVibe, offering crisp, calm guidance with a wise companion presence. The name carries symbolic spiritual depth while remaining non-religious and universally accessible.

---

## Brand Positioning

### MindVibe
- **Mission**: Premium mental wellness platform for all ages and cultures
- **Personality**: Modern, calming, emotionally intelligent
- **Voice**: Warm, supportive, non-judgmental
- **Visual Language**: Soft gradients, rounded geometry, subtle glow effects

### KIAAN — MindVibe Companion
- **Role**: AI-powered wellness guide
- **Personality**: Wise, calm, supportive
- **Tagline**: "Crisp, calm guidance"
- **Visual Elements**: Peacock feather (wisdom), Flute accent (harmony)

---

## Logo System

### MindVibe Logos
| Asset | File | Usage |
|-------|------|-------|
| Icon | `mindvibe-icon.svg` | App icons, favicons, small displays |
| Wordmark | `mindvibe-wordmark.svg` | Header, marketing materials |
| Horizontal Lockup | `mindvibe-lockup-horizontal.svg` | Navigation, wide spaces |
| Vertical Lockup | `mindvibe-lockup-vertical.svg` | Square spaces, splash screens |

### KIAAN Logos
| Asset | File | Usage |
|-------|------|-------|
| Static Logo | `kiaan-static.svg` | Static displays, print |
| Full Lockup | `kiaan-lockup-full.svg` | Featured displays, headers |
| Flute Element | `kiaan-flute-element.svg` | Decorative accent |
| Feather Element | `kiaan-feather-element.svg` | Decorative accent |
| Animated Logo | `kiaan-animated.json` | Splash screens, loading states |

### Clear Space
- Minimum clear space: 1.5× the height of the MindVibe "M" symbol
- Never compress, stretch, or rotate logos
- Maintain aspect ratios at all sizes

### Minimum Sizes
- MindVibe Icon: 24px minimum
- MindVibe Wordmark: 100px minimum width
- KIAAN Lockup: 200px minimum width

---

## Color System

### Primary Palette: Orange–Gold (Warmth & Energy)
```css
--orange-primary: #FF6B35;
--orange-mid: #F7931E;
--gold-primary: #FFD700;
--orange-secondary: #FFA500;
--orange-light: #FFB84D;
--orange-accent: #FFEDD8;
```

### Secondary Palette: Teal–Sky (Calm & Clarity)
```css
--teal-primary: #00CED1;
--sky-primary: #87CEEB;
--teal-light: #E0F7FA;
--teal-secondary: #4DD0E1;
--sky-secondary: #80DEEA;
--teal-accent: #B2EBF2;
```

### Tertiary Palette: Rose–Lilac (Compassion & Peace)
```css
--rose-primary: #FF6B9D;
--lilac-primary: #C77DFF;
--rose-light: #E0BBE4;
--rose-secondary: #FF8FAB;
--lilac-secondary: #D4A5F9;
--rose-accent: #F3E5F5;
```

### Dark Mode Colors
```css
--background-dark: #050505;
--surface-dark: #0b0b0f;
--text-primary-dark: #fefefe;
--text-secondary-dark: #a0a0a0;
```

### Light Mode Colors
```css
--background-light: #fefefe;
--surface-light: #f8fafc;
--text-primary-light: #1e293b;
--text-secondary-light: #475569;
```

---

## Typography System

### Font Stack
```css
--font-primary: 'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif;
--font-secondary: 'Manrope', 'Outfit', sans-serif;
```

### Type Scale
| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 48–64px | 700 | 1.1 | Hero headings |
| H1 | 36–48px | 700 | 1.2 | Page titles |
| H2 | 28–36px | 600 | 1.25 | Section headings |
| H3 | 22–28px | 600 | 1.3 | Sub-sections |
| H4 | 18–22px | 600 | 1.35 | Card titles |
| Body | 16px | 400 | 1.5 | Body text |
| Body Small | 14px | 400 | 1.5 | Secondary text |
| Caption | 12px | 500 | 1.4 | Labels, captions |
| Micro | 10px | 500 | 1.3 | Badges, tags |

### Letter Spacing
- Headings: 0–0.02em
- Body: 0
- UI Labels: 0.02–0.05em
- Brand Names: 0.08–0.15em

---

## Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Icon padding, tight spacing |
| `sm` | 8px | Button padding, list gaps |
| `md` | 12px | Card padding, section gaps |
| `base` | 16px | Default spacing |
| `lg` | 24px | Section padding |
| `xl` | 32px | Large gaps |
| `2xl` | 48px | Page sections |
| `3xl` | 64px | Hero sections |

---

## Iconography

### Style Guidelines
- **Grid**: 24×24px base
- **Stroke**: 2px rounded
- **Corners**: Rounded (2–4px radius)
- **Style**: Outlined, not filled
- **Color**: Inherit from parent or use gradient

### Icon Categories
- Navigation (home, settings, profile)
- Actions (add, edit, delete, share)
- Status (success, warning, error, info)
- Wellness (meditation, breath, journal, mood)

---

## Glow & Shadow Effects

### Elevation Levels
```css
/* Level 0 - Flat */
box-shadow: none;

/* Level 1 - Subtle */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);

/* Level 2 - Card */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

/* Level 3 - Modal */
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);

/* Level 4 - Overlay */
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
```

### Brand Glow Effects
```css
/* Orange Glow */
box-shadow: 0 0 20px rgba(255, 107, 53, 0.3);

/* Teal Glow */
box-shadow: 0 0 20px rgba(0, 206, 209, 0.3);

/* Rose Glow */
box-shadow: 0 0 20px rgba(255, 107, 157, 0.3);
```

---

## Accessibility

### WCAG Compliance
- **Target**: WCAG 2.1 Level AA (AAA preferred)
- **Contrast Ratios**:
  - Normal text: 4.5:1 minimum
  - Large text: 3:1 minimum
  - UI components: 3:1 minimum

### Motion Accessibility
- All animations respect `prefers-reduced-motion`
- Essential animations have reduced-motion alternatives
- No flashing content (< 3 Hz)

### Focus States
- Visible focus indicators on all interactive elements
- Focus ring: 2px solid with brand color
- Skip links for keyboard navigation

---

## Usage Guidelines

### Do's
✅ Use official logo files without modification
✅ Maintain minimum clear space
✅ Use approved color combinations
✅ Follow typography hierarchy
✅ Ensure accessibility compliance

### Don'ts
❌ Stretch, compress, or rotate logos
❌ Change logo colors outside approved palettes
❌ Use low-contrast color combinations
❌ Add effects or shadows to logos
❌ Combine logos with other brand marks

---

## File Formats

### SVG
- Primary format for web and UI
- Scalable without quality loss
- Supports gradients and animations

### PNG
- Raster format for limited SVG support
- Export at 1×, 2×, 3× for retina displays
- Use for social media and presentations

### Lottie JSON
- Animation format for web and mobile
- Lightweight, scalable animations
- Supports interactivity

---

*Last Updated: 2024*
*Version: 1.0*
