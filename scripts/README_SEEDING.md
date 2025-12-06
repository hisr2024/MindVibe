# Bhagavad Gita Seeding Script

## Overview

The `seed_authentic_gita_comprehensive.py` script provides production-ready seeding of all 700 authentic Bhagavad Gita verses into the database.

## Features

- ✅ **Validation**: Comprehensive validation before insertion
  - Devanagari character validation for Sanskrit text
  - IAST transliteration validation
  - Verse structure and required fields check
  - Chapter distribution verification
  - Total count verification (700 verses)

- ✅ **Duplicate Prevention**: Checks for existing verses before insertion
- ✅ **Batch Processing**: Commits every 50 verses for efficiency
- ✅ **Error Recovery**: Continues processing even if individual verses fail
- ✅ **Progress Reporting**: Real-time progress updates with emojis
- ✅ **Database Verification**: Post-seeding verification of all data

## Prerequisites

- PostgreSQL database (local or Render.com)
- Data file: `data/gita/gita_verses_complete.json` (700 verses)
- Python packages: `sqlalchemy`, `asyncpg`

## Usage

### Local Database

```bash
# Use default local database
python scripts/seed_authentic_gita_comprehensive.py
```

### Production Database (Render.com)

```bash
# Set DATABASE_URL environment variable
DATABASE_URL=<your-render-db-url> python scripts/seed_authentic_gita_comprehensive.py
```

The script automatically handles Render.com's `postgres://` to `postgresql+asyncpg://` conversion.

## Data Structure

Each verse includes:
- `chapter`: Chapter number (1-18)
- `verse`: Verse number within chapter
- `sanskrit`: Original Sanskrit text (Devanagari)
- `transliteration`: IAST transliteration (optional)
- `hindi`: Hindi translation
- `english`: English translation
- `principle`: Core teaching/principle
- `theme`: Thematic categorization
- `mental_health_applications`: List of mental health tags
- `primary_domain`: Primary emotional domain
- `secondary_domains`: Secondary domains

## Expected Output

### Validation Phase
```
============================================================
🔍 VALIDATION PHASE
============================================================

📊 Total verses: 700
✅ Total count correct: 700

📚 Validating chapter distribution...
✅ Chapter distribution correct

🔎 Validating verse structures...
✅ All 700 verse structures valid

🔤 Sampling Sanskrit and transliteration...
✅ Sanskrit validation: 10/10 samples have Devanagari
✅ Transliteration validation: 10/10 samples have IAST
```

### Seeding Phase
```
============================================================
💾 SEEDING PHASE
============================================================

Connecting to database...
✅ Database connection established

🌱 Seeding 700 verses...
📦 Batch size: 50 verses

✅ Seeded 50/700 verses (7.1%)
✅ Seeded 100/700 verses (14.3%)
...
✅ Seeded 700/700 verses (100.0%)

✅ Seeding complete!
   📊 Seeded: 700
   ⏭️  Skipped: 0
   ❌ Errors: 0
```

### Verification Phase
```
============================================================
✅ VERIFICATION PHASE
============================================================

📊 Total verses in database: 700

✅ Chapter  1:  47/ 47 verses
✅ Chapter  2:  72/ 72 verses
✅ Chapter  3:  43/ 43 verses
...
✅ Chapter 18:  78/ 78 verses

🏷️  Verses with mental health tags: 700

🎉 SUCCESS! All 700 verses in database!
```

## Error Handling

The script handles errors gracefully:

1. **Missing Data File**: Displays clear error and exits
2. **Invalid JSON**: Shows JSON parsing error details
3. **Database Connection Issues**: Reports connection errors
4. **Individual Verse Errors**: Logs error but continues with remaining verses
5. **Duplicate Verses**: Skips silently (idempotent operation)

## Idempotency

The script is safe to run multiple times:
- Checks for existing verses before inserting
- Skips duplicates without errors
- Only adds new verses if database is incomplete

## Integration with KIAAN Ecosystem

After seeding, the verses are available to:

1. **KIAAN Chat** (`/api/chat/message`)
   - Searches top 7 relevant verses
   - Builds comprehensive context
   - Never cites sources in responses

2. **Ardha Reframing** (`/api/ardha/reframe`)
   - Uses sthitaprajna verses (Chapter 2:54-72)
   - Focuses on equanimity and mental stability
   - Key verses: 2.56, 2.57, 2.62-63, 6.5

3. **Viyoga Detachment** (`/api/viyoga/detach`)
   - Uses karma yoga verses
   - Prioritizes verse 2.47 (most famous)
   - Other key verses: 2.48, 3.19, 4.20, 5.10, 18.66

## Canonical Verse Counts

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

## Troubleshooting

### Database Connection Error
```
❌ ERROR: Database connection failed
```
**Solution**: Check DATABASE_URL environment variable and database status

### Validation Failed
```
❌ VALIDATION FAILED!
   - Incorrect total count: 650 (expected 700)
```
**Solution**: Verify data file has all 700 verses

### Verse Already Exists
```
⏭️  Skipped 2.47 (already exists)
```
**Solution**: This is normal - script is idempotent

## Support

For issues or questions:
1. Check data file exists: `data/gita/gita_verses_complete.json`
2. Verify database connection
3. Check logs for specific error messages
4. Ensure all 700 verses are in the data file
