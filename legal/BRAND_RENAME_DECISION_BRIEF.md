# Brand Rename — Decision Brief

**Status:** Awaiting founder decision. No code changes have been made
based on this brief.

The Phase 1N IP audit flagged four brand/naming risks. This brief
quantifies the blast radius for each rename and recommends an option,
so you can make all four calls in one sitting.

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
