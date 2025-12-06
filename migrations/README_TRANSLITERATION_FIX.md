# Database Schema Fix: GitaVerse Transliteration Column

## Problem Statement

Production database was failing with schema mismatch error:
```
asyncpg.exceptions.UndefinedColumnError: column gita_verses.transliteration does not exist
```

This error was blocking all 700-verse Bhagavad Gita seeding operations, causing cascading transaction failures.

## Root Cause

The `transliteration` column exists in:
- ✅ The `GitaVerse` model (`backend/models.py` line 450)
- ✅ The original migration file (`migrations/20251109_add_gita_wisdom_database.sql` line 41)
- ✅ The seeding script (`scripts/seed_complete_gita.py` line 206)

However, the production database was missing this column, indicating that the migration was not applied correctly or completely.

## Solution

### 1. Standalone Migration File

**File:** `migrations/20251206_add_transliteration_to_gita_verses.sql`

- **Idempotent**: Can be run multiple times safely without errors
- **Backward Compatible**: Works on both empty and populated databases
- **Self-Verifying**: Includes built-in verification checks

#### Features:
- Uses PostgreSQL `DO` blocks for conditional column addition
- Checks if column exists before attempting to add it
- Provides informative `NOTICE` messages about actions taken
- Verifies successful completion

#### Usage:
```bash
# Apply migration to production database
psql $DATABASE_URL < migrations/20251206_add_transliteration_to_gita_verses.sql
```

### 2. Schema Verification Script

**File:** `scripts/verify_db_schema.py`

A comprehensive script that verifies the database schema matches the `GitaVerse` model definition.

#### Features:
- Checks for table existence
- Verifies all required columns are present
- Displays column types and nullability
- Provides specific migration instructions for missing columns
- Uses a migration mapping system for maintainability

#### Usage:
```bash
# Verify database schema
python scripts/verify_db_schema.py

# Example output when schema is valid:
# ✅ Schema verification passed
# 📊 Found 17 columns in gita_verses table:
#    ✓ transliteration     text     NULL
#    ...

# Example output when column is missing:
# ❌ Missing columns in gita_verses table:
#    - transliteration
# 📋 Required migrations:
#    psql $DATABASE_URL < migrations/20251206_add_transliteration_to_gita_verses.sql
```

### 3. Updated Seeding Script

**File:** `scripts/seed_complete_gita.py`

Added pre-seeding schema verification to prevent runtime errors.

#### Changes:
- Checks for `transliteration` column existence before seeding
- Provides clear error messages if schema is invalid
- Exits gracefully with instructions if verification fails

#### Usage:
```bash
# Run seeding (will verify schema first)
python scripts/seed_complete_gita.py
```

## Migration Steps

### For Production Deployment

1. **Backup Database** (Always!)
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Verify Current Schema**
   ```bash
   DATABASE_URL=<your-db-url> python scripts/verify_db_schema.py
   ```

3. **Apply Migration** (if needed)
   ```bash
   psql $DATABASE_URL < migrations/20251206_add_transliteration_to_gita_verses.sql
   ```

4. **Verify Schema Again**
   ```bash
   DATABASE_URL=<your-db-url> python scripts/verify_db_schema.py
   ```

5. **Run Seeding**
   ```bash
   DATABASE_URL=<your-db-url> python scripts/seed_complete_gita.py
   ```

### For Fresh Installations

Run migrations in order:
```bash
# 1. Create base schema
psql $DATABASE_URL < migrations/20251109_add_gita_wisdom_database.sql

# 2. Add mental health tags
psql $DATABASE_URL < migrations/20251207_add_mental_health_tags_to_gita.sql

# 3. Add wisdom verse domains
psql $DATABASE_URL < migrations/20251207_add_wisdom_verse_domains.sql

# 4. Verify schema
python scripts/verify_db_schema.py

# 5. Seed data
python scripts/seed_complete_gita.py
```

## Testing

All changes have been tested with:

### Test 1: Missing Column Scenario
- ✅ Created database without `transliteration` column
- ✅ Schema verification correctly identified missing column
- ✅ Migration successfully added column
- ✅ Schema verification passed after migration

### Test 2: Idempotency
- ✅ Ran migration on database that already has column
- ✅ Migration detected existing column and skipped addition
- ✅ No errors or data loss occurred

### Test 3: Fresh Database
- ✅ Applied base migration on empty database
- ✅ Column was present from start
- ✅ Schema verification passed

### Test 4: Code Quality
- ✅ Code review completed and feedback addressed
- ✅ CodeQL security scan passed with 0 alerts
- ✅ No security vulnerabilities introduced

## Files Changed

1. **migrations/20251206_add_transliteration_to_gita_verses.sql** (NEW)
   - 39 lines
   - Idempotent migration to add transliteration column

2. **scripts/verify_db_schema.py** (NEW)
   - 131 lines
   - Comprehensive schema verification tool

3. **scripts/seed_complete_gita.py** (MODIFIED)
   - Added schema verification check before seeding
   - ~16 lines added

## Acceptance Criteria

- ✅ Migration file created and tested
- ✅ `GitaVerse` model has `transliteration` column (already present)
- ✅ Schema verification script passes
- ✅ Seeding script checks schema before attempting to seed
- ✅ Migration can run on empty database
- ✅ Migration can run on existing database without data loss
- ✅ All tests pass
- ✅ No security vulnerabilities
- ✅ Code review feedback addressed

## Security Summary

**CodeQL Analysis:** ✅ PASSED (0 alerts)

- No SQL injection vulnerabilities
- No security issues in database operations
- Safe parameterized queries used throughout
- No hardcoded credentials or secrets

## Impact Assessment

### Risk Level: **LOW**
- Minimal code changes
- Idempotent migration (safe to retry)
- No breaking changes
- Backward compatible
- No data modification (only schema addition)

### Benefits:
- ✅ Fixes critical production blocker
- ✅ Enables all 700-verse Gita seeding operations
- ✅ Adds proactive schema validation
- ✅ Improves deployment reliability
- ✅ Provides clear error messages and recovery steps

### Deployment Confidence: **HIGH**
- Thoroughly tested on multiple scenarios
- Idempotent design prevents double-application issues
- Clear rollback procedure (column is nullable, can be dropped if needed)
- No impact on existing data or functionality

## Rollback Plan

If needed, the migration can be reversed:

```sql
-- Only if absolutely necessary
ALTER TABLE gita_verses DROP COLUMN IF EXISTS transliteration;
```

**Note:** This is only safe if no data has been inserted with transliteration values.

## Next Steps

After deploying this fix:

1. Monitor seeding operations for successful completion
2. Verify all 700 verses are properly seeded
3. Consider adding automated schema validation to CI/CD pipeline
4. Document schema migration process for future changes

## Support

For issues or questions:
- Review logs from `verify_db_schema.py` for diagnostic information
- Check migration file output for specific column status
- Ensure DATABASE_URL environment variable is correctly set
- Verify database user has necessary permissions (ALTER TABLE)
