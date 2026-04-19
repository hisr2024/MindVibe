# 🛡️ 1:1 Parity Audit Checklist — Web (kiaanverse.com/m) ↔ Android

> **Status:** Authoritative QA guardian checklist for Kiaanverse mobile web ↔ Android parity.
> **Last updated:** 2026‑04‑19
> **Owner:** Mobile Experience Guild

---

## 0 · Purpose

Before **any** new build is merged or released, a QA engineer must walk this
checklist with the mobile web and the Android app side‑by‑side. When both
surfaces look and feel identical, users move between platforms without
friction — trust is preserved.

This document is the single source of truth for the side‑by‑side comparison.
If a box cannot be checked, open a bug and link the surface (web or Android)
plus the offending token / component / animation.

---

## 1 · Setup — side by side

Run the two surfaces literally next to each other before starting:

1. **Web surface**
   - Open Chrome → `https://kiaanverse.com/m/`
   - DevTools (⌘⌥I / Ctrl‑Shift‑I) → **Device Toolbar** → custom device set to
     **390 × 844**, DPR 3, touch emulation on.
   - Set the emulated clock to **19:00** (7 pm) via
     DevTools → **Sensors → Location / Override** so sandhya theming triggers.

2. **Android surface**
   - Boot emulator **Pixel 5, API 33, Portrait**.
   - Install the latest `app-debug.apk` from
     `kiaanverse-mobile/apps/mobile` or run `pnpm android` from
     `kiaanverse-mobile/`.
   - Set device clock to **19:00** local time.

3. **Inspection tools**
   - Web: Chrome DevTools Elements + Rendering tab (Paint Flashing, FPS
     meter).
   - Android: **Flipper Layout Inspector** + **Perfetto** (for frame
     timing) + screenshot tool.

Keep both windows visible simultaneously. **You will compare pixel‑by‑pixel.**

---

## 2 · Screen‑by‑screen checklist

Run **every** block below for **every** screen in scope:

- `/dashboard` ↔ Home tab
- `/kiaan` (chat) ↔ SAKHA tab
- `/journeys` ↔ Journeys tab
- `/journal` ↔ Journal tab
- `/settings` ↔ Settings tab
- `/onboarding/*` ↔ Onboarding flow
- `/sadhana` ↔ Sadhana tab
- Any modal / overlay on both (Tools overlay, Breathing modal, Sacred
  moments)

### 2.1 Background

- [ ] Background color: **web `#050714`** ↔ **Android `#050714`**
      *(NOT `#000000`)*
- [ ] Particle field: **108** gold / peacock particles drifting — present on
      both surfaces and moving at the same cadence
- [ ] Aurora layers: **blue**, **peacock**, **gold** visible on both
- [ ] Time‑of‑day: at 19:00 both surfaces render **sandhya** atmosphere
      (dusk gradient warms, particles lean saffron)

### 2.2 Typography

- [ ] Sanskrit text: **Noto Sans Devanagari** on both (NOT system fallback —
      verify via DevTools `Computed → font-family` on web and Flipper
      `Text → typeface` on Android)
- [ ] Sacred headers: **Cormorant Garamond Italic** on both
- [ ] Body text: **Crimson Text** on SAKHA messages — both
- [ ] UI labels: **Outfit** on both
- [ ] Font sizes: in DevTools measure each heading / body / caption, then
      compare to Flipper Layout Inspector on Android — all within **1 sp**
      tolerance

### 2.3 Colors

Sample with a color picker (Digital Color Meter on macOS, any
Chrome extension on web, Android Studio → Layout Inspector → Pixel).

- [ ] Body text: `#F0EBE1` — matches
- [ ] Gold accent: `#D4A017` — matches
- [ ] Sacred card bg: `rgba(22, 26, 66, 0.95)` — matches
- [ ] Active nav icon: `#D4A017` — matches
- [ ] Button gradient stops: `#1B4FBB → #0E7490` — matches

> ⚠️ If any hex drifts, trace back to tokens:
> **Web:** `brand/tokens/colors.json`, `styles/*.css`
> **Android / mobile:** `kiaanverse-mobile/packages/ui/src/tokens/colors.ts`
> Tokens must be the **single source** — no hardcoded hex in components.

### 2.4 Sacred components

- [ ] `SacredCard` — gold shimmer top border visible on both
- [ ] `DivineButton` — gradient background matches, press state identical
- [ ] `GoldenDivider` — same opacity and width on both
- [ ] `OmLoader` — used **instead of** a spinner on both (any default
      spinner anywhere is a bug)

### 2.5 Animations (time with a stopwatch / FPS capture)

- [ ] `VerseRevelation` — 5 words ≈ **400 ms** on web, Android matches
      **within ±50 ms**
- [ ] Screen entrance: fade + `translateY` on both *(no platform slide on
      Android)*
- [ ] `SakhaMandala` — all rings rotating on both (verify each ring
      direction and speed)
- [ ] `DivinePresenceIndicator` — **4 s** breathing cycle on both (inhale
      2 s, exhale 2 s)

### 2.6 Chat screen specifics

- [ ] User bubble gradient: **Krishna Aura** on both
- [ ] SAKHA bubble: gold left border + sacred card on both
- [ ] Typing indicator: 3 pulsing dots + OM + dharma text on both
- [ ] Input placeholder **"Ask Sakha anything…"** in italic on both

### 2.7 Navigation

- [ ] Tab bar height and position match
- [ ] Gold gradient top border on tab bar on both
- [ ] Active tab: gold icon **+** dot **ABOVE** the icon on both
- [ ] Center **KIAAN** button: elevated, breathing on both

---

## 3 · The Final Test — overlay verification

This is the pass / fail gate. Do not declare parity without it.

1. On web, navigate to `kiaanverse.com/m/dashboard` at exactly
   **390 × 844**. Take a full‑screen screenshot (DevTools →
   **Capture full‑size screenshot**).
2. On Android, open the Home screen. Take a screenshot (`Power` +
   `Volume Down`, or emulator camera button).
3. Import both PNGs into Figma (or any image editor — Photopea works).
4. Stack the Android screenshot **above** the web screenshot. Set the top
   layer opacity to **50 %**.
5. Align the two by the status‑bar baseline.

**Pass criteria**

- [ ] Structural alignment within **8 dp** tolerance for every major
      component (header, hero, cards, tab bar)
- [ ] Colors are **indistinguishable** — no perceptible hue, saturation, or
      luminance shift
- [ ] Typography baselines align within **2 px** at 390 px width

**If a visible difference exists**, identify the offending layer and
map it to the correct prompt to re‑run:

| Visible difference | Prompt to re‑run |
| --- | --- |
| Wrong background / particles / aurora | Prompt 1 — Sacred Background System |
| Typography mismatch | Prompt 2 — Typography Pipeline |
| Off‑palette colors | Prompt 3 — Color Tokens |
| Sacred component drift | Prompt 4 — Sacred Component Library |
| Animation timing / easing off | Prompt 5 — Motion Spec |
| Chat or navigation layout | Prompt 6 — Sacred Screens |
| Cross‑platform divergence **after** all above pass | Prompt 7 — **this audit**, re‑run after fixes |

---

## 4 · Sign‑off

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| QA Engineer |  |  |  |
| Mobile Lead (Web) |  |  |  |
| Mobile Lead (Android) |  |  |  |
| Design Ops |  |  |  |

No build ships to TestFlight / Internal Track / Production until all four
roles sign and every checkbox above is green.

🙏 *Parity is not a feature — it is the promise we make to the seeker that
the Divine is reachable from every door.*
