# Brand Rename — Decision Brief

**Status:** **DECIDED (2026-05-16).** Items #1, #2, #3 executed in
Phase 1P-Brand (mass-rename PR on branch `claude/check-agent-model-fnkul`).
Item #4 (MindVibe vs Kiaanverse parent/product split) is deferred —
operational, not legal, and needs founder-side App Store + TM-counsel work.

## Final names chosen

| # | Risk | OLD name | NEW name (Sanskrit-primary, bracketed English) |
|---|------|----------|------------------------------------------------|
| 1 | "Mood Ring" → ? | Mood Ring | **Bhava Mirror (Mood Ring)** — *bhāva* = emotional state |
| 2 | "Relationship Compass" → ? | Relationship Compass | **Sambandh Dharma (Relationship Compass)** — promotes the existing internal Sanskrit name; spelling unified from `sambandha_dharma` → `sambandh_dharma` |
| 3 | "Journey Engine" → ? | Journey Engine | **Karma Marg (Karma Journey)** — *karma mārga* = the path of action |
| 4 | MindVibe vs Kiaanverse | both used today | **Deferred** — see brief item #4 for rationale |

Why bracketed English: the Sanskrit term is the brand identity (distinctive,
unlikely to TM-collide); the English parenthetical preserves accessibility
for users who don't yet know the Sanskrit. After ~30 days of in-app
exposure the English parenthetical can be dropped or moved to tooltips —
that's a follow-on PR, not this one.

## What changed in this PR

- **Identifiers** (snake_case / camelCase / PascalCase / kebab-case /
  CONSTANT_CASE) renamed across every TS / TSX / Python / JSON / MD /
  YAML / TOML file — code references all moved in lockstep.
- **File and directory paths** moved via `git mv` (history preserved):
  11 directories + 20 files. Backend services, routes, scripts,
  components, type files, app routes, API routes, mobile routes.
- **Display strings** in user-facing surfaces (locale JSONs, README,
  store-listing copy, dashboard UI, component labels) replaced with
  the bracketed Sanskrit-primary form.
- **URL backward-compat** — `next.config.js` adds 308 redirects from
  every old user-facing route (`/relationship-compass`,
  `/tools/relationship-compass`, `/m/relationship-compass`,
  `/journey-engine`, etc.) to the new path. Existing bookmarks and
  shared links continue to work.
- **API backward-compat** — `next.config.js` adds `beforeFiles`
  rewrites that silently proxy `/api/relationship-compass*`,
  `/api/relationship-compass-engine*`, and `/api/journey-engine*` to
  the new backend prefixes. Stale mobile clients shipped before this
  rename continue to function until the minimum-supported build
  catches up.
- **Mood Ring** was the smallest surface (13 files, 0 routes, 0 i18n
  keys). Component file renames: `MoodRing.tsx` →
  `BhavaMirror.tsx`, `CompanionMoodRing.tsx` →
  `CompanionBhavaMirror.tsx`. Store-listing copy updated
  ("Divine Mood Ring" → "Bhava Mirror (Mood Ring)").

## What's deferred to follow-on PRs

- **Non-English locale value translation.** Locale KEYS are renamed
  in all 47 languages, but the VALUES are still the pre-rename
  translated copy. Translators need to update each locale's display
  string to either the bracketed Sanskrit-primary form or a
  language-appropriate equivalent. Tracked as a single follow-on
  ticket; not blocking this PR.
- **Marketing site + App Store listings**: store-listing markdown is
  updated here, but the actual App Store / Google Play console submissions
  need founder-side update.
- **Analytics event names**: events still emit under old names. Renaming
  events forks historical analytics, so doing it in a separate PR after
  the analytics team confirms cut-over strategy.
- **Brand TM filing** (USPTO): file Sambandh Dharma, Karma Marg, Bhava
  Mirror in NICE classes 9 + 41 + 42. Need counsel, ~$1.5k attorney +
  $250-500 USPTO fee per mark.
- **Item #4 (MindVibe vs Kiaanverse)**: requires App Store / Google Play
  console updates and TM filing decisions; not in scope for this PR.

---

The original analysis (preserved below for audit trail) shows the
options considered and the alternates the founder did **not** pick.
Recommendation labels in the tables below reflect the brief author's
recommendation at decision time, not the final choice — see "Final
names chosen" table above for the actual picks.

---

## #1 — "Mood Ring" → ?

**Risk level:** HIGH (per audit)
**Blast radius:** **4 files**, mostly store-listing copy and one mobile screen.

### Why it's flagged
"Mood Ring" is a 1970s toy that has decades of unrelated trademark
filings, including active marks in wellness/app classes (NICE class 9
and 41). A first-to-file challenger could send a cease-and-desist
within weeks of your launch, especially once you have App Store traction.

### Options

| Option | Distinctive? | Search-friendly? | Tone |
|---|---|---|---|
| **Divine Mood Compass** | ✅ | Medium | Strong, mystical |
| **Bhava Mirror** | ✅✅ | Lower | Sanskrit, distinctive (bhāva = emotional state) |
| **Heart Pulse** | Medium | High | Calm, generic-but-clean |
| **Rasa Lens** (recommended) | ✅✅ | Lower | Sanskrit, classical aesthetics theory term |
| Keep "Mood Ring" | ❌ | ❌ | Status quo |

### Recommendation
**"Rasa Lens"** — Sanskrit *rasa* is the classical aesthetic theory of
emotional states (śṛṅgāra, vīra, śānta…). It's distinctive, ties to the
spiritual framing, and there are no conflicting trademarks for the
exact phrase in software/wellness classes (verify with counsel).

### What you'd need to update
4 files — `app/wellness/mood.tsx`, two store-listing markdowns, and the
i18n locale key `wellness.moodRingTitle` and friends. ~1 hour of work.

---

## #2 — "Relationship Compass" → ?

**Risk level:** MEDIUM
**Blast radius:** **159 files** — this is the LARGEST rename.

### Why it's flagged
Multiple registered marks combine "Compass" with relationship /
coaching terms. Most are in unrelated classes (paper goods, life
coaching services), but a US registrant could oppose your app-class
filing.

### Options

| Option | Distinctive? | Sanskrit-ready? | Why |
|---|---|---|---|
| **Sambandha Dharma** | ✅✅ | Yes | Already used internally in some files; means "the dharma of bonds" |
| **Sambandha Navigator** | ✅ | Yes | Same root, more navigational |
| **Bandhana Sutra** (recommended) | ✅✅ | Yes | "Thread of bonds" — distinctive Sanskrit metaphor |
| **Rishta Path** | Medium | Hindi-only | More accessible to Indian users |
| Keep "Relationship Compass" | ❌ | n/a | Status quo — TM risk remains |

### Recommendation
**"Sambandha Dharma"** — it's *already* the internal Sanskrit name used
in several files (`sambandha_dharma` in route names, prompt files).
Promoting it to the public-facing name reduces the diff and gives the
feature a Sanskrit identity that distinguishes it from every generic
"Compass" wellness app.

### What you'd need to update
159 files — but most are internal (backend prompts, type names,
analytics events). Only ~20 are user-visible (i18n strings, store
listings, dashboard UI). Search-and-replace can do the internal
files in one pass. **Allocate ~3 hours**, including verification.

---

## #3 — "Journey Engine" → ?

**Risk level:** MEDIUM
**Blast radius:** **20 files**.

### Why it's flagged
"Journey" + technical noun ("Engine", "Studio", "Builder") is a
heavily-trademarked combination in fitness/wellness app classes.

### Options

| Option | Distinctive? |
|---|---|
| **Sadhana Sequences** (recommended) | ✅✅ |
| **Spiritual Pathways** | Medium (generic) |
| **Yatra Engine** | ✅ — *yatra* is Sanskrit for "journey/pilgrimage" |
| Keep "Journey Engine" | ❌ |

### Recommendation
**"Sadhana Sequences"** — already aligns with the existing Sadhana
sacred-tool, makes the relationship between the two surfaces explicit,
and `sadhana` is a distinctive Sanskrit term (your existing usage is
clean).

### What you'd need to update
20 files — backend service names, journey route names, web/mobile UI,
some metadata. ~2 hours.

---

## #4 — MindVibe vs Kiaanverse brand consistency

**Risk level:** LOW (operational, not legal)
**Blast radius:** **444 MindVibe + 506 Kiaanverse references** —
roughly co-equal usage today.

### Why it's flagged
The audit found inconsistent branding across surfaces:
- GitHub org/repo: `hisr2024/MindVibe`
- App Store / Google Play listings: `Kiaanverse`
- Marketing site: `kiaanverse.com`
- Internal docs: both used interchangeably
- Code comments: both used

This won't get you sued, but it confuses users, dilutes brand equity,
and complicates trademark filings (you'd file two separate marks if
you want protection for both).

### Options

| Option | Reasoning |
|---|---|
| **Make Kiaanverse the primary public brand; demote MindVibe to internal-only / parent-company name** (recommended) | Kiaanverse is already the App Store + web brand. It's the more distinctive name. MindVibe is generic ("vibe" is overused) and there are multiple unrelated MindVibe trademarks active. |
| Pick MindVibe as primary | Would require renaming the App Store listing, web domain, and ~500 references. Not recommended. |
| Operate as a parent (MindVibe Inc.) + product (Kiaanverse) | Common SaaS pattern; legally simplest |
| Keep both as today | Status quo |

### Recommendation
**Public-facing brand = Kiaanverse. Internal/legal-entity name =
MindVibe (or rename the entity).**

### What you'd need to update if you go with this split

1. **Legal/UI surfaces — must be "Kiaanverse":**
   - App Store + Google Play listings
   - kiaanverse.com web app
   - All user-visible strings (`Made by MindVibe` → `Made by Kiaanverse`)
   - Marketing site
   - Press kits
2. **Internal surfaces — can stay MindVibe (or rename):**
   - GitHub org/repo (optional rename; not user-facing)
   - Internal docs and code comments
   - Database / service names
3. **Legal entity — confirm with counsel:**
   - If incorporated as MindVibe LLC/Inc, keep that as the legal
     parent and operate Kiaanverse as a "doing-business-as" (DBA)
     or trademarked product brand
   - File US trademark application for "KIAANVERSE" in NICE classes
     9 (software), 41 (entertainment), 42 (SaaS)

### Estimated effort to converge
- Mass search-and-replace on user-facing strings: ~3 hours
- App Store listing update + screenshots: ~2 hours
- TM filing prep (give to counsel): ~1 hour
- Total: ~6 hours of founder time, $250–500 USPTO TM filing fee per mark

---

## Single-pass execution plan (if you approve all 4)

If you say yes to all 4 recommendations, the most efficient sequence is:

1. **Day 1 (1 hour):** Sign off on the 4 names (Rasa Lens, Sambandha
   Dharma, Sadhana Sequences, Kiaanverse-as-primary).
2. **Day 2 (4 hours):** I do the mass renames + i18n updates + store
   listing updates in a single PR (call it Phase 1O).
3. **Day 3 (1 hour):** You review + merge.
4. **Day 4-7 (your time):** Engage a US trademark attorney to file
   KIAANVERSE in classes 9, 41, 42. Budget ~$1.5k attorney + USPTO fees.
5. **Day 7-30:** I do follow-on cleanup (analytics events, error
   strings, marketing site) as small incremental PRs as you find them.

**Total founder time:** ~6 hours. **Total founder cost:** ~$2–3k (TM
filing) + ~10 hours of my engineering time.

---

## What you cannot leave open

Even if you decide NOT to rename, you MUST:
1. File a TM search for whichever name you keep (~$200 attorney time)
2. Watch the USPTO TESS database monthly for newly-filed conflicting
   marks (set up a free TMSearch alert)
3. Be prepared to rename within 30 days if a real conflict surfaces

The cost of a forced rename POST-launch (after press, after acquired
users) is 50× the cost of choosing the right name now.
