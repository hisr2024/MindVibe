# Seeding Essential Database Tables

This directory contains scripts for seeding the MindVibe database with essential data.

## seed_essential_data.py

Seeds the critical tables needed for KIAAN chat to function properly.

### What It Seeds

1. **Subscription Plans** (4 tiers)
   - Free: 10 KIAAN questions/month, $0/month
   - Basic: 50 questions/month, $9/month
   - Premium: 200 questions/month, $19/month
   - Enterprise: Unlimited (-1), $99/month

2. **Wisdom Verses** (7 curated verses)
   - BG 2.47: Action without attachment (anxiety management)
   - BG 2.14: Impermanence (emotional tolerance)
   - BG 6.5: Self-empowerment (depression recovery)
   - BG 2.48: Equanimity (balance)
   - BG 18.78: Faith and victory (hope)
   - BG 2.56: Equanimity in adversity (resilience)
   - BG 2.70: Inner peace (contentment)

3. **Gita Chapters** (4 essential chapters)
   - Chapter 1: Arjuna's Dilemma (47 verses)
   - Chapter 2: Transcendental Knowledge (72 verses)
   - Chapter 6: Self-Realization (47 verses)
   - Chapter 18: Liberation Through Renunciation (78 verses)

### Usage

#### On Render.com (Production)

```bash
# Via Render shell or deployment script
python scripts/seed_essential_data.py
```

#### Locally (Development)

```bash
# Set your database URL
export DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/mindvibe"

# Run the script
python scripts/seed_essential_data.py
```

#### As a Python Module

```bash
python -m scripts.seed_essential_data
```

### Features

✅ **Idempotent** - Safe to run multiple times without creating duplicates  
✅ **Progress Logging** - Clear output showing what's being seeded  
✅ **Verification** - Automatically verifies data after seeding  
✅ **Error Handling** - Detailed error messages with stack traces  

### Output Example

```
======================================================================
Seeding Essential Database Tables for KIAAN
======================================================================

Database: localhost:5432/mindvibe

Creating tables if needed...
✅ Tables ready

=== Seeding Subscription Plans ===
✅ Inserted Free plan (free)
✅ Inserted Basic plan (basic)
✅ Inserted Premium plan (premium)
✅ Inserted Enterprise plan (enterprise)
✅ Subscription plans seeding completed (4 plans)

=== Seeding Wisdom Verses ===
✅ Inserted verse 2.47: action_without_attachment
✅ Inserted verse 2.14: impermanence
✅ Inserted verse 6.5: self_empowerment
✅ Inserted verse 2.48: equanimity
✅ Inserted verse 18.78: faith_and_victory
✅ Inserted verse 2.56: equanimity_in_adversity
✅ Inserted verse 2.70: inner_peace
✅ Wisdom verses seeding completed (7 verses)

=== Seeding Gita Chapters ===
✅ Inserted Chapter 1: Arjuna's Dilemma
✅ Inserted Chapter 2: Transcendental Knowledge
✅ Inserted Chapter 6: Self-Realization
✅ Inserted Chapter 18: Liberation Through Renunciation
✅ Gita chapters seeding completed (4 chapters)

=== Verification ===
✅ Subscription Plans: 4 total
✅ Wisdom Verses: 7 total
✅ Gita Chapters: 4 total

✅ All essential data seeded successfully!
KIAAN should now have verse context and subscription plans.

======================================================================
✅ SEEDING COMPLETED SUCCESSFULLY!
======================================================================
```

### Troubleshooting

**Error: "No module named 'backend'"**
- Make sure you're running from the repository root
- Or use: `python -m scripts.seed_essential_data`

**Error: "connection refused"**
- Check your DATABASE_URL is correct
- Ensure the database server is running

**Error: "already exists, skipping"**
- This is normal! The script is idempotent
- It won't create duplicates

### Related Scripts

- `seed_wisdom.py` - Seeds all wisdom verses from JSON file
- `seed_complete_gita.py` - Seeds all 700 Gita verses
- `seed_content.py` - Seeds content packs for different locales

### Why This Script Exists

KIAAN chat was broken with these errors:
```
Error fetching Gita verses: current transaction is aborted
Response validation failed: ['No verse context provided or empty']
```

**Root Causes:**
1. `wisdom_verses` table was EMPTY → No Gita context for responses
2. `subscription_plans` table was EMPTY → Transaction aborts
3. KIAAN's validation rejects responses without verse context

This script fixes all three issues by populating the essential data needed for KIAAN to function.
