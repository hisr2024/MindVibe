# Bhagavad Gita Database Seeding

## Overview

Scripts for seeding, verifying, and managing Bhagavad Gita verses in the database.

## Quick Start

### Production Deployment (Render.com)

```bash
# 1. Verify current state
python scripts/verify_db_tables.py

# 2. Seed all 700 verses
python scripts/seed_gita_robust.py

# 3. Verify completion
python scripts/verify_db_tables.py
```

---

## Available Scripts

### ⭐ `seed_gita_robust.py` (RECOMMENDED)

**Production-ready seeding with robust error handling.**

#### Why Use This?
Solves common Render.com deployment issues:
- ❌ **Old problem**: First error aborts transaction, all 700 verses fail
- ✅ **Solution**: Each verse has its own transaction (isolated failures)

- ❌ **Old problem**: Re-running script fails on existing verses
- ✅ **Solution**: Checks for duplicates, idempotent operation

- ❌ **Old problem**: Generic errors, hard to debug
- ✅ **Solution**: Detailed logging shows exactly which verses fail

#### Features
- ✅ Individual transaction per verse (no cascade failures)
- ✅ Duplicate checking (safe to run multiple times)
- ✅ Continues on errors (doesn't stop at first failure)
- ✅ Real-time progress with chapter completion
- ✅ Efficient database-level counting

#### Usage
```bash
DATABASE_URL=<your-db-url> python scripts/seed_gita_robust.py
```

#### Expected Output
```
======================================================================
🕉️  ROBUST GITA VERSE SEEDING
======================================================================
Database: postgresql+asyncpg://...

📖 Loaded 700 verses from JSON

🌱 Seeding verses...

   Progress: 50 verses seeded...
   ✅ Chapter 1 complete
   Progress: 100 verses seeded...
   ✅ Chapter 2 complete
   ...
   ✅ Chapter 18 complete

======================================================================
📊 SEEDING SUMMARY
======================================================================
   ✅ Seeded: 700
   ⏭️  Skipped: 0
   ❌ Failed: 0
   📊 Total: 700/700

✅ Total verses in database: 700/700
🎉 SUCCESS! All 700 Gita verses are now in the database!
======================================================================
```

---

### `verify_db_tables.py`

**Diagnostic tool to inspect database schema and verse counts.**

#### Features
- Lists all database tables
- Shows gita_verses table structure
- Counts verses by chapter

#### Usage
```bash
DATABASE_URL=<your-db-url> python scripts/verify_db_tables.py
```

#### Example Output
```
======================================================================
📋 DATABASE TABLES
======================================================================
   ✅ gita_chapters
   ✅ gita_verses
   ✅ users
   ...

======================================================================
🔍 GITA_VERSES TABLE STRUCTURE
======================================================================
   id                             integer              NOT NULL
   chapter                        integer              NOT NULL
   verse                          integer              NOT NULL
   sanskrit                       text                 NOT NULL
   transliteration                text                 NULL
   hindi                          text                 NOT NULL
   english                        text                 NOT NULL
   ...

📊 Current verse count: 700/700
```

---

### `reset_gita_verses.py`

**⚠️ Delete all verses (testing/development only).**

#### Usage
```bash
DATABASE_URL=<your-db-url> python scripts/reset_gita_verses.py
```

Prompts for confirmation:
```
⚠️  WARNING: This will delete all Gita verses!
Type 'DELETE' to confirm: DELETE
✅ All verses deleted
```

---

## Data Source

**File**: `data/gita/gita_verses_complete.json`

Contains all 700 authentic Bhagavad Gita verses with:
- `chapter`: Chapter number (1-18)
- `verse`: Verse number
- `sanskrit`: Original Devanagari text
- `transliteration`: IAST transliteration
- `hindi`: Hindi translation
- `english`: English translation
- `word_meanings`: Word-by-word meanings (JSON)
- `principle`: Core teaching
- `theme`: Thematic category
- `mental_health_applications`: Mental health tags
- `primary_domain`: Primary emotional domain
- `secondary_domains`: Secondary domains (array)

---

## Canonical Verse Counts

All 18 chapters, 700 total verses:

| Chapter | Verses | Theme |
|---------|--------|-------|
| 1 | 47 | Emotional Crisis, Moral Conflict |
| 2 | 72 | Transcendental Knowledge |
| 3 | 43 | Selfless Action |
| 4 | 42 | Knowledge & Wisdom |
| 5 | 29 | Action & Renunciation |
| 6 | 47 | Meditation & Mindfulness |
| 7 | 30 | Self-Knowledge |
| 8 | 28 | Attaining the Supreme |
| 9 | 34 | Sovereign Knowledge |
| 10 | 42 | Divine Manifestations |
| 11 | 55 | Universal Form |
| 12 | 20 | Devotion |
| 13 | 34 | Matter & Spirit |
| 14 | 27 | Three Modes of Nature |
| 15 | 20 | Supreme Person |
| 16 | 24 | Divine & Demoniac Natures |
| 17 | 28 | Three Divisions of Faith |
| 18 | 78 | Liberation & Renunciation |
| **Total** | **700** | |

---

## Troubleshooting

### Database Connection Error
```
❌ ERROR: Database connection failed
```
**Solution**: Check `DATABASE_URL` environment variable

### Verse Already Exists (Not an Error!)
```
⏭️  Skipped: 700
```
**This is normal** - script is idempotent, safe to re-run

### Partial Success
```
⚠️  Partial success: 650/700 verses in database
```
**Solution**: Re-run the script, it will only insert missing verses

---

## Integration with KIAAN

After seeding, verses are available to:

### KIAAN Chat (`/api/chat/message`)
- Searches top 7 relevant verses
- Builds comprehensive wisdom context
- Never cites sources in responses

### Ardha Reframing (`/api/ardha/reframe`)
- Uses sthitaprajna verses (Chapter 2:54-72)
- Focuses on equanimity and mental stability
- Key verses: 2.56, 2.57, 2.62-63, 6.5

### Viyoga Detachment (`/api/viyoga/detach`)
- Uses karma yoga verses
- Prioritizes verse 2.47 (most famous)
- Key verses: 2.48, 3.19, 4.20, 5.10, 18.66

---

## Legacy Scripts

### `seed_authentic_gita_comprehensive.py`
Original seeding script with comprehensive validation.

### Other Scripts
- `seed_complete_gita.py`
- `seed_gita_from_json.py`
- `seed_gita_wisdom.py`

See `README_SEEDING_OLD.md` for legacy documentation.
