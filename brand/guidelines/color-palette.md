# Color Palette System

## Overview

MindVibe's color system is designed to evoke calm, warmth, and emotional intelligence. The palette supports both light and dark modes while maintaining WCAG AA/AAA accessibility standards.

---

## Primary Theme: Orange–Gold (Warmth & Energy)

The signature MindVibe palette represents warmth, optimism, and positive energy.

### Primary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Orange Primary | `#FF6B35` | 255, 107, 53 | Primary actions, brand accent |
| Orange Mid | `#F7931E` | 247, 147, 30 | Gradient midpoint |
| Gold Primary | `#FFD700` | 255, 215, 0 | Highlights, success states |

### Secondary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Orange Secondary | `#FFA500` | 255, 165, 0 | Secondary elements |
| Orange Light | `#FFB84D` | 255, 184, 77 | Hover states |
| Orange Accent | `#FFEDD8` | 255, 237, 216 | Light backgrounds |

### Gradients
```css
/* Primary Orange-Gold Gradient */
background: linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%);

/* Warm Glow Gradient */
background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(255, 107, 53, 0.15) 70%, transparent 100%);
```

---

## Secondary Theme: Teal–Sky (Calm & Clarity)

Used for Inner Peace features, meditation, and calming elements.

### Primary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Teal Primary | `#00CED1` | 0, 206, 209 | Inner Peace tab, calm states |
| Sky Primary | `#87CEEB` | 135, 206, 235 | Light calm elements |
| Teal Light | `#E0F7FA` | 224, 247, 250 | Light backgrounds |

### Secondary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Teal Secondary | `#4DD0E1` | 77, 208, 225 | Secondary calm elements |
| Sky Secondary | `#80DEEA` | 128, 222, 234 | Hover states |
| Teal Accent | `#B2EBF2` | 178, 235, 242 | Subtle accents |

### Gradients
```css
/* Calm Teal Gradient */
background: linear-gradient(135deg, #00CED1 0%, #87CEEB 50%, #E0F7FA 100%);

/* Breath Ring Gradient */
background: radial-gradient(circle, rgba(0, 206, 209, 0.5) 0%, rgba(135, 206, 235, 0.2) 70%, transparent 100%);
```

---

## Tertiary Theme: Rose–Lilac (Compassion & Peace)

Used for Self Kindness features, emotional support, and gentle encouragement.

### Primary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Rose Primary | `#FF6B9D` | 255, 107, 157 | Self Kindness tab |
| Lilac Primary | `#C77DFF` | 199, 125, 255 | Gentle accents |
| Rose Light | `#E0BBE4` | 224, 187, 228 | Light backgrounds |

### Secondary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Rose Secondary | `#FF8FAB` | 255, 143, 171 | Secondary elements |
| Lilac Secondary | `#D4A5F9` | 212, 165, 249 | Hover states |
| Rose Accent | `#F3E5F5` | 243, 229, 245 | Subtle backgrounds |

### Gradients
```css
/* Compassion Gradient */
background: linear-gradient(135deg, #FF6B9D 0%, #C77DFF 50%, #E0BBE4 100%);

/* Heart Bloom Gradient */
background: radial-gradient(circle, rgba(255, 107, 157, 0.5) 0%, rgba(199, 125, 255, 0.2) 70%, transparent 100%);
```

---

## Focus Theme: Deep Blue (Mind Control)

Used for Mind Control features, focus, and concentration.

### Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Blue Deep | `#1E40AF` | 30, 64, 175 | Mind Control tab |
| Blue Primary | `#3B82F6` | 59, 130, 246 | Focus elements |
| Blue Light | `#80B3F6` | 128, 179, 246 | Accents |

### Gradients
```css
/* Focus Beam Gradient */
background: linear-gradient(90deg, #1E40AF 0%, #3B82F6 50%, #80B3F6 100%);
```

---

## KIAAN Brand Colors

Special palette for KIAAN branding elements.

### Feather Colors
| Name | Hex | Usage |
|------|-----|-------|
| Feather Teal | `#4FD1C5` | Feather start |
| Feather Mid | `#38B2AC` | Feather body |
| Feather Blue | `#3B82F6` | Feather tip |
| Feather Deep | `#1E40AF` | Feather accent |

### Eye Colors
| Name | Hex | Usage |
|------|-----|-------|
| Eye Gold | `#FFC850` | Eye center highlight |
| Eye Orange | `#FF9933` | Eye middle ring |
| Eye Warm | `#FF7327` | Eye outer glow |

---

## Dark Mode

### Background Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Background | `#050505` | 5, 5, 5 | Main background |
| Surface | `#0B0B0F` | 11, 11, 15 | Cards, elevated surfaces |
| Surface Elevated | `#121218` | 18, 18, 24 | Modals, dropdowns |
| Border | `#1E1E24` | 30, 30, 36 | Dividers, borders |

### Text Colors
| Name | Hex | Opacity | Usage |
|------|-----|---------|-------|
| Primary | `#FEFEFE` | 100% | Headings, important text |
| Secondary | `#A0A0A0` | — | Body text |
| Tertiary | `#707070` | — | Captions, placeholders |
| Disabled | `#404040` | — | Disabled states |

### Semantic Colors
| State | Color | Hex |
|-------|-------|-----|
| Success | Green | `#22C55E` |
| Warning | Amber | `#F59E0B` |
| Error | Red | `#EF4444` |
| Info | Blue | `#3B82F6` |

---

## Light Mode

### Background Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Background | `#FEFEFE` | 254, 254, 254 | Main background |
| Surface | `#F8FAFC` | 248, 250, 252 | Cards, elevated surfaces |
| Surface Warm | `#FFF7ED` | 255, 247, 237 | Warm accented surfaces |
| Border | `#E2E8F0` | 226, 232, 240 | Dividers, borders |

### Text Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#1E293B` | Headings, important text |
| Secondary | `#475569` | Body text |
| Tertiary | `#64748B` | Captions, placeholders |
| Disabled | `#94A3B8` | Disabled states |

---

## Accessibility

### Contrast Ratios (Dark Mode)

| Foreground | Background | Ratio | Level |
|------------|------------|-------|-------|
| `#FEFEFE` | `#050505` | 21:1 | AAA |
| `#A0A0A0` | `#050505` | 8.5:1 | AAA |
| `#FF6B35` | `#050505` | 5.2:1 | AA |
| `#00CED1` | `#050505` | 9.1:1 | AAA |

### Contrast Ratios (Light Mode)

| Foreground | Background | Ratio | Level |
|------------|------------|-------|-------|
| `#1E293B` | `#FEFEFE` | 14.5:1 | AAA |
| `#475569` | `#FEFEFE` | 7.1:1 | AAA |
| `#FF6B35` | `#FEFEFE` | 3.2:1 | AA Large |
| `#1E40AF` | `#FEFEFE` | 8.8:1 | AAA |

### Color Blindness Considerations
- Primary actions use distinct hues, not just saturation
- Error states include icon + text, not color alone
- Charts use patterns in addition to colors

---

## CSS Custom Properties

```css
:root {
  /* Orange-Gold Theme */
  --color-orange-primary: #FF6B35;
  --color-orange-mid: #F7931E;
  --color-gold-primary: #FFD700;
  --color-orange-secondary: #FFA500;
  --color-orange-light: #FFB84D;
  --color-orange-accent: #FFEDD8;
  
  /* Teal-Sky Theme */
  --color-teal-primary: #00CED1;
  --color-sky-primary: #87CEEB;
  --color-teal-light: #E0F7FA;
  --color-teal-secondary: #4DD0E1;
  --color-sky-secondary: #80DEEA;
  --color-teal-accent: #B2EBF2;
  
  /* Rose-Lilac Theme */
  --color-rose-primary: #FF6B9D;
  --color-lilac-primary: #C77DFF;
  --color-rose-light: #E0BBE4;
  --color-rose-secondary: #FF8FAB;
  --color-lilac-secondary: #D4A5F9;
  --color-rose-accent: #F3E5F5;
  
  /* Focus Blue */
  --color-blue-deep: #1E40AF;
  --color-blue-primary: #3B82F6;
  --color-blue-light: #80B3F6;
  
  /* Semantic */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
}

/* Dark Mode */
[data-theme="dark"] {
  --color-background: #050505;
  --color-surface: #0B0B0F;
  --color-text-primary: #FEFEFE;
  --color-text-secondary: #A0A0A0;
  --color-border: #1E1E24;
}

/* Light Mode */
[data-theme="light"] {
  --color-background: #FEFEFE;
  --color-surface: #F8FAFC;
  --color-text-primary: #1E293B;
  --color-text-secondary: #475569;
  --color-border: #E2E8F0;
}
```

---

*Last Updated: 2024*
*Version: 1.0*
