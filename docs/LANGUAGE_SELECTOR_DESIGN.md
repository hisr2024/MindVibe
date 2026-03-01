# Language Selection Design System — MindVibe

> Polished language selector control for website, web app (Next.js/React), and
> mobile app (React Native). Nothing else in the KIAAN AI Ecosystem is changed or
> mutated by this work.

---

## 1. Requirements & Constraints

### 1.1 Scope

| Surface          | Tech stack                          | Existing component                                      |
|------------------|-------------------------------------|---------------------------------------------------------|
| Website / Web app | Next.js 16 + React 18 + Tailwind 3 | `MinimalLanguageSelector`, `GlobalLanguageSelector`, `LanguageSettings` |
| Mobile web (PWA) | Same (responsive)                   | Reuses web components via breakpoints                   |
| Native mobile    | React Native 0.76 + Reanimated 3   | None yet — new component needed                         |

### 1.2 Supported Languages (17 total)

All languages come from the single source of truth in `i18n.ts` / `hooks/useLanguage.tsx`:

| Code   | Native name | Region        |
|--------|-------------|---------------|
| en     | English     | European      |
| hi     | हिन्दी      | Indian        |
| ta     | தமிழ்       | Indian        |
| te     | తెలుగు      | Indian        |
| bn     | বাংলা       | Indian        |
| mr     | मराठी       | Indian        |
| gu     | ગુજરાતી    | Indian        |
| kn     | ಕನ್ನಡ       | Indian        |
| ml     | മലയാളം      | Indian        |
| pa     | ਪੰਜਾਬੀ      | Indian        |
| sa     | संस्कृत     | Indian        |
| es     | Español     | European      |
| fr     | Français    | European      |
| de     | Deutsch     | European      |
| pt     | Português   | European      |
| ja     | 日本語       | East Asian    |
| zh-CN  | 简体中文     | East Asian    |

### 1.3 Visual Style Criteria

- **Size:** Trigger button ≤ 44 × 44 px touch target on mobile; compact pill on
  desktop (≈ 120 × 36 px including label).
- **Recognizability:** Globe icon (not country flags — multiple Indian languages
  share the same flag, so flags are ambiguous).
- **Non-overlapping:** Must not collide with the KIAAN floating button, the
  mobile bottom tab bar, the desktop nav links, or the tools dropdown.
- **Theme:** Golden-black (dark) and warm-cream (light) via existing design
  tokens. Gold accent (`#d4a44c` / `gold.500`) for the active/selected state.

### 1.4 Accessibility (A11Y) Targets

| Criterion                          | Target                       |
|------------------------------------|------------------------------|
| Color contrast (normal text)       | ≥ 4.5 : 1 (WCAG 2.1 AA)    |
| Color contrast (large text / icons)| ≥ 3.0 : 1                   |
| Minimum touch target               | 44 × 44 px (iOS/Android HIG)|
| Keyboard navigation                | Full: Tab, Arrow, Enter, Esc |
| Screen reader                      | `aria-expanded`, `aria-haspopup="listbox"`, `role="option"`, `aria-selected`, live region on change |
| Focus management                   | Focus trap inside open dropdown/sheet; restore focus on close |
| Reduced motion                     | Respect `prefers-reduced-motion`; skip spring animations |

### 1.5 Localization Considerations

| Concern             | Approach                                                       |
|---------------------|----------------------------------------------------------------|
| RTL support          | All 17 current languages are LTR. Infrastructure is ready (`dir` attribute set by `useLanguage`). Selector UI uses logical properties (`start`/`end`) so it flips automatically if an RTL language (e.g. Urdu, Arabic) is added later. |
| Dynamic text length  | Native names vary from 5 chars ("English") to 9 chars ("মলয়ालম"). The dropdown rows use flex layout with `min-width: 0` truncation. The trigger pill shows the native name on desktop and a 2-letter ISO code on very small screens. |
| Pluralization        | Not applicable — the selector displays static labels only.     |
| Script diversity     | Font stack includes system fallbacks that cover Devanagari, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Gurmukhi, CJK. No custom font downloads needed. |

---

## 2. Design System & UX Details

### 2.1 Placement

```
┌─────────────────────────────────────────────────────────┐
│  DESKTOP (≥ 768 px)                                     │
│                                                         │
│  ┌──────┐  Home  KIAAN  Dashboard  ...  [🌐 हिन्दी ▾]  │
│  │ Logo │                               ↑               │
│  └──────┘                         right side of         │
│                                   DesktopNav             │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│  MOBILE (< 768 px)       │
│                          │
│  Accessed via:           │
│  1. Hamburger menu row   │
│     "Language  [🌐 EN]"  │
│  2. Settings page        │
│                          │
│  Opens a BOTTOM SHEET    │
│  (not a dropdown)        │
│                          │
│  ┌────────────────────┐  │
│  │ ── drag handle ──  │  │
│  │ Select Language     │  │
│  │ ┌────────────────┐ │  │
│  │ │ 🔍 Search...   │ │  │
│  │ ├────────────────┤ │  │
│  │ │ ✓ हिन्दी       │ │  │
│  │ │   English      │ │  │
│  │ │   தமிழ்        │ │  │
│  │ │   ...          │ │  │
│  │ └────────────────┘ │  │
│  └────────────────────┘  │
│                          │
│  [Home][Journal][K][Tools][Profile]  │
└──────────────────────────┘
```

### 2.2 Iconography — Globe, Not Flags

**Decision:** Use a globe icon (matching the existing `GlobalLanguageSelector`
style) instead of country flags.

**Rationale:**
- 10 of 17 languages are Indian and would all show 🇮🇳 — zero differentiation.
- Flags carry political connotations that conflict with the spiritual wellness
  mission.
- The globe is universally recognized as "language/international."
- Already established in the codebase (`GlobalLanguageSelector` and
  `LanguageSettings` both use globe SVGs).

### 2.3 Typography & Color Treatment

| Element               | Dark theme                          | Light theme                          |
|-----------------------|-------------------------------------|--------------------------------------|
| Trigger text          | `divine.cream` (#f5f0e8)           | `textPrimary` (#1a1714)             |
| Trigger border        | `gold.500` at 50% opacity          | `gold.600` at 40% opacity           |
| Trigger background    | `gold.500` at 20% opacity          | `gold.100` at 60% opacity           |
| Selected row bg       | `gold.500` at 20% opacity          | `gold.100`                          |
| Selected check icon   | `gold.500` (#d4a44c)               | `gold.600` (#c8943a)                |
| Row text (unselected) | `white` at 80% opacity             | `textSecondary` (#6b6358)           |
| Search input border   | `white` at 10% opacity             | `black` at 8% opacity               |
| Font                  | System sans-serif (Inter variable)  | Same                                 |
| Font size (trigger)   | 14 px / `text-sm`                   | Same                                 |
| Font size (rows)      | 14 px native name, 12 px English    | Same                                 |

### 2.4 Interaction Patterns

#### Option A — Compact Dropdown (Desktop & Tablet)

```
Trigger: [🌐 हिन्दी ▾]
  ↓ click
┌────────────────────────┐
│ Select Language         │
│ ┌────────────────────┐ │
│ │ 🔍 Search...       │ │
│ ├────────────────────┤ │
│ │ ✓ हिन्दी  Hindi    │ │  ← active: gold bg + check
│ │   English          │ │
│ │   தமிழ்  Tamil     │ │
│ │   తెలుగు  Telugu   │ │
│ │   বাংলা  Bengali   │ │
│ │   ...              │ │
│ └────────────────────┘ │
│ 17 languages available │
└────────────────────────┘
Width: 288 px (w-72)
Max height: 320 px (scrollable)
Position: anchored top-right of trigger
Animation: scale-in from 0.95 + fade (150 ms spring)
Close on: click outside, Escape, select
```

#### Option B — Bottom Sheet (Mobile, < 768 px)

```
Trigger: [🌐 EN] (compact, in hamburger menu or settings)
  ↓ tap
Full-width bottom sheet using existing MobileBottomSheet:
┌──────────────────────────────┐
│        ═══ handle ═══        │
│  Select Language         ✕   │
│ ┌──────────────────────────┐ │
│ │ 🔍 Search languages...   │ │
│ ├──────────────────────────┤ │
│ │ Indian Languages         │ │  ← region group header
│ │  ✓ हिन्दी  Hindi         │ │
│ │    தமிழ்  Tamil          │ │
│ │    తెలుగు  Telugu        │ │
│ │    বাংলা  Bengali        │ │
│ │    ...                   │ │
│ │ European Languages       │ │
│ │    English               │ │
│ │    Español  Spanish      │ │
│ │    ...                   │ │
│ │ East Asian Languages     │ │
│ │    日本語  Japanese       │ │
│ │    简体中文  Chinese      │ │
│ └──────────────────────────┘ │
│  Saved locally               │
└──────────────────────────────┘
Height: auto (up to 70vh)
Dismissible: swipe-down or ✕ or backdrop tap
Haptic: light on open, selection on pick
Animation: existing MobileBottomSheet spring
```

### 2.5 Responsiveness Breakpoints

| Breakpoint        | Behavior                                                 |
|-------------------|----------------------------------------------------------|
| `≥ 1024 px` (lg)  | Desktop nav: pill trigger shows globe + native name + chevron |
| `768–1023 px` (md)| Tablet: pill trigger shows globe + 2-letter code + chevron |
| `< 768 px` (sm)   | Mobile: trigger hidden from top nav. Accessible via hamburger menu row and settings page. Opens bottom sheet. |

### 2.6 Touch Targets

| Element             | Minimum size | Actual size     |
|---------------------|-------------|-----------------|
| Trigger button      | 44 × 44 px  | 44 × 36 px (pill padded to 44 height) |
| Dropdown row        | 44 × 44 px  | full-width × 48 px |
| Bottom sheet row    | 48 × 48 px  | full-width × 52 px |
| Search input        | 44 × 44 px  | full-width × 44 px |
| Close button (sheet)| 44 × 44 px  | 36 × 36 px (padded hit area to 44) |

---

## 3. Implementation Guidance

### 3.1 Recommended Technologies

| Platform     | Stack                                                       |
|-------------|-------------------------------------------------------------|
| Web          | React 18 + Next.js 16 App Router + Tailwind CSS 3 + Framer Motion |
| State        | Zustand-backed `useLanguage` hook (existing `LanguageProvider` context) |
| Persistence  | `localStorage` key `preferredLocale` (existing), synced to backend via `/api/translation/preferences` (existing) |
| Mobile web   | Same as web; bottom sheet via existing `MobileBottomSheet`  |
| Native mobile| React Native 0.76 + Reanimated 3 + `react-native-mmkv` for persistence |
| Design tokens| Web: `tailwind.config.ts`; Native: `mobile/react-native/src/theme/tokens.ts` |

### 3.2 Accessible Markup & ARIA Roles

#### Desktop Dropdown (simplified)

```tsx
<div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
  <button
    aria-label={`Current language: ${config.nativeName}. Click to change.`}
    aria-expanded={isOpen}
    aria-controls="language-listbox"
  >
    <GlobeIcon />
    <span>{config.nativeName}</span>
    <ChevronIcon />
  </button>

  {isOpen && (
    <div id="language-listbox" role="listbox" aria-label="Select language">
      <input
        role="searchbox"
        aria-label="Search languages"
        aria-controls="language-listbox"
      />
      {filteredLanguages.map(([code, lang]) => (
        <button
          key={code}
          role="option"
          aria-selected={code === currentLanguage}
          onClick={() => selectLanguage(code)}
        >
          <span>{lang.nativeName}</span>
          <span aria-hidden="true">{lang.name}</span>
          {code === currentLanguage && <CheckIcon aria-hidden="true" />}
        </button>
      ))}
    </div>
  )}
</div>
```

#### Mobile Bottom Sheet

```tsx
<MobileBottomSheet
  isOpen={isOpen}
  onClose={onClose}
  title="Select Language"
  height="auto"
  role="dialog"
  aria-modal="true"
  aria-label="Language selection"
>
  {/* Search + grouped language list */}
</MobileBottomSheet>
```

#### Screen Reader Announcements

On language change, `useLanguage` already creates a live region:

```tsx
const announcement = document.createElement('div')
announcement.setAttribute('role', 'status')
announcement.setAttribute('aria-live', 'polite')
announcement.textContent = `Language changed to ${LANGUAGES[newLang].name}`
```

### 3.3 Lightweight, Themeable Styles

**CSS footprint target:** < 2 KB additional (Tailwind utilities only, no new
CSS files).

All colors reference existing Tailwind tokens (`gold.*`, `divine.*`,
`white/opacity`) or the RN `tokens.ts` palette. No new color values introduced.

**Reduced motion:**
```tsx
const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// In Framer Motion:
<motion.div
  transition={prefersReducedMotion ? { duration: 0 } : springConfigs.smooth}
/>
```

### 3.4 State Management & Persistence

```
┌──────────────┐     setLanguage()     ┌────────────────────┐
│  UI Trigger  │ ───────────────────▶  │  LanguageProvider   │
│  (Dropdown / │                       │  (React Context)    │
│   Sheet)     │                       │                     │
└──────────────┘                       │  1. setState(lang)  │
                                       │  2. localStorage    │
                                       │  3. document.lang   │
                                       │  4. document.dir    │
                                       │  5. load translations│
                                       │  6. aria-live announce│
                                       │  7. POST /api/      │
                                       │     translation/    │
                                       │     preferences     │
                                       └────────────────────┘
```

**Web:** `LanguageProvider` in `hooks/useLanguage.tsx` is the single source of
truth. The selector calls `setLanguage(code)` — that's it. Persistence is
handled internally (localStorage + optional backend sync).

**React Native:** Create `useLanguageNative` hook using `react-native-mmkv` for
synchronous persistence and a matching `LanguageProviderNative` context. Same
`Language` type and `LANGUAGES` constant imported from a shared `types/` module.

---

## 4. Deliverables

### 4.1 Wireframes

#### Desktop — Closed state
```
┌─────────────────────────────────────────────────────────────┐
│  [MindVibe]  Home  KIAAN  Companion  Dashboard  ...        │
│                                        [🌐 हिन्दी ▾] [Sub] │
└─────────────────────────────────────────────────────────────┘
```

#### Desktop — Open state
```
                                         ┌─ dropdown ─────────┐
                                         │ Select Language     │
[🌐 हिन्दी ▾]                           │ ┌─────────────────┐ │
                                         │ │🔍 Search...     │ │
                                         │ ├─────────────────┤ │
                                         │ │ ✓ हिन्दी  Hindi │ │
                                         │ │   English       │ │
                                         │ │   தமிழ்  Tamil  │ │
                                         │ │   తెలుగు Telugu │ │
                                         │ │   বাংলা Bengali │ │
                                         │ │   मराठी Marathi │ │
                                         │ │   ... (scroll)  │ │
                                         │ ├─────────────────┤ │
                                         │ │ 17 languages    │ │
                                         │ └─────────────────┘ │
                                         └─────────────────────┘
```

#### Mobile hamburger menu — Language row
```
┌──────────────────────────┐
│  Home                    │
│  KIAAN                   │
│  Dashboard               │
│  ...                     │
│ ─────────────────────── │
│  Theme            [◐]   │
│  Language      [🌐 EN]  │  ← tap opens bottom sheet
└──────────────────────────┘
```

#### Mobile — Bottom sheet open
```
┌──────────────────────────┐
│         ═════            │
│  Select Language     ✕   │
│ ┌──────────────────────┐ │
│ │ 🔍 Search languages  │ │
│ ├──────────────────────┤ │
│ │ INDIAN LANGUAGES     │ │
│ │  ✓ हिन्दी            │ │
│ │    Hindi              │ │
│ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│ │
│ │    தமிழ்             │ │
│ │    Tamil              │ │
│ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│ │
│ │    ...               │ │
│ │ EUROPEAN LANGUAGES   │ │
│ │    English           │ │
│ │    Español           │ │
│ │    ...               │ │
│ │ EAST ASIAN           │ │
│ │    日本語             │ │
│ │    简体中文           │ │
│ └──────────────────────┘ │
│  Saved locally           │
└──────────────────────────┘
```

#### React Native — Bottom sheet
```
┌──────────────────────────┐
│         ═════            │
│  Select Language     ✕   │
│ ┌──────────────────────┐ │
│ │ 🔍 Search...         │ │
│ ├──────────────────────┤ │
│ │ ✓ हिन्दी  Hindi      │ │
│ │   English            │ │
│ │   தமிழ்  Tamil       │ │
│ │   ...                │ │
│ └──────────────────────┘ │
└──────────────────────────┘
Uses: react-native-gesture-handler
      + Reanimated BottomSheet
```

### 4.2 Component API Surface

#### Web: `<LanguageSelector />`

Unified component that renders dropdown (desktop) or bottom sheet (mobile).

```typescript
interface LanguageSelectorProps {
  /** Additional CSS classes for the trigger wrapper */
  className?: string

  /** Force a specific variant regardless of viewport */
  variant?: 'dropdown' | 'sheet'

  /** Render only the trigger button (for embedding in menus) */
  triggerOnly?: boolean

  /** Callback after language is changed */
  onLanguageChange?: (language: Language) => void
}

// Events emitted (via useLanguage context):
// - Language state update (React state)
// - localStorage write
// - document.lang / document.dir update
// - aria-live announcement
// - Optional backend POST
```

#### React Native: `<LanguageSelectorNative />`

```typescript
interface LanguageSelectorNativeProps {
  /** Style overrides for the trigger */
  triggerStyle?: StyleProp<ViewStyle>

  /** Whether to show as inline row (settings) or floating button */
  variant?: 'inline' | 'floating'

  /** Callback after language is changed */
  onLanguageChange?: (language: Language) => void
}

// Internally uses:
// - useLanguageNative() hook
// - react-native-gesture-handler BottomSheet
// - react-native-reanimated for animations
// - react-native-mmkv for persistence
```

### 4.3 Example Code Snippets

#### Web — React (consolidated component)

```tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage, LANGUAGES, type Language } from '@/hooks/useLanguage'
import { getLanguagesByRegion } from '@/config/translation'
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface LanguageSelectorProps {
  className?: string
  variant?: 'dropdown' | 'sheet'
  triggerOnly?: boolean
  onLanguageChange?: (language: Language) => void
}

export function LanguageSelector({
  className = '',
  variant,
  triggerOnly = false,
  onLanguageChange,
}: LanguageSelectorProps) {
  const { language, setLanguage, config } = useLanguage()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const resolvedVariant = variant ?? (isMobile ? 'sheet' : 'dropdown')

  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter languages
  const filtered = Object.entries(LANGUAGES).filter(([code, cfg]) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      cfg.name.toLowerCase().includes(q) ||
      cfg.nativeName.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q)
    )
  })

  // Group by region for sheet variant
  const grouped = getLanguagesByRegion()

  const select = useCallback(
    (code: Language) => {
      setLanguage(code)
      setIsOpen(false)
      setSearch('')
      onLanguageChange?.(code)
      // Return focus to trigger
      setTimeout(() => triggerRef.current?.focus(), 100)
    },
    [setLanguage, onLanguageChange]
  )

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen || resolvedVariant !== 'dropdown') return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, resolvedVariant])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearch('')
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  // --- Trigger Button ---
  const trigger = (
    <motion.button
      ref={triggerRef}
      onClick={() => setIsOpen(!isOpen)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-2 rounded-full border border-gold-500/50
        bg-gold-500/20 px-3 py-2 text-sm font-medium text-divine-cream
        shadow-sm transition-all hover:bg-gold-500/30 hover:border-gold-500/65
        focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500
        focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
        ${className}`}
      aria-label={`Current language: ${config.nativeName}. Click to change.`}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      {/* Globe SVG */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.25" className="text-gold-400">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10
               15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <span className="hidden sm:inline">{config.nativeName}</span>
      <span className="sm:hidden text-xs font-bold uppercase">{language}</span>
      {/* Chevron */}
      <motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" className="text-white/70"
        animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <polyline points="6 9 12 15 18 9" />
      </motion.svg>
    </motion.button>
  )

  if (triggerOnly) return trigger

  // --- Dropdown variant (desktop/tablet) ---
  if (resolvedVariant === 'dropdown') {
    return (
      <div ref={dropdownRef} className="relative">
        {trigger}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-72 overflow-hidden
                rounded-xl border border-white/10 bg-slate-950 backdrop-blur-xl
                shadow-2xl shadow-black/50"
              role="listbox"
              aria-label="Select language"
            >
              {/* Search */}
              <div className="p-3 border-b border-white/5">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search languages..."
                  className="w-full rounded-lg border border-white/10 bg-white/5
                    pl-10 pr-3 py-2 text-sm text-white outline-none
                    placeholder:text-white/30 focus:border-gold-500/50
                    focus:ring-1 focus:ring-gold-500/30"
                  autoFocus
                  role="searchbox"
                  aria-label="Search languages"
                />
              </div>
              {/* List */}
              <div className="max-h-72 overflow-y-auto">
                {filtered.map(([code, cfg]) => (
                  <button
                    key={code}
                    onClick={() => select(code as Language)}
                    className={`w-full flex items-center justify-between px-4 py-3
                      text-left transition-all min-h-[48px] ${
                        code === language
                          ? 'bg-gold-500/20 text-divine-cream'
                          : 'text-white/80 hover:bg-white/5'
                      }`}
                    role="option"
                    aria-selected={code === language}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{cfg.nativeName}</span>
                      <span className="text-xs text-white/40">{cfg.name}</span>
                    </span>
                    {code === language && (
                      <svg width="18" height="18" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        className="text-gold-500">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-white/5 px-4 py-2 text-center">
                <span className="text-xs text-white/40">
                  {Object.keys(LANGUAGES).length} languages available
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // --- Bottom Sheet variant (mobile) ---
  return (
    <>
      {trigger}
      <MobileBottomSheet
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setSearch('') }}
        title="Select Language"
        height="auto"
      >
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search languages..."
            className="w-full rounded-xl border border-white/10 bg-white/5
              px-4 py-3 text-sm text-white outline-none
              placeholder:text-white/30 focus:border-gold-500/50"
            role="searchbox"
            aria-label="Search languages"
          />
        </div>
        {/* Grouped list */}
        <div className="space-y-4 pb-4">
          {Object.entries(grouped).map(([region, langs]) => {
            const visible = langs.filter((l) => {
              if (!search) return true
              const q = search.toLowerCase()
              return l.nativeName.toLowerCase().includes(q)
                || l.name.toLowerCase().includes(q)
            })
            if (visible.length === 0) return null
            return (
              <div key={region}>
                <h3 className="text-xs font-semibold uppercase tracking-wider
                  text-white/40 px-1 mb-2">{region}</h3>
                {visible.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => select(lang.code as Language)}
                    className={`w-full flex items-center justify-between
                      px-3 py-3.5 rounded-xl text-left transition-all
                      min-h-[52px] ${
                        lang.code === language
                          ? 'bg-gold-500/20 text-divine-cream'
                          : 'text-white/80 hover:bg-white/5'
                      }`}
                    role="option"
                    aria-selected={lang.code === language}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{lang.nativeName}</span>
                      <span className="text-xs text-white/40">{lang.name}</span>
                    </span>
                    {lang.code === language && (
                      <svg width="20" height="20" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        className="text-gold-500">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-white/40 text-center pb-2">Saved locally</p>
      </MobileBottomSheet>
    </>
  )
}
```

#### React Native — Bottom Sheet Selector

```tsx
import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, useWindowDimensions,
} from 'react-native'
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useLanguageNative, LANGUAGES, type Language } from '@/hooks/useLanguageNative'
import { colors, typography, spacing, radii } from '@/theme/tokens'

interface LanguageSelectorNativeProps {
  triggerStyle?: object
  variant?: 'inline' | 'floating'
  onLanguageChange?: (language: Language) => void
}

export function LanguageSelectorNative({
  triggerStyle,
  variant = 'inline',
  onLanguageChange,
}: LanguageSelectorNativeProps) {
  const { language, setLanguage, config } = useLanguageNative()
  const sheetRef = React.useRef<BottomSheetModal>(null)
  const [search, setSearch] = useState('')
  const { height } = useWindowDimensions()

  const snapPoints = useMemo(() => [Math.min(height * 0.7, 600)], [height])

  const languages = useMemo(() => {
    const entries = Object.entries(LANGUAGES)
    if (!search) return entries
    const q = search.toLowerCase()
    return entries.filter(([code, cfg]) =>
      cfg.name.toLowerCase().includes(q) ||
      cfg.nativeName.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q)
    )
  }, [search])

  const select = useCallback((code: Language) => {
    setLanguage(code)
    sheetRef.current?.dismiss()
    setSearch('')
    onLanguageChange?.(code)
  }, [setLanguage, onLanguageChange])

  const renderItem = useCallback(({ item: [code, cfg] }: { item: [string, typeof LANGUAGES[Language]] }) => {
    const selected = code === language
    return (
      <TouchableOpacity
        onPress={() => select(code as Language)}
        style={[styles.row, selected && styles.rowSelected]}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${cfg.nativeName}, ${cfg.name}`}
      >
        <View>
          <Text style={[styles.nativeName, selected && styles.textSelected]}>
            {cfg.nativeName}
          </Text>
          <Text style={[styles.englishName, selected && styles.subTextSelected]}>
            {cfg.name}
          </Text>
        </View>
        {selected && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Text style={styles.check}>✓</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    )
  }, [language, select])

  return (
    <>
      {/* Trigger */}
      <TouchableOpacity
        onPress={() => sheetRef.current?.present()}
        style={[styles.trigger, triggerStyle]}
        accessibilityRole="button"
        accessibilityLabel={`Language: ${config.nativeName}. Tap to change.`}
        accessibilityHint="Opens language selection"
      >
        <Text style={styles.globeIcon}>🌐</Text>
        <Text style={styles.triggerLabel}>{config.nativeName}</Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />
        )}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Select Language</Text>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search languages..."
            placeholderTextColor={colors.divine.muted}
            style={styles.searchInput}
            accessibilityLabel="Search languages"
          />
        </View>
        <FlatList
          data={languages}
          renderItem={renderItem}
          keyExtractor={([code]) => code}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheetModal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.goldLight,
  },
  globeIcon: { fontSize: 16 },
  triggerLabel: {
    ...typography.bodySmall,
    color: colors.divine.cream,
    fontWeight: '500',
  },
  chevron: { fontSize: 12, color: colors.divine.muted },
  sheetBg: { backgroundColor: colors.divine.surface },
  handle: { backgroundColor: colors.divine.muted, width: 40 },
  sheetHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.alpha.whiteLight,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.gold[100],
  },
  searchContainer: { padding: spacing.lg },
  searchInput: {
    ...typography.bodySmall,
    color: colors.divine.cream,
    backgroundColor: colors.alpha.whiteLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.alpha.whiteMedium,
  },
  listContent: { paddingBottom: spacing['3xl'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 52,
  },
  rowSelected: { backgroundColor: colors.alpha.goldLight },
  nativeName: {
    ...typography.body,
    color: colors.divine.cream,
    fontWeight: '500',
  },
  englishName: {
    ...typography.caption,
    color: colors.divine.muted,
    marginTop: 2,
  },
  textSelected: { color: colors.gold[200] },
  subTextSelected: { color: colors.gold[400] },
  check: {
    fontSize: 18,
    color: colors.gold[500],
    fontWeight: '700',
  },
})
```

### 4.4 Testing & Quality Checks

#### Unit Tests (Vitest / React Testing Library)

```typescript
// __tests__/LanguageSelector.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSelector } from '@/components/LanguageSelector'
import { LanguageProvider } from '@/hooks/useLanguage'

function renderWithProvider(ui: React.ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

describe('LanguageSelector', () => {
  it('renders trigger with current language', () => {
    renderWithProvider(<LanguageSelector />)
    expect(screen.getByRole('button', { name: /current language/i })).toBeInTheDocument()
  })

  it('opens dropdown on click', async () => {
    renderWithProvider(<LanguageSelector variant="dropdown" />)
    await userEvent.click(screen.getByRole('button', { name: /current language/i }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('filters languages by search', async () => {
    renderWithProvider(<LanguageSelector variant="dropdown" />)
    await userEvent.click(screen.getByRole('button', { name: /current language/i }))
    await userEvent.type(screen.getByRole('searchbox'), 'tamil')
    expect(screen.getByText('தமிழ்')).toBeInTheDocument()
    expect(screen.queryByText('Deutsch')).not.toBeInTheDocument()
  })

  it('selects a language and closes', async () => {
    const onChange = vi.fn()
    renderWithProvider(<LanguageSelector variant="dropdown" onLanguageChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: /current language/i }))
    await userEvent.click(screen.getByText('हिन्दी'))
    expect(onChange).toHaveBeenCalledWith('hi')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes on Escape key', async () => {
    renderWithProvider(<LanguageSelector variant="dropdown" />)
    await userEvent.click(screen.getByRole('button', { name: /current language/i }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  it('marks selected language with aria-selected', async () => {
    renderWithProvider(<LanguageSelector variant="dropdown" />)
    await userEvent.click(screen.getByRole('button', { name: /current language/i }))
    const selectedOption = screen.getByRole('option', { selected: true })
    expect(selectedOption).toBeInTheDocument()
  })
})
```

#### Accessibility Tests (axe-core)

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('has no accessibility violations (closed)', async () => {
  const { container } = renderWithProvider(<LanguageSelector />)
  expect(await axe(container)).toHaveNoViolations()
})

it('has no accessibility violations (open)', async () => {
  const { container } = renderWithProvider(<LanguageSelector variant="dropdown" />)
  await userEvent.click(screen.getByRole('button', { name: /current language/i }))
  expect(await axe(container)).toHaveNoViolations()
})
```

#### E2E Tests (Playwright)

```typescript
test('language selector changes app language', async ({ page }) => {
  await page.goto('/')
  // Open selector
  await page.click('[aria-label*="Current language"]')
  // Search for Hindi
  await page.fill('[role="searchbox"]', 'hindi')
  // Select Hindi
  await page.click('text=हिन्दी')
  // Verify document lang attribute changed
  const lang = await page.getAttribute('html', 'lang')
  expect(lang).toBe('hi')
  // Verify localStorage
  const stored = await page.evaluate(() => localStorage.getItem('preferredLocale'))
  expect(stored).toBe('hi')
})
```

#### React Native Tests (Jest + Testing Library)

```typescript
import { render, fireEvent } from '@testing-library/react-native'
import { LanguageSelectorNative } from '@/components/LanguageSelectorNative'

it('renders trigger with current language name', () => {
  const { getByLabelText } = render(<LanguageSelectorNative />)
  expect(getByLabelText(/Language:.*Tap to change/)).toBeTruthy()
})

it('calls onLanguageChange when selecting a language', () => {
  const onChange = jest.fn()
  const { getByText } = render(
    <LanguageSelectorNative onLanguageChange={onChange} />
  )
  // Simulate opening and selecting
  fireEvent.press(getByText('हिन्दी'))
  expect(onChange).toHaveBeenCalledWith('hi')
})
```

---

## 5. Design Option Comparison

### Option A: Compact Dropdown (All Viewports)

| Pro                                  | Con                                       |
|--------------------------------------|-------------------------------------------|
| Familiar web pattern                 | Dropdown clipped by viewport on small screens |
| Single component for all breakpoints | Hard to scroll 17 items on 375 px screen  |
| Fast to implement                    | No haptic/gesture support on mobile        |
| Low JS bundle cost                   | Positioned absolutely — can overlap content |

### Option B: Dropdown (Desktop) + Bottom Sheet (Mobile)

| Pro                                  | Con                                       |
|--------------------------------------|-------------------------------------------|
| Best-in-class UX per platform        | Two render paths (slightly more code)     |
| Bottom sheet: native mobile feel     | Depends on MobileBottomSheet component    |
| Region grouping in sheet helps scan  | Slightly higher initial bundle (sheet)    |
| Gesture dismissal, haptic feedback   | Sheet already exists — no extra dep       |
| Reuses existing `MobileBottomSheet`  |                                           |

### Recommendation: **Option B** (Hybrid)

The bottom sheet is already built and battle-tested (`MobileBottomSheet`). With
17 languages and 3 region groups, the sheet's full-width scrollable area
provides superior scan-ability on mobile. The dropdown remains perfect for
desktop where screen real estate is ample.

---

## 6. Minimal MVP Path

### Phase 1 — MVP (Estimated: ~4-6 hours)

**Goal:** Single unified `<LanguageSelector />` component for the web app.

| Step | Task                                                          | Est.   |
|------|---------------------------------------------------------------|--------|
| 1    | Create `components/LanguageSelector.tsx` with dropdown + sheet logic | 1.5 h  |
| 2    | Wire into `DesktopNav` (replacing `GlobalLanguageSelector`)   | 0.5 h  |
| 3    | Wire into mobile hamburger menu row                           | 0.5 h  |
| 4    | Add `useMediaQuery` hook (if not existing)                    | 0.25 h |
| 5    | Unit tests (5 core cases)                                     | 0.5 h  |
| 6    | Accessibility audit (axe-core scan)                           | 0.25 h |
| 7    | Manual test on Chrome (desktop + mobile emulator)             | 0.5 h  |

**What ships:**
- Dropdown on desktop/tablet (≥ 768 px) with search, globe icon, gold theming
- Bottom sheet on mobile (< 768 px) with grouped languages, search, swipe dismiss
- Full keyboard + screen reader support
- Uses existing `useLanguage` context — no state management changes
- Replaces `GlobalLanguageSelector` + `MinimalLanguageSelector` with one component

**What does NOT change:**
- KIAAN AI Ecosystem — untouched
- `LanguageSettings` page — remains as full settings panel
- `useLanguage` hook — no API changes
- Backend API — no changes
- All other components — zero mutations

### Phase 2 — React Native (Estimated: ~3-4 hours, deferred)

| Step | Task                                                          | Est.   |
|------|---------------------------------------------------------------|--------|
| 1    | Create `useLanguageNative` hook with MMKV persistence         | 1 h    |
| 2    | Create `LanguageSelectorNative` with bottom sheet             | 1.5 h  |
| 3    | Wire into settings screen and header                          | 0.5 h  |
| 4    | Jest tests                                                    | 0.5 h  |

### Phase 3 — Polish (Estimated: ~2 hours, deferred)

| Step | Task                                                          | Est.   |
|------|---------------------------------------------------------------|--------|
| 1    | E2E Playwright test for language switch                       | 0.5 h  |
| 2    | `prefers-reduced-motion` support                              | 0.25 h |
| 3    | Keyboard arrow-key navigation within dropdown                 | 0.5 h  |
| 4    | RTL layout verification (manual with `dir="rtl"`)            | 0.25 h |
| 5    | Light theme variant styling                                   | 0.5 h  |

---

## 7. Files Touched (MVP)

| File                                         | Action  | Impact                    |
|----------------------------------------------|---------|---------------------------|
| `components/LanguageSelector.tsx`            | **NEW** | Unified selector component |
| `components/navigation/DesktopNav.tsx`       | EDIT    | Import new selector       |
| `components/navigation/GlobalLanguageSelector.tsx` | SOFT-DEPRECATE | Replaced by new component |
| `components/MinimalLanguageSelector.tsx`     | SOFT-DEPRECATE | Replaced by new component |
| `hooks/useMediaQuery.ts`                     | NEW (if absent) | Breakpoint detection |
| `tests/LanguageSelector.test.tsx`            | **NEW** | Unit + a11y tests         |

**Zero changes to:**
- `hooks/useLanguage.tsx`
- `i18n.ts`
- `config/translation.ts`
- Any KIAAN ecosystem component
- Backend API
- `locales/*` translation files
- `tailwind.config.ts`
- `mobile/react-native/*` (Phase 2)
