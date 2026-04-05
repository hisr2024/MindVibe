# Kiaanverse Unified Typography System

## Overview
The Kiaanverse typography system unifies web, React Native, and mobile platforms under a single sacred font hierarchy. It pairs decorative serifs for sacred/spiritual content with a clean geometric sans-serif for UI, ensuring readability from age 8 to 80+ across all devices and lighting conditions.

---

## The Four Sacred Fonts

### 1. Cormorant Garamond (Divine)
```css
font-family: 'Cormorant Garamond', Georgia, serif;
```
**Role**: Sacred display, Sanskrit headers (romanized), OM symbol, chapter titles.
**Weights**: 300 (Light), 400, 500, 600. Italic: 300, 400, 500.
**Best at**: 26px-54px. **Minimum readable**: 18px.
**Do NOT use** for body text, UI labels, or anything below 18px.

### 2. Crimson Text (Scripture)
```css
font-family: 'Crimson Text', Georgia, 'Times New Roman', serif;
```
**Role**: Gita verse body, transliteration, reflective/devotional text, contemplation cards.
**Weights**: 400, 600. Italic: 400.
**Best at**: 15px-22px. The italic at 17px is supremely readable.
**Do NOT use** for UI navigation, buttons, or short labels.

### 3. Playfair Display (Display)
```css
font-family: 'Playfair Display', Georgia, serif;
```
**Role**: Hero moments, affirmations, Sakha's spoken words, completion seals.
**Weights**: 400, 700. Italic: 400, 700.
**Best at**: 20px-42px. **Minimum readable**: 20px.
**Do NOT use** for anything below 20px (thin strokes disappear).

### 4. Outfit (UI)
```css
font-family: 'Outfit', system-ui, -apple-system, sans-serif;
```
**Role**: ALL UI text — buttons, navigation, labels, badges, numbers, metadata.
**Weights**: 300, 400, 500, 600.
**Best at**: 11px-18px. Clear I/l/1 distinction (important for UPI IDs, refs).
**ALWAYS use** for any interactive element, any label, any number.

### 5. Noto Sans Devanagari (Sanskrit Unicode)
```css
font-family: 'Noto Sans Devanagari', 'Mangal', 'Arial Unicode MS', sans-serif;
```
**Role**: Sanskrit Unicode rendering. CRITICAL: Cormorant Garamond cannot render Devanagari.
**Weights**: 400, 500, 600.
**Use for**: All actual Devanagari script text. Romanized Sanskrit can use Cormorant Garamond.

---

## Type Scale

| Token | Desktop | Mobile | Line Height | Letter Spacing | Weight | Font | Usage |
|-------|---------|--------|-------------|----------------|--------|------|-------|
| 5xl | 54px | 40px | 1.1 | -0.02em | 300 | divine | OM, full-screen sacred |
| 4xl | 42px | 36px | 1.15 | -0.01em | 300 | divine | Hero Sanskrit, chapter numbers |
| 3xl | 32px | 28px | 1.2 | -0.01em | 300 | divine | Page titles |
| 2xl | 26px | 24px | 1.3 | 0 | 400 | divine | Section headings |
| xl | 21px | 20px | 1.4 | 0 | 400 | divine | Card titles, verse refs |
| lg | 18px | 17px | 1.65 | 0 | 400 | scripture | Verse body, lead paragraphs |
| base | 16px | 16px | 1.6 | 0 | 400 | ui | Body text (MINIMUM for paragraphs) |
| sm | 14px | 14px | 1.5 | 0.01em | 400 | ui | Secondary info, timestamps |
| label | 13px | 13px | 1.4 | 0.02em | 500 | ui | Badges, category tags |
| caption | 12px | 12px | 1.4 | 0.02em | 400 | ui | Timestamps, attribution |
| micro | 11px | 10px | 1.3 | 0.12em | 500 | ui | UPPERCASE section labels |
| sacred | 20px | 18px | 1.85 | 0.04em | 400 | scripture | Main shloka body (crown setting) |
| sacred-sm | 16px | 15px | 1.75 | 0.03em | 400 | scripture | Transliteration, reflection prompts |

---

## Accessibility — Age-by-Age Guide

### Child (8-12): Minimum 16px body, 1.65 line-height, 7:1 contrast (AAA)
### Young Adult (18-35): 14px secondary OK, 16px body default, all weights acceptable
### Middle Age (40-60): Prefer 18px for long reading, Outfit 500 for labels, avoid 13px for important content
### Senior (60-80+): 18px body minimum, 14px minimum for ANY readable text, 7:1 contrast mandatory

**Large Text mode** (user preference):
- body: 16px -> 18px
- sacred: 18px -> 22px
- labels: 13px -> 15px
- captions: 12px -> 14px

---

## Font Decision Tree

1. **Devanagari/Sanskrit Unicode?** -> Noto Sans Devanagari (always, no exceptions)
2. **Larger than 20px?** -> Cormorant Garamond (headers) or Playfair Display italic (affirmations)
3. **Gita verse/scripture/reflection?** -> Crimson Text italic (15-20px)
4. **UI element (button/label/nav/number)?** -> Outfit (always)
5. **Default** -> Outfit

---

## CSS Custom Properties
```css
:root {
  --font-divine: 'Cormorant Garamond', Georgia, serif;
  --font-scripture: 'Crimson Text', Georgia, 'Times New Roman', serif;
  --font-display: 'Playfair Display', Georgia, serif;
  --font-ui: 'Outfit', system-ui, -apple-system, sans-serif;
  --font-devanagari: 'Noto Sans Devanagari', 'Mangal', sans-serif;
  --fw-light: 300; --fw-normal: 400; --fw-medium: 500; --fw-semibold: 600; --fw-bold: 700;
  --lh-tight: 1.1; --lh-snug: 1.25; --lh-normal: 1.5; --lh-relaxed: 1.65; --lh-loose: 1.75; --lh-scripture: 1.85; --lh-devanagari: 2.0;
  --ls-tighter: -0.02em; --ls-tight: -0.01em; --ls-normal: 0; --ls-wide: 0.02em; --ls-wider: 0.04em; --ls-widest: 0.12em;
}
```

---

## Font Loading
Fonts are loaded via `next/font/google` for automatic self-hosting and optimal performance.
CSS variables (`--font-divine`, `--font-scripture`, `--font-display`, `--font-ui`, `--font-devanagari`) are injected on `<html>` via className.

```css
.readable-text {
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

---

## Removed Fonts
The following fonts are no longer used in the unified system:
- **Cinzel**: Cannot render Devanagari (all-caps display only)
- **Lato**: Replaced by Outfit (better x-height, more readable)
- **SpaceMono**: Monospace not needed in Kiaanverse
- **Inter**: Replaced by Outfit (same role, better for sacred app context)
- **Manrope**: Not primary, inconsistent with brand

---

*Last Updated: 2026-04-05*
*Version: 3.0 — Unified Divine Typography System*
